(function () {
  console.log("[Renderer Lances] Página de Gestão de Lances carregada.");

  // =================================================================================
  // ESTADO DA APLICAÇÃO (State)
  // =================================================================================
  const state = {
    todosOsGrupos: [],
    gruposFiltrados: [],
    paginaAtual: 1,
    itensPorPagina: 20,
    meuGraficoDeLances: null,
    grupoAbertoAtualmente: null,
    filtrosAtuais: {
      administradora: null,
      categoria: null,
      termoBusca: "",
    },
  };

  // =================================================================================
  // ELEMENTOS DO DOM (UI Elements)
  // =================================================================================
  const ui = {
    uploadTabButton: document.querySelector('[data-tab="upload"]'),
    searchTabButton: document.querySelector('[data-tab="search"]'),
    tabButtons: document.querySelectorAll(".tab-button"),
    tabPanels: document.querySelectorAll(".tab-panel"),
    analysisSection: document.getElementById("analysis-section"),
    summaryTableBody: document.getElementById("summary-table-body"),
    paginationContainer: document.getElementById("pagination-container"),
    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("search-input"),
    filtrosRapidosContainer: document.querySelector(".filtros-rapidos"),
    analysisGroupName: document.getElementById("analysis-group-name"),
    detailTableBody: document.getElementById("detail-table-body"),
    closeAnalysisButton: document.getElementById("close-analysis-button"),
    chartCanvas: document.getElementById("bids-chart"),
    btnAbrirDocsApi: document.getElementById("btnAbrirDocsApi"),
    btnAbrirJanelaUpload: document.getElementById("btnAbrirJanelaUpload"),
    radiosTipoHistorico: document.querySelectorAll('input[name="ver-dados"]'),
  };

  // =================================================================================
  // DADOS (Data Access) - [Funções de busca de dados que já ajustamos]
  // =================================================================================

  async function fetchTodosOsGrupos() {
    console.log("Buscando lista de grupos do backend real...");
    try {
      // 1. Chama a API do Electron
      const dados = await window.electronAPI.invoke('lances:get-sumario');

      // 2. O Main Process pode retornar um objeto de erro customizado
      if (dados && dados.success === false) {
        // Se for um objeto de erro, lança o erro para ser pego pelo catch.
        throw new Error(dados.message || "O backend retornou um erro desconhecido.");
      }

      // 3. Se não for um erro, 'dados' é o nosso array! Retorna ele.
      console.log("Dados recebidos com sucesso. Retornando para a inicialização da página.");
      return dados; // <-- A LINHA MAIS IMPORTANTE QUE FALTAVA

    } catch (error) {
      // 4. Se qualquer erro acontecer (seja da comunicação ou o que foi lançado acima)...
      console.error("Erro final ao buscar grupos:", error.message);

      // ...retorna um array vazio para que o resto da aplicação não quebre ao tentar
      // ler uma variável 'undefined'. A tabela simplesmente aparecerá vazia.
      return [];
    }
  }

  // =================================================================================
  // FUNÇÕES DE LÓGICA
  // =================================================================================

  function aplicarFiltros() {
    state.filtrosAtuais.termoBusca = ui.searchInput.value.toLowerCase();
    let tempGrupos = [...state.todosOsGrupos];

    if (state.filtrosAtuais.administradora) {
      tempGrupos = tempGrupos.filter(
        (g) => g.administradora === state.filtrosAtuais.administradora
      );
    }
    if (state.filtrosAtuais.categoria) {
      tempGrupos = tempGrupos.filter(
        (g) => g.categoria === state.filtrosAtuais.categoria
      );
    }
    if (state.filtrosAtuais.termoBusca) {
      tempGrupos = tempGrupos.filter((g) =>
        g.grupo.toLowerCase().includes(state.filtrosAtuais.termoBusca)
      );
    }

    state.gruposFiltrados = tempGrupos;
    state.paginaAtual = 1;
    atualizarExibicao();
  }

  function renderizarDetalhes(dadosHistorico) {
    if (
      !dadosHistorico ||
      !Array.isArray(dadosHistorico) ||
      dadosHistorico.length === 0
    ) {
      ui.detailTableBody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;">Nenhum histórico encontrado para este grupo.</td></tr>';
      if (state.meuGraficoDeLances) state.meuGraficoDeLances.destroy();
      return;
    }

    const dadosParaGrafico = prepararDadosParaGrafico(dadosHistorico);
    renderizarGrafico(dadosParaGrafico);

    ui.detailTableBody.innerHTML = "";
    dadosHistorico.sort(
      (a, b) => new Date(b.data_lance) - new Date(a.data_lance)
    );

    dadosHistorico.forEach((item) => {
      const row = document.createElement("tr");
      const dataFormatada = new Date(item.data_lance).toLocaleDateString(
        "pt-BR",
        { timeZone: "UTC" }
      );
      row.innerHTML = `
      <td>${dataFormatada}</td>
      <td>${(item.percentual_minimo || 0).toFixed(2)}%</td>
      <td>${(item.percentual_maximo || 0).toFixed(2)}%</td>
      <td>${item.qtd_contemplados || 0}</td>
    `;
      ui.detailTableBody.appendChild(row);
    });
  }

  async function buscarEExibirHistoricoRecente(grupo) {
    try {
      const accessToken = await window.electronAPI.invoke("get-access-token");
      const resultadoIPC = await window.electronAPI.invoke(
        "lances:get-historico",
        {
          token: accessToken,
          nomeGrupo: grupo.grupo,
        }
      );

      if (!resultadoIPC.success) {
        throw new Error(
          resultadoIPC.message || "Falha ao buscar histórico recente."
        );
      }

      const respostaAPI = resultadoIPC.data;
      if (respostaAPI.status === "sem_dados_recentes") {
        const dataFormatada = new Date(
          respostaAPI.ultimo_lance_em
        ).toLocaleDateString("pt-BR", { timeZone: "UTC" });
        ui.detailTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: #ffc107;">Nenhum lance nos últimos 6 meses. <br> Último lance registrado em: <strong>${dataFormatada}</strong></td></tr>`;
        if (state.meuGraficoDeLances) state.meuGraficoDeLances.destroy();
        return;
      }

      renderizarDetalhes(respostaAPI.data);
    } catch (error) {
      console.error("Erro ao buscar histórico recente:", error);
      ui.detailTableBody.innerHTML =
        '<tr><td colspan="4" style="color: red; text-align:center;">Erro ao carregar dados recentes.</td></tr>';
    }
  }

  async function buscarEExibirHistoricoCompleto(grupo) {
    try {
      const accessToken = await window.electronAPI.invoke("get-access-token");
      const resultadoIPC = await window.electronAPI.invoke(
        "lances:get-historico-completo",
        {
          token: accessToken,
          nomeGrupo: grupo.grupo,
        }
      );

      // A resposta aqui é o array direto, se a chamada falhar, o 'catch' pega.
      renderizarDetalhes(resultadoIPC);
    } catch (error) {
      console.error("Erro ao buscar histórico completo:", error);
      ui.detailTableBody.innerHTML =
        '<tr><td colspan="4" style="color: red; text-align:center;">Erro ao carregar histórico completo.</td></tr>';
    }
  }

  function prepararDadosParaGrafico(dadosHistorico) {
    dadosHistorico.sort(
      (a, b) => new Date(a.data_lance) - new Date(b.data_lance)
    );
    const labels = dadosHistorico.map((item) =>
      new Date(item.data_lance).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      })
    );
    const dadosLanceMinimo = dadosHistorico.map((item) =>
      item.percentual_minimo.toFixed(2)
    );
    const dadosLanceMaximo = dadosHistorico.map((item) =>
      item.percentual_maximo.toFixed(2)
    );

    const dataForChart = {
      labels,
      datasets: [
        {
          label: "Lance Mínimo (%)",
          data: dadosLanceMinimo,
          borderColor: "#007bff",
          fill: true,
          tension: 0.4,
        },
        {
          label: "Lance Máximo (%)",
          data: dadosLanceMaximo,
          borderColor: "#28a745",
          fill: true,
          tension: 0.4,
        },
      ],
    };

    const ctx = ui.chartCanvas.getContext("2d");
    const gradienteMin = ctx.createLinearGradient(0, 0, 0, 300);
    gradienteMin.addColorStop(0, "rgba(0, 123, 255, 0.4)");
    gradienteMin.addColorStop(1, "rgba(0, 123, 255, 0)");
    dataForChart.datasets[0].backgroundColor = gradienteMin;

    const gradienteMax = ctx.createLinearGradient(0, 0, 0, 300);
    gradienteMax.addColorStop(0, "rgba(40, 167, 69, 0.4)");
    gradienteMax.addColorStop(1, "rgba(40, 167, 69, 0)");
    dataForChart.datasets[1].backgroundColor = gradienteMax;

    return dataForChart;
  }

  async function handleUploadSubmit(event) {
    event.preventDefault();

    const arquivo = ui.fileInput.files[0];
    const administradora = new FormData(ui.uploadForm).get("administradora");

    ui.uploadResponse.textContent = "Enviando, por favor aguarde...";

    if (!arquivo) {
      ui.uploadResponse.textContent = "Erro: Por favor, selecione um arquivo.";
      return;
    }

    if (!administradora) {
      ui.uploadResponse.textContent =
        "Erro: Por favor, selecione uma administradora.";
      return;
    }

    const activeUrl = await window.electronAPI.invoke("get-active-backend-url");
    if (!activeUrl) {
      ui.uploadResponse.textContent =
        "Erro crítico: URL do backend não foi encontrada.";
      return;
    }

    const accessToken = await window.electronAPI.invoke("get-access-token");
    if (!accessToken) {
      ui.uploadResponse.textContent =
        "Erro: Usuário não autenticado. Faça o login novamente.";
      return;
    }

    const formData = new FormData();
    formData.append("planilha", arquivo);

    try {
      const finalUrl = `${activeUrl}/lances/upload/${administradora}`;
      console.log(`[Frontend] Enviando para: ${finalUrl}`);

      const response = await fetch(finalUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const resultado = await response.json();

      if (response.ok) {
        ui.uploadResponse.textContent = `Sucesso! ${resultado.message}`;
        ui.uploadForm.reset();
      } else {
        ui.uploadResponse.textContent = `Erro do servidor: ${resultado.message}`;
      }
    } catch (error) {
      console.error("Erro ao enviar planilha:", error);
      ui.uploadResponse.textContent =
        "Falha de comunicação. A API está offline ou a rota não existe.";
    }
  }

  // =================================================================================
  // FUNÇÕES DE RENDERIZAÇÃO E UI
  // =================================================================================

  function atualizarExibicao() {
    const { paginaAtual, itensPorPagina, gruposFiltrados } = state;
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const gruposDaPagina = gruposFiltrados.slice(inicio, fim);

    renderizarTabela(gruposDaPagina);
    renderizarPaginacao();
    atualizarCabecalhosDinamicos(gruposDaPagina);
  }

  function renderizarTabela(grupos) {
    ui.summaryTableBody.innerHTML = "";
    if (grupos.length === 0) {
      ui.summaryTableBody.innerHTML =
        '<tr><td colspan="6" style="text-align:center;">Nenhum grupo encontrado.</td></tr>';
      return;
    }

    grupos.forEach((grupo) => {
      const row = document.createElement("tr");

      row.innerHTML = `
            <td>${grupo.grupo}</td>
            <td>${grupo.administradora}</td>
            <td>${grupo.categoria}</td>
            <td>${(grupo.lanceMinUltimoMes || 0).toFixed(2)}%</td>
            <td>${(grupo.lanceMaxUltimoMes || 0).toFixed(2)}%</td>
            <td>${grupo.qtdContempladosUltimoMes}</td>
        `;

      row.dataset.groupId = grupo.id;
      row.classList.add("clickable-row");

      ui.summaryTableBody.appendChild(row);
    });
  }

  function renderizarPaginacao() {
    ui.paginationContainer.innerHTML = "";
    const totalPaginas = Math.ceil(
      state.gruposFiltrados.length / state.itensPorPagina
    );
    const paginaAtual = state.paginaAtual;

    if (totalPaginas <= 1) {
      return;
    }

    // Função auxiliar para criar os botões
    const criarBotao = (iconeHtml, pagina, desabilitado = false) => {
      const btn = document.createElement("button");
      btn.innerHTML = iconeHtml;
      btn.disabled = desabilitado;
      btn.addEventListener("click", () => {
        state.paginaAtual = pagina;
        atualizarExibicao();
      });
      return btn;
    };

    // Botão 'Primeira Página' (<<)
    ui.paginationContainer.appendChild(
      criarBotao(
        '<i class="fas fa-angle-double-left"></i>',
        1,
        paginaAtual === 1
      )
    );

    // Botão 'Anterior' (<)
    ui.paginationContainer.appendChild(
      criarBotao(
        '<i class="fas fa-angle-left"></i>',
        paginaAtual - 1,
        paginaAtual === 1
      )
    );

    // Indicador de página com campo para digitar
    const pageIndicator = document.createElement("span");
    pageIndicator.className = "page-indicator";
    pageIndicator.innerHTML = `
        Página 
        <input type="number" class="page-input" value="${paginaAtual}" min="1" max="${totalPaginas}">
        de ${totalPaginas}
    `;
    ui.paginationContainer.appendChild(pageIndicator);

    // Adiciona o evento para pular para a página digitada
    const pageInput = ui.paginationContainer.querySelector(".page-input");
    pageInput.addEventListener("change", (e) => {
      let novaPagina = parseInt(e.target.value, 10);
      if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        state.paginaAtual = novaPagina;
        atualizarExibicao();
      } else {
        // Se o valor for inválido, volta para o valor da página atual
        e.target.value = paginaAtual;
      }
    });
    pageInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        e.target.blur(); // Dispara o evento 'change'
      }
    });

    // Botão 'Próxima' (>)
    ui.paginationContainer.appendChild(
      criarBotao(
        '<i class="fas fa-angle-right"></i>',
        paginaAtual + 1,
        paginaAtual === totalPaginas
      )
    );

    // Botão 'Última Página' (>>)
    ui.paginationContainer.appendChild(
      criarBotao(
        '<i class="fas fa-angle-double-right"></i>',
        totalPaginas,
        paginaAtual === totalPaginas
      )
    );
  }

  function atualizarCabecalhosDinamicos(grupos) {
    const nomeMes = grupos.length > 0 ? grupos[0].ultimoMesNome : "Últ. Mês";
    document.getElementById(
      "th-lance-min"
    ).textContent = `Lance Mín. (${nomeMes})`;
    document.getElementById(
      "th-lance-max"
    ).textContent = `Lance Máx. (${nomeMes})`;
    document.getElementById(
      "th-contemplados"
    ).textContent = `Contemplados (${nomeMes})`;
  }

  function renderizarGrafico(dadosParaGrafico) {
    if (state.meuGraficoDeLances) state.meuGraficoDeLances.destroy();

    state.meuGraficoDeLances = new Chart(ui.chartCanvas, {
      type: "line",
      data: dadosParaGrafico,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        elements: {
          line: { tension: 0.4, borderWidth: 2.5 },
          point: { radius: 0, hitRadius: 10, hoverRadius: 5 },
        },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { boxWidth: 12, padding: 20, font: { size: 14 } },
          },
          title: {
            display: true,
            text: "Evolução dos Lances",
            align: "start",
            font: { size: 18, weight: "bold" },
            padding: { bottom: 20 },
          },
          tooltip: {
            backgroundColor: "#fff",
            titleColor: "#333",
            bodyColor: "#555",
            borderColor: "#ddd",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${context.parsed.y}%`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: { callback: (value) => value + "%" },
            grid: { color: "#e9ecef" },
          },
          x: { grid: { display: false } },
        },
      },
    });
  }

  function abrirModalDeDetalhes(grupoSelecionado) {
    if (!grupoSelecionado || !grupoSelecionado.grupo) {
      console.error("Dados do grupo selecionado são inválidos!");
      return;
    }
    state.grupoAbertoAtualmente = grupoSelecionado;
    ui.analysisSection.classList.add("visible");
    ui.analysisGroupName.textContent = grupoSelecionado.grupo;
    ui.detailTableBody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;">Carregando dados...</td></tr>';
    if (state.meuGraficoDeLances) {
      state.meuGraficoDeLances.destroy();
      state.meuGraficoDeLances = null;
    }

    // Por padrão, ao abrir, sempre busca o histórico recente
    buscarEExibirHistoricoRecente(grupoSelecionado);
  }

  function fecharModalDeDetalhes() {
    ui.analysisSection.classList.remove("visible");
    state.grupoAbertoAtualmente = null;
  }

  function switchTab(tabId) {
    ui.tabPanels.forEach((panel) => panel.classList.remove("active"));
    ui.tabButtons.forEach((button) => button.classList.remove("active"));
    const activePanel = document.getElementById(`${tabId}-panel`);
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activePanel) activePanel.classList.add("active");
    if (activeButton) activeButton.classList.add("active");
  }

  // =================================================================================
  // EVENT LISTENERS
  // =================================================================================

  function bindEventListeners() {
    ui.tabButtons.forEach((button) => {
      button.addEventListener("click", () => switchTab(button.dataset.tab));
    });

    ui.summaryTableBody.addEventListener("click", (event) => {
      const clickedRow = event.target.closest("tr");
      if (clickedRow && clickedRow.dataset.groupId) {
        const grupoCompleto = state.gruposFiltrados.find(
          (g) => g.id === clickedRow.dataset.groupId
        );
        if (grupoCompleto) {
          abrirModalDeDetalhes(grupoCompleto);
        }
      }
    });

    if (ui.btnAbrirJanelaUpload) {
      ui.btnAbrirJanelaUpload.addEventListener("click", () => {
        window.electronAPI.invoke("abrir-janela-docs-api");
      });
    }

    if (ui.closeAnalysisButton) {
      ui.closeAnalysisButton.addEventListener("click", fecharModalDeDetalhes);
    }

    ui.radiosTipoHistorico.forEach((radio) => {
      radio.addEventListener("change", () => {
        if (state.grupoAbertoAtualmente) {
          console.log(
            `Tipo de histórico alterado para: ${radio.value}. Recarregando dados...`
          );
          // Chama a função certa baseado no novo valor
          if (radio.value === "completo") {
            buscarEExibirHistoricoCompleto(state.grupoAbertoAtualmente);
          } else {
            buscarEExibirHistoricoRecente(state.grupoAbertoAtualmente);
          }
        }
      });
    });

    ui.searchInput.addEventListener("input", aplicarFiltros);
    ui.searchForm.addEventListener("submit", (e) => e.preventDefault());

    ui.filtrosRapidosContainer.addEventListener("click", (event) => {
      const target = event.target.closest("button");
      if (!target) return;

      if (target.classList.contains("filtro-btn-limpar")) {
        ui.filtrosRapidosContainer
          .querySelectorAll(".filtro-btn.active")
          .forEach((btn) => btn.classList.remove("active"));
        state.filtrosAtuais.administradora = null;
        state.filtrosAtuais.categoria = null;
        ui.searchInput.value = "";
        aplicarFiltros();
        return;
      }

      if (target.classList.contains("filtro-btn")) {
        const isActive = target.classList.contains("active");
        ui.filtrosRapidosContainer
          .querySelectorAll(".filtro-btn.active")
          .forEach((btn) => btn.classList.remove("active"));

        if (isActive) {
          state.filtrosAtuais.administradora = null;
          state.filtrosAtuais.categoria = null;
        } else {
          target.classList.add("active");
          let [admin, categ] = target.dataset.valor.split("-");

          if (categ) {
            categ = categ.replace("ó", "o").replace("ú", "u");
          }
          state.filtrosAtuais.administradora = admin;
          state.filtrosAtuais.categoria = categ || null;
        }

        aplicarFiltros();
      }
    });
    if (ui.uploadForm) {
      ui.uploadForm.addEventListener("submit", handleUploadSubmit);
    }
  }

  // =================================================================================
  // INICIALIZAÇÃO
  // =================================================================================

  async function inicializarPagina() {
    bindEventListeners();

    try {
      const resultado = await window.electronAPI.invoke(
        "get-current-user-data"
      );
      if (resultado.success && resultado.user) {
        const permissoes = resultado.user.permissions || [];
        let primeiraAbaVisivel = null;

        if (permissoes.includes("gestao_lances")) {
          ui.searchTabButton.style.display = "inline-flex";
          primeiraAbaVisivel = "search";
        } else {
          ui.searchTabButton.style.display = "none";
        }

        if (resultado.user && resultado.user.role === "ADM") {
          ui.uploadTabButton.style.display = "inline-flex";
          if (!primeiraAbaVisivel) primeiraAbaVisivel = "upload";
        } else {
          ui.uploadTabButton.style.display = "none";
        }

        if (primeiraAbaVisivel) switchTab(primeiraAbaVisivel);

        state.todosOsGrupos = await fetchTodosOsGrupos();
        console.log("DADOS RECEBIDOS DO BACKEND:", state.todosOsGrupos);
        state.gruposFiltrados = [...state.todosOsGrupos];
        atualizarExibicao();
      } else {
        console.error("Falha ao obter dados do usuário:", resultado.message);
        ui.uploadTabButton.style.display = "none";
        ui.searchTabButton.style.display = "none";
      }
    } catch (error) {
      console.error("Erro crítico ao inicializar a página de lances:", error);
    }
  }

  inicializarPagina();
})();
