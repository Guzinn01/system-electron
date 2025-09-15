# 🚀 Sistema de Gestão de Consórcios (Projeto de Portfólio)

<p align="center">
  <strong>Sistema de desktop integrado para a otimização dos processos internos de uma empresa de consórcios.</strong>
</p>

<p align="center">
  <img alt="Status do Projeto" src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow?style=for-the-badge">
  <img alt="Versão" src="https://img.shields.io/badge/versão-1.1.0-blue?style=for-the-badge">
</p>

<p align="center">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=electron&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
  <img alt="Python" src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-47A248?style=for-the-badge&logo=mysql&logoColor=white">
  <img alt="Docker" src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-funcionalidades-principais">Funcionalidades</a> •
  <a href="#-arquitetura-e-tecnologias">Tecnologias</a> •
  <a href="#-configuração-e-execução-do-ambiente">Como Executar</a> •
  <a href="#-autor">Autor</a>
</p>

## 📖 Sobre o Projeto

Este projeto foi desenvolvido como uma vitrine de portfólio, simulando um sistema de gestão completo para uma empresa de consórcios. O objetivo é demonstrar competências em engenharia de software, incluindo desenvolvimento full-stack, arquitetura de microserviços, integração de APIs e análise de dados.

A aplicação centraliza ferramentas de trabalho, substituindo fluxos manuais e descentralizados por uma solução desktop moderna, prática e segura.

## ✨ Funcionalidades Principais

| Ícone | Funcionalidade                | Descrição Resumida                                                                                    |
| :---: | ----------------------------- | ----------------------------------------------------------------------------------------------------- |
|  🔐   | **Sistema de Login e Acesso** | Autenticação segura por usuário com interface dinâmica baseada em perfis e permissões (JWT).            |
|  👥   | **Gestão de Clientes (CRM)**  | Cadastro completo de clientes (PF/PJ), gestão de consórcios, upload e visualização de contratos.        |
|  📈   | **Análise de Lances (BI)**    | Módulo para análise de dados históricos de lances, com visualização em gráficos e tabelas interativas.  |
|  📂   | **Ingestão de Dados**         | Upload de planilhas (`.xlsx`) processadas por uma API Python dedicada, que valida e salva os registros. |
|  🧮   | **Simulador de Parcelas**     | Cálculo rápido de parcelas e lances, com impressão de simulações personalizadas em PDF.                 |
|  🏆   | **Apuração de Sorteios**      | Apuração de contemplados da Loteria Federal com geração de relatórios em PDF.                           |
|  ⏰   | **Registro de Ponto**         | Registro de jornada para colaboradores com impressão do espelho de ponto diário/mensal em PDF.            |
|  👤   | **Gestão de Usuários**        | Interface administrativa para gerenciar usuários e suas permissões no sistema.                        |

## 🛠️ Arquitetura e Tecnologias

O sistema utiliza uma arquitetura de microserviços orquestrada com Docker para garantir desempenho, escalabilidade e facilidade de manutenção.

*   **Plataforma Desktop (Frontend):**
    *   **Electron:** Estrutura para criar a aplicação de desktop multiplataforma.
    *   **HTML, CSS & JavaScript:** Interface do usuário, interatividade e visualização de gráficos com `Chart.js`.

*   **Serviços (Backend):**
    *   **API Principal (Node.js & Express):** API REST principal (`nodejs_gateway_service`) que gerencia regras de negócio, autenticação e operações CRUD. Utiliza **Sequelize ORM** para comunicação com o banco.
    *   **Serviço de Ingestão de Dados (Python & FastAPI):** API (`python_api_service`) dedicada à conversão e processamento de planilhas (`.xlsx`, `.csv`), utilizando **Pandas** para manipulação dos dados.
    *   **Banco de Dados (MySQL):** Armazenamento central de todas as informações do sistema, rodando em um contêiner `mysql_db_service`.
    *   **Comunicação Real-time (Socket.IO):** Utilizado para funcionalidades em tempo real, como o status online de usuários.

*   **Infraestrutura e Orquestração:**
    *   **Docker & Docker Compose:** Containeriza todos os serviços do backend, garantindo um ambiente de desenvolvimento e produção consistente e isolado.

## 🚀 Configuração e Execução do Ambiente

Para executar o projeto, você precisará ter o **Git** e o **Docker Desktop** instalados.

```bash
# 1. Clone o repositório
git clone https://github.com/Guzinn01/system-electron.git
cd system-electron

# 2. Acesse a pasta do backend e configure o ambiente
cd back-end

# Crie um arquivo chamado .env.docker a partir do exemplo
# (No Windows, pode usar 'copy' em vez de 'cp')
cp .env.example .env.docker

# 3. Construa as imagens e inicie os contêineres Docker
# O comando -d (detached) executa os contêineres em segundo plano.
docker-compose up --build -d

# 4. Rode as migrations para criar a estrutura do banco de dados
docker-compose exec nodejs_gateway_service npx sequelize-cli db:migrate

# 5. (Opcional) Popule o banco com dados iniciais (ex: usuário admin)
docker-compose exec nodejs_gateway_service npx sequelize-cli db:seed:all

# 6. Inicie a aplicação Electron (em outro terminal, a partir da raiz do projeto)
cd ../front-end
npm install
npm start
```

### 🗃️ Comandos de Migração (Sequelize)

Todos os comandos devem ser executados de dentro da pasta `back-end`, utilizando o nome do serviço do Node.js (`nodejs_gateway_service`).

*   **Criar uma nova migration:**
    ```bash
    docker-compose exec nodejs_gateway_service npx sequelize-cli migration:generate --name nome-da-migration
    ```

*   **Aplicar todas as migrations pendentes:**
    ```bash
    docker-compose exec nodejs_gateway_service npx sequelize-cli db:migrate
    ```

*   **Reverter a última migration:**
    ```bash
    docker-compose exec nodejs_gateway_service npx sequelize-cli db:migrate:undo
    ```

*   **Reverter todas as migrations:**
    > **CUIDADO:** Este comando é destrutivo e irá apagar todas as tabelas gerenciadas pelo Sequelize.
    ```bash
    docker-compose exec nodejs_gateway_service npx sequelize-cli db:migrate:undo:all
    ```

## 👨‍💻 Autor

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Guzinn01">
        <img src="https://avatars.githubusercontent.com/u/201021844?v=4" width="100px;" alt="Foto de Gustavo no GitHub"/><br>
        <sub>
          <b>Gustavo (Guzinn01)</b>
        </sub>
      </a>
    </td>
    <td align="left">
      Desenvolvedor responsável pelo projeto.<br><br>
      <a href="https://github.com/Guzinn01" title="GitHub">
        <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" />
      </a>
      <a href="https://www.linkedin.com/in/gustavo-da-silva-martins-rodrigues-a78b4b1b3/" title="LinkedIn">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" />
      </a>
    </td>
  </tr>
</table>