// renderer_upload.js

(function () {
  // URL base da sua API Python
  const PYTHON_API_URL = "http://crm.capitaoconsorcios.com:8000";

  // Guarda o token obtido no login
  let apiToken = null;

  // Mapeamento dos elementos da UI
  const ui = {
    loginSection: document.getElementById("login-section"),
    uploadSection: document.getElementById("upload-section"),
    loginForm: document.getElementById("login-form"),
    uploadForm: document.getElementById("upload-form"),
    usernameInput: document.getElementById("username"),
    passwordInput: document.getElementById("password"),
    fileInput: document.getElementById("file-input"),
    statusArea: document.getElementById("status-area"),
  };

  // Função para mostrar mensagens de status
  function setStatus(message, type = "") {
    ui.statusArea.textContent = message;
    ui.statusArea.className = `status ${type}`;
  }

  // Lida com a submissão do formulário de login
  async function handleLogin(event) {
    event.preventDefault();
    setStatus("Autenticando na API Python...", "info");

    const username = ui.usernameInput.value;
    const password = ui.passwordInput.value;

    // FastAPI espera os dados de login em um formato específico (form-urlencoded)
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      // Nota: Verifique se a rota de login na sua API Python é '/token'
      const response = await fetch(`${PYTHON_API_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Falha na autenticação.");
      }

      apiToken = data.access_token; // Pega o token retornado pela API
      setStatus(
        "Autenticação bem-sucedida! Pode enviar a planilha.",
        "success"
      );

      // Habilita a seção de upload e desabilita a de login
      ui.uploadSection.classList.remove("disabled");
      ui.loginSection.classList.add("disabled");
    } catch (error) {
      console.error("Erro de login:", error);
      setStatus(`Erro de autenticação: ${error.message}`, "error");
      apiToken = null;
    }
  }

  // Lida com a submissão do formulário de upload
  async function handleUpload(event) {
    event.preventDefault();

    if (!apiToken) {
      setStatus("Erro: Faça a autenticação primeiro.", "error");
      return;
    }

    const arquivo = ui.fileInput.files[0];
    const administradora = new FormData(ui.uploadForm).get("administradora");

    if (!arquivo) {
      setStatus("Por favor, selecione um arquivo de planilha.", "error");
      return;
    }

    setStatus("Enviando planilha...", "info");

    const uploadFormData = new FormData();
    uploadFormData.append("file", arquivo); // A API Python espera um campo 'file'

    try {
      const finalUrl = `${PYTHON_API_URL}/lances/upload/${administradora}`;
      const response = await fetch(finalUrl, {
        method: "POST",
        headers: {
          // Envia o token obtido no passo do login
          Authorization: `Bearer ${apiToken}`,
        },
        body: uploadFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.detail || "Erro no servidor.");
      }

      setStatus(`Sucesso: ${data.message}`, "success");
      ui.uploadForm.reset();
    } catch (error) {
      console.error("Erro de upload:", error);
      setStatus(`Erro no envio: ${error.message}`, "error");
    }
  }

  // Registra os listeners dos formulários
  ui.loginForm.addEventListener("submit", handleLogin);
  ui.uploadForm.addEventListener("submit", handleUpload);
})();
