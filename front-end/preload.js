// preload.js
const { contextBridge, ipcRenderer } = require("electron");

const validInvokeChannels = [
  "gerar-pdf-simulacao",
  "imprimir-pagina-atual",
  "carregar-dados-clientes",
  "carregar-estado-apurador",
  "ler-dados-planilha",
  "calcular-simulacao-python",
  "gerar-pdf-relatorio-sorteio",
  "is-window-maximized",
  "login-attempt",
  "get-users",
  "add-user",
  "delete-user",
  "update-user",
  "get-users-status",
  "window-state-changed",
  "user-status-updated",
  "gerar-csv-ponto",
  "registrar-ponto",
  "get-ponto-hoje",
  "gerar-pdf-ponto",
  "enviar-jornada-servidor",
  "get-current-user-data",
  "update-user-permissions",
  "get-client-consortium",
  "add-consortium",
  "clientes:get-all",
  "clientes:create",
  "clientes:get-by-id",
  "clientes:update",
  "clientes:delete",
  "consorcios:get-by-client-id",
  "consorcios:create",
  "consorcios:get-by-id",
  "consorcios:update",
  "consorcios:delete",
  "consorcios:transfer",
  "gerar-pdf-com-template",
  "consorcios:get-historico",
  "users:set-status",
  "calcular-simulacao",
  "consorcios:get-transferidos",
  "contratos:get-pdf-data",
  "contratos:abrir-arquivo",
  "get-access-token",
  "abrir-janela-docs-api",
  "lances:get-sumario",
  "lances:get-historico",
  "lances:get-historico-completo",
  "get-active-backend-url",
  "consorcios:delete-contract",
  "ponto:get-registros-mensais",
  "admin:get-historico-ponto-usuario",
  "admin:update-ponto",
  "admin:exportar-planilha",
  "admin:update-observacao",
  "ponto:abrir-preview-folha-mensal",
  "ponto:salvar-preview-como-pdf",
];

const validSendChannels = [
  "salvar-dados-clientes",
  "salvar-estado-apurador",
  "minimize-window",
  "maximize-restore-window",
  "close-window",
  "logout",
  "user-status-updated",
];

const validReceiveChannels = ["window-state-changed", "dados-folha-ponto"];

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel, data) => {
    if (validInvokeChannels.includes(channel)) {
      console.log(
        `[Preload] Invocando canal IPC: ${channel} com dados:`,
        data !== undefined ? data : "Sem dados"
      );
      return ipcRenderer.invoke(channel, data);
    }
    console.error(
      `[Preload] Tentativa de invocar canal IPC não permitido: ${channel}`
    );
    return Promise.reject(
      new Error(`Canal IPC não permitido via invoke: ${channel}`)
    );
  },

  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      console.log(
        `[Preload] Enviando para canal IPC: ${channel} com dados:`,
        data !== undefined ? data : "Sem dados"
      );
      ipcRenderer.send(channel, data);
    } else {
      console.error(
        `[Preload] Tentativa de enviar para canal IPC não permitido: ${channel}`
      );
    }
  },

  on: (channel, listener) => {
    if (validReceiveChannels.includes(channel)) {
      const wrappedListener = (event, ...args) => listener(...args);

      ipcRenderer.on(channel, wrappedListener);

      // Retorna uma função para que o listener possa ser removido depois (boa prática)
      return () => {
        ipcRenderer.removeListener(channel, wrappedListener);
      };
    }
  },

  /**
   * Remove um listener específico de um canal IPC.
   */
  removeListener: (channel, listener) => {
    console.log(`[Preload] Removendo listener do canal IPC: ${channel}`);
    ipcRenderer.removeListener(channel, listener);
  },

  /**
   * Remove todos os listeners de um canal IPC específico, ou todos os listeners se nenhum canal for especificado.
   */
  removeAllListeners: (channel) => {
    console.log(
      `[Preload] Removendo todos os listeners do canal IPC: ${channel || "(todos os canais)"
      }`
    );
    if (channel) {
      ipcRenderer.removeAllListeners(channel);
    } else {
      console.warn(
        "[Preload] Chamando removeAllListeners sem especificar um canal. Isso removerá todos os listeners de todos os canais."
      );
      ipcRenderer.removeAllListeners();
    }
  },

  // --- Funções específicas expostas para o renderer ---

  // Logout
  sendLogout: () => {
    console.log("[Preload] API: sendLogout chamada.");
    if (validSendChannels.includes("logout")) {
      ipcRenderer.send("logout");
    } else {
      console.error(
        '[Preload] Canal "logout" não está listado em validSendChannels.'
      );
    }
  },

  // Listener para mudança de estado da janela
  onWindowStateChange: (callback) => {
    const channel = "window-state-changed";
    console.log(
      `[Preload] API: onWindowStateChange - Registrando listener para canal: ${channel}`
    );
    const wrappedCallback = (event, isMaximized) =>
      callback(event, isMaximized);
    ipcRenderer.on(channel, wrappedCallback);
    return () => {
      console.log(
        `[Preload] Removendo listener de onWindowStateChange para o canal: ${channel}`
      );
      ipcRenderer.removeListener(channel, wrappedCallback);
    };
  },

  gerarPdfSimulacao: (htmlConteudo) => {
    console.log("[Preload] API: gerarPdfSimulacao chamada.");
    return ipcRenderer.invoke("gerar-pdf-simulacao", htmlConteudo);
  },
  gerarRelatorioSorteioPDF: (dadosRelatorio) => {
    console.log("[Preload] API: gerarRelatorioSorteioPDF chamada.");
    return ipcRenderer.invoke("gerar-pdf-relatorio-sorteio", dadosRelatorio);
  },
  imprimirTelaAtualPDF: () => {
    console.log("[Preload] API: imprimirTelaAtualPDF chamada.");
    return contextBridge.exposeInMainWorld.electronAPI.invoke(
      "imprimir-pagina-atual"
    );
  },
  calculadora: async (payload) => {
    console.log("[Preload] API: calculadora chamada.");
    if (validInvokeChannels.includes("calcular-simulacao-python")) {
      try {
        const result = await ipcRenderer.invoke(
          "calcular-simulacao-python",
          payload
        );
        return result;
      } catch (error) {
        console.error(
          '[Preload] Erro ao chamar Python via IPC (na função específica "calculadora"):',
          error
        );
        throw error;
      }
    }
    console.error(
      `[Preload] Canal 'calcular-simulacao-python' não permitido (na função específica "calculadora").`
    );
    return Promise.reject(
      new Error(`Canal IPC não permitido: calcular-simulacao-python`)
    );
  },

  windowMinimize: () => {
    console.log("[Preload] API: windowMinimize chamada.");
    if (validSendChannels.includes("minimize-window")) {
      ipcRenderer.send("minimize-window");
    } else {
      console.error(
        '[Preload] Canal "minimize-window" não listado em validSendChannels.'
      );
    }
  },
  windowMaximizeRestore: () => {
    console.log("[Preload] API: windowMaximizeRestore chamada.");
    if (validSendChannels.includes("maximize-restore-window")) {
      ipcRenderer.send("maximize-restore-window");
    } else {
      console.error(
        '[Preload] Canal "maximize-restore-window" não listado em validSendChannels.'
      );
    }
  },
  windowClose: () => {
    console.log("[Preload] API: windowClose chamada.");
    if (validSendChannels.includes("close-window")) {
      ipcRenderer.send("close-window");
    } else {
      console.error(
        '[Preload] Canal "close-window" não listado em validSendChannels.'
      );
    }
  },
  fetchWindowIsMaximized: () => {
    console.log("[Preload] API: fetchWindowIsMaximized chamada.");
    if (validInvokeChannels.includes("is-window-maximized")) {
      return ipcRenderer.invoke("is-window-maximized");
    }
    console.error(
      '[Preload] Canal "is-window-maximized" não permitido via invoke (na função específica).'
    );
    return Promise.reject(
      new Error("Canal IPC não permitido: is-window-maximized")
    );
  },
});

console.log("[Preload Script] electronAPI foi exposto no MainWorld.");
