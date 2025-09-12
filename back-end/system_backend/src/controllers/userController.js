// controllers/userController.js

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");

// Rota: POST /register
exports.register = async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({
      success: false,
      message: "Nome de usuário, senha e e-mail são obrigatórios.",
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
      role: "VENDEDOR", // Papel padrão, pode ser ajustado
      status: "ativo",
      permissions: [], // Permissões padrão
    });

    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Usuário registrado com sucesso!",
      user: userResponse,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor." });
  }
};

exports.setUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["ativo", "inativo"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status inválido." });
    }

    const [affectedRows] = await User.update({ status }, { where: { id } });

    if (affectedRows > 0) {
      res.json({
        success: true,
        message: `Status do usuário atualizado para ${status}.`,
      });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado." });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar status do usuário.",
    });
  }
};
// Rota: POST /login
exports.login = async (req, res) => {
  const { username, password, rememberMe } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Usuário e senha são obrigatórios." });
  }

  try {
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Credenciais inválidas." });
    }

    const accessTokenPayload = {
      sub: user.email,
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || [],
    };

    const accessToken = jwt.sign(accessTokenPayload, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "8h",
    });
    let refreshToken = null;

    if (rememberMe) {
      refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
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
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor." });
  }
};

// Rota: POST /refresh-token
exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Refresh token não fornecido." });
  }

  try {
    // Assumindo que você tem um segredo separado para o refresh token no .env
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
    const user = await User.findOne({
      where: { id: decoded.id, refreshToken: token },
    });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Refresh token inválido ou revogado.",
      });
    }

    // CORREÇÃO: Padronizando o payload para usar 'userId'
    const newAccessTokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || [],
    };

    const newAccessToken = jwt.sign(
      newAccessTokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "Refresh token inválido ou expirado." });
  }
};

// Rota: GET /
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password", "refreshToken"] },
      order: [["username", "ASC"]],
    });
    res.json({ success: true, users });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor." });
  }
};

// Rota: GET /me
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "refreshToken"] },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado." });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro interno ao buscar dados do usuário.",
    });
  }
};

// Rota: PUT /:id
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role, password } = req.body;

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
    if (email) fieldsToUpdate.email = email;
    if (role) fieldsToUpdate.role = role.toUpperCase();
    if (password) {
      fieldsToUpdate.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum campo para atualizar foi fornecido.",
      });
    }

    const [affectedRows] = await User.update(fieldsToUpdate, { where: { id } });

    if (affectedRows > 0) {
      res.json({ success: true, message: "Usuário atualizado com sucesso." });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor." });
  }
};

// Rota: PUT /:id/permissions
exports.updateUserPermissions = async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body;

  if (!Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      message: "O campo 'permissions' deve ser um array.",
    });
  }

  try {
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
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor." });
  }
};

// Rota: DELETE /:id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (req.user.id == id) {
    return res.status(400).json({
      success: false,
      message: "Não é possível excluir a própria conta.",
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
    res
      .status(500)
      .json({ success: false, message: "Erro interno do servidor." });
  }
};

// Rota: GET /status
exports.getUsersWithStatus = (onlineUsers) => async (req, res) => {
  try {
    const allUsers = await User.findAll({
      attributes: ["id", "username", "role", "status", "permissions"],
    });

    const usersWithStatus = allUsers.map((user) => ({
      ...user.toJSON(),
      online: onlineUsers[user.id] ? true : false,
    }));

    res.json({ success: true, users: usersWithStatus });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Erro ao obter status dos usuários." });
  }
};
