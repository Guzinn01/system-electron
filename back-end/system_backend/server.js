// server.js

require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { User } = require("./models");

// --- Conexão e Modelos do Banco ---
const sequelize = require("./config/database");
require("./models");

// --- Importação das Rotas ---
const userRoutes = require("./routes/userRoutes");
const clienteRoutes = require("./routes/clienteRoutes");
const consorcioRoutes = require("./routes/consorcioRoutes");
const pontoRoutes = require("./routes/pontoRoutes");
const lancesRoutes = require("./routes/lancesRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { initializeAdminUser } = require('./src/startup/createAdmin');

// --- Inicialização do Servidor ---
const app = express();
const server = http.createServer(app);

// --- Constantes e Variáveis de Estado ---
const PORT = process.env.PORT || 3000;
const onlineUsers = {};

// --- Middlewares Globais ---
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Registro das Rotas da API ---
app.use("/users", userRoutes(onlineUsers));
app.use("/clientes", clienteRoutes);
app.use("/consorcios", consorcioRoutes);
app.use("/ponto", pontoRoutes);
app.use("/lances", lancesRoutes);
app.use("/admin", adminRoutes);

// --- Configuração do Multer (Upload de Arquivos) ---
const uploadDir = path.join(__dirname, "uploads", "contracts");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// --- Lógica do Socket.IO ---
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("authenticate", async (token) => {
    // Adicionamos 'async' aqui
    if (!token) return socket.disconnect();
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      onlineUsers[payload.userId] = socket.id;

      await User.update(
        { onlineStatus: "Online" },
        { where: { id: payload.userId } }
      );

      socket.broadcast.emit("user-status-change", {
        userId: payload.userId,
        status: "Online",
      });
    } catch (error) {
      socket.disconnect();
    }
  });

  socket.on("disconnect", async () => {
    // Adicionamos 'async' aqui
    if (socket.userId && onlineUsers[socket.userId] === socket.id) {
      delete onlineUsers[socket.userId];
      const lastSeenTime = new Date();
      await User.update(
        { onlineStatus: "Offline", lastSeen: lastSeenTime },
        { where: { id: socket.userId } }
      );
      io.emit("user-status-change", {
        userId: socket.userId,
        status: "Offline",
        lastSeen: lastSeenTime,
      });
    }
  });
});
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("[Database] Conexão com o MySQL estabelecida com sucesso.");

    await initializeAdminUser();

    //await sequelize.sync({ alter: true });
    console.log("[Database] Modelos sincronizados com alterações.");

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[Server] Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("[Server] ERRO CRÍTICO ao iniciar:", error);
    process.exit(1);
  }
}

startServer();
