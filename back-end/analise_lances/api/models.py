# Em api/models.py
from sqlalchemy import (Column, Integer, String, DateTime, Text,
                        Table, ForeignKey, Float, Date)
from sqlalchemy.orm import relationship
from .database import Base

# --- MODELOS DE USUÁRIO E PERMISSÃO ---

usuario_permissoes_table = Table('usuario_permissoes', Base.metadata,
                                 Column('id_usuario', Integer, ForeignKey('users_api.id'), primary_key=True),
                                 Column('id_permissao', Integer, ForeignKey('permissoes.id'), primary_key=True)
                                 )


class Usuario(Base):
    __tablename__ = "users_api"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    role = Column(String(50))
    status = Column(String(20), default='ativo')
    refresh_token = Column(Text)
    mongo_id = Column(String(24), unique=True)
    data_criacao = Column(DateTime)

    permissoes = relationship(
        "Permissao",
        secondary=usuario_permissoes_table,
        back_populates="usuarios"
    )


class Permissao(Base):
    __tablename__ = "permissoes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), unique=True, nullable=False)

    usuarios = relationship(
        "Usuario",
        secondary=usuario_permissoes_table,
        back_populates="permissoes"
    )


# --- MODELOS DE LANCES, GRUPOS E CATEGORIAS (COM CORREÇÃO) ---

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    # CORREÇÃO: Adicionado um tamanho para o campo String
    nome = Column(String(255), unique=True, index=True, nullable=False)
    grupos = relationship("Grupo", back_populates="categoria")


class Grupo(Base):
    __tablename__ = "grupos"
    id = Column(Integer, primary_key=True, index=True)
    # CORREÇÃO: Adicionado um tamanho para o campo String
    nome = Column(String(255), unique=True, index=True, nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    categoria = relationship("Categoria", back_populates="grupos")
    lances = relationship("Lance", back_populates="grupo")


class Lance(Base):
    __tablename__ = "lances"
    id = Column(Integer, primary_key=True, index=True)
    data_lance = Column(Date, nullable=False)
    percentual_maximo = Column(Float, nullable=False)
    percentual_minimo = Column(Float, nullable=True)
    qtd_contemplados = Column(Integer, nullable=False)
    grupo_id = Column(Integer, ForeignKey("grupos.id"), nullable=False)
    grupo = relationship("Grupo", back_populates="lances")