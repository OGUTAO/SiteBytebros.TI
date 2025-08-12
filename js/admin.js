import { authService, productService, newsService, supportService } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('admin-login-section');
    const dashboardSection = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const adminEmailDisplay = document.getElementById('admin-email-display');

    // Função para verificar se o admin está logado
    function checkAdminLogin() {
        const token = localStorage.getItem('adminToken');
        const email = localStorage.getItem('adminEmail');

        if (token && email) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            adminEmailDisplay.textContent = email;
            // Carregar conteúdo da primeira aba (Dashboard)
            loadTabContent('dashboard'); 
        } else {
            loginSection.style.display = 'flex';
            dashboardSection.style.display = 'none';
        }
    }

    // Evento de submit do formulário de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        try {
            const data = await authService.loginAdmin({ email, senha: password });
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminEmail', data.email);
            checkAdminLogin();
        } catch (error) {
            alert(`Falha no login: ${error.message}`);
        }
    });

    // Evento de logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        checkAdminLogin();
    });
    
    // Adiciona eventos de clique para carregar o conteúdo das abas
    document.querySelectorAll('#v-pills-tab button').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            const tabId = event.target.id.replace('-tab', '').replace('v-pills-', '');
            loadTabContent(tabId);
        });
    });

    // Função para carregar o conteúdo da aba selecionada
    async function loadTabContent(tabId) {
        const contentArea = document.getElementById(`v-pills-${tabId}`);
        contentArea.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>';

        try {
            switch(tabId) {
                case 'dashboard':
                    contentArea.innerHTML = '<h2>Bem-vindo ao Painel de Controle</h2><p>Utilize o menu ao lado para gerenciar o conteúdo do site.</p>';
                    break;
                case 'products':
                    const products = await productService.getProducts();
                    renderProducts(contentArea, products);
                    break;
                case 'news':
                    const news = await newsService.getNews();
                    renderNews(contentArea, news);
                    break;
                // Adicionar casos para 'quotes', 'support', 'clients'
                default:
                    contentArea.innerHTML = `<h2>Conteúdo para ${tabId}</h2><p>Funcionalidade em desenvolvimento.</p>`;
            }
        } catch (error) {
            contentArea.innerHTML = `<div class="alert alert-danger">Erro ao carregar conteúdo: ${error.message}</div>`;
        }
    }
    
    // Função para renderizar a lista de produtos
    function renderProducts(container, products) {
        let content = '<h2>Gerenciar Produtos <button class="btn btn-success btn-sm ms-2">Adicionar Novo</button></h2>';
        content += '<div class="table-responsive"><table class="table table-striped table-hover">';
        content += '<thead><tr><th>ID</th><th>Nome</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead><tbody>';
        products.forEach(p => {
            content += `<tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${parseFloat(p.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>${p.quantity}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        });
        content += '</tbody></table></div>';
        container.innerHTML = content;
    }

    // Função para renderizar a lista de notícias
    function renderNews(container, news) {
         let content = '<h2>Gerenciar Notícias <button class="btn btn-success btn-sm ms-2">Adicionar Nova</button></h2>';
        content += '<div class="list-group">';
        news.forEach(n => {
            content += `<div class="list-group-item">
                <h5>${n.titulo}</h5>
                <p>${n.subtitulo || ''}</p>
                <small class="text-muted">Por ${n.autor} em ${new Date(n.data).toLocaleDateString()}</small>
            </div>`;
        });
        content += '</div>';
        container.innerHTML = content;
    }

    // Verificação inicial de login ao carregar a página
    checkAdminLogin();
});