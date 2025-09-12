const express = require("express");
const userController = require("../controllers/userController");
const { authenticateToken, hasPermission } = require("../middlewares/authMiddleware");
const userService = require("../services/userService");

const router = express.Router();

// Este módulo exporta uma função que aceita 'onlineUsers'
module.exports = (onlineUsers) => {
  // -- Rotas de Autenticação e Usuários --

  router.post("/register", async (req, res) => {
    const { username, password, role, email } = req.body;
    try {
      if (!username || !password || !role || !email) {
        return res.status(400).json({
          success: false,
          message: "Nome de usuário, senha, e-mail e papel são obrigatórios.",
        });
      }
      const user = await userService.registerUser(req.body);
      res.status(201).json({
        success: true,
        message: "Usuário registrado com sucesso!",
        user,
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erro interno do servidor.",
      });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      if (!req.body.username || !req.body.password) {
        return res
          .status(400)
          .json({ success: false, message: "Dados incompletos." });
      }
      const data = await userService.loginUser(req.body);
      res.json({ success: true, ...data });
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Erro interno do servidor.",
      });
    }
  });

  router.put(
    "/:id/status",
    authenticateToken,
    hasPermission("gestao_usuarios"),
    userController.setUserStatus
  );

  router.post("/refresh-token", async (req, res) => {
    const { token } = req.body;
    try {
      if (!token) {
        return res
          .status(401)
          .json({ success: false, message: "Refresh token não fornecido." });
      }
      const { newAccessToken } = await userService.refreshAccessToken(token);
      res.json({ success: true, accessToken: newAccessToken });
    } catch (error) {
      return res.status(error.statusCode || 403).json({
        success: false,
        message: error.message || "Refresh token inválido ou expirado.",
      });
    }
  });

  router.get(
    "/",
    authenticateToken,
    hasPermission("gestao_usuarios"),
    async (req, res) => {
      try {
        const users = await userService.getAllUsers();
        res.json({ success: true, users });
      } catch (error) {
        console.error("Erro ao buscar lista de usuários:", error);
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor.",
        });
      }
    }
  );

  router.put(
    "/users/:id",
    authenticateToken,
    hasPermission("gestao_usuarios"),
    async (req, res) => {
      try {
        if (Object.keys(req.body).length === 0) {
          return res.status(400).json({
            success: false,
            message: "Nenhum campo para atualizar foi fornecido.",
          });
        }

        const affectedRows = await userService.updateUser(req.params.id, req.body);

        if (affectedRows > 0) {
          res.json({
            success: true,
            message: "Usuário atualizado com sucesso.",
          });
        } else {
          res
            .status(404)
            .json({ success: false, message: "Usuário não encontrado." });
        }
      } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(error.statusCode || 500).json({
          success: false,
          message: error.message || "Erro interno do servidor.",
        });
      }
    }
  );
  router.put(
    "/:id/permissions",
    authenticateToken,
    hasPermission("admin"),
    async (req, res) => {
      const { id } = req.params;
      const { permissions } = req.body;
      try {
        if (!Array.isArray(permissions)) {
          return res.status(400).json({
            success: false,
            message: "O campo 'permissions' deve ser um array.",
          });
        }

        const affectedRows = await userService.updateUserPermissions(id, permissions);

        if (affectedRows > 0) {
          res.json({
            success: true,
            message: "Permissões atualizadas com sucesso.",
          });
        } else {
          res
            .status(404)
            .json({ success: false, message: "Usuário não encontrado." });
        }
      } catch (error) {
        console.error("Erro ao atualizar permissões:", error);
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor.",
        });
      }
    }
  );

  router.delete(
    "/users/:id",
    authenticateToken,
    hasPermission("gestao_usuarios"),
    async (req, res) => {
      const { id } = req.params;
      try {
        if (req.user.id == id) {
          return res.status(400).json({
            success: false,
            message: "Não é possível excluir sua própria conta.",
          });
        }
        const affectedRows = await userService.deleteUser(id);
        if (affectedRows > 0) {
          res.json({ success: true, message: "Usuário excluído com sucesso." });
        } else {
          res
            .status(404)
            .json({ success: false, message: "Usuário não encontrado." });
        }
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        res.status(500).json({
          success: false,
          message: "Erro interno do servidor.",
        });
      }
    }
  );

  router.get(
    "/users/status",
    authenticateToken,
    hasPermission("gestao_usuarios"),
    async (req, res) => {
      try {
        const usersWithStatus = await userService.getUsersWithStatus(onlineUsers);
        res.json({ success: true, users: usersWithStatus });
      } catch (error) {
        console.error("Erro ao obter status dos usuários:", error);
        res.status(500).json({
          success: false,
          message: "Erro ao obter status dos usuários.",
        });
      }
    }
  );

  router.get("/me", authenticateToken, async (req, res) => {
    try {
      res.json({ success: true, user: req.user });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Erro interno ao buscar dados do usuário.",
      });
    }
  });

  return router;
};
