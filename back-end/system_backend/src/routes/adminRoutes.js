// routes/adminRoutes.js

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.use(authenticateToken);

router.get("/ponto/historico/:userId", adminController.getHistoricoPorUsuario);

router.put("/ponto/:pontoId", adminController.updatePonto);

router.put("/ponto/:pontoId/observacao", adminController.updateObservacao);

module.exports = router;
