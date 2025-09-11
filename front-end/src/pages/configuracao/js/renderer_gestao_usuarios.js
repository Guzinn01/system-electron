(function () {
  console.log("[Renderer Gestão Usuários] Script carregado.");
  const btnVoltar = document.getElementById("btnVoltarGestao");
  const userTableBody = document.querySelector("#userTable tbody");
  const noUsersMessage = document.getElementById("noUsersMessage");
  const addUserBtn = document.getElementById("addUserBtn");
  const userFormContainer = document.getElementById("userFormContainer");
  const userForm = document.getElementById("userForm");
  const userFormTitle = document.getElementById("userFormTitle");
  const cancelUserFormBtn = document.getElementById("cancelUserFormBtn");
  const userNameInput = document.getElementById("userName");
  const userEmailInput = document.getElementById("userEmail");
  const userRoleInput = document.getElementById("userRole");
  const userPasswordInput = document.getElementById("userPassword");
  const userIdInput = document.getElementById("userId");
  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const exportStatusMessage = document.getElementById("exportStatusMessage");
  const deleteConfirmBackdrop = document.getElementById(
    "delete-confirm-backdrop"
  );
  const deleteConfirmMessage = document.getElementById(
    "delete-confirm-message"
  );
  const deleteConfirmOkBtn = document.getElementById("delete-confirm-ok-btn");
  const deleteConfirmCancelBtn = document.getElementById(
    "delete-confirm-cancel-btn"
  );

  const PERMISSIONS_CONFIG = {
    system_admin: {
      label: "👑 Acesso Total (Administrador do Sistema)",
      actions: [],
    },

    gestao_clientes: {
      label: "Página: Gestão de Clientes",
      actions: [
        { id: "clientes_cadastrar", label: "Cadastrar Cliente" },
        { id: "clientes_editar", label: "Editar Cliente" },
        { id: "clientes_excluir", label: "Excluir Cliente" },
        { id: "clientes_gerenciar_consorcios", label: "Gerenciar Consórcios" },
        {
          id: "clientes_transferir_consorcios",
          label: "Transferir Consórcios",
        },
      ],
    },
    ponto: {
      label: "Página: Ponto",
      actions: [],
    },
    simulador_parcelas: {
      label: "Página: Simulador de Parcelas",
      actions: [],
    },
    sorteio: {
      label: "Página: Apurador e Sorteio",
      actions: [],
    },
    gestao_usuarios: {
      label: "Página: Gestão de Usuários",
      actions: [],
    },
    gestao_lances: {
      label: "Página: Lances",
      actions: [{ id: "lances_upload", label: "Permitir Upload de Planilha" }],
    },
  };
  let currentUsers = [];
  let userBeingEdited = null;
  let userIdParaExcluir = null;

  function abrirModalDeExclusao(userId, userName) {
    userIdParaExcluir = userId;
    deleteConfirmMessage.textContent = `Tem certeza que deseja excluir o usuário "${userName}" (ID: ${userId})?`;
    deleteConfirmBackdrop.classList.remove("hidden");
  }

  function fecharModalDeExcluir() {
    deleteConfirmBackdrop.classList.add("hidden");
    userIdParaExcluir = null;
  }

  if (btnVoltar) {
    btnVoltar.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.hash = "#/configuracao";
    });
  }

  async function loadUsers() {
    if (!userTableBody || !noUsersMessage) {
      return console.error("Elementos da tabela não foram encontrados.");
    }
    try {
      const result = await window.electronAPI.invoke("get-users");
      if (result.success) {
        currentUsers = result.users;
        renderTable(currentUsers);
      } else {
        userTableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Erro: ${result.message}</td></tr>`;
        console.error(
          "[Renderer Gestão Usuários] Falha ao carregar usuários:",
          result.message
        );
      }
    } catch (error) {
      console.error(
        "[Renderer Gestão Usuários] Erro de comunicação ao buscar usuários:",
        error
      );
      userTableBody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">Erro de comunicação com o sistema.</td></tr>`;
    }
  }

  function renderTable(users) {
    userTableBody.innerHTML = "";
    noUsersMessage.style.display =
      !users || users.length === 0 ? "block" : "none";

    if (!users) return;

    users.forEach((user) => {
      const row = document.createElement("tr");
      row.dataset.userData = JSON.stringify(user);

      const statusClass = user.onlineStatus === "Online" ? "online" : "offline";
      const lastSeenDate = user.lastSeen
        ? new Date(user.lastSeen).toLocaleString("pt-BR")
        : "Nunca";
      const titleText =
        user.onlineStatus === "Offline"
          ? `Visto por último: ${lastSeenDate}`
          : "Online agora";
      const statusText = user.onlineStatus || "Offline";

      // --- INÍCIO DO HTML CORRIGIDO ---
      row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email || "N/A"}</td>
            <td>${user.role}</td>
            <td style="text-align: center;" class="status-cell" id="status-cell-${
              user.id
            }" title="${titleText}">
                <span class="status-indicator ${statusClass}"></span>
                <span class="status-text">${statusText}</span>
            </td>
            <td class="actions-cell">
                <button class="btn-icon edit-btn" data-id="${
                  user.id
                }" title="Editar Dados do Usuário">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon permissions-btn" data-id="${
                  user.id
                }" title="Editar Permissões">
                    <i class="fas fa-shield-alt"></i>
                </button>
            </td>
        `;
      // --- FIM DO HTML CORRIGIDO ---

      userTableBody.appendChild(row);
    });
  }
  function updateUserStatusInUI(data) {
    console.log("[Real-time] Recebido evento de mudança de status:", data);
    const { userId, status, lastSeen } = data;

    const statusCell = document.getElementById(`status-cell-${userId}`);
    if (statusCell) {
      const indicator = statusCell.querySelector(".status-indicator");
      const text = statusCell.querySelector(".status-text");

      if (indicator && text) {
        indicator.className = `status-indicator ${status.toLowerCase()}`;
        text.textContent = status;

        const lastSeenDate = lastSeen
          ? new Date(lastSeen).toLocaleString("pt-BR")
          : "Nunca";
        const titleText =
          status === "Offline"
            ? `Visto por último: ${lastSeenDate}`
            : "Online agora";
        statusCell.title = titleText;
      }
    }
  }

  function showForm(user = null) {
    userForm.reset();
    if (user) {
      userFormTitle.textContent = "Editar Usuário";
      userIdInput.value = user.id;
      userNameInput.value = user.username;
      userEmailInput.value = user.email || "";
      userRoleInput.value = user.role;
      userPasswordInput.placeholder =
        "Deixe em branco para não alterar a senha";
      userPasswordInput.required = false;
    } else {
      userFormTitle.textContent = "Adicionar Novo Usuário";
      userIdInput.value = "";
      userPasswordInput.placeholder = "Senha";
      userPasswordInput.required = true;
    }
    userFormContainer.classList.remove("hidden");
  }

  function hideForm() {
    userFormContainer.classList.add("hidden");
    userForm.reset();
  }

  function openPermissionsModal(user) {
    // Busca os elementos SÓ AGORA, no momento do clique
    const modalBackdrop = document.getElementById("permissions-modal-backdrop");
    const modalUsernameTitle = document.querySelector(
      "#modal-username-title span"
    );
    const modalPermissionsList = document.getElementById(
      "modal-permissions-list"
    );
    const modalSaveButton = document.getElementById("modal-save-button");
    const modalCancelButton = document.getElementById("modal-cancel-button");
    const modalCloseButton = document.getElementById("modal-close-button");

    if (!modalBackdrop || !modalUsernameTitle || !modalPermissionsList) {
      console.error(
        "ERRO: Um ou mais elementos do modal de permissões não foram encontrados no DOM!"
      );
      return;
    }

    userBeingEdited = user;
    modalUsernameTitle.textContent = user.username;
    const userCurrentPermissions = user.permissions || [];

    // Preenche os checkboxes com as permissões atuais do usuário
    modalPermissionsList
      .querySelectorAll('input[name="page_access"], input[name="action"]')
      .forEach((cb) => {
        cb.checked = userCurrentPermissions.includes(cb.value);
      });

    // --- LÓGICA DE SALVAR COMPLETA ---
    modalSaveButton.onclick = async () => {
      if (!userBeingEdited) return;

      // 1. Coleta todas as permissões que estão marcadas no modal
      const checkedBoxes = modalPermissionsList.querySelectorAll(
        'input[type="checkbox"]:checked'
      );
      const newPermissions = Array.from(checkedBoxes).map(
        (checkbox) => checkbox.value
      );

      // 2. Envia os dados para o processo principal do Electron
      try {
        const result = await window.electronAPI.invoke(
          "update-user-permissions",
          {
            userId: userBeingEdited.id,
            permissions: newPermissions,
          }
        );

        // 3. Trata a resposta do processo principal
        if (result.success) {
          window.showNotification(
            "Permissões atualizadas com sucesso!",
            "sucesso"
          );
          closePermissionsModal(); // Fecha o modal
          loadUsers(); // Recarrega a tabela de usuários
        } else {
          window.showNotification(`Erro ao salvar: ${result.message}`, "erro");
        }
      } catch (error) {
        console.error("Erro de comunicação ao salvar permissões:", error);
        window.showNotification(
          "Erro de comunicação ao salvar permissões.",
          "erro"
        );
      }
    };
    // --- FIM DA LÓGICA DE SALVAR ---

    modalCancelButton.onclick = closePermissionsModal;
    modalCloseButton.onclick = closePermissionsModal;

    // Lógica para exibir o modal
    modalBackdrop.classList.remove("hidden");
    setTimeout(() => {
      modalBackdrop.classList.add("is-visible");
    }, 10);
  }

  function closePermissionsModal() {
    const modalBackdrop = document.getElementById("permissions-modal-backdrop");
    if (!modalBackdrop) return;

    modalBackdrop.classList.remove("is-visible");

    const handleTransitionEnd = () => {
      modalBackdrop.classList.add("hidden");
      modalBackdrop.removeEventListener("transitionend", handleTransitionEnd);
    };

    modalBackdrop.addEventListener("transitionend", handleTransitionEnd);

    userBeingEdited = null;
  }

  addUserBtn.addEventListener("click", () => {
    showForm(null);
  });

  cancelUserFormBtn.addEventListener("click", () => {
    hideForm();
  });

  userTableBody.addEventListener("click", (event) => {
    const target = event.target;

    const editButton = target.closest(".edit-btn");
    if (editButton) {
      const userId = editButton.dataset.id;
      const userToEdit = currentUsers.find(
        (user) => user.id.toString() === userId
      );
      if (userToEdit) {
        showForm(userToEdit);
      }
      return;
    }

    const permissionsButton = target.closest(".permissions-btn");
    if (permissionsButton) {
      const userId = permissionsButton.dataset.id;
      const userToEdit = currentUsers.find(
        (user) => user.id.toString() === userId
      );
      if (userToEdit) {
        openPermissionsModal(userToEdit);
      }
      return;
    }
  });

  async function verificarPermissoesEIniciar() {
    console.log(
      "[Renderer Gestão Usuários] Verificando permissões e iniciando a página..."
    );
    const pageContainer = document.querySelector(".user-management-container");
    const statusMessage = document.getElementById("statusMessage");

    try {
      const result = await window.electronAPI.invoke("get-current-user-data");
      if (result && result.success) {
        const currentUser = result.user;
        const permissions = currentUser.permissions || [];
        const userHasPermission = (permissionId) =>
          permissions.includes(permissionId);

        if (userHasPermission("gestao_usuarios")) {
          console.log("[Renderer Gestão Usuários] Acesso PERMITIDO.");
          loadUsers();
          const permissionsListContainer = document.getElementById(
            "modal-permissions-list"
          );
          if (permissionsListContainer) {
            permissionsListContainer.addEventListener("click", (event) => {
              const label = event.target.closest(".permission-page-label");
              if (!label || event.target.tagName === "INPUT") {
                return;
              }
              const actionsContainer = label.parentElement.querySelector(
                ".permission-actions"
              );
              if (actionsContainer) {
                actionsContainer.classList.toggle("hidden");
              }
            });
          }
          // FIM DA LÓGICA CORRIGIDA
        } else {
          console.log("[Renderer Gestão Usuários] Acesso NEGADO.");
          if (pageContainer) pageContainer.style.display = "none";
          if (statusMessage) {
            statusMessage.textContent =
              "Acesso Negado: Você não tem permissão para acessar esta página.";
            statusMessage.style.color = "red";
          }
        }
      } else {
        throw new Error(
          result.message || "Não foi possível obter os dados da sessão."
        );
      }
    } catch (error) {
      console.error(
        "[Renderer Gestão Usuários] Erro crítico na inicialização:",
        error
      );
      if (pageContainer) pageContainer.style.display = "none";
      if (statusMessage) {
        statusMessage.textContent = `Erro crítico ao carregar a página: ${error.message}`;
        statusMessage.style.color = "red";
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        if (!userBeingEdited) return;
        const modalPermissionsList = document.getElementById(
          "modal-permissions-list"
        );
        const checkedBoxes = modalPermissionsList.querySelectorAll(
          'input[type="checkbox"]:checked'
        );
        const newPermissions = Array.from(checkedBoxes).map(
          (checkbox) => checkbox.value
        );

        console.log(
          "Enviando para o backend as seguintes permissões:",
          newPermissions
        );

        try {
          const result = await window.electronAPI.invoke(
            "update-user-permissions",
            {
              userId: userBeingEdited.id,
              permissions: newPermissions,
            }
          );
          if (result.success) {
            window.showNotification(
              "Permissões atualizadas com sucesso!",
              "sucesso"
            );
            closePermissionsModal();
            loadUsers();
          } else {
            window.showNotification(
              `Erro ao salvar: ${result.message}`,
              "erro"
            );
          }
        } catch (error) {
          console.error("Erro ao salvar permissões:", error);
          window.showNotification(
            "Erro de comunicação ao salvar permissões.",
            "erro"
          );
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", closePermissionsModal);
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", closePermissionsModal);
    }
  });

  if (deleteConfirmCancelBtn) {
    deleteConfirmCancelBtn.addEventListener("click", () => {
      fecharModalDeExcluir();
    });
  }
  if (deleteConfirmOkBtn) {
    deleteConfirmOkBtn.addEventListener("click", async () => {
      if (!userIdParaExcluir) return;
      try {
        const result = await window.electronAPI.invoke(
          "delete-user",
          userIdParaExcluir
        );
        if (result.success) {
          window.showNotification("Usuário excluído com sucesso!", "sucesso");
          loadUsers();
        } else {
          window.showNotification(`Erro ao excluir: ${result.message}`, "erro");
        }
      } catch (error) {
        window.showNotification(
          `Erro de comunicação: ${error.message}`,
          "erro"
        );
      } finally {
        fecharModalDeExcluir();
      }
    });
  }

  if (userForm) {
    userForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = userIdInput.value;
      const isEditing = !!id;
      const userData = {
        username: userNameInput.value,
        email: userEmailInput.value,
        role: userRoleInput.value,
      };
      if (userPasswordInput.value) {
        userData.password = userPasswordInput.value;
      }
      if (!isEditing && !userData.password) {
        return window.showNotification(
          "A senha é obrigatória para novos usuários.",
          "erro"
        );
      }
      try {
        const channel = isEditing ? "update-user" : "add-user";
        const payload = isEditing ? { userId: id, userData } : userData;
        const result = await window.electronAPI.invoke(channel, payload);
        if (result.success) {
          window.showNotification(
            `Usuário ${isEditing ? "atualizado" : "adicionado"} com sucesso!`,
            "sucesso"
          );
          hideForm();
          loadUsers();
        } else {
          window.showNotification(`Erro: ${result.message}`, "erro");
        }
      } catch (error) {
        window.showNotification(
          `Erro de comunicação: ${error.message}`,
          "erro"
        );
      }
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", async () => {
      exportStatusMessage.textContent =
        "Gerando relatório, por favor aguarde...";
      exportStatusMessage.style.color = "#333";
      exportCsvBtn.disabled = true;
      try {
        const result = await window.electronAPI.invoke("gerar-csv-ponto");
        if (result.success) {
          exportStatusMessage.textContent = result.message;
          exportStatusMessage.style.color = "green";
        } else {
          exportStatusMessage.textContent = `Erro: ${result.message}`;
          exportStatusMessage.style.color = "red";
        }
      } catch (error) {
        exportStatusMessage.textContent =
          "Erro de comunicação ao gerar o relatório.";
        exportStatusMessage.style.color = "red";
      } finally {
        exportCsvBtn.disabled = false;
      }
    });
  }

  if (window.electronAPI && typeof window.electronAPI.on === "function") {
    window.electronAPI.on("user-status-change", (data) => {
      updateUserStatusInUI(data);
    });
  }

  verificarPermissoesEIniciar();
})();
