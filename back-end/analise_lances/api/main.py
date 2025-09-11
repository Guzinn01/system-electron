import pandas as pd
import io
import numpy as np
from datetime import timedelta
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from fastapi.middleware.cors import CORSMiddleware

# Nossos módulos
from . import crud, security, logic, schemas, config
from .database import SessionLocal, criar_banco

# --- Configuração Inicial ---
criar_banco()

app = FastAPI(
    title="API de Análise de Lances de Consórcio",
    description="Microserviço para processar e analisar dados de lances.",
    version="1.5.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# --- Dependências ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user


# CORREÇÃO: Função movida para antes de ser usada
async def get_current_admin_user(current_user: schemas.UserOut = Depends(get_current_user)):
    """
    Uma dependência que primeiro valida o usuário e depois verifica se ele é um ADM.
    """
    if current_user.role != "ADM":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado: permissões de administrador necessárias.",
        )
    return current_user


# --- Endpoints de Usuário e Autenticação ---
@app.post("/users_api/", response_model=schemas.UserOut, tags=["Usuários"])
def create_user_endpoint(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email já registrado")
    return crud.create_user(db=db, user=user)


@app.post("/token", response_model=schemas.Token, tags=["Usuários"])
async def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=form_data.username)
    # CORREÇÃO: Usando user.senha_hash
    if not user or not security.verify_password(form_data.password, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


def _processar_planilha_porto(file_content: bytes) -> pd.DataFrame:
    """Lê e processa a planilha da Porto, renomeando as colunas."""
    try:
        df = pd.read_excel(io.BytesIO(file_content), header=config.CABECALHO_PORTO)
        # Renomeia as colunas usando o dicionário do config.py
        df.rename(columns=config.COLUNAS_PORTO, inplace=True)
        return df
    except Exception as e:
        raise ValueError(f"Erro ao processar planilha Porto: {e}")

def _processar_planilha_itau(file_content: bytes) -> pd.DataFrame:
    """Lê e processa a planilha do Itaú, combinando as abas 'IMOVEL' e 'AUTO'."""
    try:
        # Lê a aba de Imóveis, usando a linha de cabeçalho correta
        df_imovel = pd.read_excel(
            io.BytesIO(file_content),
            sheet_name='IMOVEL',
            header=config.CABECALHOS_ITAU['IMOVEL']
        )
        df_imovel.rename(columns=config.COLUNAS_ITAU_IMOVEL, inplace=True)

        # Lê a aba de Automóveis, usando a linha de cabeçalho correta
        df_auto = pd.read_excel(
            io.BytesIO(file_content),
            sheet_name='AUTO',
            header=config.CABECALHOS_ITAU['AUTO']
        )
        df_auto.rename(columns=config.COLUNAS_ITAU_AUTO, inplace=True)

        # Combina os dados das duas abas em uma única tabela
        df_final = pd.concat([df_imovel, df_auto], ignore_index=True)
        return df_final
    except Exception as e:
        raise ValueError(f"Erro ao processar planilha Itaú: {e}")

# --- FIM DAS FUNÇÕES DE AJUDA ---

# --- Endpoint de Upload (Protegido para Admins) ---
@app.post("/lances/upload/{administradora}", response_model=schemas.StatusResponse, tags=["Lances"])
async def upload_e_processar_lances(
        administradora: str, file: UploadFile = File(...), db: Session = Depends(get_db),
        current_user: schemas.UserOut = Depends(get_current_admin_user)
):
    df = None
    conteudo = await file.read()

    # Bloco 1: Leitura e processamento do arquivo
    try:
        if administradora.lower() == 'porto':
            df = _processar_planilha_porto(conteudo)
        elif administradora.lower() == 'itau':
            df = _processar_planilha_itau(conteudo)
        else:
            raise HTTPException(status_code=400, detail=f"Administradora '{administradora}' não é suportada.")

        # --- NOVA ETAPA DE LIMPEZA DE DADOS ADICIONADA ---
        # 1. Converte a coluna de data, tratando erros (ex: '-') como Nulos (NaT)
        df['data_lance'] = pd.to_datetime(df['data_lance'], errors='coerce')

        # 2. Define as colunas que são obrigatórias para um registro ser válido
        required_data_columns = ['data_lance', 'grupo', 'percentual_minimo', 'percentual_maximo', 'qtd_contemplados']

        # 3. Remove qualquer linha que tenha valor nulo/vazio em QUALQUER uma dessas colunas
        df.dropna(subset=required_data_columns, inplace=True)
        # --- FIM DA NOVA ETAPA DE LIMPEZA ---

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro inesperado ao ler o arquivo: {e}")

    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="A planilha está vazia ou não contém nenhuma linha com dados completos.")

    # Bloco 2: Salvamento no banco de dados
    try:
        for indice, linha in df.iterrows():
            nome_grupo = str(linha['grupo']).strip()
            nome_categoria = logic.determinar_categoria(nome_grupo, administradora=administradora)
            categoria_obj = crud.get_or_create_categoria(db, nome_categoria=nome_categoria)
            grupo_obj = crud.get_or_create_grupo(db, nome_grupo=nome_grupo, categoria_id=categoria_obj.id)

            lance_schema = schemas.LanceCreate(
                data_lance=linha['data_lance'].date(), # A data já foi convertida, aqui só pegamos a parte da data
                percentual_maximo=linha['percentual_maximo'],
                percentual_minimo=linha['percentual_minimo'],
                qtd_contemplados=int(linha['qtd_contemplados']) # Garante que a quantidade seja um inteiro
            )
            crud.upsert_lance_para_grupo(db, lance_data=lance_schema, grupo_id=grupo_obj.id)

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar os dados no banco: {e}")

    return {"status": "sucesso", "message": f"{len(df)} lances para a administradora '{administradora}' importados com sucesso."}


# --- Endpoints de Análise (Públicos) ---
@app.get("/analises/sumario-grupos/", response_model=List[schemas.SumarioGrupo], tags=["Análises"])
def ler_sumario_dos_grupos(query: Optional[str] = None, db: Session = Depends(get_db)):
    sumario = crud.get_sumario_grupos(db, query=query)
    return sumario


@app.get("/lances/historico-recente/{nome_grupo}", tags=["Análises"])
def ler_historico_de_grupo(nome_grupo: str, db: Session = Depends(get_db)):
    lances_recentes = crud.get_lances_por_grupo(db, nome_grupo=nome_grupo)

    if lances_recentes:
        return {"status": "ok", "data": lances_recentes}

    ultimo_lance = crud.get_data_ultimo_lance(db, nome_grupo=nome_grupo)

    if ultimo_lance:
        return {
            "status": "sem_dados_recentes",
            "ultimo_lance_em": ultimo_lance.strftime("%Y-%m-%d"),
        }
    
    raise HTTPException(
        status_code=404, 
        detail="Nenhum histórico de lance jamais foi encontrado para este grupo."
    )


@app.get("/lances/historico-completo/{nome_grupo}", response_model=List[schemas.Lance], tags=["Análises"])
def ler_historico_completo_de_grupo(nome_grupo: str, db: Session = Depends(get_db)):
    lances = crud.get_lances_completos_por_grupo(db, nome_grupo=nome_grupo)
    if not lances:
        raise HTTPException(status_code=404, detail="Nenhum lance encontrado para este grupo")
    return lances