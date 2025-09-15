// controllers/adminController.js
const { JornadaDeTrabalho } = require("../models");
const { Op } = require("sequelize");

// ✅ FUNÇÃO ATUALIZADA PARA FILTRAR POR MÊS
exports.getHistoricoPorUsuario = async (req, res) => {
    if (
        !req.user ||
        !req.user.permissions ||
        !req.user.permissions.includes("gestao_usuarios")
    ) {
        return res.status(403).json({
            success: false,
            message: "Acesso negado. Requer permissão de administrador do sistema.",
        });
    }

    try {
        const { userId } = req.params;
        const { periodo } = req.query; // Pega o período da URL (ex: "2025-08")

        // Cláusula base para a busca
        const whereClause = { userId: userId };

        // Se um período foi enviado na URL, adiciona o filtro de data
        if (periodo) {
            const [ano, mes] = periodo.split("-").map(Number);
            const primeiroDia = new Date(ano, mes - 1, 1);
            const ultimoDia = new Date(ano, mes, 0, 23, 59, 59); // Pega até o fim do último dia do mês

            // Adiciona a condição de data à cláusula 'where'
            whereClause.data = {
                [Op.between]: [primeiroDia, ultimoDia],
            };
        }

        const registros = await JornadaDeTrabalho.findAll({
            where: whereClause, // Usa a cláusula com o filtro de data (se houver)
            order: [["data", "DESC"]],
        });

        res.json({ success: true, registros: registros });
    } catch (error) {
        console.error("Erro no adminController ao buscar histórico:", error);
        res
            .status(500)
            .json({ success: false, message: "Erro interno no servidor." });
    }
};

exports.updatePonto = async (req, res) => {
    // Verificação de permissão
    if (
        !req.user ||
        !req.user.permissions ||
        !req.user.permissions.includes("gestao_usuarios")
    ) {
        return res.status(403).json({
            success: false,
            message: "Acesso negado. Requer permissão de administrador.",
        });
    }

    try {
        const { pontoId } = req.params;
        const { tipo, timestamp, observacao } = req.body;

        if (!timestamp || !tipo) {
            return res.status(400).json({
                success: false,
                message: "O tipo e o novo horário (timestamp) são obrigatórios.",
            });
        }

        const registro = await JornadaDeTrabalho.findByPk(pontoId);
        if (!registro) {
            return res
                .status(404)
                .json({ success: false, message: "Registro de ponto não encontrado." });
        }

        // ✅ ATUALIZAÇÃO INTELIGENTE: Monta o objeto com os dados que vieram.
        const dadosParaAtualizar = {};
        dadosParaAtualizar[tipo] = new Date(timestamp);

        // Só adiciona a observação ao objeto de atualização se ela foi enviada.
        if (observacao !== undefined) {
            dadosParaAtualizar.observacao = observacao;
        }

        await registro.update(dadosParaAtualizar);

        res.json({
            success: true,
            message: "Registro de ponto atualizado com sucesso.",
        });
    } catch (error) {
        console.error("Erro no adminController ao atualizar ponto:", error);
        res
            .status(500)
            .json({ success: false, message: "Erro interno no servidor." });
    }
};

exports.updateObservacao = async (req, res) => {
    if (
        !req.user ||
        !req.user.permissions ||
        !req.user.permissions.includes("gestao_usuarios")
    ) {
        return res.status(403).json({ success: false, message: "Acesso negado." });
    }

    try {
        const { pontoId } = req.params;
        const { observacao } = req.body;

        if (observacao === undefined) {
            return res.status(400).json({
                success: false,
                message: "O campo 'observacao' não foi fornecido.",
            });
        }

        const registro = await JornadaDeTrabalho.findByPk(pontoId);
        if (!registro) {
            return res
                .status(404)
                .json({ success: false, message: "Registro de ponto não encontrado." });
        }

        registro.observacao = observacao;
        await registro.save();

        res.json({ success: true, message: "Observação atualizada com sucesso." });
    } catch (error) {
        console.error("Erro no adminController ao atualizar observação:", error);
        res
            .status(500)
            .json({ success: false, message: "Erro interno no servidor." });
    }
};