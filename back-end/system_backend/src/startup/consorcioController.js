// controllers/consorcioController.js

const { Consorcio, HistoricoConsorcio, Cliente, User } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");
const fs = require("fs").promises;
const path = require("path");

// Rota: GET /consorcios/:id
exports.getConsorcioById = async (req, res) => {
  try {
    const { id } = req.params;
    const consorcio = await Consorcio.findByPk(id, {
      include: [
        { model: Cliente, as: "cliente" },
        { model: User, as: "responsavel", attributes: ["id", "username"] },
      ],
    });

    if (!consorcio) {
      return res
        .status(404)
        .json({ success: false, message: "Consórcio não encontrado." });
    }
    res.json({ success: true, data: consorcio });
  } catch (error) {
    console.error("ERRO em getConsorcioById:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao buscar consórcio." });
  }
};

// Rota: POST /consorcios
exports.createConsorcio = async (req, res) => {
  // LOG 1: O que chegou na requisição?
  console.log("--> [CRIAR CONSÓRCIO] Dados recebidos no body:", req.body);

  const { clienteId, vendedorId, creditoContratado, ...dadosConsorcio } =
    req.body;

  if (
    !clienteId ||
    !vendedorId ||
    !dadosConsorcio.administradora ||
    !dadosConsorcio.grupo ||
    !dadosConsorcio.cota
  ) {
    return res.status(400).json({
      success: false,
      message: "Campos obrigatórios não foram preenchidos.",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    let valorCreditoNumerico = 0;
    if (creditoContratado) {
      valorCreditoNumerico = parseFloat(
        String(creditoContratado).replace(/\./g, "").replace(",", ".")
      );
    }

    const dadosParaCriar = {
      ...dadosConsorcio,
      creditoContratado: valorCreditoNumerico,
      clienteId: clienteId, // Corrigido de ClienteId para clienteId
      usuarioResponsavelId: vendedorId,
    };

    // LOG 2: O que estamos tentando inserir no banco?
    console.log(
      "--> [CRIAR CONSÓRCIO] Objeto pronto para o banco:",
      dadosParaCriar
    );

    const novoConsorcio = await Consorcio.create(dadosParaCriar, {
      transaction,
    });

    // LOG 3: O que foi salvo no banco?
    console.log(
      "--> [CRIAR CONSÓRCIO] Objeto retornado pelo banco:",
      novoConsorcio.toJSON()
    );

    await HistoricoConsorcio.create(
      {
        consorcioId: novoConsorcio.id,
        usuarioResponsavelId: req.user.id,
        tipoEvento: "CRIACAO",
        detalhes: {
          mensagem: `Consórcio criado por ${req.user.username}.`,
          dadosIniciais: novoConsorcio.toJSON(),
        },
      },
      { transaction }
    );

    await transaction.commit();
    console.log("--> [CRIAR CONSÓRCIO] Transação COMITADA com sucesso.");

    res.status(201).json({
      success: true,
      message: "Consórcio criado com sucesso!",
      data: novoConsorcio,
    });
  } catch (error) {
    await transaction.rollback(); // Desfaz tudo se deu algum erro
    // LOG 4: Se deu erro, qual foi?
    console.error(
      "--> [CRIAR CONSÓRCIO] ERRO CAPTURADO, transação revertida:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erro no servidor ao criar consórcio.",
    });
  }
};
// Rota: PUT /consorcios/:id
exports.updateConsorcio = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosParaAtualizar = req.body;

    const consorcio = await Consorcio.findByPk(id);
    if (!consorcio) {
      return res
        .status(404)
        .json({ success: false, message: "Consórcio não encontrado." });
    }

    // Lógica para criar histórico de edições
    for (const key in dadosParaAtualizar) {
      if (consorcio[key] !== dadosParaAtualizar[key]) {
        await HistoricoConsorcio.create({
          consorcioId: id,
          usuarioResponsavelId: req.user.id,
          tipoEvento: "EDICAO",
          detalhes: {
            mensagem: `Campo '${key}' alterado por ${req.user.username}.`,
            campo: key,
            valorAntigo: consorcio[key],
            valorNovo: dadosParaAtualizar[key],
          },
        });
      }
    }

    const consorcioAtualizado = await consorcio.update(dadosParaAtualizar);
    res.json({
      success: true,
      message: "Consórcio atualizado com sucesso!",
      data: consorcioAtualizado,
    });
  } catch (error) {
    console.error("ERRO em updateConsorcio:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao atualizar consórcio." });
  }
};

// Rota: DELETE /consorcios/:id
exports.deleteConsorcio = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Consorcio.destroy({ where: { id } });

    if (resultado === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Consórcio não encontrado." });
    }
    res.json({ success: true, message: "Consórcio excluído com sucesso." });
  } catch (error) {
    console.error("ERRO em deleteConsorcio:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao excluir consórcio." });
  }
};

// Rota: PATCH /consorcios/:id/transfer
exports.transferConsorcio = async (req, res) => {
  try {
    const { id } = req.params;
    const { newClientId } = req.body;

    const consorcio = await Consorcio.findByPk(id, {
      include: [{ model: Cliente, as: "cliente" }],
    });
    if (!consorcio) {
      return res
        .status(404)
        .json({ success: false, message: "Consórcio não encontrado." });
    }

    const clienteNovo = await Cliente.findByPk(newClientId);
    if (!clienteNovo) {
      return res
        .status(404)
        .json({ success: false, message: "Novo cliente não encontrado." });
    }

    const oldClientId = consorcio.clienteId;
    const oldClientName = consorcio.cliente
      ? consorcio.cliente.nome_completo
      : "Desconhecido";

    await consorcio.update({ clienteId: newClientId });

    await HistoricoConsorcio.create({
      consorcioId: id,
      usuarioResponsavelId: req.user.id,
      tipoEvento: "TRANSFERENCIA",
      detalhes: {
        mensagem: `Transferido de '${oldClientName}' para '${clienteNovo.nome_completo}' por ${req.user.username}.`,
        deClienteId: oldClientId,
        paraClienteId: newClientId,
      },
    });

    res.json({ success: true, message: "Consórcio transferido com sucesso!" });
  } catch (error) {
    console.error("ERRO em transferConsorcio:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao transferir consórcio." });
  }
};

// Rota: GET /consorcios/:id/historico
exports.getConsorcioHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const historico = await HistoricoConsorcio.findAll({
      where: { consorcioId: id },
      order: [["createdAt", "DESC"]],
      include: [
        { model: User, as: "usuario", attributes: ["username", "status"] },
      ],
    });
    res.json({ success: true, data: historico });
  } catch (error) {
    console.error("ERRO em getConsorcioHistory:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao buscar histórico." });
  }
};

exports.getConsorciosByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const consorcios = await Consorcio.findAll({
      where: { ClienteId: clienteId },

      include: [
        {
          model: User,
          as: "responsavel",
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const dadosFormatados = consorcios.map((consorcio) => {
      const consorcioJSON = consorcio.toJSON();
      consorcioJSON.vendedorNome = consorcio.responsavel
        ? consorcio.responsavel.username
        : "Não informado";
      return consorcioJSON;
    });

    res.json({ success: true, data: dadosFormatados });
  } catch (error) {
    console.error("Erro ao buscar consórcios do cliente:", error);
    res.status(500).json({
      success: false,
      message: "Erro no servidor ao buscar consórcios do cliente.",
    });
  }
};

exports.getTransferredConsorciosByCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;

    // 1. Busca os eventos de transferência onde o clienteId é quem transferiu
    const eventos = await HistoricoConsorcio.findAll({
      where: {
        tipoEvento: "TRANSFERENCIA",
        // Busca dentro do JSON da coluna 'detalhes'
        [Op.and]: sequelize.where(
          sequelize.json("detalhes.deClienteId"),
          clienteId
        ),
      },
      include: [{ model: Consorcio, as: "consorcio" }], // Inclui os dados do consórcio
      order: [["createdAt", "DESC"]],
    });

    // ===== INÍCIO DA CORREÇÃO =====
    // 2. Processa cada evento para buscar o nome do destinatário
    const dadosFormatados = await Promise.all(
      eventos.map(async (evento) => {
        const eventoJSON = evento.toJSON();
        let transferidoPara = null;

        // Pega o ID do cliente que recebeu, que está no JSON 'detalhes'
        const paraClienteId = eventoJSON.detalhes?.paraClienteId;

        if (paraClienteId) {
          // Busca os dados do cliente que recebeu
          const clienteDestino = await Cliente.findByPk(paraClienteId, {
            attributes: ["id", "nome_completo"], // Pega só os campos necessários
          });
          if (clienteDestino) {
            transferidoPara = { nome: clienteDestino.nome_completo };
          }
        }

        // 3. Monta o objeto final com a estrutura que o frontend espera
        return {
          consorcio: eventoJSON.consorcio,
          transferidoPara: transferidoPara,
          dataTransferencia: eventoJSON.createdAt, // Usa a data de criação do registro de histórico
        };
      })
    );
    // ===== FIM DA CORREÇÃO =====

    res.json({ success: true, data: dadosFormatados }); // Envia os dados já processados
  } catch (error) {
    console.error("ERRO em getTransferredConsorciosByCliente:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar consórcios transferidos.",
    });
  }
};

exports.deleteContract = async (req, res) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();

  try {
    const consorcio = await Consorcio.findByPk(id, { transaction });
    if (!consorcio) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Consórcio não encontrado." });
    }

    const caminhoContrato = consorcio.caminhoContratoPDF;
    if (!caminhoContrato) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Este consórcio não possui um contrato anexado.",
      });
    }

    // 1. Apagar o arquivo do sistema de arquivos
    // Assumindo que os arquivos estão em uma pasta 'uploads' na raiz do backend
    const filePath = path.join(__dirname, "..", "..", "uploads", caminhoContrato);

    try {
      await fs.unlink(filePath);
    } catch (fileError) {
      // Se o arquivo não existir, apenas loga o erro mas continua o processo
      console.warn(
        `Arquivo de contrato não encontrado para exclusão: ${filePath}. Continuando para remover a referência do DB.`
      );
    }

    // 2. Atualizar o banco de dados para remover a referência
    consorcio.caminhoContratoPDF = null;
    await consorcio.save({ transaction });

    // 3. Registrar no histórico
    await HistoricoConsorcio.create(
      {
        consorcioId: id,
        usuarioResponsavelId: req.user.id,
        tipoEvento: "EXCLUSAO_CONTRATO",
        detalhes: {
          mensagem: `Contrato '${caminhoContrato}' removido por ${req.user.username}.`,
          arquivoRemovido: caminhoContrato,
        },
      },
      { transaction }
    );

    await transaction.commit();

    res.json({ success: true, message: "Contrato removido com sucesso." });
  } catch (error) {
    await transaction.rollback();
    console.error("ERRO em deleteContract:", error);
    res.status(500).json({
      success: false,
      message: "Erro no servidor ao remover o contrato.",
    });
  }
};
