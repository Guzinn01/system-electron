// src/js/login_renderer.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('remember-me'); // Nova checkbox
    const errorMessageElement = document.getElementById('error-message');
    const loginButton = document.getElementById('login-button');

    // Lógica dos botões de controle da janela de login
    const loginMinimizeButton = document.getElementById('login-minimize-btn');
    const loginCloseButton = document.getElementById('login-close-btn');

    if (loginMinimizeButton && loginCloseButton) {
        if (window.electronAPI && typeof window.electronAPI.windowMinimize === 'function') {
            loginMinimizeButton.addEventListener('click', () => {
                window.electronAPI.windowMinimize();
            });
        }
        if (window.electronAPI && typeof window.electronAPI.windowClose === 'function') {
            loginCloseButton.addEventListener('click', () => {
                window.electronAPI.windowClose();
            });
        }
    } else {
        console.warn('[LoginRenderer] Botões de controle da janela de login não encontrados.');
    }

    // Lógica do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const username = usernameInput.value;
            const password = passwordInput.value;
            const rememberMe = rememberMeCheckbox.checked; // Obter o estado da checkbox

            errorMessageElement.textContent = '';
            loginButton.disabled = true;
            loginButton.textContent = 'Verificando...';

            try {
                if (window.electronAPI && typeof window.electronAPI.invoke === 'function') {
                    // Enviar 'username', 'password' E 'rememberMe'
                    const result = await window.electronAPI.invoke('login-attempt', { username, password, rememberMe });

                    if (!result.success) {
                        errorMessageElement.textContent = result.message || 'Ocorreu um erro desconhecido.';
                    }
                    // Se o login for bem-sucedido, o main.js cuida da transição.
                } else {
                    throw new Error('A API de comunicação (electronAPI.invoke) não está disponível.');
                }
            } catch (error) {
                console.error('Erro durante a tentativa de login:', error);
                errorMessageElement.textContent = error.message || 'Falha na comunicação com o sistema.';
            } finally {
                // Apenas reabilitar se ainda estivermos na página de login (ou seja, login falhou)
                if (errorMessageElement.textContent || document.getElementById('login-form')) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Entrar';
                }
            }
        });
    } else {
        console.error('[LoginRenderer] O formulário de login com id "login-form" não foi encontrado.');
    }
});
