// Importa o modelo de usuário e a biblioteca para hash de senha
const { User } = require('../../models'); // Ajuste o caminho se necessário
const bcrypt = require('bcryptjs');

/**
 * Função principal que verifica a existência do usuário admin e o cria se necessário.
 */
async function initializeAdminUser() {
    console.log('[Admin Setup] Verificando a existência do usuário administrador...');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('[Admin Setup] Erro: As variáveis ADMIN_EMAIL e ADMIN_PASSWORD precisam ser definidas.');
        return;
    }

    try {
        const adminExists = await User.findOne({
            where: { email: adminEmail }
        });

        if (adminExists) {
            console.log('[Admin Setup] Usuário administrador já existe. Nenhuma ação necessária.');
        } else {
            console.log('[Admin Setup] Usuário administrador não encontrado. Criando novo usuário...');

            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // NOVO: Adicionamos a lista de permissões extraída do seu seeder.
            const adminPermissions = [
                "system_admin", "gestao_clientes", "clientes_cadastrar",
                "clientes_editar", "clientes_excluir", "clientes_gerenciar_consorcios",
                "clientes_transferir_consorcios", "view_clients", "ponto",
                "simulador_parcelas", "sorteio", "gestao_usuarios",
                "gestao_lances", "lances_upload"
            ];

            await User.create({
                username: 'admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'ADM',
                status: 'ativo',
                permissions: adminPermissions // Usando a lista completa de permissões
            });

            console.log(`[Admin Setup] Usuário administrador ('${adminEmail}') criado com sucesso!`);
        }
    } catch (error) {
        console.error('[Admin Setup] Ocorreu um erro ao tentar criar o usuário administrador:', error);
    }
}

module.exports = {
    initializeAdminUser
};