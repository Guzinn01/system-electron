// renderer_ponto.js

(function () {
  console.log("[Ponto] Script renderer_ponto.js carregado.");

  const elements = {
    clock: document.getElementById("relógio-em-tempo-real"),
    dataAtual: document.getElementById("data-atual"),
    statusMessage: document.getElementById("ponto-status-message"),
    btnEntrada: document.getElementById("btn-ponto-entrada"),
    btnAlmocoSaida: document.getElementById("btn-ponto-almoco-saida"),
    btnAlmocoVolta: document.getElementById("btn-ponto-almoco-volta"),
    btnSaida: document.getElementById("btn-ponto-saida"),
    btnGerarRelatorio: document.getElementById("btn-gerar-relatorio-ponto"),
    displayEntrada: document.getElementById("display-entrada"),
    displayAlmocoSaida: document.getElementById("display-almoco-saida"),
    displayAlmocoVolta: document.getElementById("display-almoco-volta"),
    displaySaida: document.getElementById("display-saida"),
  };

  let usuarioSendoVisualizado = null;

  function formatarHoraCompleta(dataString) {
    if (!dataString) return "--:--:--";
    return new Date(dataString).toLocaleTimeString("pt-BR");
  }

  function atualizarRelogio() {
    const agora = new Date();
    const horas = agora.getHours().toString().padStart(2, "0");
    const minutos = agora.getMinutes().toString().padStart(2, "0");
    const segundos = agora.getSeconds().toString().padStart(2, "0");
    if (elements.clock)
      elements.clock.textContent = `${horas}:${minutos}:${segundos}`;
    if (elements.dataAtual)
      elements.dataAtual.textContent = agora.toLocaleDateString("pt-BR");
  }

  function atualizarUI(pontoDoDia) {
    const formatarHora = (dataISO) =>
      dataISO ? new Date(dataISO).toLocaleTimeString("pt-BR") : "--:--:--";
    if (!pontoDoDia) {
      Object.values(elements).forEach((el) => {
        if (el && el.id && el.id.startsWith("display-"))
          el.textContent = "--:--:--";
      });
      elements.btnEntrada.disabled = false;
      elements.btnAlmocoSaida.disabled = true;
      elements.btnAlmocoVolta.disabled = true;
      elements.btnSaida.disabled = true;
      elements.btnGerarRelatorio.disabled = true;
      return;
    }
    elements.displayEntrada.textContent = formatarHora(pontoDoDia.entrada);
    elements.displayAlmocoSaida.textContent = formatarHora(
      pontoDoDia.almoco_saida
    );
    elements.displayAlmocoVolta.textContent = formatarHora(
      pontoDoDia.almoco_volta
    );
    elements.displaySaida.textContent = formatarHora(pontoDoDia.saida);
    elements.btnEntrada.disabled = !!pontoDoDia.entrada;
    elements.btnAlmocoSaida.disabled =
      !pontoDoDia.entrada || !!pontoDoDia.almoco_saida;
    elements.btnAlmocoVolta.disabled =
      !pontoDoDia.almoco_saida || !!pontoDoDia.almoco_volta;
    elements.btnSaida.disabled = !pontoDoDia.entrada || !!pontoDoDia.saida;
    elements.btnGerarRelatorio.disabled = !pontoDoDia.saida;
  }

  async function inicializarPaginaPonto() {
    try {
      console.log("Buscando dados do usuário para permissões...");
      const respostaUsuario = await window.electronAPI.invoke(
        "get-current-user-data"
      );

      if (respostaUsuario && respostaUsuario.success) {
        const usuario = respostaUsuario.user;

        if (
          usuario.permissions &&
          usuario.permissions.includes("gestao_usuarios")
        ) {
          console.log("Usuário é Admin. Revelando aba de gestão.");
          const abaAdmin = document.getElementById("gestao_equipe");
          if (abaAdmin) {
            abaAdmin.style.display = "block";
          }
        } else {
          console.log("Usuário comum. A aba de gestão permancerá oculta.");
        }
      }

      // 1. Primeiro, configuramos TODOS os "ouvintes" de eventos da página.
      setupEventListeners();

      // 2. DEPOIS, iniciamos as funções que rodam ao carregar a página.
      setInterval(atualizarRelogio, 1000); // Inicia o relógio que atualiza a cada segundo.
      atualizarRelogio(); // Chama uma vez para não esperar 1s para o relógio aparecer.
      inicializarPagina(); // Carrega os dados de ponto do dia (da primeira aba).
    } catch (error) {
      // Corrigi 'erro' para 'error' para consistência
      console.error("Erro fatal ao inicializar a página de ponto:", error);
    }
  }

  function ativarBotoesDeEdicao() {
    // Agora, em vez de procurar pela linha (tr), procuramos direto pela célula
    document.querySelectorAll(".celula-editavel").forEach((celula) => {
      celula.addEventListener("click", () => {
        const linha = celula.closest("tr"); // Encontramos o "pai" <tr> da célula clicada
        const pontoId = linha.dataset.pontoId;
        const tipo = celula.dataset.tipo;

        // A lógica agora é mais clara:
        if (tipo === "observacao") {
          // Se clicou na observação, pega o texto dela e abre o modal de observação
          const observacaoAtual = celula.textContent;
          abrirModalObservacao({ id: pontoId, observacao: observacaoAtual });
        } else {
          // Se clicou em um horário, pega a data da linha e o horário da célula
          const dataDaLinha =
            linha.querySelector("td:nth-child(1)").textContent;
          const horarioAtual = celula.textContent;

          // E abre o modal de edição de HORÁRIO (sem se preocupar com a observação)
          abrirModalDeEdicao({
            id: pontoId,
            tipo: tipo,
            data: dataDaLinha,
            hora: horarioAtual,
          });
        }
      });
    });
  }

  /**
   * Abre o modal de edição de HORÁRIO e preenche seus campos.
   * @param {object} dadosDoPonto - O objeto com os dados do ponto a ser editado.
   */
  function abrirModalDeEdicao(dadosDoPonto) {
    try {
      console.log(
        "Tentando abrir o modal de EDIÇÃO DE HORÁRIO com os dados:",
        dadosDoPonto
      );

      const modal = document.getElementById("modal-editar-ponto");
      if (!modal) {
        console.error(
          "ERRO CRÍTICO: O modal 'modal-editar-ponto' não foi encontrado no HTML."
        );
        return;
      }

      // Pega apenas os inputs necessários para editar o HORÁRIO
      const inputId = document.getElementById("edit-ponto-id");
      const inputTipo = document.getElementById("edit-ponto-tipo");
      const inputTimestamp = document.getElementById("edit-timestamp");

      // Preenche os campos com os dados recebidos da tabela
      inputId.value = dadosDoPonto.id;
      inputTipo.value = dadosDoPonto.tipo;

      // Lógica para formatar a data e a hora para o input 'datetime-local'
      if (dadosDoPonto.hora && dadosDoPonto.hora !== "---") {
        const [dia, mes, ano] = dadosDoPonto.data.split("/");
        const horaSemSegundos = dadosDoPonto.hora.substring(0, 5); // Pega apenas HH:MM

        // Formato final: AAAA-MM-DDTHH:MM
        inputTimestamp.value = `${ano}-${mes}-${dia}T${horaSemSegundos}`;
      } else {
        // Se o campo de hora estiver vazio na tabela, o input de data também fica vazio
        inputTimestamp.value = "";
      }

      // Mostra o modal na tela
      modal.classList.add("is-visible");
    } catch (error) {
      console.error(
        "Ocorreu um erro dentro da função abrirModalDeEdicao:",
        error
      );
      window.showNotification(
        "Ocorreu um erro ao abrir a janela de edição.",
        "erro"
      );
    }
  }

  function ativarModalObservacao() {
    const modal = document.getElementById("modal-editar-observacao");
    const form = document.getElementById("form-editar-observacao");
    const btnCancelar = document.getElementById("btn-cancelar-obs");

    if (!modal || !form || !btnCancelar) return;

    btnCancelar.addEventListener("click", () =>
      modal.classList.remove("is-visible")
    );

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const pontoId = document.getElementById("edit-obs-ponto-id").value;
      const observacao = document.getElementById("edit-observacao-texto").value;
      const btnSalvarObs = form.querySelector('button[type="submit"]');

      btnSalvarObs.textContent = "Salvando...";
      btnSalvarObs.disabled = true;

      try {
        // Chamada real para o main.js
        const resultado = await window.electronAPI.invoke(
          "admin:update-observacao",
          {
            pontoId,
            observacao,
          }
        );

        if (resultado.success) {
          window.showNotification("Observação salva com sucesso!", "sucesso");
          modal.classList.remove("is-visible");

          // Recarrega a tabela para mostrar a nova observação
          if (usuarioSendoVisualizado) {
            exibirDetalhesUsuario(
              usuarioSendoVisualizado.id,
              usuarioSendoVisualizado.name
            );
          }
        } else {
          window.showNotification(`Erro: ${resultado.message}`, "erro");
        }
      } catch (error) {
        window.showNotification(
          `Erro de comunicação: ${error.message}`,
          "erro"
        );
        console.error("Erro ao salvar observação:", error);
      } finally {
        btnSalvarObs.textContent = "Salvar Observação";
        btnSalvarObs.disabled = false;
      }
    });
  }

  function abrirModalObservacao(dados) {
    const modal = document.getElementById("modal-editar-observacao");
    if (!modal) return console.error("Modal de observação não encontrado!");

    document.getElementById("edit-obs-ponto-id").value = dados.id;
    document.getElementById("edit-observacao-texto").value =
      dados.observacao === "---" ? "" : dados.observacao;

    modal.classList.add("is-visible");
  }

  async function carregarDashboardMensal() {
    console.log("Iniciando carregamento do dashboard mensal...");
    const dashboardContainer = document.getElementById("dashboard-cards");
    const tabelaCorpo = document.getElementById("corpo-tabela-espelho");
    const filtroMesAno = document.getElementById("filtro-mes-ano");

    if (!filtroMesAno.value) {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = (hoje.getMonth() + 1).toString().padStart(2, "0");
      filtroMesAno.value = `${ano}-${mes}`;
    }

    dashboardContainer.innerHTML = "<p>Carregando dados do mês...</p>";
    tabelaCorpo.innerHTML = "";

    try {
      const periodoSelecionado = filtroMesAno.value;
      const resultado = await window.electronAPI.invoke(
        "ponto:get-registros-mensais",
        { periodo: periodoSelecionado }
      );

      if (resultado.success) {
        const registros = resultado.registros;
        if (!registros || registros.length === 0) {
          dashboardContainer.innerHTML =
            "<p>Nenhum registro encontrado para o período selecionado.</p>";
          tabelaCorpo.innerHTML =
            '<tr><td colspan="6">Nenhum registro.</td></tr>';
          return;
        }
        let totalMinutosMes = 0;
        let diasCompletos = 0;
        registros.forEach((registro) => {
          const minutosDoDia = calcularMinutosTrabalhadosNoDia(registro);
          totalMinutosMes += minutosDoDia;
          if (registro.entrada && registro.saida) {
            diasCompletos++;
          }
        });

        const totalMinutosEsperados = diasCompletos * 8 * 60; // 8 horas/dia
        const minutosExtras = totalMinutosMes - totalMinutosEsperados;

        const dadosParaCards = {
          trabalhadas: formatarMinutosParaHHMM(totalMinutosMes),
          extras: formatarMinutosParaHHMM(minutosExtras, true),
        };
        // ==========================================================

        // As chamadas finais, que agora funcionarão corretamente
        atualizarCardsDashboard(dadosParaCards);
        preencherTabela(registros);
      } else {
        console.error("Erro ao buscar dados do dashboard:", resultado.message);
        dashboardContainer.innerHTML = `<p style="color: red;">Erro: ${resultado.message}</p>`;
      }
    } catch (error) {
      console.error("Erro crítico ao chamar IPC para o dashboard:", error);
      dashboardContainer.innerHTML = `<p style="color: red;">Erro de comunicação.</p>`;
    }
  }

  /**
   * Recebe um array de registros de ponto e retorna o HTML de uma tabela de histórico.
   * @param {Array} registros - A lista de pontos do usuário.
   * @returns {string} - A string HTML da tabela completa.
   */
  function montarTabelaHistorico(registros) {
    if (!registros || registros.length === 0) {
      return "<p>Nenhum registro de ponto encontrado para este período.</p>";
    }

    // ✅ CORREÇÃO: Removemos as funções internas 'formatarHora' e 'formatarData'
    // para usar a função global 'formatarHoraCompleta' e a formatação de data correta.

    const formatarData = (dataStringISO) => {
      if (!dataStringISO) return "---";
      // Usar timeZone UTC aqui é correto para a DATA, para evitar que ela mude de dia.
      return new Date(dataStringISO).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      });
    };

    let tabelaHtml = `
      <table class="tabela-detalhes">
          <thead>
              <tr>
                  <th>Data</th>
                  <th>Entrada</th>
                  <th>Saída Almoço</th>
                  <th>Volta Almoço</th>
                  <th>Saída</th>
                  <th>Observação</th>
              </tr>
          </thead>
          <tbody>`;

    registros.forEach((reg) => {
      tabelaHtml += `
            <tr data-ponto-id="${reg.id}">
                <td>${formatarData(reg.data)}</td>
                <td class="celula-editavel" data-tipo="entrada">${formatarHoraCompleta(
                  reg.entrada
                )}</td>
                <td class="celula-editavel" data-tipo="almoco_saida">${formatarHoraCompleta(
                  reg.almoco_saida
                )}</td>
                <td class="celula-editavel" data-tipo="almoco_volta">${formatarHoraCompleta(
                  reg.almoco_volta
                )}</td>
                <td class="celula-editavel" data-tipo="saida">${formatarHoraCompleta(
                  reg.saida
                )}</td>
                <td class="celula-editavel" data-tipo="observacao">${
                  reg.observacao || "---"
                }</td>
            </tr>
        `;
    });

    tabelaHtml += `</tbody></table>`;
    return tabelaHtml;
  }

  /**
   * Busca o histórico de ponto de um usuário específico e exibe na tela em uma tabela.
   * @param {string} userId - O ID do usuário a ser consultado.
   * @param {string} userName - O nome do usuário para exibir no título.
   */
  async function exibirDetalhesUsuario(userId, userName) {
    usuarioSendoVisualizado = { id: userId, name: userName };
    const containerDetalhes = document.getElementById(
      "detalhes-usuario-container"
    );

    // 1. Cria a nova interface com filtro de mês e botões
    const hoje = new Date();
    const periodoAtual = `${hoje.getFullYear()}-${(hoje.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    containerDetalhes.innerHTML = `
        <h3>Histórico para ${userName}</h3>
        <div class="filtros-container" style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
            <label for="filtro-mes-ano-admin" style="font-weight: bold;">Selecionar Mês:</label>
            <input type="month" id="filtro-mes-ano-admin" value="${periodoAtual}" style="padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            <button id="btn-buscar-historico-admin" class="ponto-button" style="background-color: #007bff;">
                <i class="fas fa-search"></i> Buscar
            </button>
            <button id="btn-exportar-planilha-admin" class="ponto-button" style="background-color: #1a73e8;" disabled>
                <i class="fas fa-file-excel"></i> Exportar para Planilha
            </button>
            <button id="btn-imprimir-folha-admin" class="ponto-button" style="background-color: #17a2b8;" disabled>
                <i class="fas fa-print"></i> Imprimir Folha de Ponto
            </button>
        </div>
        <div id="admin-tabela-container">
            <p>Selecione um mês e clique em "Buscar" para ver os registros.</p>
        </div>
    `;

    // 2. Adiciona lógica ao botão de busca
    const btnBuscar = document.getElementById("btn-buscar-historico-admin");
    const inputPeriodo = document.getElementById("filtro-mes-ano-admin");

    btnBuscar.addEventListener("click", async () => {
      const periodo = inputPeriodo.value;
      if (!periodo) {
        window.showNotification("Por favor, selecione um mês.", "erro");
        return;
      }

      const containerTabela = document.getElementById("admin-tabela-container");
      containerTabela.innerHTML = `<p>Buscando registros para ${periodo}...</p>`;

      const btnExportar = document.getElementById(
        "btn-exportar-planilha-admin"
      );
      const btnImprimir = document.getElementById("btn-imprimir-folha-admin");
      btnExportar.disabled = true;
      btnImprimir.disabled = true;

      try {
        // Chamada ao backend com o período
        const resposta = await window.electronAPI.invoke(
          "admin:get-historico-ponto-usuario",
          { userId, periodo }
        );

        if (resposta.success) {
          const registros = resposta.registros;
          // Monta a tabela (reutilizando sua função antiga)
          containerTabela.innerHTML = montarTabelaHistorico(registros);

          if (registros && registros.length > 0) {
            btnExportar.disabled = false;
            btnImprimir.disabled = false;

            // Lógica do botão de exportar (adaptada)
            btnExportar.onclick = () => {
              /* ... sua lógica de exportar ... */
            };

            // Lógica do botão de imprimir
            btnImprimir.onclick = () => {
              const totais = calcularTotaisMensais(registros);

              const dadosParaPDF = {
                registros: registros,
                totais: totais,
                usuario: { id: userId, username: userName },
                periodo: periodo,
              };
              window.electronAPI.invoke(
                "ponto:abrir-preview-folha-mensal",
                dadosParaPDF
              );
            };
          }

          ativarBotoesDeEdicao(); // Reativa a edição na nova tabela
        } else {
          containerTabela.innerHTML = `<p style="color: red;">${resposta.message}</p>`;
        }
      } catch (error) {
        containerTabela.innerHTML = `<p style="color: red;">Erro de comunicação: ${error.message}</p>`;
      }
    });
  }

  async function carregarUsuariosParaGestao() {
    const containerLista = document.getElementById("lista-usuarios-container");
    containerLista.innerHTML = `<p>Buscando usuários...</p>`;

    try {
      const resposta = await window.electronAPI.invoke("get-users");

      if (resposta.success) {
        const usuarios = resposta.users;
        let listaHtml = `<h3>Selecione um funcionário para ver os detalhes:</h3><ul>`;

        usuarios.forEach((usuario) => {
          listaHtml += `<li class="item-usuario" data-userid="${usuario.id}">${usuario.username}</li>`;
        });

        listaHtml += `</ul>`;
        containerLista.innerHTML = listaHtml;

        const itensUsuario = containerLista.querySelectorAll(".item-usuario");

        itensUsuario.forEach((item) => {
          item.addEventListener("click", () => {
            // --- LÓGICA PARA DESTACAR O USUÁRIO ---
            // 1. Remove a classe 'active' de TODOS os itens da lista
            itensUsuario.forEach((i) => i.classList.remove("active"));
            // 2. Adiciona a classe 'active' APENAS no item que foi clicado
            item.classList.add("active");
            // --- FIM DA LÓGICA ---

            const userId = item.dataset.userid;
            const userName = item.textContent;

            console.log(`Item clicado! ID do usuário selecionado: ${userId}`);
            exibirDetalhesUsuario(userId, userName);
          });
        });
      } else {
        containerLista.innerHTML = `<p style="color: red;">Erro ao buscar usuários: ${resposta.message}</p>`;
      }
    } catch (error) {
      console.error("Erro em carregarUsuariosParaGestao:", error);
      containerLista.innerHTML = `<p style="color: red;">Erro de comunicação ao buscar usuários.</p>`;
    }
  }

  function setupAbasPonto() {
    const botoesAba = document.querySelectorAll(".aba-button");
    const conteudoAba = document.querySelectorAll(".aba-pane");

    botoesAba.forEach((botaoClicado) => {
      botaoClicado.addEventListener("click", () => {
        botoesAba.forEach((b) => b.classList.remove("active"));
        conteudoAba.forEach((c) => c.classList.remove("active"));

        botaoClicado.classList.add("active");

        const nomeDaAbaAlvo = botaoClicado.dataset.aba;
        const conteudoAlvo = document.getElementById(
          `conteudo-${nomeDaAbaAlvo}`
        );

        if (conteudoAlvo) {
          conteudoAlvo.classList.add("active");
        }

        if (nomeDaAbaAlvo === "gestao") {
          console.log("Aba de Gestão clicada. Carregando lista de usuários...");
          carregarUsuariosParaGestao();
        } else if (nomeDaAbaAlvo === "relatorio") {
          console.log("Aba de Relatório clicada. Carregando dashboard...");
          carregarDashboardMensal();
        }
      });
    });
  }

  function calcularTotaisMensais(registros) {
    let totalMinutosMes = 0;
    let diasCompletos = 0;
    registros.forEach((registro) => {
      const minutosDoDia = calcularMinutosTrabalhadosNoDia(registro);
      totalMinutosMes += minutosDoDia;
      if (registro.entrada && registro.saida) {
        diasCompletos++;
      }
    });
    const totalMinutosEsperados = diasCompletos * 8 * 60;
    const minutosExtras = totalMinutosMes - totalMinutosEsperados;

    return {
      trabalhadas: formatarMinutosParaHHMM(totalMinutosMes),
      extras: formatarMinutosParaHHMM(minutosExtras, true),
    };
  }

  function preencherTabela(registros) {
    const tabelaCorpo = document.getElementById("corpo-tabela-espelho");
    let htmlLinhas = "";

    // Função interna para formatar apenas a hora
    const formatarApenasHora = (dataString) => {
      if (!dataString) return "--:--:--";
      // Sem o timeZone, ele usa o fuso horário local
      return new Date(dataString).toLocaleTimeString("pt-BR");
    };

    registros.forEach((registro) => {
      const totalMinutosDia = calcularMinutosTrabalhadosNoDia(registro);
      const totalHorasDiaFormatado = formatarMinutosParaHHMM(totalMinutosDia);

      // Formata a data para o padrão brasileiro (DD/MM/AAAA)
      const dataObj = new Date(registro.data);
      const dataFormatada = new Date(
        dataObj.getTime() + dataObj.getTimezoneOffset() * 60000
      ).toLocaleDateString("pt-BR");

      htmlLinhas += `
      <tr style="border-bottom: 1px solid #f0f2f5;">
        <td style="padding: 8px;">${dataFormatada}</td>
        <td style="padding: 8px;">${formatarApenasHora(registro.entrada)}</td>
        <td style="padding: 8px;">${formatarApenasHora(
          registro.almoco_saida
        )}</td>
        <td style="padding: 8px;">${formatarApenasHora(
          registro.almoco_volta
        )}</td>
        <td style="padding: 8px;">${formatarApenasHora(registro.saida)}</td>
        <td style="padding: 8px;"><strong>${totalHorasDiaFormatado}</strong></td>
      </tr>
    `;
    });

    tabelaCorpo.innerHTML = htmlLinhas;
  }

  function calcularMinutosTrabalhadosNoDia(registro) {
    // Usamos .getTime() para pegar o valor numérico (em milissegundos) de cada data.
    // Isso ignora completamente qualquer problema de fuso horário e torna o cálculo preciso.
    const entrada = registro.entrada
      ? new Date(registro.entrada).getTime()
      : null;
    const saidaAlmoco = registro.almoco_saida
      ? new Date(registro.almoco_saida).getTime()
      : null;
    const voltaAlmoco = registro.almoco_volta
      ? new Date(registro.almoco_volta).getTime()
      : null;
    const saida = registro.saida ? new Date(registro.saida).getTime() : null;

    // Se não houver entrada ou saída, o dia não foi completado.
    if (!entrada || !saida) {
      return 0;
    }

    // A subtração agora é feita com números puros, o que é muito mais seguro.
    let diffTrabalhoMs = saida - entrada;

    // Se houve intervalo de almoço completo, subtrai esse tempo
    if (saidaAlmoco && voltaAlmoco) {
      let diffAlmocoMs = voltaAlmoco - saidaAlmoco;
      if (diffAlmocoMs > 0) {
        diffTrabalhoMs -= diffAlmocoMs;
      }
    }

    // Garante que o tempo total não seja negativo
    if (diffTrabalhoMs < 0) {
      return 0;
    }

    // Converte a diferença final de milissegundos para minutos
    return Math.floor(diffTrabalhoMs / 60000);
  }

  function formatarMinutosParaHHMM(totalMinutos, mostrarSinal = false) {
    if (isNaN(totalMinutos)) return "00:00";

    const sinal = totalMinutos < 0 ? "-" : "+";
    const minutos = Math.abs(totalMinutos);

    const horas = Math.floor(minutos / 60);
    const mins = Math.round(minutos % 60);

    const horasFormatadas = horas.toString().padStart(2, "0");
    const minsFormatados = mins.toString().padStart(2, "0");

    if (mostrarSinal) {
      return `${sinal} ${horasFormatadas}:${minsFormatados}`;
    }
    return `${horasFormatadas}:${minsFormatados}`;
  }

  // ADICIONE ESTA FUNÇÃO PARA ATUALIZAR O HTML
  function atualizarCardsDashboard(dados) {
    const container = document.getElementById("dashboard-cards");

    // Define a cor da hora extra (verde para positivo, vermelho para negativo)
    const corExtra = dados.extras.startsWith("+")
      ? "color: #28a745;"
      : "color: #d9534f;";

    const htmlCards = `
        <div class="summary-card" style="flex-grow: 1; text-align: center; background-color: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0;">
            <h4 style="margin: 0 0 5px 0; font-size: 0.9em; color: #555;">HORAS TRABALHADAS</h4>
            <p style="margin: 0; font-size: 1.8em; font-weight: bold; color: #003366;">${dados.trabalhadas}</p>
        </div>
        <div class="summary-card" style="flex-grow: 1; text-align: center; background-color: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0;">
            <h4 style="margin: 0 0 5px 0; font-size: 0.9em; color: #555;">SALDO DE HORAS</h4>
            <p style="margin: 0; font-size: 1.8em; font-weight: bold; ${corExtra}">${dados.extras}</p>
        </div>
    `;

    container.innerHTML = htmlCards;
  }

  function ativarBotoesDoModal() {
    const modal = document.getElementById("modal-editar-ponto");
    const form = document.getElementById("form-editar-ponto");
    const btnCancelar = document.getElementById("btn-cancelar-edicao");
    const btnSalvar = document.getElementById("btn-salvar-edicao");

    if (!modal || !form || !btnCancelar || !btnSalvar) {
      console.error(
        "ERRO: Um ou mais elementos do modal de edição de ponto não foram encontrados."
      );
      return;
    }

    btnCancelar.addEventListener("click", () => {
      modal.classList.remove("is-visible");
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const pontoId = document.getElementById("edit-ponto-id").value;
      const tipo = document.getElementById("edit-ponto-tipo").value;
      const timestampLocal = document.getElementById("edit-timestamp").value;
      const novoTimestampUTC = new Date(timestampLocal).toISOString();

      const btnSalvar = document.getElementById("btn-salvar-edicao");
      btnSalvar.disabled = true;
      btnSalvar.textContent = "Salvando...";

      try {
        const resultado = await window.electronAPI.invoke(
          "admin:update-ponto",
          {
            pontoId,
            tipo,
            // ✅ CORREÇÃO AQUI: Mude 'novoTimestamp' para 'timestamp'
            timestamp: novoTimestampUTC,
          }
        );

        if (resultado.success) {
          modal.classList.remove("is-visible");
          window.showNotification("Ponto atualizado com sucesso!", "sucesso");
          // Clica no botão de busca da aba de gestão para recarregar a tabela
          document.getElementById("btn-buscar-historico-admin")?.click();
        } else {
          window.showNotification(`Erro: ${resultado.message}`, "erro");
        }
      } catch (error) {
        window.showNotification(
          `Erro de comunicação: ${error.message}`,
          "erro"
        );
      } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = "Salvar Alterações";
      }
    });
  }

  async function registrarPontoLocal(tipo) {
    elements.statusMessage.textContent = "Registrando localmente...";
    elements.statusMessage.className = "status-message";
    try {
      const resultado = await window.electronAPI.invoke("registrar-ponto", {
        tipo,
      });
      if (resultado.success) {
        await inicializarPagina();
        return true;
      } else {
        throw new Error(resultado.message);
      }
    } catch (error) {
      elements.statusMessage.textContent = `Erro: ${error.message}`;
      elements.statusMessage.className = "status-message error";
      return false;
    }
  }

  async function finalizarEEnviarJornada() {
    const saidaRegistrada = await registrarPontoLocal("saida");

    // Só continua se o registro de saída local funcionar
    if (saidaRegistrada) {
      elements.statusMessage.textContent =
        "Jornada finalizada localmente. Enviando para o servidor...";
      elements.statusMessage.className = "status-message";
      try {
        const resultadoEnvio = await window.electronAPI.invoke(
          "enviar-jornada-servidor"
        );

        if (resultadoEnvio.success) {
          elements.statusMessage.textContent =
            "Jornada enviada e salva no servidor com sucesso!";
          elements.statusMessage.className = "status-message success";
        } else {
          throw new Error(resultadoEnvio.message);
        }
      } catch (error) {
        elements.statusMessage.textContent = `Falha ao enviar para o servidor: ${error.message}`;
        elements.statusMessage.className = "status-message error";
      }
    }
  }

  async function gerarRelatorioPDF() {
    elements.btnGerarRelatorio.disabled = true;
    elements.btnGerarRelatorio.textContent = "Gerando...";
    elements.statusMessage.textContent = "Coletando dados para o relatório...";
    elements.statusMessage.className = "status-message";

    try {
      const dadosPonto = {
        data: elements.dataAtual.textContent,
        entrada: elements.displayEntrada.textContent,
        almoco_saida: elements.displayAlmocoSaida.textContent,
        almoco_volta: elements.displayAlmocoVolta.textContent,
        saida: elements.displaySaida.textContent,
      };

      // 2. Busca os dados do usuário que está logado
      const userDataResponse = await window.electronAPI.invoke(
        "get-current-user-data"
      );
      if (!userDataResponse.success) {
        // Se não conseguir pegar os dados do usuário, lança um erro
        throw new Error(
          userDataResponse.message ||
            "Não foi possível obter os dados do usuário."
        );
      }

      // 3. Junta tudo em um único objeto, no formato que o main.js espera
      const dadosParaPDF = {
        ...dadosPonto, // Adiciona data, entrada, saida, etc.
        usuario: userDataResponse.user, // Adiciona o objeto do usuário
      };

      // 4. Envia o pacote completo para o main.js gerar o PDF
      elements.statusMessage.textContent = "Enviando para geração do PDF...";
      const resultadoPDF = await window.electronAPI.invoke(
        "gerar-pdf-ponto",
        dadosParaPDF
      );

      if (resultadoPDF.success) {
        elements.statusMessage.textContent =
          "Relatório PDF gerado com sucesso!";
        elements.statusMessage.className = "status-message success";
      } else {
        // Se o usuário simplesmente cancelou a caixa de "Salvar", não mostramos como um erro.
        if (resultadoPDF.cancelled) {
          elements.statusMessage.textContent =
            "Geração de relatório cancelada.";
        } else {
          throw new Error(
            resultadoPDF.message ||
              "Falha ao gerar o PDF no processo principal."
          );
        }
      }
    } catch (error) {
      console.error("Erro ao gerar relatório PDF:", error);
      elements.statusMessage.textContent = `Erro: ${error.message}`;
      elements.statusMessage.className = "status-message error";
    } finally {
      // No final (seja sucesso, erro ou cancelamento), reabilita o botão
      elements.btnGerarRelatorio.disabled = false;
      // Aqui você pode decidir se volta o texto original ou mantém o ícone
      elements.btnGerarRelatorio.innerHTML =
        '<i class="fas fa-file-pdf"></i> Gerar Relatório do Dia';
    }
  }

  async function inicializarPagina() {
    try {
      const resultado = await window.electronAPI.invoke("get-ponto-hoje");
      if (resultado.success) {
        atualizarUI(resultado.ponto);
      } else {
        throw new Error(resultado.message);
      }
    } catch (error) {
      elements.statusMessage.textContent = `Erro ao carregar dados: ${error.message}`;
      elements.statusMessage.className = "status-message error";
    }
  }

  function setupEventListeners() {
    if (elements.btnEntrada)
      elements.btnEntrada.addEventListener("click", () =>
        registrarPontoLocal("entrada")
      );
    const btnBuscar = document.getElementById("btn-buscar-relatorio");
    if (btnBuscar) {
      btnBuscar.addEventListener("click", carregarDashboardMensal);
    }

    setupAbasPonto();

    if (elements.btnAlmocoSaida)
      elements.btnAlmocoSaida.addEventListener("click", () =>
        registrarPontoLocal("almoco_saida")
      );
    if (elements.btnAlmocoVolta)
      elements.btnAlmocoVolta.addEventListener("click", () =>
        registrarPontoLocal("almoco_volta")
      );

    if (elements.btnSaida)
      elements.btnSaida.addEventListener("click", () =>
        registrarPontoLocal("saida")
      );

    if (elements.btnGerarRelatorio)
      elements.btnGerarRelatorio.addEventListener("click", gerarRelatorioPDF);

    ativarBotoesDoModal();
    ativarModalObservacao();
  }

  inicializarPaginaPonto();
})();
