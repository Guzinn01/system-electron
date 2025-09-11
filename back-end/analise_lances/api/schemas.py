# api/schemas.py

from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import date
from typing import List, Optional

# ====================================================
#               SCHEMAS DE LANCES, GRUPOS E CATEGORIAS
# ====================================================

class CategoriaBase(BaseModel):
    nome: str

class GrupoBase(BaseModel):
    nome: str

class LanceBase(BaseModel):
    data_lance: date
    percentual_maximo: float
    percentual_minimo: Optional[float] = None
    qtd_contemplados: int

# --- Schemas para Criação ---

class CategoriaCreate(CategoriaBase):
    pass

class GrupoCreate(GrupoBase):
    pass

class LanceCreate(LanceBase):
    pass

# --- Schemas para Respostas de API (com correção de loop) ---

class Categoria(CategoriaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class GrupoParaRespostaLance(GrupoBase):
    id: int
    categoria: Categoria
    model_config = ConfigDict(from_attributes=True)

class LanceParaRespostaGrupo(LanceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class Lance(LanceBase):
    id: int
    grupo: GrupoParaRespostaLance
    model_config = ConfigDict(from_attributes=True)

class Grupo(GrupoBase):
    id: int
    categoria: Categoria
    lances: List[LanceParaRespostaGrupo] = []
    model_config = ConfigDict(from_attributes=True)

# ====================================================
#               OUTROS SCHEMAS DE SUPORTE
# ====================================================

class StatusResponse(BaseModel):
    status: str
    message: str

class SumarioGrupo(BaseModel):
    id: str
    grupo: str
    administradora: str
    categoria: str
    lanceMaxUltimoMes: float
    lanceMinUltimoMes: float
    qtdContempladosUltimoMes: int

    model_config = ConfigDict(from_attributes=True)

class HistoricoLance(BaseModel):
    data_lance: date
    percentual_maximo: float
    percentual_minimo: Optional[float] = None
    qtd_contemplados: int
    model_config = ConfigDict(from_attributes=True)

# ====================================================
#          SCHEMAS DE USUÁRIO E TOKEN (CORRIGIDOS)
# ====================================================

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str
    role: str = "VENDEDOR"

class UserOut(UserBase):
    id: int
    role: str
    status: str
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str