const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");

const JWT_SECRET = process.env.JWT_SECRET;

const registerUser = async (userData) => {
  const { username, password, role, email } = userData;

  const existingUser = await User.findOne({
    where: { [Op.or]: [{ username }, { email }] },
  });
  if (existingUser) {
    const error = new Error("Nome de usuário ou e-mail já existe.");
    error.statusCode = 409;
    throw error;
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
  return userResponse;
};

const loginUser = async (credentials) => {
  const { username, password, rememberMe } = credentials;

  const user = await User.findOne({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error("Credenciais inválidas.");
    error.statusCode = 401;
    throw error;
  }

  const accessTokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions || [],
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

  return { accessToken, refreshToken, user: userResponse };
};

const refreshAccessToken = async (token) => {
  const payload = jwt.verify(token, JWT_SECRET);
  const user = await User.findByPk(payload.userId);

  if (!user || user.refreshToken !== token) {
    const error = new Error("Refresh token inválido ou revogado.");
    error.statusCode = 403;
    throw error;
  }

  const newAccessTokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    permissions: user.permissions || [],
  };

  const newAccessToken = jwt.sign(newAccessTokenPayload, JWT_SECRET, {
    expiresIn: "8h",
  });
  return { newAccessToken };
};

const getAllUsers = async () => {
  return User.findAll({
    attributes: { exclude: ["password", "refreshToken"] },
    order: [["username", "ASC"]],
  });
};

const updateUser = async (userId, updateData) => {
  const { username, role, password, email } = updateData;

  if (username) {
    const existingUser = await User.findOne({
      where: { username, id: { [Op.ne]: userId } },
    });
    if (existingUser) {
      const error = new Error("Este nome de usuário já está em uso.");
      error.statusCode = 409;
      throw error;
    }
  }

  const fieldsToUpdate = {};
  if (username) fieldsToUpdate.username = username;
  if (role) fieldsToUpdate.role = role.toUpperCase();
  if (email) fieldsToUpdate.email = email;

  if (password) {
    fieldsToUpdate.password = await bcrypt.hash(password, 10);
  }

  const [affectedRows] = await User.update(fieldsToUpdate, {
    where: { id: userId },
  });

  return affectedRows;
};

const updateUserPermissions = async (userId, permissions) => {
  const user = await User.findByPk(userId);
  if (!user) {
    return 0; // Indica que o usuário não foi encontrado
  }

  const [affectedRows] = await User.update({ permissions }, { where: { id: userId } });
  return affectedRows;
};

const deleteUser = async (userId) => {
  return User.destroy({ where: { id: userId } });
};

const getUsersWithStatus = async (onlineUsers) => {
  const allUsers = await User.findAll({
    attributes: { exclude: ["password", "refreshToken"] },
  });
  return allUsers.map((user) => {
    const userJson = user.toJSON();
    return {
      ...userJson,
      status: onlineUsers[userJson.id] ? "Online" : "Offline",
    };
  });
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  getAllUsers,
  updateUser,
  updateUserPermissions,
  deleteUser,
  getUsersWithStatus,
};