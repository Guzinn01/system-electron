# Arquivo: api/config.py (Versão Final Correta)

from dotenv import load_dotenv
import os

# Carrega as variáveis do arquivo .env ANTES de qualquer outra coisa
load_dotenv()

# --- Configurações do Banco de Dados ---
DATABASE_URL = os.getenv("DATABASE_URL")

# --- Configurações de Segurança ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Validação Crítica ---
# Adicione este bloco para garantir que as variáveis foram carregadas
if not DATABASE_URL:
    raise ValueError("A variável de ambiente DATABASE_URL não foi definida.")
if not SECRET_KEY:
    raise ValueError("A variável de ambiente SECRET_KEY não foi definida.")

# --- Configurações de Leitura de Planilhas ---
# Cabeçalhos corretos para o Itaú
CABECALHOS_ITAU = {
    'IMOVEL': 4,  # Nome da aba 'IMOVEL', cabeçalho na linha 5 do Excel (índice 4)
    'AUTO': 6     # Nome da aba 'AUTO', cabeçalho na linha 7 do Excel (índice 6)
}
# Cabeçalho para a Porto (Ajuste se necessário)
CABECALHO_PORTO = 0

# +++ MUDANÇA PRINCIPAL ABAIXO +++
# Dicionários de colunas SEPARADOS para cada aba do Itaú, refletindo os nomes exatos.
COLUNAS_ITAU_IMOVEL = {
    'Mês referência': 'data_lance',
    'Grupo': 'grupo',
    'Menor % Lance': 'percentual_minimo',
    'Maior % Lance': 'percentual_maximo',
    'Contemplados Lance': 'qtd_contemplados'
}
COLUNAS_ITAU_AUTO = {
    'Mês referência': 'data_lance',
    'Grupo': 'grupo',
    'Menor % Lance': 'percentual_minimo',
    'Maior % Lance': 'percentual_maximo',
    'Contemplados': 'qtd_contemplados'
}

# Dicionário de colunas da Porto (continua igual)
COLUNAS_PORTO = {
    'Mês Referencia': 'data_lance',
    'Grupo': 'grupo',
    'Menor': 'percentual_minimo',
    'Maior': 'percentual_maximo',
    'Qtde': 'qtd_contemplados',
}