(function () {
  console.log("[Renderer Configuração] Script carregado e executando.");

  // 1. Seleciona os botões da página
  const btnGestaoUsuarios = document.getElementById("btnIrParaGestaoUsuarios");
  const btnDocumentacao = document.getElementById("btnIrParaDocumentacao");
  const btnSair = document.getElementById("btnConfigSair");
  const btnVoltar = document.getElementById("btnVoltarConfig");

  // 2. Função que mostra ou esconde o botão de "Gestão de Usuários"
  async function configurarPaginaPorPermissao() {
    console.log(
      "[Renderer Configuração] Verificando permissões para os itens do menu..."
    );
    if (!btnGestaoUsuarios) return;
    try {
      const result = await window.electronAPI.invoke("get-current-user-data");
      if (result && result.success && result.user) {
        const permissions = result.user.permissions || [];
        const temPermissao = permissions.includes("gestao_usuarios");
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

  // 3. Adiciona os eventos de clique para cada botão de navegação
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
      // Recomendo usar o hash para voltar para a página anterior ou a home
      window.history.back(); // Opção mais simples para voltar
    });
  }

  // 4. Inicializa a verificação de permissões
  configurarPaginaPorPermissao();

  // ===================================================================
  // NOVA LÓGICA PARA O SELETOR DE TEMA - Adicionada aqui
  // ===================================================================

  // Seleciona o interruptor e o corpo do documento
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  // Função que aplica o tema desejado
  const applyTheme = (theme) => {
    // Se o tema for 'dark', adiciona o atributo data-theme="dark" no body
    if (theme === "dark") {
      body.setAttribute("data-theme", "dark");
      if (themeToggle) themeToggle.checked = true; // Marca o interruptor
    } else {
      // Senão, remove o atributo (voltando para o tema claro padrão)
      body.removeAttribute("data-theme");
      if (themeToggle) themeToggle.checked = false; // Desmarca o interruptor
    }
  };

  // Adiciona o evento de clique no interruptor
  if (themeToggle) {
    themeToggle.addEventListener("change", () => {
      // Verifica se o interruptor está marcado ou não
      const newTheme = themeToggle.checked ? "dark" : "light";
      applyTheme(newTheme);
      // Salva a preferência no localStorage para ser lembrada
      localStorage.setItem("theme", newTheme);
    });
  }

  // Função que carrega o tema salvo assim que a aplicação abre
  const loadSavedTheme = () => {
    const savedTheme = localStorage.getItem("theme");
    // Se encontrou um tema salvo, aplica-o. Senão, não faz nada (usa o padrão claro).
    if (savedTheme) {
      applyTheme(savedTheme);
    }
  };

  // Chama a função para carregar o tema salvo
  // É importante que o tema seja carregado em todas as páginas,
  // então esta lógica também deve existir no seu script principal (como o spa_router.js)
  // para que o tema não "pisque" ao trocar de página.
  loadSavedTheme();

})();