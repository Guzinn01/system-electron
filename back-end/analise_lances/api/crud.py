from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from dateutil.relativedelta import relativedelta
from typing import Optional
from sqlalchemy.orm import Session, joinedload
import pandas as pd

from . import security, models, schemas


# --- Funções CRUD para Categoria ---

def get_or_create_categoria(db: Session, nome_categoria: str) -> models.Categoria:
    db_categoria = db.query(models.Categoria).filter(models.Categoria.nome == nome_categoria).first()
    if not db_categoria:
        db_categoria = models.Categoria(nome=schemas.CategoriaCreate(nome=nome_categoria).nome)
        db.add(db_categoria)
        db.flush()
        db.refresh(db_categoria)
    return db_categoria


# --- Funções CRUD para Grupo ---

def get_or_create_grupo(db: Session, nome_grupo: str, categoria_id: int) -> models.Grupo:
    grupo = db.query(models.Grupo).filter(models.Grupo.nome == nome_grupo).first()
    if not grupo:
        grupo = models.Grupo(nome=nome_grupo, categoria_id=categoria_id)
        db.add(grupo)
        db.flush()
        db.refresh(grupo)
    return grupo


# --- Funções CRUD para Lance ---

def upsert_lance_para_grupo(db: Session, lance_data: schemas.LanceCreate, grupo_id: int):
    """
    Verifica se um lance existe para o grupo e data.
    Se existir, atualiza. Se não, cria um novo.
    """
    db_lance = db.query(models.Lance).filter(
        models.Lance.grupo_id == grupo_id,
        models.Lance.data_lance == lance_data.data_lance
    ).first()

    if db_lance:
        # Se encontrou o lance, ATUALIZA os valores
        db_lance.percentual_maximo = lance_data.percentual_maximo
        db_lance.percentual_minimo = lance_data.percentual_minimo
        db_lance.qtd_contemplados = lance_data.qtd_contemplados
    else:
        # Se NÃO encontrou, CRIA um novo
        db_lance = models.Lance(**lance_data.model_dump(), grupo_id=grupo_id)
        db.add(db_lance)

    return db_lance


# --- Funções de Análise ---

def get_sumario_grupos(db: Session, query: Optional[str] = None):
    # 1. FAZEMOS A CONSULTA COM JOIN PARA INCLUIR A CATEGORIA
    base_query = (
        db.query(
            models.Grupo.nome.label("grupo_nome"),
            models.Categoria.nome.label("categoria_completa"),
            func.avg(models.Lance.percentual_maximo).label("media_maximo"),
            func.avg(models.Lance.percentual_minimo).label("media_minimo"),
            func.count(models.Lance.id).label("total_lances")
        )
        .join(models.Lance, models.Grupo.id == models.Lance.grupo_id)
        .join(models.Categoria, models.Grupo.categoria_id == models.Categoria.id)  # JOIN adicionado
    )

    if query:
        base_query = base_query.filter(models.Grupo.nome.ilike(f"%{query}%"))

    # Agrupamos pelas colunas de texto
    resultado_db = base_query.group_by(models.Grupo.nome, models.Categoria.nome).all()

    # 2. PROCESSAMOS O RESULTADO PARA FORMATAR A SAÍDA
    # A API agora vai retornar os nomes exatos que o frontend espera
    lista_formatada = []
    for item in resultado_db:
        # A categoria vem como "Imovel - Porto", então separamos em duas partes
        partes_categoria = item.categoria_completa.split(' - ')
        categoria = partes_categoria[0].strip() if len(partes_categoria) > 0 else 'N/A'
        administradora = partes_categoria[1].strip() if len(partes_categoria) > 1 else 'N/A'

        lista_formatada.append({
            "grupo": item.grupo_nome,
            "administradora": administradora,
            "categoria": categoria,
            "lanceMinUltimoMes": item.media_minimo or 0,
            "lanceMaxUltimoMes": item.media_maximo or 0,
            "qtdContempladosUltimoMes": item.total_lances,
            "id": item.grupo_nome  # Adicionamos o 'id' que o frontend usa
        })

    return lista_formatada


def get_lances_por_grupo(db: Session, nome_grupo: str):
    # --- CORREÇÃO APLICADA AQUI ---
    # 1. Usamos .first() que retorna None se não encontrar, em vez de quebrar.
    grupo = db.query(models.Grupo).filter(models.Grupo.nome == nome_grupo).first()

    # 2. Verificamos se o grupo foi encontrado. Se não, retornamos uma lista vazia.
    if not grupo:
        return []  # Retorna vazio, não causa o erro 500.

    # Se o grupo foi encontrado, o resto da lógica continua.
    hoje = date.today()
    # Buscamos o histórico dos últimos 6 meses a partir do início do mês.
    data_limite = (hoje - relativedelta(months=5)).replace(day=1)

    lances_existentes = (
        db.query(models.Lance)
        .filter(models.Lance.grupo_id == grupo.id)  # Usamos o ID do grupo que encontramos
        .filter(models.Lance.data_lance >= data_limite)
        .order_by(models.Lance.data_lance.asc())
        .all()
    )

    # --- O resto da função continua igual para preencher os meses vazios ---
    if not lances_existentes:
        return []

    indice_meses = pd.date_range(start=data_limite, end=hoje, freq='MS').date

    df_lances = pd.DataFrame([l.__dict__ for l in lances_existentes])
    df_lances['data_lance'] = pd.to_datetime(df_lances['data_lance']).dt.to_period('M').dt.start_time.dt.date
    df_lances = df_lances.set_index('data_lance')

    df_resultado = pd.DataFrame(index=indice_meses)
    df_resultado = df_resultado.join(df_lances)
    df_resultado.fillna(0, inplace=True)
    df_resultado.reset_index(inplace=True)
    df_resultado.rename(columns={'index': 'data_lance'}, inplace=True)

    for col in ['percentual_maximo', 'percentual_minimo', 'qtd_contemplados', 'id', 'grupo_id']:
        if col in df_resultado.columns:
            df_resultado[col] = pd.to_numeric(df_resultado[col], errors='coerce').fillna(0)

    colunas_resposta = ['data_lance', 'percentual_maximo', 'percentual_minimo', 'qtd_contemplados']
    df_final = df_resultado[colunas_resposta]
    df_final = df_final.sort_values(by='data_lance', ascending=False)

    return df_final.to_dict('records')


def get_lances_completos_por_grupo(db: Session, nome_grupo: str):
    return (
        db.query(models.Lance)
        .join(models.Grupo)
        .filter(models.Grupo.nome == nome_grupo)
        .options(joinedload(models.Lance.grupo).joinedload(models.Grupo.categoria))
        .order_by(models.Lance.data_lance.asc())
        .all()
    )

def get_data_ultimo_lance(db: Session, nome_grupo: str) -> Optional[date]:

    ultimo_lance_data = (
        db.query(func.max(models.Lance.data_lance))
        .join(models.Grupo)
        .filter(models.Grupo.nome == nome_grupo)
        .scalar()
    )
    return ultimo_lance_data


def get_user_by_email(db: Session, email: str) -> Optional[models.Usuario]:
    """Busca um usuário pelo email."""
    # Correção: Usar o modelo 'Usuario' que definimos em models.py
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.Usuario:
    """Cria um novo usuário no banco de dados."""
    # Pega a senha do schema e usa a função de segurança para criar o hash
    hashed_password = security.get_password_hash(user.password)

    # Correção: Cria o objeto 'models.Usuario' com os campos corretos
    # Usamos 'senha_hash' e adicionamos 'username' e 'role'
    db_user = models.Usuario(
        email=user.email,
        senha_hash=hashed_password,
        username=user.username,
        role=user.role
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user