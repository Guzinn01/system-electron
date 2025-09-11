// renderer_sorteio.js (Controla a página sorteio.html - Apurador de Sorteio)

// Envolve todo o código em uma IIFE para criar um novo escopo a cada carregamento
(function () {
    console.log('[Renderer Sorteio] Script carregado. Iniciando configuração (dentro da IIFE)...');

    const gruposConfig = [
        // IMÓVEL
        { nome: "PARTICIPANTES (540)", tipo: "Imóvel", participantes: 540, equivalencia: 540 },
        { nome: "PARTICIPANTES (600)", tipo: "Imóvel", participantes: 600, equivalencia: 600 },
        { nome: "PARTICIPANTES (800)", tipo: "Imóvel", participantes: 800, equivalencia: 800 },
        { nome: "PARTICIPANTES (700)", tipo: "Imóvel", participantes: 700, equivalencia: 700 },
        { nome: "PARTICIPANTES (900)", tipo: "Imóvel", participantes: 900, equivalencia: 900 },
        // AUTOMÓVEL
        { nome: "PARTICIPANTES (320)", tipo: "Automóvel", participantes: 320, equivalencia: 960 },
        { nome: "PARTICIPANTES (250)", tipo: "Automóvel", participantes: 250, equivalencia: 750 },
        { nome: "PARTICIPANTES (216)", tipo: "Automóvel", participantes: 216, equivalencia: 864 },
        { nome: "PARTICIPANTES (360)", tipo: "Automóvel", participantes: 360, equivalencia: 720 },
        { nome: "PARTICIPANTES (350)", tipo: "Automóvel", participantes: 350, equivalencia: 1050 },
        { nome: "PARTICIPANTES (504)", tipo: "Automóvel", participantes: 504, equivalencia: 504 },
        { nome: "PARTICIPANTES (300)", tipo: "Automóvel", participantes: 300, equivalencia: 900 },
        { nome: "PARTICIPANTES (600)", tipo: "Automóvel", participantes: 600, equivalencia: 600 }
    ];

    console.log('[Renderer Sorteio] Selecionando elementos do DOM para apuração...');
    const btnApurar = document.getElementById('btnApurarSorteio');
    // Adicione estas linhas junto com as outras seleções de elementos
    const btnCarregarPlanilha = document.getElementById('btnCarregarPlanilha');
    const infoPlanilhaEl = document.getElementById('infoPlanilha');
    const loteriaInputs = [
        document.getElementById('loteriaNum1'), document.getElementById('loteriaNum2'),
        document.getElementById('loteriaNum3'), document.getElementById('loteriaNum4'),
        document.getElementById('loteriaNum5')
    ];
    const dataApuracaoInput = document.getElementById('dataApuracaoSorteio');
    const btnImprimir = document.getElementById('btnImprimirResultados');

    const errorMessageApuracaoEl = document.getElementById('errorMessageApuracao');
    const opcoesGlobaisContainerEl = document.getElementById('opcoesGlobaisContainer');
    const opcoesGlobaisListaEl = document.getElementById('opcoesGlobaisLista');

    const resultadosImovelContainerEl = document.getElementById('resultadosImovelContainer');
    const tabelaResultadosImovelEl = document.getElementById('tabelaResultadosImovel');
    const tabelaResultadosImovelBodyEl = tabelaResultadosImovelEl ? tabelaResultadosImovelEl.getElementsByTagName('tbody')[0] : null;

    const resultadosAutomovelContainerEl = document.getElementById('resultadosAutomovelContainer');
    const tabelaResultadosAutomovelEl = document.getElementById('tabelaResultadosAutomovel');
    const tabelaResultadosAutomovelBodyEl = tabelaResultadosAutomovelEl ? tabelaResultadosAutomovelEl.getElementsByTagName('tbody')[0] : null;

    // Verificações de elementos (mantidas para debug)
    if (!btnApurar) console.error("[Renderer Sorteio] ERRO DOM: Botão 'btnApurarSorteio' não encontrado.");
    loteriaInputs.forEach((input, index) => {
        if (!input) console.error(`[Renderer Sorteio] ERRO DOM: Input 'loteriaNum${index + 1}' não encontrado.`);
    });
    if (!tabelaResultadosImovelBodyEl && tabelaResultadosImovelEl) console.error("[Renderer Sorteio] ERRO DOM: <tbody> de 'tabelaResultadosImovel' não encontrado.");
    if (!tabelaResultadosAutomovelBodyEl && tabelaResultadosAutomovelEl) console.error("[Renderer Sorteio] ERRO DOM: <tbody> de 'tabelaResultadosAutomovel' não encontrado.");


    async function salvarEstadoAtualApurador() {
        if (window.electronAPI && typeof window.electronAPI.send === 'function') {
            const numerosAtuais = loteriaInputs.map(input => input ? input.value.trim() : '');
            const dataAtual = dataApuracaoInput ? dataApuracaoInput.value : '';
            const estado = { loteriaNumeros: numerosAtuais, dataApuracao: dataAtual };
            try {
                window.electronAPI.send('salvar-estado-apurador', estado);
                console.log('[Renderer Sorteio] Estado do apurador enviado para salvamento:', estado);
            } catch (error) {
                console.error('[Renderer Sorteio] Erro ao enviar estado do apurador para salvamento:', error);
            }
        } else {
            console.warn('[Renderer Sorteio] API "electronAPI.send" não disponível para salvar estado.');
        }
    }

    async function carregarEstadoSalvoApurador() {
        if (window.electronAPI && typeof window.electronAPI.invoke === 'function') {
            console.log('[Renderer Sorteio] Carregando estado salvo do apurador...');
            try {
                const estadoSalvo = await window.electronAPI.invoke('carregar-estado-apurador');
                if (estadoSalvo) {
                    if (estadoSalvo.loteriaNumeros && Array.isArray(estadoSalvo.loteriaNumeros)) {
                        loteriaInputs.forEach((inputEl, index) => {
                            if (inputEl && estadoSalvo.loteriaNumeros[index] !== undefined) {
                                inputEl.value = estadoSalvo.loteriaNumeros[index];
                            }
                        });
                    }
                    if (dataApuracaoInput && estadoSalvo.dataApuracao) {
                        dataApuracaoInput.value = estadoSalvo.dataApuracao;
                    }
                    console.log('[Renderer Sorteio] Estado do apurador carregado:', estadoSalvo);
                } else {
                    console.log('[Renderer Sorteio] Nenhum estado do apurador salvo encontrado.');
                }
            } catch (error) {
                console.error('[Renderer Sorteio] Erro ao carregar estado do apurador:', error);
            }
        } else {
            console.warn('[Renderer Sorteio] API "electronAPI.invoke" não disponível para carregar estado.');
        }
    }

    loteriaInputs.forEach(inputElement => {
        if (inputElement) {
            inputElement.addEventListener('input', function () { this.value = this.value.replace(/\D/g, ''); });
            inputElement.addEventListener('blur', function () { salvarEstadoAtualApurador(); });
        }
    });
    if (dataApuracaoInput) {
        dataApuracaoInput.addEventListener('blur', function () {
            salvarEstadoAtualApurador();
        });
    }
    console.log('[Renderer Sorteio] Listeners de input da loteria e data configurados.');

    function gerarOpcoesGlobais(numerosLoteriaArray) {
        const opcoes = [];
        numerosLoteriaArray.forEach(numStr => {
            if (typeof numStr === 'string' && numStr.length > 0) {
                const numPad = numStr.padStart(5, '0');
                opcoes.push(parseInt(numPad.slice(-3), 10));
                opcoes.push(parseInt(numPad.slice(1, 4), 10));
            } else {
                opcoes.push(NaN, NaN);
            }
        });
        return opcoes.filter(op => !isNaN(op));
    }

    function calcularCotaContemplada(numeroOpcao, participantesGrupo) {
        if (isNaN(numeroOpcao) || isNaN(participantesGrupo) || participantesGrupo <= 0) return "-";
        let cota = numeroOpcao;
        while (cota > participantesGrupo) {
            cota -= participantesGrupo;
        }
        if (cota === 0) {
            cota = participantesGrupo;
        }
        return cota;
    }

    if (btnApurar) {
        btnApurar.addEventListener('click', () => {
            console.log('[Renderer Sorteio] Botão "Apurar Sorteio Completo" CLICADO.');
            salvarEstadoAtualApurador();
            console.log('[Renderer Sorteio] Estado do apurador (números/data) potencialmente salvo antes da apuração.');

            if (errorMessageApuracaoEl) errorMessageApuracaoEl.style.display = 'none';
            if (opcoesGlobaisListaEl) opcoesGlobaisListaEl.innerHTML = '';
            if (tabelaResultadosImovelBodyEl) { tabelaResultadosImovelBodyEl.innerHTML = ''; }
            if (tabelaResultadosAutomovelBodyEl) { tabelaResultadosAutomovelBodyEl.innerHTML = ''; }

            if (opcoesGlobaisContainerEl) opcoesGlobaisContainerEl.style.display = 'none';
            if (resultadosImovelContainerEl) resultadosImovelContainerEl.style.display = 'none';
            if (resultadosAutomovelContainerEl) resultadosAutomovelContainerEl.style.display = 'none';
            console.log('[Renderer Sorteio] UI de resultados limpa.');

            const numerosLoteriaInputValues = loteriaInputs.map(input => input ? input.value.trim() : '');
            if (!numerosLoteriaInputValues.every(val => val && /^\d{1,5}$/.test(val))) {
                if (errorMessageApuracaoEl) {
                    errorMessageApuracaoEl.textContent = 'Preencha todos os 5 campos da Loteria com números válidos (até 5 dígitos).';
                    errorMessageApuracaoEl.style.display = 'block';
                }
                console.warn('[Renderer Sorteio] Validação dos números da loteria falhou.');
                if (btnImprimir) btnImprimir.disabled = true;
                return;
            }
            console.log('[Renderer Sorteio] Validação dos inputs da loteria passou.');

            console.log('[Renderer Sorteio] Montando a estrutura do JSON de resultado...');
            const resultadoSorteioJSON = {
                dataApuracao: dataApuracaoInput.value,
                numerosLoteria: numerosLoteriaInputValues,
                resultados: {
                    imovel: [],
                    automovel: []
                }
            };

            const opcoesGlobais = gerarOpcoesGlobais(numerosLoteriaInputValues);
            if (opcoesGlobais.length === 0) {
                if (errorMessageApuracaoEl) {
                    errorMessageApuracaoEl.textContent = 'Erro ao gerar opções globais. Verifique os números da loteria.';
                    errorMessageApuracaoEl.style.display = 'block';
                }
                console.error('[Renderer Sorteio] Erro: Nenhuma opção global válida foi gerada.');
                if (btnImprimir) btnImprimir.disabled = true;
                return;
            }
            console.log('[Renderer Sorteio] Opções Globais geradas:', opcoesGlobais);

            if (opcoesGlobaisListaEl && opcoesGlobaisContainerEl) {
                opcoesGlobais.forEach((op, index) => {
                    const li = document.createElement('li');
                    li.textContent = `Op. Global ${index + 1}: ${op}`;
                    opcoesGlobaisListaEl.appendChild(li);
                });
                opcoesGlobaisContainerEl.style.display = 'block';
            }
            console.log('[Renderer Sorteio] Opções Globais exibidas na UI.');

            gruposConfig.forEach(grupo => {
                const newRow = document.createElement('tr');

                // CORREÇÃO 1: Inicializa o objeto para guardar os resultados deste grupo
                const grupoResultados = {
                    grupo: grupo.nome,
                    cotas: []
                };

                const nomeTd = document.createElement('td');
                nomeTd.textContent = grupo.nome;
                nomeTd.className = 'grupo-nome';
                newRow.appendChild(nomeTd);
                const indicesOpcoesUsadasParaEsteGrupo = new Set();

                for (let i = 0; i < 10; i++) {
                    const td = document.createElement('td');
                    let cotaApuradaParaEstePremio = "-";
                    for (let j = 0; j < opcoesGlobais.length; j++) {
                        if (indicesOpcoesUsadasParaEsteGrupo.has(j)) { continue; }
                        const numeroOpcaoAtual = opcoesGlobais[j];
                        if (!isNaN(numeroOpcaoAtual) && numeroOpcaoAtual <= grupo.equivalencia) {
                            cotaApuradaParaEstePremio = calcularCotaContemplada(numeroOpcaoAtual, grupo.participantes);
                            indicesOpcoesUsadasParaEsteGrupo.add(j);
                            break;
                        }
                    }
                    td.textContent = cotaApuradaParaEstePremio;
                    newRow.appendChild(td);

                    // CORREÇÃO 2: Adiciona a cota apurada ao nosso objeto de resultados
                    grupoResultados.cotas.push(cotaApuradaParaEstePremio);
                }

                if (grupo.tipo === "Imóvel" && tabelaResultadosImovelBodyEl) {
                    tabelaResultadosImovelBodyEl.appendChild(newRow);
                    if (resultadosImovelContainerEl) resultadosImovelContainerEl.style.display = 'block';

                    // CORREÇÃO 3: Adiciona o resultado completo do grupo ao JSON final
                    resultadoSorteioJSON.resultados.imovel.push(grupoResultados);

                } else if (grupo.tipo === "Automóvel" && tabelaResultadosAutomovelBodyEl) {
                    tabelaResultadosAutomovelBodyEl.appendChild(newRow);
                    if (resultadosAutomovelContainerEl) resultadosAutomovelContainerEl.style.display = 'block';

                    // CORREÇÃO 4: Adiciona o resultado completo do grupo ao JSON final
                    resultadoSorteioJSON.resultados.automovel.push(grupoResultados);
                }
            });
            console.log('[Renderer Sorteio] Tabelas de apuração (Imóvel/Automóvel) preenchidas.');
            if (btnImprimir) btnImprimir.disabled = false;
        });
    } else {
        console.error("[Renderer Sorteio] ERRO FATAL: Botão 'btnApurarSorteio' não encontrado no DOM.");
    }

    if (btnImprimir) {
        console.log("[Renderer Sorteio] Botão 'btnImprimirResultados' ENCONTRADO no DOM.");
        btnImprimir.disabled = true;

        if (window.electronAPI && typeof window.electronAPI.gerarRelatorioSorteioPDF === 'function') {
            console.log("[Renderer Sorteio] API de impressão formatada (window.electronAPI.gerarRelatorioSorteioPDF) ENCONTRADA.");

            btnImprimir.addEventListener('click', async () => {
                console.log("[Renderer Sorteio] Botão IMPRIMIR RELATÓRIO FORMATADO clicado.");

                const dataApuracao = dataApuracaoInput ? dataApuracaoInput.value : "Não informada";
                const numerosLoteria = loteriaInputs.map(input => input ? input.value.trim() : '');
                const htmlTabelaImovel = tabelaResultadosImovelEl ? tabelaResultadosImovelEl.outerHTML : "<table><tr><td>Tabela de Imóveis não disponível</td></tr></table>";
                const htmlTabelaAutomovel = tabelaResultadosAutomovelEl ? tabelaResultadosAutomovelEl.outerHTML : "<table><tr><td>Tabela de Automóveis não disponível</td></tr></table>";
                const opcoesGlobaisHTML = opcoesGlobaisListaEl ? opcoesGlobaisListaEl.innerHTML : "<li>Nenhuma opção global gerada</li>";

                const dadosParaRelatorio = {
                    dataApuracao: dataApuracao,
                    numerosLoteria: numerosLoteria,
                    opcoesGlobaisHTML: `<ul>${opcoesGlobaisHTML}</ul>`,
                    htmlTabelaImovel: htmlTabelaImovel,
                    htmlTabelaAutomovel: htmlTabelaAutomovel
                };

                console.log("[Renderer Sorteio] Dados coletados para o relatório:", dadosParaRelatorio);

                try {
                    console.log("[Renderer Sorteio] Tentando chamar window.electronAPI.gerarRelatorioSorteioPDF()...");
                    const resultadoImpressao = await window.electronAPI.gerarRelatorioSorteioPDF(dadosParaRelatorio);
                    console.log("[Renderer Sorteio] Resultado da chamada gerarRelatorioSorteioPDF:", resultadoImpressao);

                    if (resultadoImpressao && resultadoImpressao.success) {
                        console.log('[Renderer Sorteio] PDF do relatório de sorteio salvo com sucesso em:', resultadoImpressao.filePath || resultadoImpressao.path);
                    } else if (resultadoImpressao && resultadoImpressao.error) {
                        console.error(`[Renderer Sorteio] Erro retornado pela API ao gerar PDF do relatório: ${resultadoImpressao.error}`);
                    } else if (resultadoImpressao && resultadoImpressao.cancelled) {
                        console.log('[Renderer Sorteio] Geração de PDF do relatório cancelada pelo usuário.');
                    } else {
                        console.warn('[Renderer Sorteio] Resultado inesperado ou falha silenciosa da API de geração de PDF do relatório:', resultadoImpressao);
                    }
                } catch (error) {
                    console.error(`[Renderer Sorteio] Erro CRÍTICO ao tentar executar gerarRelatorioSorteioPDF: ${error.message}`, error);
                }
            });
            console.log("[Renderer Sorteio] Listener para GERAR PDF FORMATADO DO RELATÓRIO configurado.");
        } else {
            console.warn("[Renderer Sorteio] API (window.electronAPI.gerarRelatorioSorteioPDF) NÃO disponível ou não é uma função.");
        }
    } else {
        console.warn("[Renderer Sorteio] Botão 'btnImprimirResultados' NÃO encontrado no DOM.");
    }
    // --- LÓGICA PARA O NOVO BOTÃO DE CARREGAR PLANILHA ---
    function exibirContemplados(ganhadores) {
        // A função precisa de um lugar no HTML para renderizar a tabela.
        // Certifique-se que a div <div id="secaoContemplados"></div> existe no seu sorteio.html
        const container = document.getElementById('secaoContemplados');
        if (!container) {
            console.error('O container para exibir os contemplados (id="secaoContemplados") não foi encontrado no HTML.');
            if (infoPlanilhaEl) {
                infoPlanilhaEl.textContent = "Erro de UI: Container de resultados não encontrado."
                infoPlanilhaEl.style.color = 'red';
            }
            return;
        }

        // Limpa o container e o torna visível
        container.innerHTML = '';
        container.style.display = 'block';

        const titulo = document.createElement('h3');
        titulo.textContent = 'Clientes Contemplados na Planilha';
        container.appendChild(titulo);

        // Verifica se a lista de ganhadores está vazia
        if (!ganhadores || !Array.isArray(ganhadores) || ganhadores.length === 0) {
            container.innerHTML += '<p>Nenhum cliente contemplado foi encontrado na planilha para os números sorteados.</p>';
            return;
        }

        // Cria a estrutura da tabela
        const tabela = document.createElement('table');
        tabela.className = 'tabela-resultados-geral'; // Use esta classe para estilizar no CSS
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // Cria o cabeçalho da tabela dinamicamente a partir das chaves do primeiro objeto
        // Isso torna o código mais flexível se as colunas do Python mudarem
        const headers = Object.keys(ganhadores[0]);
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        // Preenche o corpo da tabela com os dados dos ganhadores
        ganhadores.forEach(ganhador => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = ganhador[header] || '-'; // Usa '-' se o valor for nulo ou indefinido
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        tabela.appendChild(thead);
        tabela.appendChild(tbody);
        container.appendChild(tabela);

    }

    (async () => {
        try {
            await carregarEstadoSalvoApurador();
        } catch (e) {
            console.error("[Renderer Sorteio] Erro durante carregarEstadoSalvoApurador na inicialização:", e);
        }
    })();

    console.log('[Renderer Sorteio] Script de inicialização totalmente concluído.');
})(); // Fim da IIFE
