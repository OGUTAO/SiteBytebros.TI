import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('admin-login-section');
    const dashboardSection = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const adminEmailDisplay = document.getElementById('admin-email-display');
    const loginError = document.getElementById('login-error');

    // Função para mostrar a tela de login
    function showLogin() {
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
    }

    // Função para mostrar o painel de controle
    function showDashboard(email) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        adminEmailDisplay.textContent = email;
        // Carrega o conteúdo da primeira aba por padrão
        loadTabContent('v-pills-dashboard');
    }

    // Função principal que verifica se o usuário é um admin
    async function checkAdminStatus() {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            showLogin();
            return;
        }

        // Busca o perfil do usuário na tabela 'usuarios' para verificar a flag 'is_admin'
        const { data: userProfile, error: profileError } = await supabase
            .from('usuarios')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (profileError || !userProfile || !userProfile.is_admin) {
            // Se não for admin, desloga e mostra a tela de login com um aviso
            await supabase.auth.signOut();
            showLogin();
            // Opcional: alertar o usuário
            // alert('Acesso negado. Esta área é restrita para administradores.');
        } else {
            // Se for admin, mostra o painel
            showDashboard(session.user.email);
        }
    }

    // Evento de submit do formulário de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('d-none');
        const btn = e.submitter;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Entrando...`;

        const email = loginForm.email.value;
        const password = loginForm.password.value;

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            loginError.textContent = error.message;
            loginError.classList.remove('d-none');
        } else {
            // Após o login bem-sucedido, verifica se o usuário tem permissão de admin
            await checkAdminStatus();
        }
        
        btn.disabled = false;
        btn.innerHTML = 'Entrar';
    });

    // Evento de logout
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        showLogin();
    });

    // Adiciona eventos para carregar o conteúdo das abas quando clicadas
    document.querySelectorAll('#v-pills-tab button').forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            const targetId = event.target.getAttribute('data-bs-target').substring(1);
            loadTabContent(targetId);
        });
    });

    // Função para carregar dinamicamente o conteúdo de cada aba
    async function loadTabContent(tabId) {
        const contentArea = document.getElementById(tabId);
        contentArea.innerHTML = `<div class="d-flex justify-content-center"><div class="spinner-border" role="status"></div></div>`;

        try {
            if (tabId === 'v-pills-products') {
                const { data, error } = await supabase.from('produtos').select('*').order('id');
                if (error) throw error;
                renderProducts(contentArea, data);
            } else if (tabId === 'v-pills-news') {
                const { data, error } = await supabase.from('noticias').select('*').order('data', { ascending: false });
                if (error) throw error;
                renderNews(contentArea, data);
            } else if (tabId === 'v-pills-interactions') {
                const { data, error } = await supabase.from('interacoes').select('*').order('criado_em', { ascending: false });
                if (error) throw error;
                renderInteractions(contentArea, data);
            } else if (tabId === 'v-pills-dashboard') {
                 contentArea.innerHTML = '<h2>Bem-vindo ao Painel de Controle</h2><p>Utilize o menu ao lado para gerenciar o conteúdo do site.</p>';
            }
            // Adicionar lógica para outras abas aqui
        } catch (error) {
            contentArea.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
        }
    }

    // Funções para renderizar o conteúdo de cada aba
    function renderProducts(container, products) {
        let tableHtml = `<h2>Produtos Cadastrados</h2>
            <div class="table-responsive">
                <table class="table table-dark table-striped table-hover">
                    <thead><tr><th>ID</th><th>Nome</th><th>Preço</th><th>Estoque</th></tr></thead>
                    <tbody>`;
        products.forEach(p => {
            tableHtml += `<tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${parseFloat(p.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td>${p.quantity}</td>
            </tr>`;
        });
        tableHtml += `</tbody></table></div>`;
        container.innerHTML = tableHtml;
    }

    function renderNews(container, news) {
        let content = '<h2>Notícias Publicadas</h2><div class="list-group">';
        news.forEach(n => {
            content += `<div class="list-group-item list-group-item-dark">
                <h5>${n.titulo}</h5>
                <p class="mb-1">${n.subtitulo || ''}</p>
                <small class="text-muted">Por ${n.autor} em ${new Date(n.data).toLocaleDateString()}</small>
            </div>`;
        });
        content += '</div>';
        container.innerHTML = content;
    }

    function renderInteractions(container, interactions) {
        let content = '<h2>Orçamentos e Pedidos de Suporte</h2><div class="list-group">';
        interactions.forEach(i => {
            const badgeColor = i.tipo_interacao === 'orcamento' ? 'bg-info' : 'bg-warning';
            content += `<div class="list-group-item list-group-item-dark">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">${i.nome} <small>(${i.email})</small></h5>
                    <span class="badge ${badgeColor} text-dark">${i.tipo_interacao}</span>
                </div>
                <p class="mb-1">${i.mensagem}</p>
                <small class="text-muted">Recebido em: ${new Date(i.criado_em).toLocaleString('pt-BR')}</small>
            </div>`;
        });
        content += '</div>';
        container.innerHTML = content;
    }

    // Verificação inicial ao carregar a página
    checkAdminStatus();
});
