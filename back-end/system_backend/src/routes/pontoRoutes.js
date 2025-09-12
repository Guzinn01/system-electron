// routes/pontoRoutes.js

const express = require("express");
const pontoController = require("../controllers/pontoController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Aplica o middleware de autenticação a TODAS as rotas de ponto.
// Um usuário precisa estar logado para bater o ponto.
router.use(authenticateToken);

// GET /ponto/hoje -> Busca o registro de ponto do dia para o usuário logado
router.get("/hoje", pontoController.getRegistroDeHoje);

router.get("/registros-mensais", pontoController.buscarRegistrosMensais);
// POST /ponto/registrar -> Registra uma nova marcação (entrada, saída, etc.)
router.post("/registrar", pontoController.registrarPonto);
// POST /ponto/registrar -> Registra uma nova marcação (entrada, saída, etc.)
router.post("/registrar", pontoController.registrarPonto);

// POST /ponto/finalizar-dia -> Sincroniza a jornada completa vinda do app
router.post("/finalizar-dia", pontoController.finalizarJornada);

module.exports = router;
