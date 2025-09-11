// Importa a biblioteca bcryptjs
const bcrypt = require("bcryptjs");

// Pega a senha que será passada como argumento no terminal
const senha_para_hash = process.argv[2];

// Verifica se uma senha foi fornecida
if (!senha_para_hash) {
  console.log("Por favor, forneça uma senha para gerar o hash.");
  console.log("Exemplo: node gerar-hash.js 'minhaSenha123'");
  process.exit(1); // Encerra o script com um código de erro
}

// Define o "custo" do hash (padrão é 10)
const saltRounds = 10;

// Gera o hash da senha
bcrypt.hash(senha_para_hash, saltRounds, (err, hash) => {
  if (err) {
    console.error("Erro ao gerar o hash:", err);
    return;
  }

  // Imprime o hash gerado no console
  console.log("Seu hash é:");
  console.log(hash);
});
