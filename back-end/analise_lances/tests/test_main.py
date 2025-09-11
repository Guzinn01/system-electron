# tests/test_main.py
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_read_main():
    """ Teste para garantir que a API está no ar e respondendo. """
    response = client.get("/docs") # Acessa a página de documentação
    assert response.status_code == 200

def test_login_com_usuario_invalido():
    """ Testa se o login falha com credenciais erradas. """
    response = client.post(
        "/token",
        data={"username": "email@errado.com", "password": "senhaerrada"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Email ou senha incorretos"}