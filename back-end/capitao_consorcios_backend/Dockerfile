# Use uma imagem base do Node.js leve
FROM node:18-alpine

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copie os arquivos de dependência e instale-as
# Isso aproveita o cache do Docker, acelerando builds futuros
COPY package*.json ./
RUN npm install

# Copie o resto dos arquivos da sua aplicação
COPY . .

# Exponha a porta que seu servidor usa
EXPOSE 3000

# O comando para iniciar sua aplicação
CMD [ "node", "server.js" ]