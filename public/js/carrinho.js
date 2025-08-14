import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    // Adiciona as funções ao objeto window para que possam ser chamadas pelo HTML (onclick)
    window.updateCartQuantity = updateCartQuantity;
    window.removeFromCart = removeFromCart;
    
    // Verifica se o usuário está logado
    checkUserSession();
    
    // Carrega os itens do carrinho do localStorage
    renderCart();

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
        // Redireciona para o login se não houver sessão ativa, guardando a página atual para voltar depois
        alert("Você precisa estar logado para acessar o carrinho.");
        window.location.href = `login.html?redirect=${window.location.pathname}`;
    }
}

function renderCart() {
    // Usa 'cart' como chave no localStorage, que é mais comum que 'carrinho'
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('itens-carrinho');
    const checkoutButton = document.getElementById('finalizar-compra-btn');
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<li class="list-group-item text-center text-muted">Seu carrinho está vazio.</li>';
        if (checkoutButton) checkoutButton.classList.add('disabled');
        updateSummary(0);
        return;
    }

    if (checkoutButton) checkoutButton.classList.remove('disabled');

    let subtotal = 0;
    cart.forEach((item, index) => {
        // Garante que o preço e a quantidade são números
        const price = parseFloat(item.value || item.price || 0);
        const quantity = parseInt(item.quantity || 1);

        const itemElement = document.createElement('li');
        itemElement.className = 'list-group-item d-flex align-items-center';
        itemElement.innerHTML = `
            <img src="${item.imageUrl || item.image?.String || 'img/default_product.jpg'}" alt="${item.name}" class="img-fluid rounded me-3" style="width: 60px; height: 60px; object-fit: cover;">
            <div class="flex-grow-1">
                <h6 class="my-0">${item.name}</h6>
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
        cartItemsContainer.appendChild(itemElement);
        subtotal += price * quantity;
    });

    updateSummary(subtotal);
}

function updateSummary(subtotal) {
    const subtotalEl = document.getElementById('valor-subtotal');
    const totalEl = document.getElementById('valor-total');
    if(subtotalEl) subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
    if(totalEl) totalEl.textContent = `R$ ${subtotal.toFixed(2)}`; // Adicionar frete aqui se houver
}

function updateCartQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            // Remove o item se a quantidade for zero ou menos
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
    const cep = cepInput.value.replace(/\D/g, ''); // Remove caracteres não numéricos
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
            document.getElementById('endereco').value = data.logradouro;
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

    // 1. Validar formulário
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        alert('Por favor, preencha todos os campos de endereço obrigatórios.');
        return;
    }
    
    button.disabled = true;
    spinner.classList.remove('d-none');

    // 2. Obter dados
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
    
    const valorTotal = cart.reduce((acc, item) => acc + (parseFloat(item.value || item.price) * item.quantity), 0);

    // 3. Montar objeto do pedido com os novos campos
    const orderData = {
        usuario_id: user.id,
        valor_total: valorTotal,
        forma_pagamento: 'Pagamento na Entrega', // Valor padrão
        status: 'Pendente',
        // Novos campos de endereço
        cep: document.getElementById('cep').value,
        endereco: document.getElementById('endereco').value,
        numero: document.getElementById('numero').value,
        complemento: document.getElementById('complemento').value,
        referencia: document.getElementById('referencia').value,
        cidade: document.getElementById('cidade').value,
        uf: document.getElementById('uf').value,
    };

    // 4. Inserir na tabela 'pedidos'
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

    // 5. Inserir na tabela 'itens_pedido'
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
        await supabase.from('pedidos').delete().eq('id', newOrder.id); // Rollback
        alert('Houve um erro ao salvar os itens do seu pedido. Tente novamente.');
        button.disabled = false;
        spinner.classList.add('d-none');
        return;
    }

    // 6. Limpar e redirecionar
    localStorage.removeItem('cart');
    alert('Compra finalizada com sucesso! Acompanhe o status do seu pedido na área "Meus Pedidos".');
    window.location.href = 'meuspedidos.html';
}