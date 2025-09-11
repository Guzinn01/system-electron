// tests/login.spec.js

// Importa as funções 'test' e 'expect' do Playwright, e o '_electron'
const { test, expect, _electron } = require("@playwright/test");

// 'test' define um novo caso de teste. Damos um nome a ele.
test("A aplicação Electron deve abrir a janela de login", async () => {
  // 1. Lança a aplicação Electron
  // O Playwright vai procurar o executável do Electron nos node_modules.
  // 'args: ['.']' diz para o Electron rodar o projeto na pasta atual (onde está o main.js).
  const electronApp = await _electron.launch({ args: ["."] });

  // 2. Espera a primeira janela da aplicação ser criada e a pega para controlar.
  const window = await electronApp.firstWindow();

  // 3. Verifica o título da janela (ajuste se o seu for diferente)
  // 'expect' é a função de asserção. Aqui verificamos se o título é "Login".
  await expect(window).toHaveTitle("Capitão Consórcios"); // <-- O título esperado agora está correto

  // 4. Interage com a página, como se fosse um navegador
  // 'locator' encontra um elemento na página. Use o seletor CSS correto.
  const userInput = window.locator('input[name="username"]'); // <-- Verifique se o seletor está correto!

  // 5. Verifica se o campo de usuário está visível
  await expect(userInput).toBeVisible();

  // 6. Preenche o campo de usuário
  await userInput.fill("teste@playwright.com");

  // 7. Tira um screenshot para você ver o resultado (opcional, mas ótimo para depurar)
  await window.screenshot({ path: "screenshots/resultado_login.png" });

  // 8. Fecha a aplicação ao final do teste
  await electronApp.close();
});
