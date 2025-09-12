const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");
const userController = require("../controllers/userController");
const { authenticateToken, hasPermission } = require("./authMiddleware");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Este módulo exporta uma função que aceita 'onlineUsers'
module.exports = (onlineUsers) => {
  // -- Rotas de Autenticação e Usuários --

  router.post("/register", async (req, res) => {
    const { username, password, role, email } = req.body;
    if (!username || !password || !role || !email) {
      return res.status(400).json({
        success: false,
        message: "Nome de usuário, senha, e-mail e papel são obrigatórios.",
      });
    }
    try {
      const existingUser = await User.findOne({
        where: { [Op.or]: [{ username }, { email }] },
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Nome de usuário ou e-mail já existe.",
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        role: role.toUpperCase(),
        status: "ativo",
        permissions: [],
      });
      const userResponse = newUser.toJSON();
      delete userResponse.password;
      res.status(201).json({
        success: true,
        message: "Usuário registrado com sucesso!",
        user: userResponse,
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro interno do servidor." });
    }
  });

  router.post("/login", async (req, res) => {
    const { username, password, rememberMe } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Dados incompletos." });
    }
    try {
      const user = await User.findOne({ where: { username } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res
          .status(401)
          .json({ success: false, message: "Credenciais inválidas." });
      }
      const userPermissions = user.permissions || [];
      const accessTokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: userPermissions,
      };
      const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, {
        expiresIn: "8h",
      });
      let refreshToken = null;
      if (rememberMe) {
        refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
          expiresIn: "7d",
        });
        user.refreshToken = refreshToken;
        await user.save();
      }
      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.refreshToken;
      res.json({
        success: true,
        accessToken,
        refreshToken,
        user: userResponse,
      });
    } catch (error) {
      console.error("Erro no login:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro interno do servidor." });
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
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token não fornecido." });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET); // Use o mesmo segredo do refresh se for diferente
      const user = await User.findByPk(payload.userId);

      if (!user || user.refreshToken !== token) {
        return res.status(403).json({
          success: false,
          message: "Refresh token inválido ou revogado.",
        });
      }

      const newAccessTokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || [], // Garante que as permissões sejam incluídas
      };

      const newAccessToken = jwt.sign(newAccessTokenPayload, JWT_SECRET, {
        expiresIn: "8h",
      });
      res.json({ success: true, accessToken: newAccessToken });
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: "Refresh token inválido ou expirado.",
      });
    }
  });

  router.get(
    "/",
    authenticateToken,
    hasPermission("gestao_usuarios"),
    async (req, res) => {
      try {
        const users = await User.findAll({
          attributes: { exclude: ["password", "refreshToken"] },
          order: [["username", "ASC"]],
        });
        res.json({ success: true, users });
      } catch (error) {
        console.error("Erro ao buscar lista de usuários:", error);
        res
          .status(500)
          .json({ success: false, message: "Erro interno do servidor." });
      }
    }
  );

  router.put(
    "/users/:id",
    authenticateToken,
    hasPermission("gestao_usuarios"),
    async (req, res) => {
      const { id } = req.params;
      const { username, role, password, email } = req.body;

      try {
        if (username) {
          const existingUser = await User.findOne({
            where: { username, id: { [Op.ne]: id } },
          });
          if (existingUser) {
            return res.status(409).json({
              success: false,
              message: "Este nome de usuário já está em uso.",
            });
          }
        }

        const fieldsToUpdate = {};
        if (username) fieldsToUpdate.username = username;
        if (role) fieldsToUpdate.role = role.toUpperCase();
        if (email) fieldsToUpdate.email = email;

        if (password) {
          fieldsToUpdate.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
          return res.status(400).json({
            success: false,
            message: "Nenhum campo para atualizar foi fornecido.",
          });
        }

        const [affectedRows] = await User.update(fieldsToUpdate, {
          where: { id },
        });

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
        res
          .status(500)
          .json({ success: false, message: "Erro interno do servidor." });
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

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: "O campo 'permissions' deve ser um array.",
        });
      }

      try {
        const user = await User.findByPk(id);

        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "Usuário não encontrado." });
        }

        const [affectedRows] = await User.update(
          { permissions },
          { where: { id } }
        );

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
        res
          .status(500)
          .json({ success: false, message: "Erro interno do servidor." });
      }
    }
  );

  router.delete(
    "/users/:id",
    authenticateToken,
    hasPermission("gestao_usuarios"),
    async (req, res) => {
      const { id } = req.params;
      if (req.user.id == id) {
        return res.status(400).json({
          success: false,
          message: "Não é possível excluir sua própria conta.",
        });
      }
      try {
        const affectedRows = await User.destroy({ where: { id } });
        if (affectedRows > 0) {
          res.json({ success: true, message: "Usuário excluído com sucesso." });
        } else {
          res
            .status(404)
            .json({ success: false, message: "Usuário não encontrado." });
        }
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        res
          .status(500)
          .json({ success: false, message: "Erro interno do servidor." });
      }
    }
  );

  router.get(
    "/users/status",
    authenticateToken,
    hasPermission("gestao_usuarios"),
    async (req, res) => {
      try {
        const allUsers = await User.findAll({
          attributes: { exclude: ["password", "refreshToken"] },
        });
        const usersWithStatus = allUsers.map((user) => {
          const userJson = user.toJSON();
          return {
            ...userJson,
            status: onlineUsers[userJson.id] ? "Online" : "Offline",
          };
        });
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
