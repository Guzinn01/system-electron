# Use uma imagem base do Python leve
FROM python:3.10-slim

# Defina o diretório de trabalho
WORKDIR /code

# Copie o arquivo de dependências e instale-as
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copie o resto dos arquivos da sua API
COPY ./api /code/api

# Exponha a porta que a API usa
EXPOSE 8000

# O comando para iniciar o Uvicorn
# O host 0.0.0.0 é ESSENCIAL para que a porta seja acessível de fora do contêiner
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]