// controllers/clienteController.js

const { Cliente } = require("../models");

// Rota: GET /clientes
exports.getAllClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      order: [["nome_completo", "ASC"]],
    });
    res.json({ success: true, data: clientes });
  } catch (error) {
    console.error("ERRO EM getAllClientes:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao listar clientes." });
  }
};
// Rota: GET /clientes/:id
exports.getClienteById = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente não encontrado." });
    }
    res.json({ success: true, data: cliente });
  } catch (error) {
    console.error("ERRO EM getClienteById:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao buscar cliente." });
  }
};

// Rota: POST /clientes
exports.createCliente = async (req, res) => {
  try {
    const dadosCliente = req.body;

    if (
      !dadosCliente.tipo_pessoa ||
      !dadosCliente.cpf_cnpj ||
      !dadosCliente.nome_completo
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Campos obrigatórios (Tipo, CPF/CNPJ, Nome) não foram preenchidos.",
      });
    }

    const clienteExistente = await Cliente.findOne({
      where: { cpf_cnpj: dadosCliente.cpf_cnpj },
    });

    if (clienteExistente) {
      return res.status(409).json({
        success: false,
        message: "Já existe um cliente cadastrado com este CPF/CNPJ.",
      });
    }

    if (dadosCliente.tipo_pessoa === "Fisica") {
      dadosCliente.socios = null;
    }

    const novoCliente = await Cliente.create(dadosCliente);

    res.status(201).json({
      success: true,
      message: "Cliente cadastrado com sucesso!",
      data: novoCliente,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro ao cadastrar cliente." });
  }
};

// Rota: PUT /clientes/:id
exports.updateCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const dadosParaAtualizar = req.body;

    if (dadosParaAtualizar.data_nascimento === "") {
      dadosParaAtualizar.data_nascimento = null;
    }
    if (dadosParaAtualizar.conjuge_data_nascimento === "") {
      dadosParaAtualizar.conjuge_data_nascimento = null;
    }
    // --- FIM DA CORREÇÃO ---

    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: "Cliente não encontrado para atualização.",
      });
    }

    if (dadosParaAtualizar.tipo_pessoa === "Fisica") {
      dadosParaAtualizar.socios = null;
    }

    const clienteAtualizado = await cliente.update(dadosParaAtualizar);

    res.json({
      success: true,
      message: "Cliente atualizado com sucesso!",
      data: clienteAtualizado,
    });
  } catch (error) {
    console.error("ERRO AO ATUALIZAR CLIENTE:", error);
    res
      .status(500)
      .json({ success: false, message: "Erro ao atualizar cliente." });
  }
};

// Rota: DELETE /clientes/:id
exports.deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await Cliente.destroy({
      where: { id: id },
    });

    if (resultado === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Cliente não encontrado." });
    }

    res.json({ success: true, message: "Cliente excluído com sucesso." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro ao excluir cliente." });
  }
};
