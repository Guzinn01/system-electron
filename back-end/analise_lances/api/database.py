from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from . import config

DATABASE_URL = config.DATABASE_URL

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def criar_banco():
    from . import models
    Base.metadata.create_all(bind=engine)