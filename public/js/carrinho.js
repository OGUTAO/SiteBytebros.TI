import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    // Adiciona as funções ao objeto window para que possam ser chamadas pelo HTML
    window.updateCartQuantity = updateCartQuantity;
    window.removeFromCart = removeFromCart;
    
    checkUserSession();
    
    // Verifica em qual página estamos para carregar a função correta
    if (document.getElementById('itens-carrinho')) {
        renderCart(); // Página do carrinho
    }
    if (document.getElementById('resumo-pedido')) {
        loadPaymentPage(); // Página de pagamento
    }

    // Adiciona os listeners aos botões
    const checkoutButton = document.getElementById('finalizar-compra-btn');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', finalizeOrder);
    }
    
    const cepButton = document.getElementById('buscar-cep-btn');
    if (cepButton) {
        cepButton.addEventListener('click', fetchAddressByCep);
    }
});

async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = `login.html?redirect=${window.location.pathname}`;
    }
}

// Carrega um resumo simples dos itens na página de pagamento
function loadPaymentPage() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const summaryContainer = document.getElementById('resumo-pedido');
    const totalEl = document.getElementById('valor-total-pagamento');

    if (!summaryContainer) return;

    summaryContainer.innerHTML = '';

    if (cart.length === 0) {
        summaryContainer.innerHTML = '<p class="text-muted">Seu carrinho está vazio.</p>';
        document.getElementById('finalizar-compra-btn')?.classList.add('disabled');
        if (totalEl) totalEl.textContent = 'R$ 0,00';
        return;
    }

    let subtotal = 0;
    cart.forEach(item => {
        const price = parseFloat(item.value || item.price || 0);
        const quantity = parseInt(item.quantity || 1);
        subtotal += price * quantity;

        const itemElement = document.createElement('div');
        itemElement.className = 'd-flex justify-content-between';
        itemElement.innerHTML = `
            <p class="mb-2">${item.name || 'Produto sem nome'} (x${quantity})</p>
            <p class="mb-2">R$ ${(price * quantity).toFixed(2)}</p>
        `;
        summaryContainer.appendChild(itemElement);
    });

    if (totalEl) {
        totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    }
}


// Renderiza a lista detalhada de itens na página do carrinho
function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('itens-carrinho');
    
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<li class="list-group-item text-center text-muted">Seu carrinho está vazio.</li>';
        document.getElementById('finalizar-compra-btn')?.classList.add('disabled');
        updateSummary(0);
        return;
    }

    document.getElementById('finalizar-compra-btn')?.classList.remove('disabled');

    let subtotal = 0;
    cart.forEach((item, index) => {
        const price = parseFloat(item.value || item.price || 0);
        const quantity = parseInt(item.quantity || 1);

        const itemElement = document.createElement('li');
        itemElement.className = 'list-group-item d-flex align-items-center';
        
        // --- AQUI ESTÁ A CORREÇÃO PARA IMAGEM E ERRO ---
        // Usamos item.image_url, que é o campo correto do seu banco de dados.
        // Isso corrige tanto a imagem quebrada quanto o erro 'reading String'.
        itemElement.innerHTML = `
            <img src="${item.image_url || 'img/default_product.jpg'}" alt="${item.name}" class="img-fluid rounded me-3" style="width: 60px; height: 60px; object-fit: cover;">
            <div class="flex-grow-1">
                <h6 class="my-0">${item.name || 'Produto sem nome'}</h6>
                <small class="text-muted">Valor: R$ ${price.toFixed(2)}</small>
            </div>
            <div class="d-flex align-items-center">
                <div class="input-group input-group-sm" style="width: 100px;">
                    <button class="btn btn-outline-secondary" type="button" onclick="updateCartQuantity(${index}, -1)">-</button>
                    <input type="text" class="form-control text-center" value="${quantity}" readonly>
                    <button class="btn btn-outline-secondary" type="button" onclick="updateCartQuantity(${index}, 1)">+</button>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-3" onclick="removeFromCart(${index})"><i class="bi bi-trash"></i></button>
            </div>
        `;
        // --- FIM DA CORREÇÃO ---

        cartItemsContainer.appendChild(itemElement);
        subtotal += price * quantity;
    });

    updateSummary(subtotal);
}

function updateSummary(subtotal) {
    const subtotalEl = document.getElementById('valor-subtotal');
    const totalEl = document.getElementById('valor-total');
    if(subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    if(totalEl) totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
}

function updateCartQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

async function fetchAddressByCep() {
    const cepInput = document.getElementById('cep');
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) {
        alert('CEP inválido. Por favor, digite um CEP com 8 dígitos.');
        return;
    }

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            alert('CEP não encontrado. Por favor, verifique o número digitado.');
        } else {
            document.getElementById('endereco').value = data.logouro;
            document.getElementById('cidade').value = data.localidade;
            document.getElementById('uf').value = data.uf;
        }
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        alert('Não foi possível buscar o CEP. Por favor, preencha o endereço manualmente.');
    }
}

async function finalizeOrder(event) {
    const form = document.getElementById('form-entrega');
    const button = event.currentTarget;
    const spinner = button.querySelector('.spinner-border');

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        alert('Por favor, preencha todos os campos de endereço obrigatórios.');
        return;
    }
    
    button.disabled = true;
    spinner.classList.remove('d-none');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Sessão expirada. Faça o login novamente.');
        window.location.href = 'login.html';
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Seu carrinho está vazio.');
        button.disabled = false;
        spinner.classList.add('d-none');
        return;
    }

    const invalidItem = cart.find(item => typeof item.id === 'undefined' || item.id === null);
    if (invalidItem) {
        console.error('Item inválido encontrado no carrinho:', invalidItem);
        alert(`Erro: O item "${invalidItem.name || 'Desconhecido'}" está com problema. Por favor, limpe o cache do seu navegador ou remova todos os itens do carrinho e tente adicioná-los novamente.`);
        
        button.disabled = false;
        spinner.classList.add('d-none');
        return;
    }
    
    const valorTotal = cart.reduce((acc, item) => acc + (parseFloat(item.value || item.price) * item.quantity), 0);

    const orderData = {
        usuario_id: user.id,
        valor_total: valorTotal,
        forma_pagamento: 'Pagamento na Entrega',
        status: 'Pendente',
        cep: document.getElementById('cep').value,
        endereco: document.getElementById('endereco').value,
        numero: document.getElementById('numero').value,
        complemento: document.getElementById('complemento').value,
        referencia: document.getElementById('referencia').value,
        cidade: document.getElementById('cidade').value,
        uf: document.getElementById('uf').value,
    };

    const { data: newOrder, error: orderError } = await supabase
        .from('pedidos')
        .insert(orderData)
        .select()
        .single();

    if (orderError) {
        console.error('Erro ao criar pedido:', orderError);
        alert('Houve um erro ao processar seu pedido. Tente novamente.');
        button.disabled = false;
        spinner.classList.add('d-none');
        return;
    }

    const orderItems = cart.map(item => ({
        pedido_id: newOrder.id,
        produto_id: item.id,
        quantidade: item.quantity,
        valor_unitario: parseFloat(item.value || item.price)
    }));

    const { error: itemsError } = await supabase
        .from('itens_pedido')
        .insert(orderItems);

    if (itemsError) {
        console.error('Erro ao salvar itens do pedido:', itemsError);
        await supabase.from('pedidos').delete().eq('id', newOrder.id);
        alert('Houve um erro ao salvar os itens do seu pedido. Tente novamente.');
        button.disabled = false;
        spinner.classList.add('d-none');
        return;
    }

    localStorage.removeItem('cart');
    alert('Compra finalizada com sucesso! Acompanhe o status do seu pedido na área "Meus Pedidos".');
    window.location.href = 'meuspedidos.html';
}