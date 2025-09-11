(function () {
  console.log("[Renderer Configuração] Script carregado e executando.");

  // 1. Seleciona os botões da página usando os IDs corretos do seu HTML
  const btnGestaoUsuarios = document.getElementById("btnIrParaGestaoUsuarios");
  const btnDocumentacao = document.getElementById("btnIrParaDocumentacao");
  const btnSair = document.getElementById("btnConfigSair");
  const btnVoltar = document.getElementById("btnVoltarConfig");

  // 2. Função que mostra ou esconde o botão de "Gestão de Usuários"
  async function configurarPaginaPorPermissao() {
    console.log(
      "[Renderer Configuração] Verificando permissões para os itens do menu..."
    );

    // Se o botão não existir na página, não faz nada
    if (!btnGestaoUsuarios) return;

    try {
      const result = await window.electronAPI.invoke("get-current-user-data");

      if (result && result.success && result.user) {
        const permissions = result.user.permissions || [];
        const temPermissao = permissions.includes("gestao_usuarios");

        // Lógica principal: mostra ou esconde o botão
        if (temPermissao) {
          console.log(
            '[Renderer Configuração] Usuário TEM permissão "gestao_usuarios". Exibindo o botão.'
          );
          btnGestaoUsuarios.style.display = "flex";
        } else {
          console.log(
            '[Renderer Configuração] Usuário NÃO TEM permissão "gestao_usuarios". Ocultando o botão.'
          );
          btnGestaoUsuarios.style.display = "none";
        }
      } else {
        // Se não conseguir os dados, esconde por segurança
        console.warn(
          "[Renderer Configuração] Não foi possível obter dados do usuário. Ocultando o botão por segurança."
        );
        btnGestaoUsuarios.style.display = "none";
      }
    } catch (error) {
      console.error(
        "[Renderer Configuração] Erro ao verificar permissões. Ocultando o link por segurança.",
        error
      );
      btnGestaoUsuarios.style.display = "none";
    }
  }

  // 3. Adiciona os eventos de clique para cada botão
  if (btnGestaoUsuarios) {
    btnGestaoUsuarios.addEventListener("click", () => {
      window.location.hash = "/gestao_usuarios";
    });
  }

  if (btnDocumentacao) {
    btnDocumentacao.addEventListener("click", () => {
      window.location.hash = "/documentacao";
    });
  }

  if (btnSair) {
    btnSair.addEventListener("click", () => {
      if (
        window.electronAPI &&
        typeof window.electronAPI.sendLogout === "function"
      ) {
        window.electronAPI.sendLogout();
      }
    });
  }

  if (btnVoltar) {
    btnVoltar.addEventListener("click", () => {
      window.location.hash =
        "/src/pages/simulador_parcelas/html/simulador_parcelas.html";
    });
  }

  // 4. Inicializa a verificação de permissões assim que a página carrega
  configurarPaginaPorPermissao();
})();
