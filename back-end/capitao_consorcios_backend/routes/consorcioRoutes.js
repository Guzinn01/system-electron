// routes/consorcioRoutes.js

const express = require("express");
const consorcioController = require("../controllers/consorcioController");
const { authenticateToken, hasPermission } = require("./authMiddleware");

const router = express.Router();

// Protege todas as rotas de consórcio
router.use(authenticateToken);

// POST /consorcios -> Criar um novo consórcio
router.post(
  "/",
  hasPermission("clientes_gerenciar_consorcios"),
  consorcioController.createConsorcio
);

// GET /consorcios/:id -> Buscar um consórcio pelo seu ID
router.get(
  "/:id",
  hasPermission("view_clients"),
  consorcioController.getConsorcioById
);

// PUT /consorcios/:id -> Atualizar um consórcio
router.put(
  "/:id",
  hasPermission("clientes_gerenciar_consorcios"),
  consorcioController.updateConsorcio
);

// DELETE /consorcios/:id -> Deletar um consórcio
router.delete(
  "/:id",
  hasPermission("clientes_excluir"),
  consorcioController.deleteConsorcio
);

// PATCH /consorcios/:id/transfer -> Transferir consórcio para outro cliente
router.patch(
  "/:id/transfer",
  hasPermission("clientes_transferir_consorcios"),
  consorcioController.transferConsorcio
);

// GET /consorcios/:id/historico -> Buscar o histórico de um consórcio
router.get(
  "/:id/historico",
  hasPermission("view_clients"),
  consorcioController.getConsorcioHistory
);

router.delete(
  "/:id/contract",
  hasPermission("clientes_gerenciar_consorcios"), // Reutilizando uma permissão existente
  consorcioController.deleteContract
);

module.exports = router;
