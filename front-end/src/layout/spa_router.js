document.addEventListener("DOMContentLoaded", () => {
  console.log("[SPA Router] DOMContentLoaded disparado.");

  // ===================================================================
  // NOVO: LÓGICA GLOBAL DE TEMA
  // Carrega o tema salvo no localStorage assim que a aplicação inicia.
  // ===================================================================
  (function () {
    const temaSalvo = localStorage.getItem('theme');
    if (temaSalvo === 'dark') {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }
  })();
  // ===================================================================

  const mostrarNotificacao = (mensagem, tipo = "sucesso") => {
    const container = document.getElementById("notificacao-container");

    // Cria o elemento da notificação
    const toast = document.createElement("div");
    toast.className = `toast-notificacao ${tipo}`;
    toast.textContent = mensagem;

    // Adiciona a notificação na tela
    container.appendChild(toast);

    // Força o navegador a reconhecer o elemento antes de adicionar a classe de animação
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);

    // Define um tempo para remover a notificação
    setTimeout(() => {
      toast.classList.remove("show");

      // Espera a animação de saída terminar para remover o elemento da tela
      toast.addEventListener("transitionend", () => {
        toast.remove();
      });
    }, 4000); // A notificação ficará visível por 4 segundos
  };

  window.showNotification = mostrarNotificacao;

  // Espera um ciclo para garantir que o preload.js e outras inicializações possam ter ocorrido.
  setTimeout(() => {
    console.log(
      "[SPA Router] Executando lógica do roteador, controles de janela e logout após setTimeout(0)."
    );

    const contentArea = document.getElementById("content-area");
    const titleElement = document.querySelector(".custom-title-bar .title");

    if (!contentArea) {
      console.error(
        '[SPA Router] ERRO CRÍTICO: O elemento com ID "content-area" não foi encontrado no DOM.'
      );
      return;
    }
    if (!titleElement) {
      console.warn(
        "[SPA Router] Elemento de título da página não encontrado. O título não será atualizado."
      );
    }

    const navItems = document.querySelectorAll(".nav-item:not(#navLogout)");
    const navLogoutButton = document.getElementById("navLogout");
    console.log("--- TESTE: ESTOU PRESTES A CHAMAR A FUNÇÃO DE PERMISSÃO ---");

    applyUIPermissions();

    async function applyUIPermissions() {
      console.log("[SPA Router] Aplicando permissões na interface...");
      try {
        const resultado = await window.electronAPI.invoke(
          "get-current-user-data"
        );

        if (resultado.success && resultado.user) {
          const userPermissions = resultado.user.permissions || [];
          console.log(
            "[SPA Router] Permissões do usuário encontradas:",
            userPermissions
          );

          // Seleciona todos os links de navegação que podem ser controlados (que têm o atributo data-page)
          const navLinks = document.querySelectorAll(
            ".nav-items-main .nav-item[data-page]"
          );

          navLinks.forEach((link) => {
            const pageName = link.dataset.page;

            // Se a página for 'configuracao', não faz nada e deixa ela visível
            if (pageName === "configuracao") {
              return;
            }

            // Para todas as outras páginas, a lógica de permissão continua
            if (userPermissions.includes(pageName)) {
              link.style.display = "flex";
            } else {
              link.style.display = "none";
            }
          });
        } else {
          console.warn(
            "[SPA Router] Não foi possível obter dados do usuário. Escondendo links de navegação."
          );
          document
            .querySelectorAll(".nav-items-main .nav-item[data-page]")
            .forEach((link) => {
              link.style.display = "none";
            });
        }
      } catch (error) {
        console.error(
          "[SPA Router] Erro crítico ao aplicar permissões na UI:",
          error
        );
      }
    }

    const routes = {
      "/": {
        html: "../pages/dashboard/html/dashboard.html",
        script: "../pages/dashboard/js/dashboard.js",
        css: "../pages/dashboard/css/dashboard.css",
        pageKey: "dashboard",
        title: "Dashboard",
      },

      "/dashboard": {
        html: "../pages/dashboard/html/dashboard.html",
        script: "../pages/dashboard/js/dashboard.js",
        css: "../pages/dashboard/css/dashboard.css",
        pageKey: "dashboard",
        title: "Dashboard",
      },

      "/sorteio": {
        html: "../pages/sorteio/html/sorteio.html",
        script: "../pages/sorteio/js/renderer_sorteio.js",
        css: "../pages/sorteio/css/sorteio.css",
        pageKey: "sorteio",
        title: "Apurador e Consulta de Sorteio",
      },
      "/simulador_parcelas": {
        html: "../pages/simulador_parcelas/html/simulador_parcelas.html",
        script: "../pages/simulador_parcelas/js/renderer_simulador_parcelas.js",
        css: "../pages/simulador_parcelas/css/simulador_parcelas.css",
        pageKey: "simulador_parcelas",
        title: "Simulador de Parcelas",
      },
      "/gestao_usuarios": {
        html: "../pages/configuracao/html/gestao_usuarios.html",
        script: "../pages/configuracao/js/renderer_gestao_usuarios.js",
        css: "../pages/configuracao/css/gestao_usuarios.css",
        pageKey: "gestao_usuarios",
        title: "Gestão de Usuários",
      },
      "/configuracao": {
        html: "../pages/configuracao/html/configuracao.html",
        script: "../pages/configuracao/js/renderer_configuracao.js",
        css: "../pages/configuracao/css/configuracao.css",
        pageKey: "configuracao",
        title: "Configurações",
      },
      "/ponto": {
        html: "../pages/ponto/html/ponto.html",
        script: "../pages/ponto/js/renderer_ponto.js",
        css: "../pages/ponto/css/ponto.css",
        pageKey: "ponto",
        title: "Registro de Ponto",
      },
      "/gestao_clientes": {
        html: "../pages/gestao_clientes/html/gestao_clientes.html",
        script: "../pages/gestao_clientes/js/renderer_gestao_clientes.js",
        css: "../pages/gestao_clientes/css/gestao_clientes.css",
        pageKey: "gestao_clientes",
        title: "Gestão de Clientes",
      },
      "/documentacao": {
        html: "../pages/configuracao/html/documentacao.html",
        css: "../pages/configuracao/css/documentacao.css",
        script: "../pages/configuracao/js/documentacao.js",
        title: "Documentação do Sistema",
      },
      "/gestao_lances": {
        html: "../pages/gestao_lances/html/gestao_lances.html",
        script: "../pages/gestao_lances/js/renderer_gestao_lances.js",
        css: "../pages/gestao_lances/css/gestao_lances.css",
        pageKey: "gestao_lances",
        title: "Histórico de Lances",
      },
    };

    async function loadPage(pageRouteKey) {
      console.log(`[SPA Router] Tentando carregar rota: ${pageRouteKey}`);
      if (!contentArea) {
        console.error("[SPA Router] ERRO em loadPage: contentArea é null.");
        return;
      }
      const routeConfig = routes[pageRouteKey];
      if (!routeConfig) {
        console.error(`[SPA Router] Rota não encontrada para: ${pageRouteKey}`);
        contentArea.innerHTML = "<p>Página não encontrada (Erro 404).</p>";
        if (titleElement) titleElement.textContent = "Erro 404";
        return;
      }

      const htmlPath = `./${routeConfig.html}`;
      const scriptPath = routeConfig.script;
      const cssPath = routeConfig.css;

      try {
        const response = await fetch(htmlPath);
        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status} ao buscar ${htmlPath}`);
        }
        const html = await response.text();
        contentArea.innerHTML = html;
        if (titleElement)
          titleElement.textContent = routeConfig.title || "Capitão Consórcios";

        document.querySelectorAll(".modal-backdrop").forEach((modal) => {
          if (modal) {
            modal.classList.add("hidden");
          }
        });

        // --- LÓGICA DE REMOÇÃO ---
        document
          .querySelectorAll('script[data-page-script="true"]')
          .forEach((s) => s.remove());
        document
          .querySelectorAll('link[data-page-css="true"]')
          .forEach((l) => l.remove());

        // --- LÓGICA DE ADIÇÃO ---
        if (cssPath) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.type = "text/css";

          // CRIA UMA URL ABSOLUTA E À PROVA DE ERROS
          const absoluteUrl = new URL(cssPath, document.baseURI).href;
          link.href = absoluteUrl;

          link.setAttribute("data-page-css", "true");
          document.head.appendChild(link);
          console.log(
            `[SPA Router] CSS dinâmico ${cssPath} adicionado como ${absoluteUrl}.`
          );
        }

        if (scriptPath) {
          const script = document.createElement("script");
          script.src = scriptPath;
          script.type = "text/javascript";
          script.defer = true;
          script.setAttribute("data-page-script", "true");
          document.body.appendChild(script);
          console.log(`[SPA Router] Script ${scriptPath} adicionado.`);
        }
      } catch (error) {
        console.error(
          `[SPA Router] Erro ao carregar a página para rota "${pageRouteKey}" (HTML: ${htmlPath}):`,
          error
        );
        if (contentArea) {
          contentArea.innerHTML = `<p>Erro ao carregar o conteúdo da página. Verifique o console.</p>`;
        }
        if (titleElement) titleElement.textContent = "Erro ao Carregar";
      }
    }

    function handleRouteChange() {
      const hash = window.location.hash.substring(1);
      let routeKey = hash || "/";

      if (routeKey && !routeKey.startsWith("/") && routeKey !== "") {
        routeKey = `/${routeKey}`;
      }

      if (!routes[routeKey] && routeKey !== "/") {
        console.warn(
          `[SPA Router] Rota via hash "${hash}" (processada como "${routeKey}") não é válida. Redirecionando para a rota padrão.`
        );
        const defaultRouteKey =
          Object.keys(routes).find((k) => routes[k].pageKey === "sorteio") ||
          "/";
        window.location.hash = `#${defaultRouteKey.startsWith("/")
          ? defaultRouteKey.substring(1)
          : defaultRouteKey
          }`;
        return;
      }

      console.log(`[SPA Router] Rota atual via hash: ${routeKey}`);

      // A linha que causava o erro foi removida daqui.

      loadPage(routeKey);

      navItems.forEach((item) => {
        const itemPageKey = item.dataset.page;
        if (routes[routeKey] && itemPageKey === routes[routeKey].pageKey) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
    }

    navItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();
        const pageName = item.dataset.page;
        if (pageName) {
          const targetHash = pageName.startsWith("/")
            ? pageName
            : `/${pageName}`;
          if (window.location.hash === `#${targetHash}`) {
            console.log(
              `[SPA Router] Clicou no link da página atual (${pageName}). Recarregando conteúdo.`
            );
            loadPage(targetHash);
          } else {
            window.location.hash = targetHash;
          }
        } else {
          console.warn(
            "[SPA Router] Nav-item clicado não possui data-page:",
            item
          );
        }
      });
    });

    if (navLogoutButton) {
      navLogoutButton.addEventListener("click", (event) => {
        event.preventDefault();
        console.log("[SPA Router] Botão de Logout clicado.");
        if (
          window.electronAPI &&
          typeof window.electronAPI.sendLogout === "function"
        ) {
          window.electronAPI.sendLogout();
        } else {
          console.error(
            "[SPA Router] API de Logout (window.electronAPI.sendLogout) não encontrada. Verifique o preload.js."
          );
          alert("Erro: Funcionalidade de logout não está disponível.");
        }
      });
    } else {
      console.warn("[SPA Router] Botão de Logout (navLogout) não encontrado.");
    }

    window.addEventListener("hashchange", handleRouteChange);
    console.log("[SPA Router] Chamando handleRouteChange para carga inicial.");
    handleRouteChange(); // Carga inicial da página

    // --- LÓGICA PARA OS BOTÕES DE CONTROLE DA JANELA (Minimizar, Maximizar, Fechar) ---
    const minimizeButton = document.getElementById("minimize-btn");
    const maximizeRestoreButton = document.getElementById(
      "maximize-restore-btn"
    );
    const closeButton = document.getElementById("close-btn");

    if (minimizeButton && maximizeRestoreButton && closeButton) {
      const maximizeIconElement = maximizeRestoreButton.querySelector("i");

      async function updateMaximizeRestoreIcon() {
        if (
          !window.electronAPI ||
          typeof window.electronAPI.fetchWindowIsMaximized !== "function"
        ) {
          return;
        }
        try {
          const isMaximized = await window.electronAPI.fetchWindowIsMaximized();
          if (maximizeIconElement) {
            if (isMaximized) {
              maximizeIconElement.classList.remove("fa-window-maximize");
              maximizeIconElement.classList.add("fa-window-restore");
              maximizeRestoreButton.title = "Restaurar";
            } else {
              maximizeIconElement.classList.remove("fa-window-restore");
              maximizeIconElement.classList.add("fa-window-maximize");
              maximizeRestoreButton.title = "Maximizar";
            }
          }
        } catch (error) {
          console.error(
            "[WindowControls] Erro ao buscar estado de maximização da janela:",
            error
          );
        }
      }

      if (
        window.electronAPI &&
        typeof window.electronAPI.windowMinimize === "function"
      ) {
        minimizeButton.addEventListener("click", () =>
          window.electronAPI.windowMinimize()
        );
      }
      if (
        window.electronAPI &&
        typeof window.electronAPI.windowMaximizeRestore === "function"
      ) {
        maximizeRestoreButton.addEventListener("click", () =>
          window.electronAPI.windowMaximizeRestore()
        );
      }
      if (
        window.electronAPI &&
        typeof window.electronAPI.windowClose === "function"
      ) {
        closeButton.addEventListener("click", () =>
          window.electronAPI.windowClose()
        );
      }

      if (
        window.electronAPI &&
        typeof window.electronAPI.onWindowStateChange === "function"
      ) {
        window.electronAPI.onWindowStateChange((event, isMaximized) => {
          console.log(
            '[WindowControls] Evento "window-state-changed" recebido do main. Novo estado maximizado:',
            isMaximized
          );
          updateMaximizeRestoreIcon();
        });
      }
      updateMaximizeRestoreIcon();
    } else {
      console.warn(
        "[WindowControls] Um ou mais botões de controle da janela não foram encontrados."
      );
    }
    console.log(
      "[SPA Router] Roteador SPA e Controles de Janela inicializados."
    );
  }, 0);
});