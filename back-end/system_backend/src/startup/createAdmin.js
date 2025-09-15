const bcrypt = require("bcryptjs");
const { User } = require("../models");

/**
 * Verifica se um usuário administrador padrão existe e, se não, o cria.
 * Utiliza variáveis de ambiente para as credenciais.
 */
async function initializeAdminUser() {
  // Pega as credenciais do admin das variáveis de ambiente
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || "Administrador";

  // Verifica se as variáveis essenciais foram definidas
  if (!adminEmail || !adminPassword) {
    console.warn(
      "[Admin Init] Variáveis DEFAULT_ADMIN_EMAIL ou DEFAULT_ADMIN_PASSWORD não definidas. Pulando criação do usuário admin."
    );
    return;
  }

  try {
    // 1. Verifica se o usuário já existe no banco de dados
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    // 2. Se o usuário já existe, não faz nada
    if (existingAdmin) {
      console.log(
        `[Admin Init] Usuário administrador (${adminEmail}) já existe.`
      );
      return;
    }

    // 3. Se não existe, cria o hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // 4. Cria o novo usuário administrador no banco
    await User.create({
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword, // O modelo User mapeia 'password' para 'senha_hash'
      role: "ADM",
      status: "ativo",
    });

    console.log(
      `[Admin Init] SUCESSO: Usuário administrador (${adminEmail}) criado.`
    );
  } catch (error) {
    console.error(
      "[Admin Init] ERRO ao tentar criar o usuário administrador:",
      error
    );
  }
}

module.exports = { initializeAdminUser };