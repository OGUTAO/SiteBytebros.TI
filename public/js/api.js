// URL da API (será substituída pelo Netlify durante o build)
const API_BASE_URL = window.API_BASE_URL || "https://back-end-site-bytebros-nuot.onrender.com/api/";

/**
 * Função genérica para realizar requisições à API.
 * @param {string} endpoint - O endpoint da API a ser chamado.
 * @param {string} method - O método HTTP (GET, POST, PUT, DELETE).
 * @param {object} data - O corpo da requisição (para POST e PUT).
 * @param {boolean} needsAuth - Se a requisição precisa de token de autenticação.
 * @returns {Promise<any>} - A resposta da API em JSON.
 */
async function apiRequest(endpoint, method = 'GET', data = null, needsAuth = false) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };

    if (needsAuth) {
        const token = localStorage.getItem('userToken') || localStorage.getItem('adminToken');
        if (!token) {
            console.error('Token de autenticação não encontrado para:', endpoint);
            throw new Error('Não autenticado. Por favor, faça login.');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (data) {
        config.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ erro: 'Erro desconhecido' }));
            throw new Error(errorData.erro || `Erro na API: ${response.statusText}`);
        }
        // Retorna um objeto vazio se a resposta não tiver conteúdo (status 204)
        return response.status === 204 ? {} : await response.json();
    } catch (error) {
        console.error(`Erro na requisição ${method} ${endpoint}:`, error);
        throw error;
    }
}

// Exportando os serviços da API
export const authService = {
    registerUser: (userData) => apiRequest('auth/registrar', 'POST', userData),
    loginUser: (credentials) => apiRequest('auth/login', 'POST', credentials),
    loginAdmin: (credentials) => apiRequest('admin/login', 'POST', credentials),
};

export const productService = {
    getProducts: () => apiRequest('produtos'),
};

export const newsService = {
    getNews: () => apiRequest('noticias'),
};

export const supportService = {
    createMessage: (messageData) => apiRequest('suporte', 'POST', messageData, true),
};

export const orderService = {
    createOrder: (orderData) => apiRequest('pedidos', 'POST', orderData, true),
    getOrders: () => apiRequest('meus-pedidos', 'GET', null, true),
};