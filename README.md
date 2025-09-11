# Sistema de Gestão de Consórcios (Projeto de Portfólio)

Projeto full-stack desenvolvido para portfólio, simulando um sistema real para gerenciamento de clientes, análise de dados e rotinas administrativas de uma empresa de consórcios. A arquitetura é composta por uma aplicação desktop (criada com **Electron.js**) que se comunica com uma API de processamento de dados (desenvolvida em **Python** e **JavaScript/node.js**).

**Status do Projeto:** 🏁 Concluído

## 🎬 Demonstração

_(Dica: Grave um GIF ou um vídeo curto mostrando o sistema em funcionamento e coloque aqui. Isso valoriza muito o projeto!)_

![GIF da Aplicação](URL_PARA_SEU_GIF_OU_IMAGEM.gif)

## ✨ Funcionalidades Principais

- **📈 Análise de Lances (BI):** Módulo para análise de dados históricos de lances, com visualização em gráficos e tabelas.
- **📂 Upload e Processamento de Planilhas:** Envio de arquivos `.xlsx` que são processados de forma assíncrona por uma API em Python, que valida e insere milhares de registros no banco de dados.
- **👤 Gestão de Clientes (CRUD):** Funcionalidades completas para criar, ler, atualizar e deletar clientes.
- **📄 Simulador de Parcelas:** Ferramenta para simular parcelas com exportação do resultado em formato PDF.
- **🔐 Autenticação e Permissões:** Sistema de login seguro com diferentes níveis de acesso para usuários e administradores.
- **⏰ Registro de Ponto:** Módulo para registro de jornada de trabalho dos colaboradores.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com uma arquitetura de serviços, utilizando as seguintes tecnologias:

- **Desktop (Frontend):**

  - [**Electron.js**](https://www.electronjs.org/)
  - HTML5
  - CSS3
  - JavaScript

- **API (Back-end):**

  - [**Python**](https://www.python.org/)
  - FastAPI
  - Pandas

- **Banco de Dados:**

  - MySQL

- **Controle de Versão:**
  - Git & GitHub

## 🚀 Como Executar o Projeto

Será necessário ter o [Node.js](https://nodejs.org/en/) e o [Python](https://www.python.org/downloads/) instalados.

```bash
# 1. Clone o repositório
git clone [https://github.com/Guzinn01/system-electron.git](https://github.com/Guzinn01/system-electron.git)

# 2. Acesse a pasta do projeto
cd system-electron
```
