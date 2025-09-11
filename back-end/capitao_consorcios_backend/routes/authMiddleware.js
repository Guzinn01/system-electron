// Arquivo: authMiddleware.js (VERSÃO COM DEBUG ATIVADO)

const jwt = require("jsonwebtoken");
const { User } = require("../models");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    return res
      .status(401)
      .json({ success: false, message: "Token de acesso não fornecido." });
  }

  try {
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decodedPayload.userId, {
      attributes: ["id", "username", "permissions", "role"],
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Usuário do token não encontrado." });
    }
    req.user = user.toJSON();
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, message: "Token inválido ou expirado." });
  }
}
const hasRole = (requiredRole) => {
  return (req, res, next) => {
    if (req.user && req.user.role === requiredRole) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: "Acesso negado. Requer privilégios de administrador.",
      });
    }
  };
};
const hasPermission = (requiredPermission) => {
  return (req, res, next) => {
    let userPermissions = req.user?.permissions || [];

    if (typeof userPermissions === "string" && userPermissions.length > 0) {
      try {
        userPermissions = JSON.parse(userPermissions);
      } catch (e) {
        userPermissions = [];
      }
    }

    const hasAdminAccess = userPermissions.includes("system_admin");
    const hasSpecificPermission = userPermissions.includes(requiredPermission);

    if (hasAdminAccess || hasSpecificPermission) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Acesso negado. Você não tem permissão para esta ação.",
    });
  };
};

module.exports = { authenticateToken, hasPermission, hasRole };
