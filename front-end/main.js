// main.js (Arquivo Principal)
console.log("[Main Process] Script main.js INICIADO.");

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  Notification,
  nativeTheme,
} = require("electron");
const path = require("path");
const fs = require("fs");
const url = require("url");
const axios = require("axios");
const { io } = require("socket.io-client");
const xlsx = require("xlsx");

app.commandLine.appendSwitch("lang", "pt-BR");

const BACKEND_URL_LOCAL = "http://localhost:3000";

// Variáveis globais que serão definidas durante a execução
let store;
let activeBackendUrl = null;
let loginWindow;
let mainWindow;
let socket = null;
let currentUserSession = null;
let dadosClientesFilePath;
let apuradorStateFilePath;
let pontoDiarioFilePath;

const isDev = process.env.NODE_ENV !== "production";
const { realizarCalculoSimulacao } = require(path.join(
  __dirname,
  "src",
  "pages",
  "simulador_parcelas",
  "js",
  "calculadora.js"
));

function getStoredToken() {
  try {
    if (!store) {
      console.error(
        "Tentativa de ler o token antes do 'store' ser inicializado."
      );
      return null;
    }
    const session = store.get("savedSession");
    return session ? session.accessToken : null;
  } catch (error) {
    console.error("Erro ao obter token do store:", error);
    return null;
  }
}

async function determineActiveBackend(urls) {
  console.log("[Connection Test] Iniciando verificação de servidor...");
  const TIMEOUT_MS = 3000;
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      console.log(`[Connection Test] Tentando conectar em: ${url}`);
      await fetch(url, { signal: controller.signal, method: "HEAD" });
      clearTimeout(timeoutId);
      console.log(`[Connection Test] Sucesso! Servidor ativo: ${url}`);
      return url;
    } catch (error) {
      console.warn(
        `[Connection Test] Falha em ${url}: ${error.message}. Tentando a próxima...`
      );
    }
  }
  console.error("[Connection Test] Nenhum servidor foi encontrado.");
  return null;
}

function connectToSocketServer(session) {
  const token = session ? session.token || session.accessToken : null;

  if (!token) {
    console.log(
      "[Socket.IO Client] Tentativa de conexão sem token. Abortando."
    );
    return;
  }

  if (socket && socket.connected) {
    socket.disconnect();
  }

  socket = io(activeBackendUrl, {
    reconnection: true,
  });

  socket.on("connect", () => {
    console.log("[Socket.IO Client] Conectado ao servidor com sucesso!");
    socket.emit("authenticate", token);
  });

  socket.on("disconnect", () => {
    console.log("[Socket.IO Client] Desconectado do servidor.");
  });

  socket.on("connect_error", (error) => {
    console.error(`[Socket.IO Client] Erro de conexão: ${error.message}`);
  });

  socket.on("user-status-change", (data) => {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      mainWindow.webContents.send("user-status-updated", data);
    }
  });
}

function createLoginWindow() {
  console.log("[Main Process] createLoginWindow: Criando janela de login.");
  nativeTheme.themeSource = "dark"; // Força o tema escuro para a janela

  loginWindow = new BrowserWindow({
    width: 500,
    height: 700,
    autoHideMenuBar: true,
    frame: false,
    transparent: false,
    resizable: false,
    maximizable: false,
    icon: path.join(__dirname, "src", "layout", "img", "icone.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  loginWindow.setMenu(null);

  const loginPagePath = path.join(
    __dirname,
    "src",
    "pages",
    "login",
    "html",
    "login.html"
  );
  loginWindow
    .loadFile(loginPagePath)
    .then(() => console.log("[Main Process] SUCESSO ao carregar login.html."))
    .catch((err) =>
      console.error("[Main Process] ERRO CRÍTICO ao carregar login.html:", err)
    );

  loginWindow.on("closed", () => {
    console.log("[Main Process] Janela de login fechada.");
    loginWindow = null;
    // Se a janela de login for fechada e não houver janela principal, encerra o app
    if (!mainWindow && app) {
      console.log(
        "[Main Process] Janela de login fechada, sem janela principal. Encerrando app."
      );
      app.quit();
    }
  });
}

function createMainWindow(userData) {
  console.log(
    "[Main Process] createMainWindow: Iniciando para utilizador:",
    userData ? userData.username : "N/A"
  );
  nativeTheme.themeSource = "dark"; // Força o tema escuro
  const pageToLoad = "src/layout/index.html";

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 940, // Largura mínima
    minHeight: 600, // Altura mínima
    autoHideMenuBar: true,
    frame: false,
    transparent: true, // Permite que a janela principal seja transparente (se o CSS suportar)
    icon: path.join(__dirname, "src", "layout", "img", "icone.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
      webSecurity: false,
    },
  });

  mainWindow.setMenu(null); // Remove o menu da aplicação

  const filePathToLoad = path.join(__dirname, pageToLoad);
  mainWindow
    .loadFile(filePathToLoad)
    .then(() => {
      console.log(`[Main Process] SUCESSO ao carregar ${pageToLoad}.`);
      if (mainWindow && mainWindow.webContents && userData) {
      }

      mainWindow.webContents.on("context-menu", (event, params) => {
        const template = [
          { label: "Atualizar Página", role: "reload" },
          {
            label: "Forçar Recarregamento (Ignorar Cache)",
            role: "forceReload",
          },
          { type: "separator" },
          {
            label: "Inspecionar Elemento",
            click: () => {
              if (mainWindow && mainWindow.webContents)
                mainWindow.webContents.inspectElement(params.x, params.y);
            },
          },
          {
            label: "Abrir/Fechar Ferramentas de Desenvolvedor",
            role: "toggleDevTools",
          },
        ];
        Menu.buildFromTemplate(template).popup({ window: mainWindow });
      });
    })
    .catch((err) =>
      console.error(
        `[Main Process] ERRO CRÍTICO ao carregar ${pageToLoad}:`,
        err
      )
    );

  mainWindow.on("maximize", () => {
    if (mainWindow && mainWindow.webContents)
      mainWindow.webContents.send("window-state-changed", true);
  });
  mainWindow.on("unmaximize", () => {
    if (mainWindow && mainWindow.webContents)
      mainWindow.webContents.send("window-state-changed", false);
  });
  mainWindow.on("close", async () => {
    console.log('[Main Process] Evento "close" da janela principal disparado.');
  });

  mainWindow.on("closed", () => {
    console.log("[Main Process] Janela principal fechada.");
    mainWindow = null;
    currentUserSession = null; // Limpa a sessão do usuário
    // Se a janela principal for fechada e não houver janela de login, encerra o app
    if (!loginWindow && app) {
      console.log("[Main Process] Janela principal fechada. Encerrando app.");
      app.quit();
    }
  });
}

function performLogout() {
  console.log("[Main Process] Executando processo de logout...");

  currentUserSession = null;
  store.delete("savedSession");

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  if (mainWindow) {
    mainWindow.close();
  }
  if (!loginWindow || loginWindow.isDestroyed()) {
    createLoginWindow();
  } else {
    loginWindow.focus();
  }
}

async function fetchWithAuth(url, options = {}) {
  if (!currentUserSession || !currentUserSession.accessToken) {
    console.error(
      "[Auth] Tentativa de chamada API sem token de acesso. Deslogando."
    );
    performLogout();
    throw new Error("Usuário não autenticado.");
  }

  if (!options.headers) {
    options.headers = {};
  }

  if (options.body) {
    options.headers["Content-Type"] = "application/json";
  }

  options.headers["Authorization"] = `Bearer ${currentUserSession.accessToken}`;

  let response = await fetch(url, options);

  if (response.status === 403) {
    const responseDataForCheck = await response
      .clone()
      .json()
      .catch(() => ({}));

    if (
      responseDataForCheck.message &&
      responseDataForCheck.message.includes("expirado")
    ) {
      console.log("[Auth] Token de acesso expirado. Tentando renovar...");

      if (!currentUserSession.refreshToken) {
        console.log("[Auth] Sem refresh token disponível. Deslogando...");
        performLogout();
        throw new Error("Sessão expirada. Por favor, faça login novamente.");
      }

      try {
        const refreshResponse = await fetch(
          `${activeBackendUrl}/refresh-token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: currentUserSession.refreshToken }),
          }
        );

        const refreshResult = await refreshResponse.json();

        if (!refreshResult.success) {
          console.log("[Auth] Refresh token inválido/expirado. Deslogando...");
          performLogout();
          throw new Error(
            "Sua sessão expirou. Por favor, faça login novamente."
          );
        }

        console.log("[Auth] Token de acesso renovado com sucesso!");
        currentUserSession.accessToken = refreshResult.accessToken;

        const savedSession = store.get("savedSession");
        if (savedSession) {
          savedSession.accessToken = refreshResult.accessToken;
          store.set("savedSession", savedSession);
        }

        options.headers[
          "Authorization"
        ] = `Bearer ${currentUserSession.accessToken}`;
        console.log("[Auth] Tentando novamente a chamada original para:", url);
        response = await fetch(url, options);
      } catch (refreshError) {
        console.error(
          "[Auth] Erro crítico durante a renovação do token. Deslogando.",
          refreshError
        );
        performLogout();
        throw new Error("Erro ao renovar a sessão. Faça login novamente.");
      }
    }
  }

  return response;
}

async function initializeAppAndStore() {
  activeBackendUrl = await determineActiveBackend([
    BACKEND_URL_LOCAL,
  ]);

  if (!activeBackendUrl) {
    // Se nenhuma URL funcionar, mostra um erro claro para o usuário.
    dialog.showErrorBox(
      "Erro de Conexão",
      "Não foi possível conectar ao servidor (local ou VPN).\n\nVerifique sua conexão e se o servidor está online."
    );
    app.quit();
    return; // Impede o resto do código de rodar
  }

  console.log("[Main Process] Inicializando electron-store dinamicamente...");
  try {
    const { default: Store } = await import("electron-store");
    store = new Store({
      schema: {
        savedSession: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { type: "object" },
          },
          default: {},
        },
      },
    });
    console.log(
      "[Main Process] electron-store inicializado com sucesso. Caminho:",
      store.path
    );
  } catch (err) {
    console.error("[Main Process] FALHA ao inicializar electron-store:", err);
    dialog.showErrorBox(
      "Erro Crítico de Inicialização",
      "Não foi possível carregar um componente essencial (electron-store).\nA aplicação será encerrada."
    );
    app.quit();
    return;
  }

  apuradorStateFilePath = path.join(
    app.getPath("userData"),
    "estadoApuradorSorteio.json"
  );
  pontoDiarioFilePath = path.join(app.getPath("userData"), "pontoDiario.json");

  // --- CORREÇÃO ADICIONADA AQUI ---
  // Chama a função que registra todos os "ouvintes" IPC.
  // Sem esta linha, nenhum ipcMain.handle ou .on funcionará.
  setupIpcHandlers();
  // --- FIM DA CORREÇÃO ---

  const savedSession = store.get("savedSession");
  if (
    savedSession &&
    savedSession.accessToken &&
    savedSession.user &&
    savedSession.user.username
  ) {
    const isTokenConsideredValid = true;
    if (isTokenConsideredValid) {
      currentUserSession = savedSession;
      createMainWindow(savedSession.user);
      connectToSocketServer({
        token: currentUserSession.accessToken,
        user: currentUserSession.user,
      });
    } else {
      store.delete("savedSession");
      createLoginWindow();
    }
  } else {
    createLoginWindow();
  }
}

function setupIpcHandlers() {
  ipcMain.handle(
    "login-attempt",
    async (event, { username, password, rememberMe }) => {
      console.log(
        `[Main Process] IPC: 'login-attempt' user: ${username}, Lembrar: ${rememberMe}`
      );
      try {
        const backendResponse = await fetch(`${activeBackendUrl}/users/login`, {
          // <--- CORRIGIDO
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, rememberMe }),
        });
        const result = await backendResponse.json();

        if (backendResponse.ok && result.success) {
          currentUserSession = {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
          };

          if (rememberMe && result.refreshToken) {
            store.set("savedSession", currentUserSession);
          } else {
            store.delete("savedSession");
          }

          if (loginWindow) loginWindow.close();
          createMainWindow(currentUserSession.user);
          connectToSocketServer({
            token: currentUserSession.accessToken,
            user: currentUserSession.user,
          });
          return { success: true, user: result.user };
        } else {
          store.delete("savedSession");
          return {
            success: false,
            message: result.message || "Falha na autenticação.",
          };
        }
      } catch (error) {
        return {
          success: false,
          message:
            error.code === "ECONNREFUSED"
              ? `Servidor de autenticação (${activeBackendUrl}) offline ou inacessível.`
              : "Erro desconhecido na comunicação.",
        };
      }
    }
  );

  ipcMain.on("logout", () => {
    console.log("[Main Process] IPC: Recebido evento de logout.");
    performLogout();
  });

  ipcMain.on("minimize-window", () => (mainWindow || loginWindow)?.minimize());
  ipcMain.on("maximize-restore-window", () => {
    const targetWindow = mainWindow || loginWindow;
    if (targetWindow) {
      targetWindow.isMaximized()
        ? targetWindow.unmaximize()
        : targetWindow.maximize();
    }
  });
  ipcMain.on("close-window", () => (mainWindow || loginWindow)?.close());
  ipcMain.handle(
    "is-window-maximized",
    () => (mainWindow || loginWindow)?.isMaximized() || false
  );

  ipcMain.handle("get-current-user-data", async () => {
    try {
      // O endereço correto é /users/me, e não /api/users/me
      const response = await fetchWithAuth(`${activeBackendUrl}/users/me`);
      const result = await response.json();

      if (response.ok && result.success) {
        if (currentUserSession) {
          currentUserSession.user = result.user;
        }
        return { success: true, user: result.user };
      } else {
        console.error(
          "[Main Process] Falha ao buscar dados do usuário, deslogando:",
          result.message
        );
        performLogout();
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error(
        "[Main Process] Erro crítico em get-current-user-data, deslogando:",
        error
      );
      performLogout();
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle(
    "admin:get-historico-ponto-usuario",
    async (event, { userId, periodo }) => {
      // Log para depuração, agora mostrando o período
      console.log(
        `[Main Process] IPC: Buscando histórico de ponto para o usuário ID: ${userId} no período: ${periodo}`
      );

      // 1. Verificação de permissão (mantida do seu código original)
      const session = store.get("savedSession");
      if (
        !session ||
        !session.user ||
        !session.user.permissions ||
        !session.user.permissions.includes("gestao_usuarios")
      ) {
        return {
          success: false,
          message: "Acesso negado. Requer permissão de administrador.",
        };
      }

      // 2. Validação dos dados recebidos
      if (!userId || !periodo) {
        return {
          success: false,
          message: "O ID do usuário e o período são obrigatórios.",
        };
      }

      try {
        // 3. Monta a URL para o backend, adicionando o período como um "query parameter"
        const url = `${activeBackendUrl}/admin/ponto/historico/${userId}?periodo=${periodo}`;

        // 4. Usa sua função de fetch autenticado para chamar o servidor
        const response = await fetchWithAuth(url);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Falha ao buscar histórico no servidor."
          );
        }

        // 5. Retorna o resultado (sucesso e registros) para o renderer
        return result;
      } catch (error) {
        console.error(
          `[Main Process] Erro ao buscar histórico para o usuário ${userId}:`,
          error
        );
        return { success: false, message: error.message };
      }
    }
  );
  ipcMain.handle("get-access-token", () => {
    return currentUserSession ? currentUserSession.accessToken : null;
  });

  ipcMain.on("logout", () => {
    currentUserSession = null;
    if (mainWindow) {
      mainWindow.close();
    }
    if (!loginWindow) {
      createLoginWindow();
    }
  });

  ipcMain.handle("abrir-janela-docs-api", () => {
    createUploadLancesWindow();
  });

  ipcMain.handle("get-ponto-hoje", async () => {
    console.log(
      "[Main Process] IPC: Buscando registro de ponto do dia ATUAL do servidor..."
    );

    try {
      // Usamos a mesma rota que o seu pontoController já tem para buscar a jornada do dia
      const response = await fetchWithAuth(`${activeBackendUrl}/ponto/hoje`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Falha ao buscar o registro de hoje no servidor."
        );
      }

      // Repassamos a resposta do servidor para o front-end
      // O servidor retorna { success: true, ponto: {...} ou null }
      console.log(
        "[Main Process] Resposta do servidor para /ponto/hoje:",
        result.ponto
      );
      return result;
    } catch (error) {
      console.error(
        "[Main Process] Erro ao buscar o ponto de hoje do servidor:",
        error
      );
      // Em caso de falha, retorna 'ponto: null' para o front-end não quebrar
      return { success: false, ponto: null, message: error.message };
    }
  });

  ipcMain.handle("get-active-backend-url", () => {
    return activeBackendUrl;
  });

  ipcMain.handle("clientes:create", async (event, dadosCliente) => {
    try {
      const response = await fetchWithAuth(`${activeBackendUrl}/clientes`, {
        method: "POST",
        body: JSON.stringify(dadosCliente),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao criar cliente.",
      };
    }
  });

  ipcMain.handle("clientes:get-by-id", async (event, clienteId) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/clientes/${clienteId}`
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao buscar cliente.",
      };
    }
  });

  function createUploadLancesWindow() {
    const uploadLancesWindow = new BrowserWindow({
      width: 800,
      height: 650,
      modal: true,
      parent: mainWindow,
      autoHideMenuBar: true,
      icon: path.join(__dirname, "src", "layout", "img", "icone.ico"),
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // ✅ CORREÇÃO APLICADA AQUI (removido "_modal" do nome do arquivo)
    const filePath = path.join(
      __dirname,
      "src",
      "pages",
      "gestao_lances",
      "html",
      "upload_lances.html" // Nome correto do arquivo
    );

    uploadLancesWindow.loadFile(filePath);
  }
  ipcMain.handle("contratos:abrir-arquivo", async (event, fileName) => {
    if (!fileName) {
      return { success: false, message: "Nome do arquivo não fornecido." };
    }

    const contractsDir = path.join(app.getPath("userData"), "contracts");
    const filePath = path.join(contractsDir, fileName);

    console.log(`[Main Process] Tentando abrir arquivo em: ${filePath}`);

    if (fs.existsSync(filePath)) {
      try {
        await shell.openPath(filePath);
        return { success: true };
      } catch (error) {
        console.error(
          `[Main Process] Erro ao tentar abrir o arquivo com shell:`,
          error
        );
        return {
          success: false,
          message: `Erro ao abrir o arquivo: ${error.message}`,
        };
      }
    } else {
      console.error(
        `[Main Process] Arquivo de contrato não encontrado: ${filePath}`
      );
      return {
        success: false,
        message: "Arquivo de contrato não encontrado no diretório.",
      };
    }
  });

  ipcMain.handle("consorcios:get-by-client-id", async (event, clienteId) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/clientes/${clienteId}/consorcios`
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao buscar consórcios.",
      };
    }
  });

  ipcMain.handle(
    "admin:update-observacao",
    async (event, { pontoId, observacao }) => {
      console.log(
        `[Main Process] Repassando para o servidor a atualização da observação para o ponto ID: ${pontoId}`
      );

      // Verificação de permissão (opcional aqui, pois o servidor também valida)
      const session = store.get("savedSession");
      if (!session?.user?.permissions?.includes("gestao_usuarios")) {
        return { success: false, message: "Acesso negado." };
      }

      try {
        // A função correta do main.js é APENAS chamar o backend
        const response = await fetchWithAuth(
          `${activeBackendUrl}/admin/ponto/${pontoId}/observacao`,
          {
            method: "PUT",
            body: JSON.stringify({ observacao: observacao }),
          }
        );

        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message || "Falha ao atualizar observação no servidor."
          );
        }
        return result; // Retorna a resposta do servidor para o front-end
      } catch (error) {
        console.error(
          `[Main Process] Erro ao repassar atualização de observação:`,
          error
        );
        return { success: false, message: error.message };
      }
    }
  );

  ipcMain.handle("contratos:get-pdf-data", async (event, fileName) => {
    if (!fileName) {
      return { success: false, message: "Nome do arquivo não fornecido." };
    }

    const contractsDir = path.join(app.getPath("userData"), "contracts");
    const filePath = path.join(contractsDir, fileName);

    console.log(`[Main Process] Lendo arquivo de contrato em: ${filePath}`);

    if (fs.existsSync(filePath)) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString("base64");

        return { success: true, base64Data: base64Data };
      } catch (error) {
        console.error(`[Main Process] Erro ao ler o arquivo:`, error);
        return {
          success: false,
          message: `Erro ao ler o arquivo: ${error.message}`,
        };
      }
    } else {
      console.error(
        `[Main Process] Arquivo de contrato não encontrado: ${filePath}`
      );
      return {
        success: false,
        message: "Arquivo de contrato não encontrado no diretório.",
      };
    }
  });

  ipcMain.handle("consorcios:update", async (event, { id, dados }) => {
    if (dados.caminhoContratoPDF) {
      const sourcePath = dados.caminhoContratoPDF;

      if (sourcePath.includes(path.sep)) {
        const originalFileName = path.basename(sourcePath);
        const newFileName = `${Date.now()}-${originalFileName}`;

        const contractsDir = path.join(app.getPath("userData"), "contracts");
        if (!fs.existsSync(contractsDir)) {
          fs.mkdirSync(contractsDir, { recursive: true });
        }

        const destinationPath = path.join(contractsDir, newFileName);

        try {
          fs.copyFileSync(sourcePath, destinationPath);
          dados.caminhoContratoPDF = newFileName;
        } catch (copyError) {
          console.error(
            "Erro ao copiar o novo arquivo de contrato:",
            copyError
          );
          return {
            success: false,
            message: "Falha ao processar o novo arquivo de contrato.",
          };
        }
      }
    }

    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/consorcios/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(dados),
        }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao atualizar consórcio.",
      };
    }
  });

  ipcMain.handle("ponto:salvar-preview-como-pdf", async (event) => {
    const previewWindow = BrowserWindow.fromWebContents(event.sender);
    if (!previewWindow) {
      return { success: false, message: "Janela de preview não encontrada." };
    }

    const { filePath, canceled } = await dialog.showSaveDialog(previewWindow, {
      title: "Salvar Folha de Ponto",
      defaultPath: `Folha_Ponto.pdf`,
      filters: [{ name: "Arquivos PDF", extensions: ["pdf"] }],
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    try {
      const pdfData = await previewWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        landscape: false,
      });
      fs.writeFileSync(filePath, pdfData);
      return { success: true };
    } catch (error) {
      console.error("Erro ao salvar preview como PDF:", error);
      return { success: false, message: "Falha ao gerar o arquivo PDF." };
    }
  });

  ipcMain.handle("ponto:abrir-preview-folha-mensal", (event, dados) => {
    const previewWindow = new BrowserWindow({
      width: 800,
      height: 800,
      title: `Folha de Ponto - ${dados.usuario.username}`,
      icon: path.join(__dirname, "src", "layout", "img", "icone.ico"),
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // --- ✅ NOVA LÓGICA DO MENU ---

    // 1. Cria o template do menu com a opção de imprimir
    const menuTemplate = [
      {
        label: "Arquivo",
        submenu: [
          {
            label: "Imprimir",
            accelerator: "CmdOrCtrl+P", // Define o atalho padrão
            click: () => {
              // Usa o método de impressão do Electron, que é mais estável
              previewWindow.webContents.print();
            },
          },
          {
            role: "close", // Adiciona um botão "Fechar" (Ctrl+W)
            label: "Fechar",
          },
        ],
      },
    ];

    // 2. Cria o menu a partir do template
    const menu = Menu.buildFromTemplate(menuTemplate);

    // 3. Aplica o menu à nova janela
    previewWindow.setMenu(menu);

    // --- FIM DA NOVA LÓGICA ---

    const filePath = path.join(
      __dirname,
      "src",
      "pages",
      "ponto",
      "html",
      "pdf_folha_ponto.html"
    );
    previewWindow.loadFile(filePath);

    previewWindow.webContents.on("did-finish-load", () => {
      previewWindow.webContents.send("dados-folha-ponto", dados);
    });
  });

  ipcMain.handle("consorcios:transfer", async (event, { id, newClientId }) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/consorcios/${id}/transfer`,
        {
          method: "PATCH",
          body: JSON.stringify({ newClientId: newClientId }),
        }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message:
          error.message || "Erro de comunicação ao transferir consórcio.",
      };
    }
  });

  ipcMain.handle("consorcios:get-transferidos", async (event, clienteId) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/clientes/${clienteId}/consorcios-transferidos`
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro ao buscar consórcios transferidos.",
      };
    }
  });

  ipcMain.handle("consorcios:get-by-id", async (event, consorcioId) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/consorcios/${consorcioId}`
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao buscar consórcio.",
      };
    }
  });

  ipcMain.handle("consorcios:get-historico", async (event, consorcioId) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/consorcios/${consorcioId}/historico`
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao buscar histórico.",
      };
    }
  });

  ipcMain.handle("consorcios:delete", async (event, consorcioId) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/consorcios/${consorcioId}`,
        {
          method: "DELETE",
        }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao deletar consórcio.",
      };
    }
  });

  ipcMain.handle("clientes:update", async (event, { id, dados }) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/clientes/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(dados),
        }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao atualizar cliente.",
      };
    }
  });

  ipcMain.handle("clientes:delete", async (event, clienteId) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/clientes/${clienteId}`,
        {
          method: "DELETE",
        }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao deletar cliente.",
      };
    }
  });

  ipcMain.handle("clientes:get-all", async (event) => {
    let response;
    try {
      response = await fetchWithAuth(`${activeBackendUrl}/clientes`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Main Process] O backend respondeu com status ${response.status}. Resposta:`,
          errorText
        );
        throw new Error(
          `O servidor retornou um erro (Status: ${response.status})`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(
        "[Main Process] Erro detalhado em 'clientes:get-all':",
        error
      );
      return {
        success: false,
        message: error.message || "Erro de comunicação ao buscar clientes.",
      };
    }
  });

  ipcMain.handle("consorcios:delete-contract", async (event, consortiumId) => {
    try {
      const token = getStoredToken();
      if (!token) throw new Error("Usuário não autenticado.");

      const response = await axios.delete(
        `${activeBackendUrl}/consorcios/${consortiumId}/contract`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error(
        "Erro no main.js ao deletar contrato:",
        error.response?.data || error.message
      );
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Erro de comunicação com o servidor.",
      };
    }
  });

  ipcMain.handle("consorcios:create", async (event, dadosConsorcio) => {
    if (dadosConsorcio.caminhoContratoPDF) {
      const sourcePath = dadosConsorcio.caminhoContratoPDF;
      const originalFileName = path.basename(sourcePath);
      const newFileName = `${Date.now()}-${originalFileName}`;

      const contractsDir = path.join(app.getPath("userData"), "contracts");
      if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
      }

      const destinationPath = path.join(contractsDir, newFileName);

      try {
        fs.copyFileSync(sourcePath, destinationPath);
        dadosConsorcio.caminhoContratoPDF = newFileName;
      } catch (copyError) {
        console.error("Erro ao copiar o arquivo de contrato:", copyError);
        return {
          success: false,
          message: "Falha ao processar o arquivo de contrato.",
        };
      }
    }

    try {
      const response = await fetchWithAuth(`${activeBackendUrl}/consorcios`, {
        method: "POST",
        body: JSON.stringify(dadosConsorcio),
      });
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao adicionar consórcio.",
      };
    }
  });

  ipcMain.handle("ponto:get-registros-mensais", async (event, { periodo }) => {
    console.log(
      `[Main Process] IPC: Buscando registros de ponto para o período: ${periodo}`
    );

    if (!periodo) {
      return {
        success: false,
        message: "O período (mês/ano) não foi fornecido.",
      };
    }


    try {
      // Converte "AAAA-MM" para datas de início e fim do mês
      const [ano, mes] = periodo.split("-").map(Number);
      const primeiroDiaDoMes = new Date(ano, mes - 1, 1);
      const ultimoDiaDoMes = new Date(ano, mes, 0);

      const inicio = primeiroDiaDoMes.toISOString().split("T")[0];
      const fim = ultimoDiaDoMes.toISOString().split("T")[0];

      console.log(`[Main Process] Período calculado: de ${inicio} até ${fim}`);

      // A chamada para o seu backend continua exatamente a mesma!
      const response = await fetchWithAuth(
        `${activeBackendUrl}/ponto/registros-mensais?inicio=${inicio}&fim=${fim}`
      );

      // ... (o resto da sua lógica de tratar a resposta continua igual) ...
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.message || "Falha ao buscar registros no servidor."
        );
      }
      return result;
    } catch (error) {
      console.error("[Main Process] Erro ao buscar registros mensais:", error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle(
    "admin:update-ponto",
    async (event, { pontoId, tipo, timestamp }) => {
      console.log(
        `[Main Process] Repassando para o servidor a atualização para o ponto ID: ${pontoId}`
      );

      // Validação de segurança
      const session = store.get("savedSession");
      if (!session?.user?.permissions?.includes("gestao_usuarios")) {
        return {
          success: false,
          message: "Acesso negado. Requer permissão de administrador.",
        };
      }

      try {
        const response = await fetchWithAuth(
          `${activeBackendUrl}/admin/ponto/${pontoId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              tipo: tipo,
              timestamp: timestamp,
            }),
          }
        );

        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            result.message || "Falha ao atualizar o ponto no servidor."
          );
        }
        return result;
      } catch (error) {
        console.error(
          `[Main Process] Erro ao atualizar ponto ID ${pontoId}:`,
          error
        );
        return { success: false, message: error.message };
      }
    }
  );

  ipcMain.handle("gerar-pdf-ponto", async (event, dadosRelatorio) => {
    if (!mainWindow) {
      return { success: false, message: "Janela principal não encontrada." };
    }

    const paraData = (horario) => {
      if (!horario || horario.includes("--")) return null;
      const [h, m, s] = horario.split(":");
      const data = new Date();
      data.setHours(h, m, s, 0);
      return data;
    };

    const entrada = paraData(dadosRelatorio.entrada);
    const saidaAlmoco = paraData(dadosRelatorio.almoco_saida);
    const voltaAlmoco = paraData(dadosRelatorio.almoco_volta);
    const saida = paraData(dadosRelatorio.saida);

    let totalAlmoco = "N/A";
    let totalTrabalhado = "N/A";

    if (saidaAlmoco && voltaAlmoco) {
      const diffMs = voltaAlmoco - saidaAlmoco;
      const horas = Math.floor(diffMs / 3600000);
      const minutos = Math.floor((diffMs % 3600000) / 60000);
      totalAlmoco = `${horas.toString().padStart(2, "0")}:${minutos
        .toString()
        .padStart(2, "0")}`;
    }

    if (entrada && saida) {
      let diffTrabalho = saida - entrada;
      if (saidaAlmoco && voltaAlmoco) {
        diffTrabalho -= voltaAlmoco - saidaAlmoco;
      }
      const horas = Math.floor(diffTrabalho / 3600000);
      const minutos = Math.floor((diffTrabalho % 3600000) / 60000);
      totalTrabalhado = `${horas.toString().padStart(2, "0")}:${minutos
        .toString()
        .padStart(2, "0")}`;
    }

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: "Salvar Relatório de Jornada",
      defaultPath: `Jornada_${dadosRelatorio.usuario.username
        }_${dadosRelatorio.data.replace(/\//g, "-")}.pdf`,
      filters: [{ name: "Arquivos PDF", extensions: ["pdf"] }],
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    const logoAssetPath = path.join(__dirname, "src", "layout", "img", "bottech.png");
    const logoBase64 = fs.existsSync(logoAssetPath)
      ? fs.readFileSync(logoAssetPath).toString("base64")
      : "";
    const logoHtml = logoBase64
      ? `<img src="data:image/png;base64,${logoBase64}" style="max-height: 50px;">`
      : "<h1>Capitão Consórcios</h1>";

    const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Jornada de Trabalho</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 11pt; color: #333; }
                .page { padding: 20mm; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0a183d; padding-bottom: 10px; }
                .header-info { text-align: right; }
                .header-info h2 { margin: 0; color: #0a183d; font-size: 1.5em; }
                .header-info p { margin: 2px 0; }
                .content { margin-top: 30px; }
                .content h3 { font-size: 1.2em; color: #003366; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                th { background-color: #f2f2f2; }
                .summary-table { width: 50%; margin-top: 20px; float: right; }
                .summary-table td { font-weight: bold; }
                .footer { position: fixed; bottom: 40px; left: 20mm; right: 20mm; text-align: center; }
                .signature-line { border-top: 1px solid #333; margin: 50px auto 0 auto; width: 250px; padding-top: 5px; text-align: center; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <div class="page">
                <div class="header">
                    ${logoHtml}
                    <div class="header-info">
                        <h2>Relatório de Jornada</h2>
                        <p><strong>Colaborador:</strong> ${dadosRelatorio.usuario.username}</p>
                        <p><strong>Data:</strong> ${dadosRelatorio.data}</p>
                    </div>
                </div>
                <div class="content">
                    <h3>Registros do Dia</h3>
                    <table>
                        <tr><th>Evento</th><th>Horário</th></tr>
                        <tr><td>Entrada</td><td>${dadosRelatorio.entrada}</td></tr>
                        <tr><td>Saída para Almoço</td><td>${dadosRelatorio.almoco_saida}</td></tr>
                        <tr><td>Volta do Almoço</td><td>${dadosRelatorio.almoco_volta}</td></tr>
                        <tr><td>Saída</td><td>${dadosRelatorio.saida}</td></tr>
                    </table>

                    <table class="summary-table">
                        <tr><td>Total de Almoço:</td><td>${totalAlmoco}</td></tr>
                        <tr><td>Total Trabalhado:</td><td>${totalTrabalhado}</td></tr>
                    </table>
                </div>
                <div class="footer">
                    <div class="signature-line">
                        Assinatura do Colaborador
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    const offscreenWindow = new BrowserWindow({ show: false });
    try {
      await offscreenWindow.loadURL(
        `data:text/html;charset=UTF-8,${encodeURIComponent(htmlTemplate)}`
      );
      const pdfData = await offscreenWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
      });
      fs.writeFileSync(filePath, pdfData);

      new Notification({
        title: "Relatório Salvo!",
        body: `O arquivo PDF foi salvo com sucesso.`,
      }).show();
      return { success: true, path: filePath };
    } catch (error) {
      console.error("Erro ao gerar PDF de ponto:", error);
      return { success: false, message: "Falha ao gerar o arquivo PDF." };
    } finally {
      offscreenWindow.close();
    }
  });

  ipcMain.handle("registrar-ponto", async (event, { tipo }) => {
    console.log(
      `[Main Process] IPC: Recebida tentativa de registrar ponto do tipo: ${tipo}`
    );

    // Validação simples para garantir que o 'tipo' (entrada, saida, etc.) foi enviado
    if (!tipo) {
      return {
        success: false,
        message: "O tipo de registro de ponto não foi fornecido.",
      };
    }

    try {
      // 1. Usamos a sua função 'fetchWithAuth' para fazer a chamada segura ao backend.
      // A rota '/ponto/registrar' é a que você já tem no seu pontoController.js e que já usa o findOrCreate.
      const response = await fetchWithAuth(
        `${activeBackendUrl}/ponto/registrar`,
        {
          method: "POST",
          // Enviamos o tipo da batida no corpo da requisição, como o servidor espera
          body: JSON.stringify({ tipo: tipo }),
        }
      );

      // 2. Pegamos a resposta completa do servidor
      const result = await response.json();

      // 3. Se a resposta do servidor não for OK (ex: erro 400, 500), consideramos um erro
      if (!response.ok) {
        throw new Error(
          result.message || "Ocorreu um erro no servidor ao registrar o ponto."
        );
      }

      // 4. Se tudo deu certo, repassamos a resposta de sucesso do servidor para o front-end
      console.log(
        `[Main Process] Ponto do tipo '${tipo}' registrado com sucesso via servidor.`
      );
      return result; // O seu servidor já retorna { success: true, message: "...", horario: "..." }
    } catch (error) {
      console.error(
        "[Main Process] Erro ao registrar ponto no servidor:",
        error
      );
      // Retornamos a mensagem de erro para que o front-end possa exibi-la ao usuário
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle("lances:get-sumario", async (event, token) => {
    // A URL correta da sua API Python que busca o sumário.
    const url = "http://localhost:8000/analises/sumario-grupos/";

    try {
      // Faz a requisição GET para a API usando axios.
      const response = await axios.get(url, {
        headers: {
          // Envia o token JWT no cabeçalho de autorização.
          Authorization: `Bearer ${token}`,
        },
        // Define um tempo limite de 10 segundos para a requisição.
        timeout: 10000,
      });

      // Se a requisição for bem-sucedida, retorna os dados para a interface.
      return response.data;

    } catch (error) {
      // Se ocorrer qualquer erro, ele será registrado no terminal para o desenvolvedor.
      console.error(
        "[IPC: lances:get-sumario] Erro detalhado ao buscar sumário de lances:"
      );

      if (error.response) {
        // O servidor respondeu com um status de erro (4xx, 5xx).
        console.error("Status do erro:", error.response.status);
        console.error("Dados do erro:", error.response.data);
      } else if (error.request) {
        // A requisição foi feita, mas não houve resposta.
        console.error("Nenhuma resposta recebida:", error.request);
      } else {
        // Um erro ocorreu ao configurar a requisição.
        console.error("Erro na configuração da requisição:", error.message);
      }

      // Retorna um objeto de erro padronizado para a interface tratar.
      return {
        success: false,
        message: error.response?.data?.message || "Erro de comunicação com o servidor.",
      };
    }
  });

  ipcMain.handle(
    "lances:get-historico",
    async (event, { token, nomeGrupo }) => {
      try {
        const response = await axios.get(
          `${activeBackendUrl}/lances/historico-recente/${nomeGrupo}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return { success: true, data: response.data };
      } catch (error) {
        console.error(
          `Erro ao buscar histórico do grupo ${nomeGrupo}:`,
          error.response?.data || error.message
        );
        return {
          success: false,
          message: error.response?.data?.detail || "Erro de comunicação",
        };
      }
    }
  );

  ipcMain.handle(
    "lances:get-historico-completo",
    async (event, { token, nomeGrupo }) => {
      try {
        const response = await axios.get(
          `${activeBackendUrl}/lances/historico-completo/${nomeGrupo}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error) {
        console.error(
          `Erro ao buscar histórico COMPLETO do grupo ${nomeGrupo}:`,
          error.response?.data || error.message
        );
        return {
          success: false,
          message: error.response?.data?.detail || "Erro de comunicação",
        };
      }
    }
  );

  ipcMain.handle(
    "update-user-permissions",
    async (event, { userId, permissions }) => {
      try {
        const response = await fetchWithAuth(
          `${activeBackendUrl}/users/${userId}/permissions`,
          {
            method: "PUT",
            body: JSON.stringify({ permissions: permissions }),
          }
        );
        return await response.json();
      } catch (error) {
        return {
          success: false,
          message: error.message || "Erro de comunicação com o servidor.",
        };
      }
    }
  );

  ipcMain.handle(
    "admin:exportar-planilha",
    async (event, { userId, userName, registros }) => {
      console.log(
        `[Main Process] Recebida solicitação para exportar planilha para: ${userName}`
      );

      // Verificação de segurança final
      const session = store.get("savedSession");
      if (
        !session ||
        !session.user ||
        !session.user.permissions ||
        !session.user.permissions.includes("gestao_usuarios")
      ) {
        return {
          success: false,
          message: "Acesso negado. Requer permissão de administrador.",
        };
      }

      // Formatar os dados para um formato amigável na planilha
      const dadosParaPlanilha = registros.map((reg) => {
        const formatar = (dataString) =>
          dataString
            ? new Date(dataString).toLocaleString("pt-BR", { timeZone: "UTC" })
            : "";
        return {
          Data: new Date(reg.data).toLocaleDateString("pt-BR", {
            timeZone: "UTC",
          }),
          Entrada: formatar(reg.entrada).split(" ")[1] || "",
          "Saída Almoço": formatar(reg.almoco_saida).split(" ")[1] || "",
          "Volta Almoço": formatar(reg.almoco_volta).split(" ")[1] || "",
          Saída: formatar(reg.saida).split(" ")[1] || "",
          Observação: reg.observacao || "",
        };
      });

      // Abrir a caixa de diálogo para o usuário escolher onde salvar
      const { filePath, canceled } = await dialog.showSaveDialog({
        title: `Salvar Planilha de Ponto - ${userName}`,
        defaultPath: `Relatorio_Ponto_${userName.replace(" ", "_")}_${new Date()
          .toISOString()
          .slice(0, 7)}.xlsx`,
        filters: [{ name: "Planilhas Excel", extensions: ["xlsx"] }],
      });

      if (canceled || !filePath) {
        return { success: false, message: "Exportação cancelada." };
      }

      // Gerar e salvar o arquivo .xlsx
      try {
        const worksheet = xlsx.utils.json_to_sheet(dadosParaPlanilha);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Relatório de Ponto");
        xlsx.writeFile(workbook, filePath);
        console.log(`Planilha salva com sucesso em: ${filePath}`);
        return { success: true };
      } catch (error) {
        console.error("Erro ao gerar a planilha:", error);
        return {
          success: false,
          message: "Ocorreu um erro ao gerar o arquivo da planilha.",
        };
      }
    }
  );
  ipcMain.handle("calcular-simulacao", async (event, dadosSimulacao) => {
    console.log("[Main Process] IPC: Chamando calculadora em JavaScript.");

    const { credito, lance } = dadosSimulacao;
    if (!credito || !lance) {
      return {
        erro: "Estrutura de dados inválida. Esperado 'credito' e 'lance'.",
      };
    }

    try {
      const resultado = realizarCalculoSimulacao(credito, lance);

      return { success: true, ...resultado };
    } catch (error) {
      console.error("[Main Process] Erro na função da calculadora JS:", error);
      return { success: false, erro: "Ocorreu um erro interno ao calcular." };
    }
  });

  ipcMain.handle("gerar-csv-ponto", async (event) => {
    console.log(
      "[Main Process] IPC: Recebida solicitação para gerar CSV de ponto."
    );
    if (!currentUserSession || !currentUserSession.token) {
      return {
        success: false,
        message: "Não autenticado para gerar relatório.",
      };
    }

    let usersWithPonto;
    try {
      const response = await fetch(`${activeBackendUrl}/users/report/csv`, {
        headers: { Authorization: `Bearer ${currentUserSession.token}` },
      });
      if (!response.ok) {
        throw new Error(`O servidor respondeu com um erro: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success || !Array.isArray(result.users)) {
        throw new Error(
          result.message ||
          "O servidor não retornou uma lista de usuários válida."
        );
      }
      usersWithPonto = result.users;
    } catch (error) {
      console.error(
        "[Main Process] ERRO AO BUSCAR DADOS PARA O RELATÓRIO:",
        error
      );
      return {
        success: false,
        message: `Falha ao buscar dados do relatório: ${error.message}`,
      };
    }

    try {
      let csvContent = "Usuario;Data;Entrada;Saida;Horas Trabalhadas\n";
      usersWithPonto.forEach((user) => {
        if (user.ponto && typeof user.ponto === "object") {
          for (const mes in user.ponto) {
            if (Array.isArray(user.ponto[mes])) {
              user.ponto[mes].forEach((registro) => {
                const entrada = new Date(registro.entrada);
                const saida = registro.saida ? new Date(registro.saida) : null;
                const dataFormatada = entrada.toLocaleDateString("pt-BR");
                const entradaFormatada = entrada.toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                let saidaFormatada = "Em aberto";
                let horasTrabalhadas = "N/A";
                if (saida) {
                  saidaFormatada = saida.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  const diffMs = saida - entrada;
                  horasTrabalhadas = (diffMs / 3600000)
                    .toFixed(2)
                    .replace(".", ",");
                }
                csvContent += `${user.username};${dataFormatada};${entradaFormatada};${saidaFormatada};${horasTrabalhadas}\n`;
              });
            }
          }
        }
      });

      const { filePath, canceled } = await dialog.showSaveDialog({
        title: "Salvar Relatório de Ponto",
        defaultPath: `Relatorio_Ponto_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`,
        filters: [{ name: "Arquivos CSV", extensions: ["csv"] }],
      });

      if (canceled || !filePath) {
        return { success: false, message: "Operação cancelada." };
      }

      fs.writeFileSync(filePath, "\uFEFF" + csvContent, { encoding: "utf-8" });
      return {
        success: true,
        message: `Relatório salvo com sucesso em ${filePath}`,
      };
    } catch (error) {
      console.error("[Main Process] ERRO AO GERAR O ARQUIVO CSV:", error);
      return {
        success: false,
        message: `Ocorreu um erro ao montar o arquivo CSV: ${error.message}`,
      };
    }
  });

  ipcMain.handle("imprimir-pagina-atual", async () => {
    if (!mainWindow)
      return { success: false, error: "Janela principal não disponível." };
    try {
      const pdfOptions = {
        marginsType: 0,
        pageSize: "A4",
        printBackground: true,
        landscape: false,
      };
      const data = await mainWindow.webContents.printToPDF(pdfOptions);
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: "Salvar Tela Atual como PDF",
        defaultPath: path.join(
          app.getPath("downloads"),
          `TelaAtual_${Date.now()}.pdf`
        ),
        filters: [{ name: "Arquivos PDF", extensions: ["pdf"] }],
      });

      if (canceled || !filePath) return { success: false, cancelled: true };

      fs.writeFileSync(filePath, data);
      if (Notification.isSupported()) {
        new Notification({
          title: "PDF da Tela Salvo!",
          body: `O arquivo "${path.basename(filePath)}" foi salvo.`,
          icon: path.join(__dirname, "src", "layout", "img", "bottech.png"),
        }).show();
      }
      return { success: true, filePath: filePath };
    } catch (error) {
      console.error(
        "[Main Process] Erro ao imprimir página atual como PDF:",
        error
      );
      return { success: false, error: error.message, cancelled: false };
    }
  });

  ipcMain.handle("users:set-status", async (event, { userId, status }) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/users/${userId}/status`,
        {
          // CORRIGIDO
          method: "PUT",
          body: JSON.stringify({ status: status }),
        }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao mudar status.",
      };
    }
  });

  ipcMain.handle("gerar-pdf-com-template", async (event, dadosParaPdf) => {
    if (!mainWindow) {
      return { success: false, message: "Janela principal não encontrada." };
    }

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: "Salvar Simulação em PDF",
      defaultPath: path.join(
        app.getPath("downloads"),
        `Simulacao_${dadosParaPdf.NOME_CLIENTE.replace(/ /g, "_")}.pdf`
      ),
      filters: [{ name: "Arquivos PDF", extensions: ["pdf"] }],
    });

    if (canceled || !filePath) {
      return {
        success: false,
        message: "Operação cancelada.",
        cancelled: true,
      };
    }

    try {
      const templateHtmlPath = path.join(
        __dirname,
        "src",
        "pages",
        "simulador_parcelas",
        "html",
        "pdf_template.html"
      );
      const templateCssPath = path.join(
        __dirname,
        "src",
        "pages",
        "simulador_parcelas",
        "css",
        "pdf_style.css"
      );
      const logoPath = path.join(__dirname, "src", "layout", "img", "icone.png");

      let html = fs.readFileSync(templateHtmlPath, "utf-8");
      const css = fs.readFileSync(templateCssPath, "utf-8");

      let logoHtmlTag = ``;
      if (fs.existsSync(logoPath)) {
        const logoBase64 = fs.readFileSync(logoPath).toString("base64");
        logoHtmlTag = `<img src="data:image/png;base64,${logoBase64}" alt="Logo" class="logo">`;
      }

      html = html.replace(
        /<link rel="stylesheet" href=".*pdf_style\.css">/,
        `<style>${css}</style>`
      );
      html = html.replace("{{LOGO_IMG_TAG}}", logoHtmlTag);

      for (const key in dadosParaPdf) {
        const regex = new RegExp(`{{${key}}}`, "g");
        html = html.replace(regex, dadosParaPdf[key] || "");
      }

      if (!dadosParaPdf.TEM_ADESAO) {
        html = html.replace(
          /<div class="info-linha adesao"[^>]*>[\s\S]*?<\/div>/g,
          ""
        );
        html = html.replace(
          /<div class="info-linha adesao-info"[^>]*>[\s\S]*?<\/div>/g,
          ""
        );
      }

      const offscreenWindow = new BrowserWindow({
        show: false,
        webPreferences: { offscreen: true },
      });
      await offscreenWindow.loadURL(
        `data:text/html;charset=UTF-8,${encodeURIComponent(html)}`
      );
      const pdfData = await offscreenWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      fs.writeFileSync(filePath, pdfData);
      offscreenWindow.close();

      new Notification({
        title: "PDF Salvo!",
        body: `Simulação salva com sucesso.`,
      }).show();
      return { success: true, path: filePath };
    } catch (error) {
      console.error("[Main Process] Erro ao gerar PDF final:", error);
      return { success: false, message: error.message };
    }
  });

  ipcMain.handle(
    "gerar-pdf-relatorio-sorteio",
    async (event, dadosDoRelatorio) => {
      if (!mainWindow)
        return { success: false, error: "Janela principal não encontrada." };

      const {
        dataApuracao,
        numerosLoteria,
        opcoesGlobaisHTML,
        htmlTabelaImovel,
        htmlTabelaAutomovel,
      } = dadosDoRelatorio;

      const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
        title: "Salvar Relatório de Apuração em PDF",
        defaultPath: path.join(
          app.getPath("downloads"),
          `Relatorio_Apuracao_Sorteio_${Date.now()}.pdf`
        ),
        filters: [{ name: "Arquivos PDF", extensions: ["pdf"] }],
      });

      if (canceled || !filePath)
        return {
          success: false,
          error: "Operação cancelada.",
          cancelled: true,
        };

      const logoAssetPath = path.join(__dirname, "src", "layout", "img", "bottech.png");
      let logoImpressaoEmbed = "";
      try {
        if (fs.existsSync(logoAssetPath)) {
          logoImpressaoEmbed = `<img src="data:image/png;base64,${fs
            .readFileSync(logoAssetPath)
            .toString(
              "base64"
            )}" alt="Logo Capitão Consórcios" class="logo-impressao">`;
        } else {
          console.warn(
            `[Main Process] Logo não encontrada em: ${logoAssetPath}`
          );
          logoImpressaoEmbed =
            '<p style="color:red; text-align:center;">Logo não encontrada</p>';
        }
      } catch (err) {
        console.error(
          "[Main Process] Erro ao ler logo para PDF do relatório de sorteio:",
          err
        );
        logoImpressaoEmbed = `<p style="color:red; text-align:center;">Erro ao carregar logo: ${err.message}</p>`;
      }

      let dataApuracaoFormatadaParaPdf = dataApuracao;
      if (dataApuracao && typeof dataApuracao === "string") {
        try {
          const partesData = dataApuracao.split("-");
          if (partesData.length === 3)
            dataApuracaoFormatadaParaPdf = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
        } catch (e) {
          console.warn(
            "[Main Process] Não foi possível formatar a data de apuração para o PDF do relatório:",
            dataApuracao
          );
        }
      }

      const offscreenWindowRelatorio = new BrowserWindow({
        show: false,
        width: 800,
        height: 1131,
        webPreferences: { contextIsolation: true, nodeIntegration: false },
      });
      try {
        const completeHtmlForRelatorioPdf = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Relatório de Apuração de Sorteio</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 10pt; color: #000; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    .page { padding: 15mm; width: 210mm; min-height: 290mm; box-sizing: border-box; }
                    .cabecalho-impressao { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #000; }
                    .cabecalho-impressao img.logo-impressao { max-height: 60px; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; }
                    .cabecalho-impressao h1 { font-size: 1.4em; margin: 0 0 5px 0; }
                    .cabecalho-impressao h2 { font-size: 1.1em; margin: 0; font-weight: normal; }
                    .info-section { margin-bottom: 15px; text-align: left;}
                    .info-section h3 { font-size: 1.1em; margin-bottom: 5px; text-align: left;}
                    .info-section p { margin-top: 0; margin-bottom: 5px; }
                    .info-section ul { list-style-type: disc; margin-left: 20px; padding-left: 0; margin-top: 0; }
                    .info-section li { margin-bottom: 3px; }
                    .table-container { margin-top: 15px; }
                    .table-container h3 { font-size: 1.2em; margin-top: 20px; margin-bottom: 8px; text-align: left; }
                    table { width: 100%; border-collapse: collapse; margin-top: 5px; font-size: 9pt; page-break-inside: auto; }
                    th, td { border: 1px solid #333; padding: 4px 6px; text-align: center; } 
                    th { background-color: #e0e0e0; font-weight: bold; }
                    td.grupo-nome { text-align: left !important; font-weight: bold !important; background-color: #f0f0f0 !important; }
                    .footer { text-align: center; font-size: 0.8em; margin-top: 30px; padding-top:10px; border-top: 1px solid #ccc; }
                    thead { display: table-header-group; } 
                    tr { page-break-inside: avoid; page-break-after: auto; }
                </style>
            </head>
            <body>
                <div class="page">
                    <div class="cabecalho-impressao">
                        ${logoImpressaoEmbed} 
                        <h1>Relatório de Apuração de Sorteio</h1>
                        <h2>Data da Apuração: ${dataApuracaoFormatadaParaPdf}</h2>
                    </div>

                    <div class="info-section">
                        <h3>Números da Loteria Sorteados:</h3>
                        <p>${numerosLoteria.join(" - ")}</p>
                    </div>

                    <div class="info-section">
                        <h3>Opções Globais Geradas:</h3>
                        ${opcoesGlobaisHTML}
                    </div>

                    <div class="table-container">
                        <h3>Resultados Apurados - IMÓVEL (1º ao 10º)</h3>
                        ${htmlTabelaImovel}
                    </div>

                    <div class="table-container">
                        <h3>Resultados Apurados - AUTOMÓVEL (1º ao 10º)</h3>
                        ${htmlTabelaAutomovel}
                    </div>

                    <div class="footer">
                        Este relatório é um demonstrativo da apuração realizada em ${dataApuracaoFormatadaParaPdf}.<br>
                        Capitão Consórcios
                    </div>
                </div>
            </body>
            </html>`;

        await offscreenWindowRelatorio.loadURL(
          `data:text/html;charset=UTF-8,${encodeURIComponent(
            completeHtmlForRelatorioPdf
          )}`
        );
        const pdfData = await offscreenWindowRelatorio.webContents.printToPDF({
          marginsType: 1,
          pageSize: "A4",
          printBackground: true,
          landscape: false,
        });
        fs.writeFileSync(filePath, pdfData);

        if (Notification.isSupported()) {
          new Notification({
            title: "Relatório de Sorteio Salvo!",
            body: `O arquivo "${path.basename(filePath)}" foi salvo.`,
            icon: path.join(__dirname, "src", "layout", "img", "icone.ico"),
          }).show();
        }
        return { success: true, path: filePath };
      } catch (error) {
        console.error("[Main Process] Erro ao gerar PDF do relatório:", error);
        return { success: false, error: error.message };
      } finally {
        if (offscreenWindowRelatorio && !offscreenWindowRelatorio.isDestroyed())
          offscreenWindowRelatorio.close();
      }
    }
  );

  ipcMain.on("salvar-dados-clientes", (event, data) => {
    try {
      fs.writeFileSync(
        dadosClientesFilePath,
        JSON.stringify(data, null, 2),
        "utf-8"
      );
      console.log(
        "[Main Process] Dados de clientes salvos em:",
        dadosClientesFilePath
      );
    } catch (e) {
      console.error("[Main Process] Erro ao salvar dados de clientes:", e);
    }
  });

  ipcMain.handle("carregar-dados-clientes", async () => {
    try {
      if (fs.existsSync(dadosClientesFilePath)) {
        const data = fs.readFileSync(dadosClientesFilePath, "utf-8");
        console.log(
          "[Main Process] Dados de clientes carregados de:",
          dadosClientesFilePath
        );
        return JSON.parse(data);
      }
      console.log(
        "[Main Process] Arquivo de dados de clientes não encontrado:",
        dadosClientesFilePath
      );
      return null;
    } catch (e) {
      console.error("[Main Process] Erro ao carregar dados de clientes:", e);
      return null;
    }
  });

  ipcMain.on("salvar-estado-apurador", (event, estado) => {
    if (estado && estado.loteriaNumeros) {
      try {
        fs.writeFileSync(
          apuradorStateFilePath,
          JSON.stringify(estado, null, 2),
          "utf-8"
        );
        console.log(
          "[Main Process] Estado do apurador salvo em:",
          apuradorStateFilePath
        );
      } catch (e) {
        console.error("[Main Process] Erro ao salvar estado do apurador:", e);
      }
    }
  });

  ipcMain.handle("carregar-estado-apurador", async () => {
    try {
      if (fs.existsSync(apuradorStateFilePath)) {
        const data = fs.readFileSync(apuradorStateFilePath, "utf-8");
        console.log(
          "[Main Process] Estado do apurador carregado de:",
          apuradorStateFilePath
        );
        return JSON.parse(data);
      }
      console.log(
        "[Main Process] Arquivo de estado do apurador não encontrado:",
        apuradorStateFilePath
      );
      return null;
    } catch (e) {
      console.error("[Main Process] Erro ao carregar estado do apurador:", e);
      return null;
    }
  });

  ipcMain.handle("get-users", async () => {
    try {
      const response = await fetchWithAuth(`${activeBackendUrl}/users`, {
        method: "GET",
      });
      if (!response.ok)
        throw new Error(`O servidor respondeu com o status ${response.status}`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: `Erro ao buscar usuários: ${error.message}`,
      };
    }
  });

  ipcMain.handle("add-user", async (event, userData) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/users/register`,
        {
          // CORRIGIDO
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: "Erro de comunicação ao adicionar usuário.",
      };
    }
  });

  ipcMain.handle("delete-user", async (event, userId) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/users/${userId}`,
        { method: "DELETE" }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao excluir usuário.",
      };
    }
  });

  ipcMain.handle("get-users-status", async () => {
    try {
      const response = await fetchWithAuth(`${activeBackendUrl}/users/status`);
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro ao buscar status dos usuários.",
      };
    }
  });

  ipcMain.handle("update-user", async (event, { userId, userData }) => {
    try {
      const response = await fetchWithAuth(
        `${activeBackendUrl}/users/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify(userData),
        }
      );
      return await response.json();
    } catch (error) {
      return {
        success: false,
        message: error.message || "Erro de comunicação ao editar usuário.",
      };
    }
  });
  console.log("[Main Process] Todos os handlers IPC configurados.");
}

app.whenReady().then(initializeAppAndStore);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (!store) {
      initializeAppAndStore();
    } else {
      const recheckSession = store.get("savedSession");
      if (recheckSession && recheckSession.token && recheckSession.user) {
        currentUserSession = recheckSession;
        createMainWindow(currentUserSession.user);
      } else {
        createLoginWindow();
      }
    }
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("quit", () => console.log("[Main Process] Encerrando aplicação."));

console.log(
  "[Main Process] FIM do arquivo main.js (definições de ciclo de vida)."
);
