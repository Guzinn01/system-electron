# 🚀 Sistema de Gestão – Capitão Consórcio

<p align="center">
  <img alt="Logo Capitão Consórcios" src="./src/assets/LogoBranca.png" width="200px">
</p>

<p align="center">
  <strong>Sistema de desktop integrado para a otimização dos processos internos da Capitão Consórcio.</strong>
</p>

<p align="center">
  <img alt="Status do Projeto" src="https://img.shields.io/badge/status-ativo-green?style=for-the-badge">
  <img alt="Versão" src="https://img.shields.io/badge/versão-1.1.0-blue?style=for-the-badge">
</p>

<p align="center">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=electron&logoColor=white">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-47A248?style=for-the-badge&logo=mysql&logoColor=white">
  <img alt="Python" src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white">
</p>

<p align="center">
  <a href="#-sobre-o-projeto">Sobre</a> •
  <a href="#-funcionalidades-principais">Funcionalidades</a> •
  <a href="#-arquitetura-e-tecnologias">Tecnologias</a> •
  <a href="#-status-e-próximos-passos">Roadmap</a> •
  <a href="#-autor">Autor</a>
</p>

## 📖 Sobre o Projeto

Este sistema foi desenvolvido para centralizar as ferramentas de trabalho da equipe Capitão Consórcio, substituindo fluxos manuais e descentralizados por uma solução desktop moderna, prática e segura, visando otimizar processos e aumentar a eficiência operacional.

## 🎯 Funcionalidades Principais

| Ícone | Funcionalidade                | Descrição Resumida                                                                                    |
| :---: | ----------------------------- | ----------------------------------------------------------------------------------------------------- |
|  🔐   | **Sistema de Login e Acesso** | Autenticação segura por usuário com interface dinâmica baseada em perfis e permissões.                  |
|  👥   | **Gestão de Clientes** | Cadastro completo de clientes (PF/PJ), gestão de consórcios, upload e visualização de contratos.        |
|  💰   | **Registro de Lances** | Ferramenta para registrar e acompanhar lances dos consórcios das administradoras (Porto, Itaú, etc).  |
|  📊   | **Dashboard de Visualização** | Gráficos interativos para análise do andamento, status e "vida" do consórcio de cada cliente.       |
|  🧮   | **Simulador de Parcelas** | Cálculo rápido de parcelas e lances, com impressão de simulações personalizadas em PDF.                 |
|  🏆   | **Apuração de Sorteios** | Apuração de contemplados da Loteria Federal (regras Porto) com geração de relatórios em PDF.            |
|  ⏰   | **Registro de Ponto** | Registro de jornada para colaboradores com impressão do espelho de ponto diário em PDF.                 |
|  👤   | **Gestão de Usuários** | Interface administrativa para gerenciar usuários e suas permissões no sistema.                        |

## 🛠️ Arquitetura e Tecnologias

O sistema utiliza uma arquitetura moderna e distribuída para garantir desempenho, escalabilidade e facilidade de manutenção.

-   **Plataforma Desktop (Frontend):**
    -   **Electron:** Estrutura para criar a aplicação de desktop multiplataforma.
    -   **HTML, CSS & JavaScript:** Interface do usuário, interatividade e visualização de gráficos.

-   **Serviços (Backend):**
    -   **API Principal (Node.js & Express):** API REST para servir os dados da aplicação, gerenciar regras de negócio e autenticação.
    -   **Serviço de Ingestão de Dados (Python):** API dedicada responsável pela conversão de planilhas (`.xlsx`, `.csv`) para o banco de dados, automatizando a importação de dados.
    -   **Banco de Dados (MySQL):** Armazenamento central de todas as informações do sistema.
    -   **Comunicação Real-time (Socket.IO):** Utilizado para funcionalidades em tempo real, como o status online de usuários.

## 🏁 Como Utilizar

Este sistema é de uso interno e distribuído pela equipe de TI da Capitão Consórcio. Para obter acesso, solicitar atualizações ou suporte, entre em contato com o setor responsável.

## 📈 Status e Próximos Passos

-   **Status Atual:** `Ativo` (em produção)
-   **Versão:** `1.1.0`

### Roadmap

#### Concluído ✔️
- [x] Subir o repositório para controle interno.
- [x] Apresentação da primeira versão Demo para validação.
- [x] Desenvolver um sistema de permissões de acesso mais granular.
- [x] Implementar registro de lances (Porto e Itaú).
- [x] Desenvolver dashboard com gráficos interativos.
- [x] Implementar um sistema de relatórios mensais para o registro de ponto.

#### Planejado 📝
- [ ] Melhorar a interface de gestão de clientes com filtros e exportação de dados.

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
    </td>
  </tr>
</table>

<br>

<p align="center">
  <i>Versão do Documento: 1.3 | Data: 08 de agosto de 2025</i>
</p>

