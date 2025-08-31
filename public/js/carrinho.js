import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const subtotalValueEl = document.getElementById('subtotal-value');
    const totalValueEl = document.getElementById('total-value');
    const checkoutBtn = document.getElementById('checkout-btn');
    const deliveryForm = document.getElementById('delivery-form');
    const cepInput = document.getElementById('cep');
    const cepBtn = document.getElementById('cep-btn');
    const addressSelectionContainer = document.getElementById('address-selection-container');
    const savedAddressesSelect = document.getElementById('saved-addresses');

    function formatCurrency(value) {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function renderCart() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartItemsContainer.innerHTML = ''; 

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center text-muted">Seu carrinho está vazio.</p>';
            checkoutBtn.disabled = true; 
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
                        <br>
                        <small class="text-muted">Estoque: ${item.stock}</small>
                    </div>
                    <div class="d-flex align-items-center my-2 my-md-0 quantity-controls">
                        <button class="btn btn-sm btn-outline-secondary" data-id="${item.id}" data-change="-1">-</button>
                        <input type="number" class="form-control form-control-sm mx-2" value="${item.quantity}" min="1" max="${item.stock}" data-id="${item.id}" readonly>
                        <button class="btn btn-sm btn-outline-secondary" data-id="${item.id}" data-change="1" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
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

    function updateSummary() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const subtotal = cart.reduce((acc, item) => acc + (item.value * item.quantity), 0);
        
        subtotalValueEl.textContent = formatCurrency(subtotal);
        
        const shipping = subtotal > 0 ? 25.50 : 0;
        document.getElementById('shipping-value').textContent = formatCurrency(shipping);

        const total = subtotal + shipping;
        totalValueEl.textContent = formatCurrency(total);
    }
    
    function updateCart(productId, change) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const itemIndex = cart.findIndex(item => String(item.id) === String(productId));

        if (itemIndex > -1) {
            const item = cart[itemIndex];
            const newQuantity = item.quantity + change;

            if (change > 0 && newQuantity > item.stock) {
                alert(`Limite de estoque atingido para "${item.name}". Apenas ${item.stock} unidades disponíveis.`);
                return;
            }
            
            item.quantity = newQuantity;

            if (item.quantity <= 0) {
                cart.splice(itemIndex, 1);
            }
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

    function removeFromCart(productId) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = cart.filter(item => String(item.id) !== String(productId));
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }

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
                if (confirm('Deseja remover este item do carrinho?')) {
                    const productId = button.dataset.id;
                    removeFromCart(productId);
                }
            });
        });
    }
    
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
            
            document.getElementById('endereco').value = data.logradouro;
            document.getElementById('bairro').value = data.bairro;
            document.getElementById('cidade').value = data.localidade;
            document.getElementById('uf').value = data.uf;
            document.getElementById('numero').focus();

        } catch (error) {
            alert(error.message);
        } finally {
            cepBtnIcon.style.display = 'inline-block';
            cepBtnSpinner.style.display = 'none';
        }
    }

    async function loadAddresses() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            addressSelectionContainer.innerHTML = '<p class="text-muted small">Faça <a href="login.html">login</a> para usar seus endereços salvos.</p>';
            return;
        }

        const { data: addresses, error } = await supabase
            .from('enderecos')
            .select('*')
            .eq('user_id', session.user.id);

        if (error || !addresses || addresses.length === 0) {
            savedAddressesSelect.innerHTML = '<option value="">Nenhum endereço salvo. Preencha abaixo.</option>';
            return;
        }

        savedAddressesSelect.innerHTML = '<option value="">Selecione um endereço...</option>';
        addresses.forEach(addr => {
            const option = document.createElement('option');
            option.value = addr.id;
            option.textContent = `${addr.apelido} - ${addr.endereco}, ${addr.numero}`;
            option.dataset.address = JSON.stringify(addr);
            savedAddressesSelect.appendChild(option);
        });

        savedAddressesSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                const selectedOption = e.target.options[e.target.selectedIndex];
                const address = JSON.parse(selectedOption.dataset.address);
                document.getElementById('cep').value = address.cep;
                document.getElementById('endereco').value = address.endereco;
                document.getElementById('numero').value = address.numero;
                document.getElementById('complemento').value = address.complemento || '';
                document.getElementById('referencia').value = address.referencia || '';
                document.getElementById('bairro').value = address.bairro;
                document.getElementById('cidade').value = address.cidade;
                document.getElementById('uf').value = address.uf;
            }
        });
    }

    cepBtn.addEventListener('click', () => {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length === 8) {
            fetchCep(cep);
        } else {
            alert('Por favor, digite um CEP válido.');
        }
    });
    
    checkoutBtn.addEventListener('click', () => {
        if (!deliveryForm.checkValidity()) {
            deliveryForm.classList.add('was-validated');
            alert('Por favor, preencha todos os campos obrigatórios do endereço.');
            return;
        }

        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const itemOverStock = cart.find(item => item.quantity > item.stock);

        if (itemOverStock) {
            alert(`O produto "${itemOverStock.name}" tem mais itens no carrinho do que o disponível em estoque. Por favor, ajuste a quantidade.`);
            return; 
        }

        const deliveryAddress = {
            cep: document.getElementById('cep').value,
            endereco: document.getElementById('endereco').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value,
            referencia: document.getElementById('referencia').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            uf: document.getElementById('uf').value,
        };
        
        localStorage.setItem('deliveryAddress', JSON.stringify(deliveryAddress));
        
        window.location.href = 'pagamento.html';
    });

    renderCart();
    loadAddresses();
});