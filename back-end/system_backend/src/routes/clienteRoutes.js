// routes/clienteRoutes.js

const express = require("express");
const clienteController = require("../controllers/clienteController");
const consorcioController = require("../controllers/consorcioController");
const { authenticateToken, hasPermission } = require("../middlewares/authMiddleware");

const router = express.Router();

// Aplica o middleware de autenticação a TODAS as rotas deste arquivo
router.use(authenticateToken);

// --- ROTAS DE CLIENTES ---
router.get(
  "/",
  hasPermission("gestao_clientes"),
  clienteController.getAllClientes
);
router.post(
  "/",
  hasPermission("clientes_cadastrar"),
  clienteController.createCliente
);
router.get(
  "/:id",
  hasPermission("view_clients"),
  clienteController.getClienteById
);
router.put(
  "/:id",
  hasPermission("clientes_editar"),
  clienteController.updateCliente
);
router.delete(
  "/:id",
  hasPermission("clientes_excluir"),
  clienteController.deleteCliente
);

// --- ROTAS DE CONSÓRCIOS RELACIONADAS A CLIENTES --- (ADICIONADO)

// GET /clientes/:clienteId/consorcios -> Listar todos os consórcios de um cliente
router.get(
  "/:clienteId/consorcios",
  hasPermission("view_clients"),
  consorcioController.getConsorciosByCliente
);

// GET /clientes/:clienteId/consorcios-transferidos -> Listar consórcios que já foram deste cliente
router.get(
  "/:clienteId/consorcios-transferidos",
  hasPermission("view_clients"),
  consorcioController.getTransferredConsorciosByCliente
);

module.exports = router;
