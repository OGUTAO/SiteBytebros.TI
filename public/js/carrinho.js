// Garante que o DOM está totalmente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const subtotalValueEl = document.getElementById('subtotal-value');
    const totalValueEl = document.getElementById('total-value');
    const checkoutBtn = document.getElementById('checkout-btn');
    const deliveryForm = document.getElementById('delivery-form');
    const cepInput = document.getElementById('cep');
    const cepBtn = document.getElementById('cep-btn');

    // Formata um número para o padrão de moeda brasileira (BRL)
    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Renderiza (desenha) os itens do carrinho na tela
    function renderCart() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartItemsContainer.innerHTML = ''; // Limpa a lista antes de redesenhar

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-muted">Seu carrinho está vazio.</p>';
            checkoutBtn.disabled = true; // Desabilita o botão de finalizar
        } else {
            const itemList = document.createElement('div');
            itemList.className = 'list-group list-group-flush';

            cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'list-group-item d-flex align-items-center flex-wrap';
                itemEl.innerHTML = `
                    <div class="flex-shrink-0">
                        <img src="${item.image || 'img/default_product.jpg'}" alt="${item.name}" class="cart-item-img">
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <h6 class="my-0">${item.name}</h6>
                        <small class="text-muted">${formatCurrency(item.value)}</small>
                    </div>
                    <div class="d-flex align-items-center my-2 my-md-0 quantity-controls">
                        <button class="btn btn-sm btn-outline-secondary" data-id="${item.id}" data-change="-1">-</button>
                        <input type="number" class="form-control form-control-sm mx-2" value="${item.quantity}" min="1" data-id="${item.id}" readonly>
                        <button class="btn btn-sm btn-outline-secondary" data-id="${item.id}" data-change="1">+</button>
                    </div>
                    <div class="ms-auto ms-md-3 fw-bold">
                        ${formatCurrency(item.value * item.quantity)}
                    </div>
                    <button class="btn btn-sm btn-outline-danger ms-3" data-id="${item.id}" data-action="remove">
                        <i class="bi bi-trash"></i>
                    </button>
                `;
                itemList.appendChild(itemEl);
            });

            cartItemsContainer.appendChild(itemList);
            checkoutBtn.disabled = false;
        }
        updateSummary();
        attachEventListeners();
    }

    // Atualiza o resumo de subtotal, frete e total
    function updateSummary() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const subtotal = cart.reduce((acc, item) => acc + (item.value * item.quantity), 0);
        
        subtotalValueEl.textContent = formatCurrency(subtotal);
        
        // Lógica de frete: frete fixo se houver itens, senão é zero.
        const shipping = subtotal > 0 ? 25.50 : 0;
        document.getElementById('shipping-value').textContent = formatCurrency(shipping);

        const total = subtotal + shipping;
        totalValueEl.textContent = formatCurrency(total);
    }
    
    // Atualiza a quantidade de um item no carrinho
    function updateCart(productId, change) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const itemIndex = cart.findIndex(item => String(item.id) === String(productId));

        if (itemIndex > -1) {
            cart[itemIndex].quantity += change;
            if (cart[itemIndex].quantity <= 0) {
                cart.splice(itemIndex, 1); // Remove o item se a quantidade for 0 ou menor
            }
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart(); // Redesenha o carrinho com os novos dados
    }

    // Remove um item completamente do carrinho
    function removeFromCart(productId) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = cart.filter(item => String(item.id) !== String(productId));
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    // Adiciona os eventos de clique para os botões de controle
    function attachEventListeners() {
        cartItemsContainer.querySelectorAll('button[data-change]').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.id;
                const change = parseInt(button.dataset.change);
                updateCart(productId, change);
            });
        });
        cartItemsContainer.querySelectorAll('button[data-action="remove"]').forEach(button => {
            button.addEventListener('click', () => {
                const productId = button.dataset.id;
                removeFromCart(productId);
            });
        });
    }
    
    // Busca o CEP usando a API ViaCEP
    async function fetchCep(cep) {
        const cepBtnIcon = cepBtn.querySelector('.bi');
        const cepBtnSpinner = cepBtn.querySelector('.cep-loading');
        
        cepBtnIcon.style.display = 'none';
        cepBtnSpinner.style.display = 'inline-block';

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('CEP não encontrado.');
            const data = await response.json();
            if (data.erro) throw new Error('CEP inválido.');
            
            // Preenche os campos do formulário com os dados retornados
            document.getElementById('endereco').value = data.logradouro;
            document.getElementById('bairro').value = data.bairro;
            document.getElementById('cidade').value = data.localidade;
            document.getElementById('uf').value = data.uf;
            document.getElementById('numero').focus(); // Move o cursor para o campo "Número"

        } catch (error) {
            alert(error.message);
        } finally {
            cepBtnIcon.style.display = 'inline-block';
            cepBtnSpinner.style.display = 'none';
        }
    }

    // Evento de clique no botão de buscar CEP
    cepBtn.addEventListener('click', () => {
        const cep = cepInput.value.replace(/\D/g, ''); // Remove caracteres não numéricos
        if (cep.length === 8) {
            fetchCep(cep);
        } else {
            alert('Por favor, digite um CEP válido.');
        }
    });
    
    // Evento de clique no botão de ir para o pagamento
    checkoutBtn.addEventListener('click', () => {
        // Verifica se o formulário de endereço é válido
        if (!deliveryForm.checkValidity()) {
            deliveryForm.classList.add('was-validated');
            alert('Por favor, preencha todos os campos obrigatórios do endereço.');
            return;
        }

        // *** ALTERAÇÃO PRINCIPAL AQUI ***
        // Cria um objeto com os dados de endereço em vez de um texto único
        const deliveryAddress = {
            cep: document.getElementById('cep').value,
            endereco: document.getElementById('endereco').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            uf: document.getElementById('uf').value,
        };
        
        // Salva o objeto como um texto JSON no localStorage
        localStorage.setItem('deliveryAddress', JSON.stringify(deliveryAddress));
        
        // Redireciona para a página de pagamento
        window.location.href = 'pagamento.html';
    });

    // Função de inicialização que desenha o carrinho quando a página carrega
    renderCart();
});