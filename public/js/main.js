import { authService, newsService, productService } from './api.js';

document.addEventListener('DOMContentLoaded', () => {

    // Lógica para alternar tema (claro/escuro)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    }

    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }

    // Lógica de autenticação
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            try {
                const data = await authService.loginUser({ email: email, senha: password });
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userName', data.nome);
                window.location.href = 'index.html';
            } catch (error) {
                alert(`Falha no login: ${error.message}`);
            }
        });
    }

    // Lógica de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (código para registro)
        });
    }
    
    // Verificar status do login para exibir/ocultar botões
    updateNavUI();
});

function updateNavUI() {
    const userToken = localStorage.getItem('userToken');
    const userName = localStorage.getItem('userName');
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const userNameSpan = document.getElementById('user-name');

    if (userToken && userName) {
        if(authButtons) authButtons.classList.add('d-none');
        if(userProfile) userProfile.classList.remove('d-none');
        if(userNameSpan) userNameSpan.textContent = userName;
    } else {
        if(authButtons) authButtons.classList.remove('d-none');
        if(userProfile) userProfile.classList.add('d-none');
    }
}

function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    updateNavUI();
    window.location.href = 'index.html';
}

// Disponibilizar a função de logout globalmente
window.logout = logout;