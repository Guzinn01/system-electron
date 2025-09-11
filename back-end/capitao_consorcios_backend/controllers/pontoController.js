// controllers/pontoController.js
const { JornadaDeTrabalho, sequelize } = require("../models");
const { Op } = require("sequelize");

// Função para obter a data de hoje no formato YYYY-MM-DD
const getHojeFormatado = () => new Date().toISOString().slice(0, 10);

// Rota: GET /ponto/hoje
exports.getRegistroDeHoje = async (req, res) => {
  try {
    const hoje = getHojeFormatado();
    const registroDeHoje = await JornadaDeTrabalho.findOne({
      where: {
        userId: req.user.id, // ID do usuário vem do token verificado
        data: hoje,
      },
    });

    res.json({ success: true, ponto: registroDeHoje });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro ao buscar registro de ponto." });
  }
};

exports.buscarRegistrosMensais = async (req, res) => {
  const { inicio, fim } = req.query;
  const userId = req.user.id;

  // Validação básica das datas
  if (!inicio || !fim) {
    return res.status(400).json({
      success: false,
      message: "Datas de início e fim são obrigatórias.",
    });
  }

  try {
    const registros = await JornadaDeTrabalho.findAll({
      where: {
        userId: userId,
        data: {
          [Op.between]: [inicio, fim], // Busca registros entre as datas
        },
      },
      order: [["data", "ASC"]], // Ordena do dia mais antigo para o mais novo
    });

    res.json({ success: true, registros: registros });
  } catch (error) {
    console.error("Erro ao buscar registros mensais:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno ao buscar registros de ponto.",
    });
  }
};

// Rota: POST /ponto/registrar
exports.registrarPonto = async (req, res) => {
  const { tipo } = req.body;
  const camposValidos = ["entrada", "almoco_saida", "almoco_volta", "saida"];

  if (!tipo || !camposValidos.includes(tipo)) {
    return res
      .status(400)
      .json({ success: false, message: "Tipo de registro inválido." });
  }

  try {
    const hoje = getHojeFormatado();
    const agora = new Date();
    const userId = req.user.id;

    // Procura por um registro de hoje, se não existir, cria um novo
    const [jornada] = await JornadaDeTrabalho.findOrCreate({
      where: { userId, data: hoje },
      defaults: { userId, data: hoje },
    });

    // Atualiza o campo específico (entrada, saida, etc.) com a hora atual
    await jornada.update({ [tipo]: agora });

    const horarioFormatado = agora.toLocaleTimeString("pt-BR");
    res.json({
      success: true,
      message: `Registro '${tipo}' salvo com sucesso!`,
      horario: horarioFormatado,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro ao registrar ponto." });
  }
};

// Rota: POST /ponto/finalizar-dia (para sincronização)
exports.finalizarJornada = async (req, res) => {
  const { jornada } = req.body;
  const userId = req.user.id;

  if (!jornada || !jornada.entrada) {
    return res
      .status(400)
      .json({ success: false, message: "Dados da jornada estão incompletos." });
  }

  try {
    const hoje = getHojeFormatado();
    const [jornadaDoDia] = await JornadaDeTrabalho.findOrCreate({
      where: { userId, data: hoje },
      defaults: { userId, data: hoje },
    });

    // Prepara os dados, garantindo que são objetos Date válidos
    const dadosParaAtualizar = {
      entrada: new Date(jornada.entrada),
      almoco_saida: jornada.almoco_saida
        ? new Date(jornada.almoco_saida)
        : null,
      almoco_volta: jornada.almoco_volta
        ? new Date(jornada.almoco_volta)
        : null,
      saida: jornada.saida ? new Date(jornada.saida) : null,
    };

    await jornadaDoDia.update(dadosParaAtualizar);

    res.json({
      success: true,
      message: "Jornada diária sincronizada com sucesso!",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro ao sincronizar jornada." });
  }
};
