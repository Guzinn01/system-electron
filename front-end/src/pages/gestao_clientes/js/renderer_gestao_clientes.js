setTimeout(() => {
  const tabPfButton = document.getElementById("tab-pf");
  const tabPjButton = document.getElementById("tab-pj");
  const contentPfPane = document.getElementById("content-pf");
  const contentPjPane = document.getElementById("content-pj");
  const viewTabela = document.getElementById("view-tabela-clientes");
  const viewCadastro = document.getElementById("view-cadastro-cliente");
  const viewPerfil = document.getElementById("view-perfil-cliente");
  const corpoTabelaPf = document.getElementById("corpo-tabela-pf");
  const corpoTabelaPj = document.getElementById("corpo-tabela-pj");
  const inputBusca = document.getElementById("input-busca-cliente");
  const btnNovoCliente = document.getElementById("btn-novo-cliente");
  const formCliente = document.getElementById("form-cadastro-cliente");
  const tituloFormulario = document.getElementById("form-title");
  const btnVoltarDoForm = document.getElementById("btn-voltar-tabela-do-form");
  const perfilNomeCliente = document.getElementById("perfil-nome-cliente");
  const containerSocios = document.getElementById("lista-socios-container");
  if (containerSocios) {
    containerSocios.addEventListener("click", function (event) {
      const removeButton = event.target.closest(".btn-remover-socio");
      if (!removeButton) {
        return;
      }
      const socioCard = removeButton.closest(".socio-item-card");
      if (socioCard) {
        socioCard.remove();
      }
    });
  }
  const perfilDadosContainer = document.getElementById(
    "perfil-dados-container"
  );
  const inputNumeroContrato = document.getElementById(
    "consortium-numero-contrato"
  );
  const inputContratoPDF = document.getElementById("consortium-contrato-pdf");
  const perfilConsortiumCardsContainer = document.getElementById(
    "perfil-consortium-cards-container"
  );

  const btnVoltarDoPerfil = document.getElementById("btn-voltar-do-perfil");
  const btnEditarClienteDoPerfil = document.getElementById(
    "btn-editar-cliente-do-perfil"
  );
  const btnExcluirClienteDoPerfil = document.getElementById(
    "btn-excluir-cliente-perfil"
  );
  const btnAddConsortiumDoPerfil = document.getElementById(
    "btn-add-consortium-do-perfil"
  );
  const consortiumModalBackdrop = document.getElementById(
    "consortium-modal-backdrop"
  );
  const consortiumModalTitle = document.getElementById(
    "consortium-modal-title"
  );
  const consortiumForm = document.getElementById("form-add-consortium");
  const consortiumModalCloseButton = document.getElementById(
    "consortium-modal-close-button"
  );
  const consortiumModalCancelButton = document.getElementById(
    "consortium-modal-cancel-button"
  );
  const inputAdministradora = document.getElementById(
    "consortium-administradora"
  );
  const inputStatus = document.getElementById("consortium-status");
  const inputCredito = document.getElementById("consortium-credito");
  const inputMeses = document.getElementById("consortium-meses");
  const inputGrupo = document.getElementById("consortium-grupo");
  const inputCota = document.getElementById("consortium-cota");
  const inputDataInicio = document.getElementById("consortium-data-inicio");
  const inputVendedor = document.getElementById("consortium-vendedor");
  const confirmDeleteModalBackdrop = document.getElementById(
    "confirm-delete-modal-backdrop"
  );
  const confirmDeleteMessage = document.getElementById(
    "confirm-delete-message"
  );
  const btnCancelDelete = document.getElementById("btn-cancel-delete");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete");
  const transferModalBackdrop = document.getElementById(
    "transfer-modal-backdrop"
  );
  const transferConsortiumInfo = document.getElementById(
    "transfer-consortium-info"
  );
  const formTransferConsortium = document.getElementById(
    "form-transfer-consortium"
  );
  const transferClientSearch = document.getElementById(
    "transfer-client-search"
  );
  const transferModalCloseButton = document.getElementById(
    "transfer-modal-close-button"
  );
  const transferModalCancelButton = document.getElementById(
    "transfer-modal-cancel-button"
  );
  const btnAdicionarSocio = document.getElementById("btn-adicionar-socio");

  let clienteEmEdicaoId = null;
  let listaCompletaDeClientes = [];
  let mascaraCredito = null;
  let mascaraCpfCnpj = null;
  let mascaraCpfConjuge = null;
  let iti = null;
  let itiConjuge = null;
  let currentUserPermissions = [];

  async function applyPagePermissions() {
    try {
      const resultado = await window.electronAPI.invoke(
        "get-current-user-data"
      );
      if (!resultado.success || !resultado.user) return;

      currentUserPermissions = resultado.user.permissions || [];
      const has = (perm) => currentUserPermissions.includes(perm);

      if (btnNovoCliente) {
        btnNovoCliente.style.display = has("clientes_cadastrar")
          ? "inline-flex"
          : "none";
      }
      // Botões da tela de Perfil do Cliente
      if (btnEditarClienteDoPerfil) {
        btnEditarClienteDoPerfil.style.display = has("clientes_editar")
          ? "inline-flex"
          : "none";
      }
      if (btnExcluirClienteDoPerfil) {
        btnExcluirClienteDoPerfil.style.display = has("clientes_excluir")
          ? "inline-flex"
          : "none";
      }
      if (btnAddConsortiumDoPerfil) {
        btnAddConsortiumDoPerfil.style.display = has(
          "clientes_gerenciar_consorcios"
        )
          ? "inline-flex"
          : "none";
      }
    } catch (error) {
      console.error("Erro ao aplicar permissões na página de clientes:", error);

      [
        btnNovoCliente,
        btnEditarClienteDoPerfil,
        btnExcluirClienteDoPerfil,
        btnAddConsortiumDoPerfil,
      ].forEach((btn) => {
        if (btn) btn.style.display = "none";
      });
    }
  }

  function setupMascaras() {
    // Máscara para o campo de valor de crédito
    if (inputCredito) {
      mascaraCredito = IMask(inputCredito, {
        mask: "R$ num",
        blocks: {
          num: {
            mask: Number,
            thousandsSeparator: ".",
            radix: ",",
            scale: 2,
            padFractionalZeros: true,
          },
        },
      });
    }

    // Máscara para o campo de CPF/CNPJ principal
    if (document.getElementById("cpf_cnpj")) {
      mascaraCpfCnpj = IMask(document.getElementById("cpf_cnpj"), {
        mask: [{ mask: "000.000.000-00" }, { mask: "00.000.000/0000-00" }],
      });
    }

    // Máscara para o campo de CEP
    if (document.getElementById("cep")) {
      IMask(document.getElementById("cep"), { mask: "00000-000" });
    }

    // --- INÍCIO DAS NOVAS MÁSCARAS DE DATA ---
    // Máscara para o campo de Data de Nascimento principal
    if (document.getElementById("data_nascimento")) {
      IMask(document.getElementById("data_nascimento"), { mask: "00/00/0000" });
    }

    // Máscara para o campo de Data de Nascimento do cônjuge
    if (document.getElementById("conjuge_data_nascimento")) {
      IMask(document.getElementById("conjuge_data_nascimento"), {
        mask: "00/00/0000",
      });
    }
    if (document.getElementById("consortium-data-inicio")) {
      IMask(document.getElementById("consortium-data-inicio"), {
        mask: "00/00/0000",
      });
    }
    // --- FIM DAS NOVAS MÁSCARAS DE DATA ---

    // Máscara para o campo de telefone principal
    if (document.getElementById("telefone")) {
      iti = window.intlTelInput(document.getElementById("telefone"), {
        initialCountry: "br",
        utilsScript:
          "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.13/js/utils.js",
        separateDialCode: true,
        nationalMode: true,
      });
    }

    // Máscara para o campo de CPF do cônjuge
    if (document.getElementById("conjuge_cpf")) {
      mascaraCpfConjuge = IMask(document.getElementById("conjuge_cpf"), {
        mask: "000.000.000-00",
      });
    }

    // Máscara para o campo de telefone do cônjuge
    if (document.getElementById("conjuge_telefone")) {
      itiConjuge = window.intlTelInput(
        document.getElementById("conjuge_telefone"),
        {
          initialCountry: "br",
          utilsScript:
            "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.13/js/utils.js",
          separateDialCode: true,
        }
      );
    }
  }

  function handleTransferSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();

    const allOtherClients = listaCompletaDeClientes.filter(
      (cliente) => cliente.id !== clienteEmEdicaoId
    );

    if (!searchTerm) {
      renderTransferClientList(allOtherClients);
      return;
    }

    const filteredClients = allOtherClients.filter(
      (cliente) =>
        cliente.nome_completo.toLowerCase().includes(searchTerm) ||
        (cliente.cpf_cnpj || "")
          .replace(/\D/g, "")
          .includes(searchTerm.replace(/\D/g, ""))
    );

    renderTransferClientList(filteredClients);
  }

  function setupEventListeners() {
    const selectStatusCliente = document.getElementById(
      "select-status-cliente"
    );
    if (selectStatusCliente) {
      selectStatusCliente.addEventListener("change", handleStatusChange);
    }
    const estadoCivilSelect = document.getElementById("estado_civil");
    if (estadoCivilSelect) {
      estadoCivilSelect.addEventListener(
        "change",
        atualizarInterfaceParaTipoPessoa
      );
    }
    if (consortiumModalBackdrop) {
      consortiumModalBackdrop.addEventListener("click", (event) => {
        const deleteButton = event.target.closest(".btn-remover-contrato");
        if (deleteButton) {
          const consortiumId = deleteButton.dataset.consortiumId;
          handleDeleteContract(consortiumId);
        }
      });
    }
    if (tabPfButton)
      tabPfButton.addEventListener("click", () => mudarAba("pf"));
    if (tabPjButton)
      tabPjButton.addEventListener("click", () => mudarAba("pj"));
    if (btnNovoCliente)
      btnNovoCliente.addEventListener("click", () => mostrarViewCadastro());
    if (btnVoltarDoForm)
      btnVoltarDoForm.addEventListener("click", mostrarViewTabela);
    if (btnVoltarDoPerfil)
      btnVoltarDoPerfil.addEventListener("click", mostrarViewTabela);
    if (formCliente)
      formCliente.addEventListener("submit", lidarComEnvioFormularioCliente);

    // ===== INÍCIO DA CORREÇÃO COMPLETA =====
    // 1. Adiciona o listener para o campo de BUSCA do modal
    const transferClientSearchInput = document.getElementById(
      "transfer-client-search"
    );
    if (transferClientSearchInput) {
      transferClientSearchInput.addEventListener("input", handleTransferSearch);
    }

    // 2. Adiciona o listener para a SELEÇÃO na lista de clientes (correção anterior)
    const transferClientList = document.getElementById("transfer-client-list");
    if (transferClientList) {
      transferClientList.addEventListener(
        "click",
        handleSelectClientForTransfer
      );
    }
    // ===== FIM DA CORREÇÃO COMPLETA =====

    const summaryContainer = document.getElementById(
      "consortium-summary-container"
    );
    if (summaryContainer) {
      summaryContainer.addEventListener("click", (event) => {
        if (event.target.closest(".summary-item.transferida")) {
          openTransferHistoryModal();
        }
      });
    }
    if (inputContratoPDF) {
      inputContratoPDF.addEventListener("change", () => {
        const labelSpan = document.querySelector(
          'label[for="consortium-contrato-pdf"] span'
        );
        const file = inputContratoPDF.files[0];
        const fileSizeLimit = 5 * 1024 * 1024; // 5 MB

        if (file) {
          if (file.size > fileSizeLimit) {
            mostrarNotificacao(
              "Arquivo muito grande! O limite é de 5 MB.",
              "erro"
            );
            inputContratoPDF.value = ""; // Limpa a seleção
            if (labelSpan) labelSpan.textContent = "Escolher arquivo...";
          } else {
            // Mostra o nome do arquivo selecionado no botão
            if (labelSpan) labelSpan.textContent = file.name;
          }
        } else {
          if (labelSpan) labelSpan.textContent = "Escolher arquivo...";
        }
      });
    }

    document.body.addEventListener("click", (event) => {
      const viewButton = event.target.closest(".btn-ver-contrato-salvo");
      if (viewButton && viewButton.dataset.filename) {
        const fileName = viewButton.dataset.filename;
        openPdfModal(fileName);
      }
    });

    const pdfModalCloseButton = document.getElementById(
      "pdf-viewer-modal-close-button"
    );
    const pdfDownloadButton = document.getElementById(
      "pdf-viewer-download-button"
    );
    if (pdfModalCloseButton)
      pdfModalCloseButton.addEventListener("click", closePdfModal);
    if (pdfDownloadButton)
      pdfDownloadButton.addEventListener("click", downloadCurrentPdf);

    const transferHistoryModalClose = document.getElementById(
      "transfer-history-modal-close-button"
    );
    const transferHistoryModalCancel = document.getElementById(
      "transfer-history-modal-cancel-button"
    );
    const containerResultadosBusca = document.getElementById(
      "container-resultados-busca"
    );
    if (containerResultadosBusca) {
      containerResultadosBusca.addEventListener("click", (event) => {
        const itemClicado = event.target.closest(".resultado-item");
        if (itemClicado && itemClicado.dataset.id) {
          const clienteId = itemClicado.dataset.id;
          mostrarViewPerfilCliente(clienteId);
          inputBusca.value = "";
          containerResultadosBusca.innerHTML = "";
          containerResultadosBusca.classList.add("hidden");
        }
      });
    }

    if (transferHistoryModalClose) {
      transferHistoryModalClose.addEventListener(
        "click",
        closeTransferHistoryModal
      );
    }
    if (transferHistoryModalCancel) {
      transferHistoryModalCancel.addEventListener(
        "click",
        closeTransferHistoryModal
      );
    }

    if (btnEditarClienteDoPerfil)
      btnEditarClienteDoPerfil.addEventListener("click", () =>
        iniciarEdicao(clienteEmEdicaoId)
      );
    if (btnExcluirClienteDoPerfil)
      btnExcluirClienteDoPerfil.addEventListener("click", () =>
        excluirCliente(clienteEmEdicaoId)
      );
    if (btnAddConsortiumDoPerfil)
      btnAddConsortiumDoPerfil.addEventListener("click", () =>
        openConsortiumModal()
      );
    if (consortiumForm)
      consortiumForm.addEventListener(
        "submit",
        lidarComEnvioFormularioConsorcio
      );
    if (perfilConsortiumCardsContainer)
      perfilConsortiumCardsContainer.addEventListener(
        "click",
        handleConsortiumCardAction
      );
    if (consortiumModalCloseButton)
      consortiumModalCloseButton.addEventListener(
        "click",
        closeConsortiumModal
      );
    if (consortiumModalCancelButton)
      consortiumModalCancelButton.addEventListener(
        "click",
        closeConsortiumModal
      );
    if (transferModalCloseButton)
      transferModalCloseButton.addEventListener("click", closeTransferModal);
    if (transferModalCancelButton)
      transferModalCancelButton.addEventListener("click", closeTransferModal);
    if (formTransferConsortium)
      formTransferConsortium.addEventListener("submit", handleConfirmTransfer);
    if (inputBusca) inputBusca.addEventListener("input", lidarComBusca);
    if (btnAdicionarSocio)
      btnAdicionarSocio.addEventListener("click", adicionarCampoDeSocio);

    const lidarComCliqueNaLinha = (event) => {
      if (event.target.closest(".acoes-tabela")) return;
      const linhaClicada = event.target.closest("tr.clickable-row");
      if (linhaClicada && linhaClicada.dataset.id) {
        mostrarViewPerfilCliente(linhaClicada.dataset.id);
      }
    };
    if (corpoTabelaPf)
      corpoTabelaPf.addEventListener("click", lidarComCliqueNaLinha);
    if (corpoTabelaPj)
      corpoTabelaPj.addEventListener("click", lidarComCliqueNaLinha);

    const tabelas = [
      document.getElementById("corpo-tabela-pf"),
      document.getElementById("corpo-tabela-pj"),
    ];

    tabelas.forEach((tabela) => {
      if (tabela) {
        tabela.addEventListener("click", (event) => {
          const editButton = event.target.closest(".btn-editar-cliente");
          if (editButton) {
            const clienteId = editButton.dataset.id;
            iniciarEdicao(clienteId);
          }
        });
      }
    });
    const radiosTipoPessoa = document.querySelectorAll(
      'input[name="tipo_pessoa"]'
    );
    radiosTipoPessoa.forEach((radio) => {
      radio.addEventListener("change", atualizarInterfaceParaTipoPessoa);
    });
  }

  function closeTransferHistoryModal() {
    const modalBackdrop = document.getElementById("transfer-history-modal-backdrop");
    if (modalBackdrop) {
      modalBackdrop.classList.remove('is-visible');

      const modalBody = document.getElementById("transfer-history-modal-body");
      if (modalBody) modalBody.innerHTML = "";
    }
  }

  async function carregarClientes() {
    try {
      const resultado = await window.electronAPI.invoke("clientes:get-all");
      if (!resultado.success) throw new Error(resultado.message);
      listaCompletaDeClientes = resultado.data || [];
      const pessoasFisicas = listaCompletaDeClientes.filter(
        (c) =>
          c.tipo_pessoa === "Fisica" ||
          (c.cpf_cnpj && c.cpf_cnpj.replace(/\D/g, "").length === 11)
      );
      const pessoasJuridicas = listaCompletaDeClientes.filter(
        (c) =>
          c.tipo_pessoa === "Juridica" ||
          (c.cpf_cnpj && c.cpf_cnpj.replace(/\D/g, "").length === 14)
      );
      renderTable(pessoasFisicas, "corpo-tabela-pf");
      renderTable(pessoasJuridicas, "corpo-tabela-pj");
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      mostrarNotificacao("Erro ao carregar lista de clientes.", "erro");
    }
  }

  async function carregarConsorciosDoCliente(clienteId) {
    try {
      const resultado = await window.electronAPI.invoke(
        "consorcios:get-by-client-id",
        clienteId
      );
      renderConsorcios(resultado.success ? resultado.data : []);
    } catch (error) {
      console.error("Erro ao carregar consórcios:", error);
      mostrarNotificacao("Erro ao carregar consórcios.", "erro");
    }
  }
  function openContractModal(consortiumId) {
    if (!contractModalBackdrop) return;

    const form = document.getElementById("form-upload-contract");
    form.dataset.consortiumId = consortiumId;

    const infoContainer = document.getElementById("current-contract-info");
    infoContainer.innerHTML = "<p>Nenhum contrato anexado.</p>";

    contractModalBackdrop.classList.remove("hidden");
  }

  function handleContractUpload(e) {
    e.preventDefault();
    console.log("Subindo contrato...");
  }

  async function carregarUsuariosParaSelect() {
    try {
      const resultado = await window.electronAPI.invoke("get-users");
      if (resultado.success) {
        listaDeVendedores = resultado.users || [];

        if (inputVendedor) {
          inputVendedor.innerHTML =
            '<option value="" disabled selected>Selecione...</option>';
          listaDeVendedores.forEach((usuario) => {
            inputVendedor.innerHTML += `<option value="${usuario.id}">${usuario.username}</option>`;
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  }

  async function lidarComEnvioFormularioCliente(e) {
    e.preventDefault();
    if (
      document.getElementById("telefone").value.trim() &&
      iti &&
      !iti.isValidNumber()
    ) {
      return mostrarNotificacao("O telefone principal é inválido.", "erro");
    }

    const formData = new FormData(formCliente);
    const dadosCliente = Object.fromEntries(formData.entries());
    if (iti && iti.isValidNumber()) dadosCliente.telefone = iti.getNumber();

    const secaoConjuge = document.getElementById("secao-conjuge");
    if (secaoConjuge && !secaoConjuge.classList.contains("hidden")) {
      if (itiConjuge && itiConjuge.isValidNumber())
        dadosCliente.conjuge_telefone = itiConjuge.getNumber();
    }

    const cardsDeSocios = document.querySelectorAll(".socio-item-card");
    dadosCliente.socios = Array.from(cardsDeSocios).map((card) => {
      const telefoneInput = card.querySelector(
        'input[name="socio_telefone[]"]'
      );
      return {
        nome: card.querySelector('input[name="socio_nome[]"]').value,
        cpf: card.querySelector('input[name="socio_cpf[]"]').value,
        data_nascimento: card.querySelector(
          'input[name="socio_data_nascimento[]"]'
        ).value,
        email: card.querySelector('input[name="socio_email[]"]').value,
        telefone:
          telefoneInput.iti && telefoneInput.iti.isValidNumber()
            ? telefoneInput.iti.getNumber()
            : telefoneInput.value,
      };
    });

    // --- INÍCIO DA CORREÇÃO DE DATA ---
    // Função auxiliar para converter DD/MM/AAAA para AAAA-MM-DD ou null se vazio/inválido
    const reformatarData = (data) => {
      if (!data || data.trim() === "") return null;
      const partes = data.split("/");
      if (partes.length !== 3 || partes[2].length < 4) return null; // Validação básica
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    };

    dadosCliente.data_nascimento = reformatarData(dadosCliente.data_nascimento);
    dadosCliente.conjuge_data_nascimento = reformatarData(
      dadosCliente.conjuge_data_nascimento
    );

    // Reformata a data para cada sócio
    if (Array.isArray(dadosCliente.socios)) {
      dadosCliente.socios.forEach((socio) => {
        socio.data_nascimento = reformatarData(socio.data_nascimento);
      });
    }
    // --- FIM DA CORREÇÃO DE DATA ---

    // Limpa os campos de sócio individuais que vêm do formulário
    delete dadosCliente["socio_nome[]"];
    delete dadosCliente["socio_cpf[]"];
    delete dadosCliente["socio_data_nascimento[]"];
    delete dadosCliente["socio_email[]"];
    delete dadosCliente["socio_telefone[]"];

    const ehModoEdicao = clienteEmEdicaoId !== null;
    try {
      const channel = ehModoEdicao ? "clientes:update" : "clientes:create";
      const payload = ehModoEdicao
        ? { id: clienteEmEdicaoId, dados: dadosCliente }
        : dadosCliente;

      console.log(
        "--> DADOS ENVIADOS DO FRONTEND (CORRIGIDO E REFORMATADO):",
        JSON.stringify(payload, null, 2)
      );

      const resultado = await window.electronAPI.invoke(channel, payload);
      if (!resultado.success) throw new Error(resultado.message);
      mostrarNotificacao("Cliente salvo com sucesso!", "sucesso");
      await carregarClientes();
      mostrarViewTabela();
    } catch (error) {
      mostrarNotificacao(`Erro ao salvar cliente: ${error.message}`, "erro");
    }
  }

  async function lidarComEnvioFormularioConsorcio(e) {
    e.preventDefault();
    const idParaEditar = consortiumForm.dataset.editingId;

    // Função auxiliar para converter DD/MM/AAAA para AAAA-MM-DD
    const reformatarData = (data) => {
      if (!data) return null;
      const partes = data.split("/");
      if (partes.length !== 3) return null;
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    };

    const dadosDoFormulario = {
      clienteId: clienteEmEdicaoId,
      administradora: inputAdministradora.value,
      status: inputStatus.value,
      creditoContratado: mascaraCredito.unmaskedValue,
      duracaoMeses: inputMeses.value,
      grupo: inputGrupo.value,
      cota: inputCota.value,
      // --- CORREÇÃO APLICADA AQUI ---
      dataInicio: reformatarData(inputDataInicio.value),
      vendedorId: inputVendedor.value,
      numeroContrato: inputNumeroContrato.value,
    };

    if (inputContratoPDF.files.length > 0) {
      dadosDoFormulario.caminhoContratoPDF = inputContratoPDF.files[0].path;
    }

    try {
      const channel = idParaEditar ? "consorcios:update" : "consorcios:create";
      const payload = idParaEditar
        ? { id: idParaEditar, dados: dadosDoFormulario }
        : dadosDoFormulario;
      const resultado = await window.electronAPI.invoke(channel, payload);
      if (!resultado.success) throw new Error(resultado.message);
      closeConsortiumModal();
      await carregarConsorciosDoCliente(clienteEmEdicaoId);
      mostrarNotificacao("Consórcio salvo com sucesso!", "sucesso");
    } catch (error) {
      mostrarNotificacao(`Erro ao salvar consórcio: ${error.message}`, "erro");
    }
  }

  async function handleConfirmTransfer(e) {
    e.preventDefault();
    const consortiumId = formTransferConsortium.dataset.consortiumId;
    const newClientId = formTransferConsortium.dataset.newClientId;
    if (!newClientId)
      return mostrarNotificacao("Selecione um novo titular da lista.", "erro");

    try {
      const resultado = await window.electronAPI.invoke("consorcios:transfer", {
        id: consortiumId,
        newClientId,
      });
      if (!resultado.success) throw new Error(resultado.message);
      mostrarNotificacao("Consórcio transferido com sucesso!", "sucesso");
      closeTransferModal();
      await carregarConsorciosDoCliente(clienteEmEdicaoId);
    } catch (error) {
      mostrarNotificacao(
        `Erro ao transferir consórcio: ${error.message}`,
        "erro"
      );
    }
  }

  async function iniciarEdicao(id) {
    if (!id) return;
    try {
      const resultado = await window.electronAPI.invoke(
        "clientes:get-by-id",
        id
      );
      if (resultado.success) {
        mostrarViewCadastro(resultado.data);
      } else {
        throw new Error(resultado.message);
      }
    } catch (error) {
      console.error("Erro ao iniciar edição:", error);
      mostrarNotificacao(
        `Não foi possível carregar o cliente para edição: ${error.message}`,
        "erro"
      );
    }
  }

  async function excluirCliente(clienteId) {
    if (!clienteId) return;
    const confirmou = await mostrarConfirmacao(
      "Tem certeza que deseja excluir este cliente? Todos os seus consórcios também serão removidos."
    );
    if (confirmou) {
      try {
        const resultado = await window.electronAPI.invoke(
          "clientes:delete",
          clienteId
        );
        if (!resultado.success) throw new Error(resultado.message);
        mostrarNotificacao("Cliente excluído com sucesso!", "sucesso");
        mostrarViewTabela();
        await carregarClientes();
      } catch (error) {
        mostrarNotificacao(`Erro ao excluir cliente: ${error.message}`, "erro");
      }
    }
  }

  async function handleConsortiumCardAction(e) {
    const button = e.target.closest("button");
    if (!button) return;

    const card = button.closest(".consortium-card");
    if (!card) return;

    const id = card.dataset.consortiumId;
    if (!id) return;

    if (button.classList.contains("btn-edit-consortium")) {
      const resultado = await window.electronAPI.invoke(
        "consorcios:get-by-id",
        id
      );
      if (resultado.success) openConsortiumModal(resultado.data);
    } else if (button.classList.contains("btn-delete-consortium")) {
      const confirmou = await mostrarConfirmacao(
        "Deseja excluir este consórcio?"
      );
      if (confirmou) {
        await window.electronAPI.invoke("consorcios:delete", id);
        await carregarConsorciosDoCliente(clienteEmEdicaoId);
      }
    } else if (button.classList.contains("btn-transfer-consortium")) {
      const resultado = await window.electronAPI.invoke(
        "consorcios:get-by-id",
        id
      );
      if (resultado.success) openTransferModal(resultado.data);
    } else if (button.classList.contains("btn-ver-historico")) {
      toggleConsortiumHistory(card, id);
    }
  }

  async function toggleConsortiumHistory(cardElement, consorcioId) {
    const historyContainer = cardElement.querySelector(
      ".consortium-history-container"
    );
    const historyButton = cardElement.querySelector(".btn-ver-historico");

    if (!historyContainer.classList.contains("hidden")) {
      historyContainer.classList.add("hidden");
      historyContainer.innerHTML = "";
      historyButton.innerHTML = '<i class="fas fa-history"></i>';
      historyButton.title = "Ver Histórico";
      return;
    }

    try {
      historyContainer.innerHTML = "<p>Carregando histórico...</p>";
      historyContainer.classList.remove("hidden");
      historyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      const resultado = await window.electronAPI.invoke(
        "consorcios:get-historico",
        consorcioId
      );

      if (resultado.success && resultado.data.length > 0) {
        const historico = resultado.data;
        let historyHtml = "<h4>Histórico de Eventos</h4><ul>";

        historico.forEach((evento) => {
          const dataFormatada = new Date(evento.timestamp).toLocaleString(
            "pt-BR"
          );
          let detalhesRenderizados = "";

          if (evento.tipoEvento === "EDICAO" && evento.detalhes) {
            const campoFormatado = (evento.detalhes.campo || "")
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase());
            let valorAntigo, valorNovo;

            if (
              evento.detalhes.campo === "Vendedor" &&
              evento.detalhes.nomeAntigo
            ) {
              valorAntigo = `${evento.detalhes.nomeAntigo
                } (${evento.detalhes.valorAntigo.slice(-4)})`;
              valorNovo = `${evento.detalhes.nomeNovo
                } (${evento.detalhes.valorNovo.slice(-4)})`;
            } else {
              valorAntigo = evento.detalhes.valorAntigo || "vazio";
              valorNovo = evento.detalhes.valorNovo || "vazio";
            }

            detalhesRenderizados = `<p class="history-detail">
            <strong>${campoFormatado}:</strong> 
            <span class="history-value-old">${valorAntigo}</span> 
            <span class="history-arrow"> &rarr; </span> 
            <span class="history-value-new">${valorNovo}</span>
          </p>`;
          } else if (evento.detalhes && evento.detalhes.mensagem) {
            detalhesRenderizados = `<p class="history-detail">${evento.detalhes.mensagem}</p>`;
          }

          historyHtml += `
          <li>
            <div class="history-summary">
              <strong>${dataFormatada}</strong> - [${evento.tipoEvento}] por <em>${evento.nomeUsuarioResponsavel}</em>
            </div>
            ${detalhesRenderizados}
          </li>
        `;
        });
        historyHtml += "</ul>";
        historyContainer.innerHTML = historyHtml;
      } else if (resultado.success) {
        historyContainer.innerHTML =
          "<p>Nenhum evento de histórico encontrado.</p>";
      } else {
        throw new Error(resultado.message);
      }

      historyButton.innerHTML = '<i class="fas fa-times"></i>';
      historyButton.title = "Ocultar Histórico";
    } catch (error) {
      console.error("Erro ao buscar histórico do consórcio:", error);
      historyContainer.innerHTML = `<p style="color: red;">Erro ao carregar histórico: ${error.message}</p>`;
    }
  }

  function lidarComBusca() {
    const termoBusca = inputBusca.value.toLowerCase().trim();
    const containerResultados = document.getElementById(
      "container-resultados-busca"
    );
    if (termoBusca.length < 3) {
      containerResultados.innerHTML = "";
      containerResultados.classList.add("hidden");
      return;
    }
    const resultados = [];
    const clientesAdicionados = new Set();
    listaCompletaDeClientes.forEach((cliente) => {
      const nomeCliente = (cliente.nome_completo || "").toLowerCase();
      const docCliente = (cliente.cpf_cnpj || "").replace(/\D/g, "");
      const termoBuscaSemMascara = termoBusca.replace(/\D/g, "");
      if (
        (nomeCliente.includes(termoBusca) ||
          (termoBuscaSemMascara &&
            docCliente.includes(termoBuscaSemMascara))) &&
        !clientesAdicionados.has(cliente.id)
      ) {
        resultados.push({
          ...cliente,
          matchInfo: `Principal: ${cliente.cpf_cnpj}`,
          matchType: "Cliente",
        });
        clientesAdicionados.add(cliente.id);
      }
    });
    containerResultados.innerHTML = "";
    if (resultados.length > 0) {
      resultados.forEach((res) => {
        containerResultados.innerHTML += `<div class="resultado-item" data-id="${res.id}"><strong>${res.nome_completo}</strong><small>${res.matchInfo}</small></div>`;
      });
      containerResultados.classList.remove("hidden");
    } else {
      containerResultados.innerHTML =
        '<div class="resultado-item">Nenhum resultado</div>';
      containerResultados.classList.remove("hidden");
    }
  }

  function handleSelectClientForTransfer(event) {
    const selectButton = event.target.closest(".btn-selecionar-transferencia");

    if (!selectButton) {
      return;
    }

    // Pega o ID do botão (que vem como texto)
    const newClientIdAsString = selectButton.dataset.id;

    // ===== INÍCIO DA CORREÇÃO =====
    // Converte o ID de texto para número antes de comparar
    const newClientIdAsNumber = parseInt(newClientIdAsString, 10);

    const selectedClient = listaCompletaDeClientes.find(
      (c) => c.id === newClientIdAsNumber // Agora compara número com número
    );
    // ===== FIM DA CORREÇÃO =====

    if (selectedClient) {
      // Guarda o ID no formulário para o envio
      formTransferConsortium.dataset.newClientId = newClientIdAsString;

      // Mostra a confirmação visual para o usuário
      const infoContainer = document.getElementById(
        "info-cliente-selecionado-transferencia"
      );
      infoContainer.textContent = `Novo titular selecionado: ${selectedClient.nome_completo}`;
      infoContainer.style.display = "block";

      // Destaca o item selecionado na lista
      document
        .querySelectorAll(".client-list-item.selected")
        .forEach((el) => el.classList.remove("selected"));
      selectButton.closest(".client-list-item").classList.add("selected");
    } else {
      // Adiciona um log de erro caso o cliente não seja encontrado (para futuras depurações)
      console.error(
        "Cliente não encontrado na lista com o ID:",
        newClientIdAsNumber
      );
    }
  }

  function mudarAba(abaAtiva) {
    tabPfButton.classList.toggle("active", abaAtiva === "pf");
    tabPjButton.classList.toggle("active", abaAtiva === "pj");
    contentPfPane.classList.toggle("active", abaAtiva === "pf");
    contentPjPane.classList.toggle("active", abaAtiva === "pj");
  }

  function mostrarViewTabela() {
    viewTabela.classList.remove("hidden");
    viewCadastro.classList.add("hidden");
    viewPerfil.classList.add("hidden");
  }

  function mostrarViewCadastro(cliente = null) {
    viewTabela.classList.add("hidden");
    viewCadastro.classList.remove("hidden");
    viewPerfil.classList.add("hidden");
    formCliente.reset();
    document.getElementById("lista-socios-container").innerHTML = "";
    if (iti) iti.setNumber("");
    if (mascaraCpfCnpj) mascaraCpfCnpj.value = "";

    if (cliente) {
      tituloFormulario.textContent = "Editar Cliente";
      clienteEmEdicaoId = cliente.id;
      preencherFormularioCliente(cliente);
    } else {
      tituloFormulario.textContent = "Cadastro de Novo Cliente";
      clienteEmEdicaoId = null;
    }
    atualizarInterfaceParaTipoPessoa();
  }

  async function mostrarViewPerfilCliente(clienteId) {
    try {
      perfilNomeCliente.textContent = "Carregando perfil...";
      perfilDadosContainer.innerHTML = "";
      perfilConsortiumCardsContainer.innerHTML = "";

      const usuariosPromise = carregarUsuariosParaSelect();

      // Busca os dados do cliente
      const resultadoCliente = await window.electronAPI.invoke(
        "clientes:get-by-id",
        clienteId
      );
      if (!resultadoCliente.success) {
        throw new Error(resultadoCliente.message);
      }
      const cliente = resultadoCliente.data;

      await usuariosPromise;

      clienteEmEdicaoId = clienteId;
      viewTabela.classList.add("hidden");
      viewCadastro.classList.add("hidden");
      viewPerfil.classList.remove("hidden");

      perfilNomeCliente.textContent = `Perfil de ${cliente.nome_completo}`;
      renderPerfilDetalhes(cliente);

      await carregarConsorciosDoCliente(clienteId);
      await carregarConsorciosTransferidos(clienteId);
    } catch (error) {
      console.error("Erro ao mostrar perfil do cliente:", error);
      mostrarNotificacao(
        "Não foi possível carregar o perfil do cliente.",
        "erro"
      );

      mostrarViewTabela();
    }
  }

  function renderTable(listaDeClientes, idDaTabela) {
    const tabelaAlvo = document.getElementById(idDaTabela);
    if (!tabelaAlvo) return;

    tabelaAlvo.innerHTML = "";
    if (!listaDeClientes || listaDeClientes.length === 0) {
      tabelaAlvo.innerHTML = `<tr><td colspan="6" style="text-align: center;">Nenhum cliente para exibir.</td></tr>`;
      return;
    }

    listaDeClientes.forEach((cliente) => {
      const numConsorcios = Array.isArray(cliente.consorcios)
        ? cliente.consorcios.length
        : 0;
      const linhaPrincipal = document.createElement("tr");
      linhaPrincipal.className = "clickable-row";
      linhaPrincipal.dataset.id = cliente.id;
      linhaPrincipal.innerHTML = `
            <td>${cliente.nome_completo || "N/A"}</td>
            <td>${cliente.cpf_cnpj || "N/A"}</td>
            <td>${cliente.telefone || "N/A"}</td>
            <td><span class="status-cliente ${cliente.statusCliente || "ativo"
        }">${cliente.statusCliente || "Ativo"}</span></td>
            <td style="text-align: center;">${numConsorcios}</td>
            <td class="acoes-tabela" style="text-align: center;">
                ${currentUserPermissions.includes("clientes_editar")
          ? `<button type="button" class="btn-card-icon btn-editar-cliente" title="Editar Cliente" data-id="${cliente.id}"><i class="fas fa-edit"></i></button>`
          : ""
        }
            </td>
        `;
      tabelaAlvo.appendChild(linhaPrincipal);

      if (
        cliente.estado_civil === "Casado(a)" &&
        cliente.conjuge_nome_completo
      ) {
        const linhaConjuge = document.createElement("tr");
        linhaConjuge.className = "conjuge-row";
        linhaConjuge.innerHTML = `
                  <td colspan="2"><i class="fas fa-user-friends"></i> <strong>Cônjuge:</strong> ${cliente.conjuge_nome_completo
          }</td>
                  <td>${cliente.conjuge_telefone || "N/A"}</td>
                  <td colspan="3">${cliente.conjuge_cpf || "N/A"}</td>
              `;
        tabelaAlvo.appendChild(linhaConjuge);
      }

      if (cliente.tipo_pessoa === "Juridica" && Array.isArray(cliente.socios)) {
        cliente.socios.forEach((socio) => {
          const linhaSocio = document.createElement("tr");
          linhaSocio.className = "socio-row";
          linhaSocio.innerHTML = `
                      <td colspan="2"><i class="fas fa-user-tie"></i> <strong>Sócio:</strong> ${socio.nome
            }</td>
                      <td>${socio.telefone || "N/A"}</td>
                      <td colspan="3">${socio.cpf || "N/A"}</td>
                  `;
          tabelaAlvo.appendChild(linhaSocio);
        });
      }
    });
  }

  function renderPerfilDetalhes(cliente) {
    const container = document.getElementById("perfil-dados-container");
    document.getElementById("select-status-cliente").value =
      cliente.statusCliente || "Ativo";
    if (!container) return;

    container.innerHTML = "";

    // Função auxiliar para formatar a data para o padrão brasileiro (DD/MM/AAAA)
    const formatarDataParaBR = (dataISO) => {
      if (!dataISO) return null;
      const data = new Date(dataISO);
      const dia = String(data.getUTCDate()).padStart(2, "0");
      const mes = String(data.getUTCMonth() + 1).padStart(2, "0"); // Mês no JS começa em 0
      const ano = data.getUTCFullYear();
      return `${dia}/${mes}/${ano}`;
    };

    let secaoPrincipalTitulo = "";
    let dadosParaExibir = {};

    if (cliente.tipo_pessoa === "Juridica") {
      secaoPrincipalTitulo =
        '<h3><i class="fas fa-building"></i> Dados Empresariais</h3>';
      dadosParaExibir = {
        "Razão Social": cliente.nome_completo,
        CNPJ: cliente.cpf_cnpj,
        Email: cliente.email,
        Telefone: cliente.telefone ? `${cliente.telefone}` : null,
        "Data de Fundação": formatarDataParaBR(cliente.data_nascimento),
      };
    } else {
      secaoPrincipalTitulo =
        '<h3><i class="fas fa-user-circle"></i> Dados Pessoais</h3>';
      dadosParaExibir = {
        Nome: cliente.nome_completo,
        CPF: cliente.cpf_cnpj,
        Email: cliente.email,
        Telefone: cliente.telefone ? `${cliente.telefone}` : null,
        "Data de Nascimento": formatarDataParaBR(cliente.data_nascimento),
        Profissão: cliente.profissao,
        "Estado Civil": cliente.estado_civil,
      };
    }

    let html = secaoPrincipalTitulo;
    for (const rotulo in dadosParaExibir) {
      if (dadosParaExibir[rotulo]) {
        html += `<p><strong>${rotulo}:</strong> ${dadosParaExibir[rotulo]}</p>`;
      }
    }

    const enderecoCompleto = [
      cliente.rua,
      cliente.numero,
      cliente.bairro,
      cliente.cep,
    ]
      .filter(Boolean)
      .join(", ");
    if (enderecoCompleto) {
      html += `<p><strong>Endereço:</strong> ${enderecoCompleto}</p>`;
    }

    container.innerHTML = html;

    // --- INÍCIO DA ALTERAÇÃO ---
    // Verifica se é casado e se tem dados do cônjuge para exibir
    if (cliente.estado_civil === "Casado(a)" && cliente.conjuge_nome_completo) {
      const dadosConjuge = {
        "Nome do Cônjuge": cliente.conjuge_nome_completo,
        "CPF do Cônjuge": cliente.conjuge_cpf,
        // Adicionamos a data de nascimento do cônjuge aqui
        "Data de Nascimento": formatarDataParaBR(
          cliente.conjuge_data_nascimento
        ),
        "Email do Cônjuge": cliente.conjuge_email,
        "Telefone do Cônjuge": cliente.conjuge_telefone
          ? `${cliente.conjuge_telefone}`
          : null,
      };
      let conjugeHtml =
        '<h3 style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;"><i class="fas fa-heart"></i> Dados do Cônjuge</h3>';
      for (const rotulo in dadosConjuge) {
        // Mostra o campo mesmo que o valor seja nulo, para consistência
        if (dadosConjuge[rotulo]) {
          conjugeHtml += `<p><strong>${rotulo}:</strong> ${dadosConjuge[rotulo]}</p>`;
        }
      }
      container.innerHTML += conjugeHtml;
    }
    // --- FIM DA ALTERAÇÃO ---

    if (
      cliente.tipo_pessoa === "Juridica" &&
      Array.isArray(cliente.socios) &&
      cliente.socios.length > 0
    ) {
      let sociosHtml =
        '<h3 style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee;"><i class="fas fa-building"></i> Sócios da Empresa</h3>';
      cliente.socios.forEach((socio, index) => {
        sociosHtml += `<div style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #f0f0f0;">`;
        sociosHtml += `<p><strong>Sócio ${index + 1}:</strong> ${socio.nome || "N/A"
          }</p>`;
        if (socio.data_nascimento) {
          const dataNasc = formatarDataParaBR(socio.data_nascimento);
          sociosHtml += `<p style="padding-left: 15px; font-size: 0.9em;"><strong>Data de Nasc.:</strong> ${dataNasc}</p>`;
        }
        if (socio.telefone) {
          const telefoneFormatado = String(socio.telefone).startsWith("+")
            ? socio.telefone
            : `${socio.telefone}`;
          sociosHtml += `<p style="padding-left: 15px; font-size: 0.9em;"><strong>Telefone:</strong> ${telefoneFormatado}</p>`;
        }
        if (socio.cpf) {
          sociosHtml += `<p style="padding-left: 15px; font-size: 0.9em;"><strong>CPF:</strong> ${socio.cpf}</p>`;
        }
        if (socio.email) {
          sociosHtml += `<p style="padding-left: 15px; font-size: 0.9em;"><strong>Email:</strong> ${socio.email}</p>`;
        }
        sociosHtml += `</div>`;
      });
      container.innerHTML += sociosHtml;
    }
  }

  function renderConsorcios(listaConsorcios) {
    renderConsortiumSummary(listaConsorcios);

    perfilConsortiumCardsContainer.innerHTML = "";
    if (!listaConsorcios || listaConsorcios.length === 0) {
      perfilConsortiumCardsContainer.innerHTML =
        '<p style="text-align:center;color:#888;">Nenhum consórcio encontrado.</p>';
      return;
    }

    listaConsorcios.forEach((consorcio) => {
      console.log("Dados do consórcio recebidos para o card:", consorcio);
      const nomeVendedor = consorcio.vendedorNome || "Não informado";

      let botaoContrato = "";
      if (consorcio.caminhoContratoPDF) {
        botaoContrato = `<button class="btn-ver-contrato-salvo" title="Visualizar Contrato" data-filename="${consorcio.caminhoContratoPDF}"><i class="fas fa-file-pdf"></i></button>`;
      }

      perfilConsortiumCardsContainer.innerHTML += `
    <div class="consortium-card" data-consortium-id="${consorcio.id}">
        <div><strong>Administradora:</strong> ${consorcio.administradora || "N/A"
        }</div>
        <div><strong>Grupo:</strong> ${consorcio.grupo || "N/A"}</div>
        <div><strong>Cota:</strong> ${consorcio.cota || "N/A"}</div>
        <div><strong>Status:</strong> ${consorcio.status || "N/A"}</div>
        <div><strong>Nº Contrato:</strong> ${consorcio.numeroContrato || "N/A"
        }</div>
        <div><strong>Crédito:</strong> R$ ${new Intl.NumberFormat("pt-BR", {
          style: "decimal",
          minimumFractionDigits: 2,
        }).format(consorcio.creditoContratado || 0)}</div>
        <div><strong>Vendido por:</strong> ${nomeVendedor}</div> 
        <div class="actions-group" style="margin-top:8px;display:flex;gap:8px;">
            
            ${currentUserPermissions.includes("clientes_gerenciar_consorcios")
          ? `
                <button class="btn-edit-consortium" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-delete-consortium" title="Excluir"><i class="fas fa-trash"></i></button>
              `
          : ""
        }

            ${currentUserPermissions.includes("clientes_transferir_consorcios")
          ? `
                <button class="btn-transfer-consortium" title="Transferir"><i class="fas fa-exchange-alt"></i></button>
              `
          : ""
        }

            <button class="btn-ver-historico" title="Ver Histórico"><i class="fas fa-history"></i></button>

            ${botaoContrato}
        </div>

        <div class="consortium-history-container hidden"></div>
    </div>`;
    });
  }

  function renderConsortiumSummary(listaConsorcios) {
    const container = document.getElementById("consortium-summary-container");
    if (!container) return;

    let ativas = 0;
    let contempladas = 0;
    let canceladas = 0;
    let transferidas = 0;

    if (Array.isArray(listaConsorcios)) {
      listaConsorcios.forEach((consorcio) => {
        switch (consorcio.status) {
          case "ativa":
            ativas++;
            break;
          case "contemplada":
            contempladas++;
            break;
          case "cancelada":
            canceladas++;
            break;
          case "transferida":
            transferidas++;
            break;
        }
      });
    }

    // 3. Monta o HTML dos cards de resumo com os totais calculados
    container.innerHTML = `
        <div class="summary-item ativa">
            <span class="count">${ativas}</span>
            <span class="label">Ativas</span>
        </div>
        <div class="summary-item contemplada">
            <span class="count">${contempladas}</span>
            <span class="label">Contempladas</span>
        </div>
        <div class="summary-item cancelada">
            <span class="count">${canceladas}</span>
            <span class="label">Canceladas</span>
        </div>
        <div class="summary-item transferida">
            <span class="count">${transferidas}</span>
            <span class="label">Transferidas</span>
        </div>
    `;
  }

  async function carregarConsorciosTransferidos(clienteId) {
    try {
      const resultado = await window.electronAPI.invoke(
        "consorcios:get-transferidos",
        clienteId
      );

      // =================================================================
      // LINHA DE DEPURAÇÃO ADICIONADA PARA VERMOS OS DADOS
      console.log("DADOS DO HISTÓRICO RECEBIDOS DO BACKEND:", resultado);
      // =================================================================

      if (resultado.success) {
        renderConsorciosTransferidos(resultado.data || []);
      } else {
        renderConsorciosTransferidos([]);
      }
    } catch (error) {
      console.error("Erro ao buscar consórcios transferidos:", error);
      renderConsorciosTransferidos([]);
    }
  }

  async function openPdfModal(fileName) {
    const modalBackdrop = document.getElementById("pdf-viewer-modal-backdrop");
    const pdfObject = document.getElementById("pdf-viewer-object");
    const downloadButton = document.getElementById(
      "pdf-viewer-download-button"
    );
    const fallbackLink = document.getElementById("pdf-fallback-download-link");

    // Limpa o visualizador
    pdfObject.data = "";
    downloadButton.dataset.fileName = "";
    downloadButton.dataset.base64 = "";
    fallbackLink.href = "#";

    if (modalBackdrop) {
      modalBackdrop.classList.remove('hidden');
      modalBackdrop.classList.add('is-visible');
    }

    try {
      const resultado = await window.electronAPI.invoke(
        "contratos:get-pdf-data",
        fileName
      );

      if (resultado.success) {
        const base64Data = resultado.base64Data;
        const dataUrl = `data:application/pdf;base64,${base64Data}`;
        pdfObject.data = dataUrl;
        downloadButton.dataset.fileName = fileName;
        downloadButton.dataset.base64 = base64Data;
        fallbackLink.href = dataUrl;
        fallbackLink.download = fileName;
      } else {
        mostrarNotificacao(resultado.message, "erro");
        closePdfModal();
      }
    } catch (error) {
      mostrarNotificacao("Erro ao carregar o arquivo PDF.", "erro");
      closePdfModal();
    }
  }

  function closePdfModal() {
    const modalBackdrop = document.getElementById("pdf-viewer-modal-backdrop");
    if (modalBackdrop) {
      modalBackdrop.classList.remove('is-visible');
    }
    document.getElementById("pdf-viewer-object").data = "";
  }

  function downloadCurrentPdf() {
    const downloadButton = document.getElementById(
      "pdf-viewer-download-button"
    );
    const fileName = downloadButton.dataset.fileName;
    const base64 = downloadButton.dataset.base64;

    if (!fileName || !base64) {
      mostrarNotificacao("Não há dados de PDF para baixar.", "erro");
      return;
    }

    const dataUrl = `data:application/pdf;base64,${base64}`;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function renderConsorciosTransferidos(listaTransferidos) {
    // 1. Atualiza o contador no card de resumo "Transferidas"
    const summaryContainer = document.getElementById(
      "consortium-summary-container"
    );
    if (summaryContainer) {
      const transferCountElement = summaryContainer.querySelector(
        ".summary-item.transferida .count"
      );
      if (transferCountElement) {
        transferCountElement.textContent = listaTransferidos.length;
      }
    }

    // 2. Renderiza a lista de cards DENTRO DO MODAL
    const container = document.getElementById("transfer-history-modal-body");
    if (!container) return;

    if (listaTransferidos.length === 0) {
      container.innerHTML =
        '<p style="text-align:center;color:#888;">Nenhum consórcio foi transferido por este cliente.</p>';
      return;
    }

    let html = "";
    listaTransferidos.forEach((item) => {
      const dataFormatada = new Date(item.dataTransferencia).toLocaleDateString(
        "pt-BR"
      );

      // ===== INÍCIO DA CORREÇÃO =====
      // Usamos o operador 'optional chaining' (?.) para acessar 'nome' de forma segura.
      // Se 'item.transferidoPara' não existir, ele não vai quebrar e usará o texto alternativo.
      const nomeDestinatario =
        item.transferidoPara?.nome || "Destinatário Inválido";
      const infoConsorcio = item.consorcio || {}; // Garante que 'infoConsorcio' seja um objeto
      // ===== FIM DA CORREÇÃO =====

      html += `
    <div class="consortium-card transferred">
      <div><strong>Administradora:</strong> ${infoConsorcio.administradora || "N/A"
        }</div>
      <div><strong>Grupo/Cota:</strong> ${infoConsorcio.grupo || "N/A"} / ${infoConsorcio.cota || "N/A"
        }</div>
      <div class="transfer-info">
        <i class="fas fa-arrow-right"></i>
        <span>Transferido para <strong>${nomeDestinatario}</strong> em ${dataFormatada}</span>
      </div>
    </div>
  `;
    });

    container.innerHTML = html;
  }

  function preencherFormularioCliente(cliente) {
    console.log("Dados recebidos para preencher o formulário:", cliente);
    if (!cliente) {
      console.error("Tentativa de preencher o formulário com um cliente nulo.");
      return;
    }
    const get = (valor) => (valor === null || valor === undefined ? "" : valor);

    // Função auxiliar para formatar a data
    const formatarDataParaBR = (dataISO) => {
      if (!dataISO) return "";
      const data = new Date(dataISO);
      const dia = String(data.getUTCDate()).padStart(2, "0");
      const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
      const ano = data.getUTCFullYear();
      return `${dia}/${mes}/${ano}`;
    };

    if (cliente.tipo_pessoa === "Juridica") {
      document.getElementById("tipoPessoaJuridica").checked = true;
    } else {
      document.getElementById("tipoPessoaFisica").checked = true;
    }

    document.getElementById("nome_completo").value = get(cliente.nome_completo);
    document.getElementById("email").value = get(cliente.email);
    document.getElementById("profissao").value = get(cliente.profissao);
    document.getElementById("estado_civil").value = get(cliente.estado_civil);

    if (mascaraCpfCnpj) {
      mascaraCpfCnpj.value = get(cliente.cpf_cnpj);
    }
    if (iti) {
      iti.setNumber(get(cliente.telefone));
    }

    // --- CORREÇÃO APLICADA AQUI ---
    document.getElementById("data_nascimento").value = formatarDataParaBR(
      get(cliente.data_nascimento)
    );

    document.getElementById("cep").value = get(cliente.cep);
    document.getElementById("rua").value = get(cliente.rua);
    document.getElementById("numero").value = get(cliente.numero);
    document.getElementById("bairro").value = get(cliente.bairro);

    document.getElementById("conjuge_nome_completo").value = get(
      cliente.conjuge_nome_completo
    );
    document.getElementById("conjuge_email").value = get(cliente.conjuge_email);

    if (document.getElementById("conjuge_cpf")) {
      document.getElementById("conjuge_cpf").value = get(cliente.conjuge_cpf);
    }
    if (itiConjuge) {
      itiConjuge.setNumber(get(cliente.conjuge_telefone));
    }

    // --- CORREÇÃO APLICADA AQUI ---
    document.getElementById("conjuge_data_nascimento").value =
      formatarDataParaBR(get(cliente.conjuge_data_nascimento));

    const containerSocios = document.getElementById("lista-socios-container");
    containerSocios.innerHTML = "";
    if (Array.isArray(cliente.socios) && cliente.socios.length > 0) {
      cliente.socios.forEach((socio) => {
        adicionarCampoDeSocio(socio);
      });
    }
    atualizarInterfaceParaTipoPessoa();
  }

  function atualizarInterfaceParaTipoPessoa() {
    const tipoSelecionado = document.querySelector(
      'input[name="tipo_pessoa"]:checked'
    ).value;
    const secaoConjuge = document.getElementById("secao-conjuge");
    const secaoSocios = document.getElementById("secao-socios");
    const labelNome = document.getElementById("label-nome");
    const labelCpfCnpj = document.getElementById("label-cpf-cnpj");
    const labelDataNascimento = document.getElementById(
      "label-data-nascimento"
    );
    const groupProfissao = document.getElementById("profissao").parentElement;
    const groupEstadoCivil =
      document.getElementById("estado_civil").parentElement;

    if (tipoSelecionado === "Juridica") {
      groupProfissao.classList.add("hidden");
      groupEstadoCivil.classList.add("hidden");
      secaoConjuge.classList.add("hidden");
      secaoSocios.classList.remove("hidden");
      labelNome.textContent = "Razão Social";
      labelCpfCnpj.textContent = "CNPJ";
      labelDataNascimento.textContent = "Data de Fundação";
    } else {
      // Lógica para Pessoa Física
      groupProfissao.classList.remove("hidden");
      groupEstadoCivil.classList.remove("hidden");
      secaoSocios.classList.add("hidden");
      labelNome.textContent = "Nome Completo";
      labelCpfCnpj.textContent = "CPF";
      labelDataNascimento.textContent = "Data de Nascimento";

      // --- CORREÇÃO APLICADA AQUI ---
      // Pega o select de estado civil
      const estadoCivilSelect = document.getElementById("estado_civil");
      // Verifica o valor selecionado e mostra/esconde a seção do cônjuge
      if (estadoCivilSelect.value === "Casado(a)") {
        secaoConjuge.classList.remove("hidden");
      } else {
        secaoConjuge.classList.add("hidden");
      }
    }
  }

  function openTransferHistoryModal() {
    const modalBackdrop = document.getElementById("transfer-history-modal-backdrop");

    if (!clienteEmEdicaoId) {
      console.error("Tentativa de abrir o histórico de transferências sem um cliente selecionado.");
      mostrarNotificacao("Erro: Nenhum cliente está sendo visualizado.", "erro");
      return;
    }

    if (modalBackdrop) {
      console.log(`Abrindo histórico de transferências para o cliente ID: ${clienteEmEdicaoId}`);

      modalBackdrop.classList.remove('hidden');
      modalBackdrop.classList.add('is-visible');

      carregarConsorciosTransferidos(clienteEmEdicaoId);
    } else {
      console.error("Elemento do modal de histórico de transferências não encontrado no DOM!");
    }
  }

  function openConsortiumModal(consorcioParaEditar = null) {
    // 1. Reseta o formulário para um estado limpo
    consortiumForm.reset();
    if (mascaraCredito) mascaraCredito.value = "";

    // Busca todos os elementos necessários para o campo de upload de PDF
    const infoContratoAntigo = document.getElementById("info-contrato-antigo");
    const inputContratoPDF = document.getElementById("consortium-contrato-pdf");
    const labelContratoPDF = document.querySelector(
      'label[for="consortium-contrato-pdf"]'
    );
    const labelSpan = labelContratoPDF
      ? labelContratoPDF.querySelector("span")
      : null;

    // 2. Limpa e reseta o estado do campo de upload
    if (infoContratoAntigo) infoContratoAntigo.innerHTML = "";
    if (inputContratoPDF) inputContratoPDF.value = "";
    if (labelSpan) labelSpan.textContent = "Escolher arquivo...";
    if (labelContratoPDF) labelContratoPDF.classList.remove("disabled");
    if (inputContratoPDF) inputContratoPDF.disabled = false;

    // 3. Verifica se está em modo de edição ou criação
    if (consorcioParaEditar) {
      // MODO EDIÇÃO
      consortiumModalTitle.textContent = "Editar Consórcio";
      consortiumForm.dataset.editingId = consorcioParaEditar.id;

      // Preenche todos os campos do formulário com os dados do consórcio
      inputAdministradora.value = consorcioParaEditar.administradora || "";
      inputStatus.value = consorcioParaEditar.status || "ativa";
      inputMeses.value = consorcioParaEditar.duracaoMeses || "";
      inputGrupo.value = consorcioParaEditar.grupo || "";
      inputCota.value = consorcioParaEditar.cota || "";

      if (mascaraCredito) {
        const valorDoBanco = consorcioParaEditar.creditoContratado || "0";
        const valorNumerico = parseFloat(valorDoBanco);
        mascaraCredito.typedValue = valorNumerico;
      }

      if (consorcioParaEditar.dataInicio) {
        const data = new Date(consorcioParaEditar.dataInicio);
        const dia = String(data.getUTCDate()).padStart(2, "0");
        const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
        const ano = data.getUTCFullYear();
        inputDataInicio.value = `${dia}/${mes}/${ano}`;
      }

      inputVendedor.value = consorcioParaEditar.usuarioResponsavelId || "";
      document.getElementById("consortium-numero-contrato").value =
        consorcioParaEditar.numeroContrato || "";

      // Lógica para lidar com o contrato PDF já existente
      if (consorcioParaEditar.caminhoContratoPDF) {
        if (labelContratoPDF) labelContratoPDF.classList.add("disabled");
        if (inputContratoPDF) inputContratoPDF.disabled = true;
        if (labelSpan) labelSpan.textContent = "Contrato Anexado";

        const nomeAmigavel = consorcioParaEditar.caminhoContratoPDF
          .split("-")
          .slice(1)
          .join("-");
        infoContratoAntigo.innerHTML = `
        <div class="contrato-atual-info">
          <strong>${nomeAmigavel}</strong>
          <button type="button" class="btn-ver-contrato-salvo" title="Visualizar" data-filename="${consorcioParaEditar.caminhoContratoPDF}"><i class="fas fa-eye"></i></button>
          <button type="button" class="btn-remover-contrato" title="Remover" data-consortium-id="${consorcioParaEditar.id}">&times;</button>
        </div>
      `;
      }
    } else {
      // MODO CRIAÇÃO
      consortiumModalTitle.textContent = "Adicionar Novo Consórcio";
      delete consortiumForm.dataset.editingId;
    }

    // 4. Exibe o modal (lógica corrigida)
    if (consortiumModalBackdrop) {
      consortiumModalBackdrop.classList.remove('hidden');
      consortiumModalBackdrop.classList.add('is-visible');
    }
  }








  async function handleDeleteContract(consortiumId) {
    const confirmou = await mostrarConfirmacao(
      "Tem certeza que deseja remover o contrato deste consórcio? Esta ação não pode ser desfeita."
    );

    if (confirmou) {
      try {
        const resultado = await window.electronAPI.invoke(
          "consorcios:delete-contract",
          consortiumId
        );
        if (!resultado.success) {
          throw new Error(resultado.message);
        }
        mostrarNotificacao("Contrato removido com sucesso!", "sucesso");

        // --- ATUALIZAÇÃO DA INTERFACE ---
        const infoContratoAntigo = document.getElementById(
          "info-contrato-antigo"
        );
        if (infoContratoAntigo) {
          infoContratoAntigo.innerHTML = "";
        }

        // Reativa o botão de upload
        const inputContratoPDF = document.getElementById(
          "consortium-contrato-pdf"
        );
        const labelContratoPDF = document.querySelector(
          'label[for="consortium-contrato-pdf"]'
        );
        if (labelContratoPDF) labelContratoPDF.classList.remove("disabled");
        if (inputContratoPDF) inputContratoPDF.disabled = false;

        await carregarConsorciosDoCliente(clienteEmEdicaoId);
      } catch (error) {
        mostrarNotificacao(
          `Erro ao remover contrato: ${error.message}`,
          "erro"
        );
      }
    }
  }

  function closeConsortiumModal() {
    if (consortiumModalBackdrop) {
      consortiumModalBackdrop.classList.remove('is-visible');
    }
  }

  function openTransferModal(consorcioParaTransferir) {
    if (!consorcioParaTransferir) return;

    transferConsortiumInfo.textContent = `Grupo ${consorcioParaTransferir.grupo}, Cota ${consorcioParaTransferir.cota}`;
    formTransferConsortium.dataset.consortiumId = consorcioParaTransferir.id;
    delete formTransferConsortium.dataset.newClientId;
    transferClientSearch.value = "";
    document.getElementById(
      "info-cliente-selecionado-transferencia"
    ).style.display = "none";

    const outrosClientes = listaCompletaDeClientes.filter(
      (cliente) => cliente.id !== clienteEmEdicaoId
    );
    renderTransferClientList(outrosClientes);

    if (transferModalBackdrop) {
      transferModalBackdrop.classList.remove('hidden');
      transferModalBackdrop.classList.add('is-visible');
    }
  }

  function closeTransferModal() {
    if (transferModalBackdrop) {
      transferModalBackdrop.classList.remove('is-visible');
    }
  }

  function renderTransferClientList(clientes) {
    const container = document.getElementById("transfer-client-list");
    container.innerHTML = "";
    if (clientes.length === 0) {
      container.innerHTML = "<p>Nenhum outro cliente encontrado.</p>";
      return;
    }
    clientes.forEach((cliente) => {
      container.innerHTML += `
                <div class="client-list-item">
                    <div>
                        <div class="client-name">${cliente.nome_completo}</div>
                        <div class="client-doc">${cliente.cpf_cnpj}</div>
                    </div>
                    <button type="button" class="btn-selecionar-transferencia" data-id="${cliente.id}">Selecionar</button>
                </div>`;
    });
  }

  function mostrarConfirmacao(mensagem) {
    return new Promise((resolve) => {
      confirmDeleteMessage.textContent = mensagem;

      if (confirmDeleteModalBackdrop) {
        confirmDeleteModalBackdrop.classList.remove('hidden');
        confirmDeleteModalBackdrop.classList.add('is-visible');
      }

      const onConfirm = () => resolve(true);
      const onCancel = () => resolve(false);

      btnConfirmDelete.addEventListener("click", onConfirm, { once: true });
      btnCancelDelete.addEventListener("click", onCancel, { once: true });

    }).finally(() => {
      if (confirmDeleteModalBackdrop) {
        confirmDeleteModalBackdrop.classList.remove('is-visible');
      }
    });
  }

  function mostrarNotificacao(mensagem, tipo = "sucesso") {
    const container = document.getElementById("container-de-notificacoes");
    if (!container) {
      console.error("Contêiner de notificações não encontrado!", mensagem);
      return;
    }

    const notificacao = document.createElement("div");
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;

    container.appendChild(notificacao);

    setTimeout(() => {
      notificacao.classList.add("visivel");
    }, 10);

    setTimeout(() => {
      notificacao.classList.remove("visivel");
      notificacao.addEventListener("transitionend", () => {
        notificacao.remove();
      });
    }, 3000);
  }
  async function handleStatusChange(event) {
    const novoStatus = event.target.value;
    const idDoCliente = clienteEmEdicaoId;

    if (!idDoCliente) {
      console.error(
        "Não foi possível encontrar o ID do cliente para atualizar o status."
      );
      return;
    }

    try {
      const resultado = await window.electronAPI.invoke("clientes:update", {
        id: idDoCliente,
        dados: { statusCliente: novoStatus },
      });

      if (resultado.success) {
        mostrarNotificacao(
          "Status do cliente atualizado com sucesso!",
          "sucesso"
        );

        await mostrarViewPerfilCliente(idDoCliente);
      } else {
        throw new Error(resultado.message);
      }
    } catch (error) {
      mostrarNotificacao(
        `Erro ao atualizar o status: ${error.message}`,
        "erro"
      );
    }
  }

  function adicionarCampoDeSocio(socio = null) {
    const containerSocios = document.getElementById("lista-socios-container");

    const socioIdUnico = `socio-telefone-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    // --- INÍCIO DA CORREÇÃO ---
    // Converte a data do formato do banco (AAAA-MM-DD) para o formato brasileiro (DD/MM/AAAA)
    let dataNascimentoSocio = "";
    if (socio?.data_nascimento) {
      // new Date() interpreta a data do banco como UTC, então usamos os métodos UTC para evitar problemas de fuso horário
      const data = new Date(socio.data_nascimento);
      const dia = String(data.getUTCDate()).padStart(2, "0");
      const mes = String(data.getUTCMonth() + 1).padStart(2, "0"); // Mês no JS começa em 0
      const ano = data.getUTCFullYear();
      dataNascimentoSocio = `${dia}/${mes}/${ano}`;
    }
    // --- FIM DA CORREÇÃO ---

    const novoSocioHTML = `
  <div class="socio-item-card">
    <div class="form-grid">
      <div class="form-group span-2">
        <label>Nome do Sócio</label>
        <input type="text" name="socio_nome[]" required value="${socio?.nome || ""
      }">
      </div>
      <div class="form-group">
        <label>CPF do Sócio</label>
        <input type="text" name="socio_cpf[]" class="socio-cpf" required value="${socio?.cpf || ""
      }">
      </div>
      <div class="form-group">
        <label>Data de Nascimento</label>
        <input type="text" name="socio_data_nascimento[]" value="${dataNascimentoSocio}" placeholder="DD/MM/AAAA">
      </div>
      <div class="form-group span-2">
        <label>E-mail</label>
        <input type="email" name="socio_email[]" value="${socio?.email || ""}">
      </div>
      <div class="form-group">
        <label>Telefone</label>
        <input type="tel" name="socio_telefone[]" id="${socioIdUnico}" class="socio-telefone">
      </div>
    </div>
    <button type="button" class="btn-remover-socio" title="Remover Sócio">&times;</button>
  </div>`;

    containerSocios.insertAdjacentHTML("beforeend", novoSocioHTML);

    const novoCard = containerSocios.lastElementChild;
    const campoCpfSocio = novoCard.querySelector(".socio-cpf");
    const campoTelefoneSocio = novoCard.querySelector(`#${socioIdUnico}`);
    const campoDataNascSocio = novoCard.querySelector(
      'input[name="socio_data_nascimento[]"]'
    );

    // Aplica máscara de data
    if (campoDataNascSocio) {
      IMask(campoDataNascSocio, { mask: "00/00/0000" });
    }

    // Aplica máscara de CPF
    if (campoCpfSocio) {
      IMask(campoCpfSocio, { mask: "000.000.000-00" });
    }

    // Aplica máscara de telefone e preenche o valor
    if (campoTelefoneSocio) {
      const itiInstance = window.intlTelInput(campoTelefoneSocio, {
        initialCountry: "br",
        utilsScript:
          "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.13/js/utils.js",
        separateDialCode: true,
      });

      if (socio?.telefone) {
        itiInstance.setNumber(socio.telefone);
      }

      campoTelefoneSocio.iti = itiInstance;
    }
  }

  async function init() {
    await applyPagePermissions();

    document.querySelectorAll(".modal-backdrop").forEach((modal) => {
      if (modal) modal.classList.add("hidden");
    });

    setupMascaras();
    setupEventListeners();
    mostrarViewTabela();
    carregarClientes();
    carregarUsuariosParaSelect();
  }
  init();
}, 0);
