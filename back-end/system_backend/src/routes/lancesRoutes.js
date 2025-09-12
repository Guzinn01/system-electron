// Arquivo: /routes/lancesRoutes.js

const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const {
  authenticateToken,
  hasPermission,
  hasRole,
} = require("../middlewares/authMiddleware");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/sumario-grupos", authenticateToken, async (req, res) => {
  try {
    const pythonApiUrl = `${
      process.env.PYTHON_API_URL || "http://crm.capitaoconsorcios.com:8000"
    }/analises/sumario-grupos/`;

    console.log(
      `[Gateway] Buscando sumário de grupos na API Python: ${pythonApiUrl}`
    );
    const response = await axios.get(pythonApiUrl);

    console.log("[Gateway] Sucesso! Resposta recebida da API Python.");

    const dataWithId = response.data.map((item) => ({
      ...item,
      id: item.grupo,
    }));
    res.json({ success: true, data: dataWithId });
  } catch (error) {
    console.error("======================================================");
    console.error("[Gateway] ERRO CRÍTICO ao chamar a API Python:");
    if (error.response) {
      console.error("Status da Resposta:", error.response.status);
      console.error("Dados da Resposta:", error.response.data);
    } else if (error.request) {
      console.error(
        "Nenhuma resposta recebida. A API Python está offline ou não respondeu a tempo."
      );
      console.error("Código do Erro:", error.code);
    } else {
      console.error("Erro ao configurar a requisição:", error.message);
    }
    console.error("======================================================");

    res.status(502).json({
      success: false,
      message: "O serviço de análise de lances está indisponível.",
    });
  }
});

router.get(
  "/historico-recente/:nomeGrupo",
  authenticateToken,
  async (req, res) => {
    try {
      const { nomeGrupo } = req.params;
      const pythonApiUrl = `${
        process.env.PYTHON_API_URL || "http://crm.capitaoconsorcios.com:8000"
      }/lances/historico-recente/${nomeGrupo}`;

      console.log(
        `[Gateway] Buscando histórico do grupo na API Python: ${pythonApiUrl}`
      );
      const response = await axios.get(pythonApiUrl);

      res.json(response.data); // Corrigido para repassar a resposta da API Python diretamente
    } catch (error) {
      console.error(
        "[Gateway] Erro ao buscar histórico da API Python:",
        error.message
      );
      res
        .status(502)
        .json({ success: false, message: "Serviço de análise indisponível." });
    }
  }
);

// ==================================================================
// ROTA ADICIONADA PARA O HISTÓRICO COMPLETO
// ==================================================================
router.get(
  "/historico-completo/:nomeGrupo",
  authenticateToken,
  async (req, res) => {
    try {
      const { nomeGrupo } = req.params;
      const pythonApiUrl = `${
        process.env.PYTHON_API_URL || "http://crm.capitaoconsorcios.com:8000"
      }/lances/historico-completo/${nomeGrupo}`; // <- URL corrigida

      console.log(
        `[Gateway] Buscando histórico COMPLETO do grupo na API Python: ${pythonApiUrl}`
      );
      const response = await axios.get(pythonApiUrl);

      res.json(response.data); // Repassa a resposta da API Python diretamente
    } catch (error) {
      console.error(
        "[Gateway] Erro ao buscar histórico COMPLETO da API Python:",
        error.message
      );
      res
        .status(502)
        .json({ success: false, message: "Serviço de análise indisponível." });
    }
  }
);
// ==================================================================

router.post(
  "/upload/:administradora",
  authenticateToken,
  hasRole("ADM"),
  upload.single("planilha"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Nenhum arquivo de planilha foi enviado.",
      });
    }

    const { administradora } = req.params;
    const token = req.headers["authorization"];

    try {
      const form = new FormData();
      form.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const pythonApiUrl = `${
        process.env.PYTHON_API_URL || "http://crm.capitaoconsorcios.com:8000"
      }/lances/upload/${administradora}`;

      console.log(`[Gateway] Repassando planilha para: ${pythonApiUrl}`);

      const responseFromPython = await axios.post(pythonApiUrl, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: token,
        },
      });
      res.status(responseFromPython.status).json(responseFromPython.data);
    } catch (error) {
      console.error(
        "[Gateway] Erro ao repassar arquivo para a API Python:",
        error.response ? error.response.data : error.message
      );
      if (error.response) {
        return res.status(error.response.status).json(error.response.data);
      }
      res.status(502).json({
        success: false,
        message: "Serviço de análise de lances indisponível.",
      });
    }
  }
);

module.exports = router;
