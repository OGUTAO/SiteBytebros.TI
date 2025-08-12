document.addEventListener('DOMContentLoaded', () => {
    const itensCarrinhoLista = document.getElementById('itens-carrinho');
    const valorSubtotalEl = document.getElementById('valor-subtotal');
    const valorFreteEl = document.getElementById('valor-frete');
    const valorTotalEl = document.getElementById('valor-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const enderecoInput = document.getElementById('endereco-input');
    const cepInput = document.getElementById('cep-destino');
    const calcularFreteBtn = document.getElementById('calcular-frete-btn');

    let carrinho = JSON.parse(localStorage.getItem('cart')) || [];
    let valorFrete = 0;

    function salvarCarrinho() {
        localStorage.setItem('cart', JSON.stringify(carrinho));
    }

    function renderizarCarrinho() {
        itensCarrinhoLista.innerHTML = '';
        if (carrinho.length === 0) {
            itensCarrinhoLista.innerHTML = '<li class="list-group-item text-center text-muted">Seu carrinho está vazio.</li>';
        } else {
            carrinho.forEach(item => {
                const itemEl = document.createElement('li');
                itemEl.className = 'list-group-item d-flex align-items-center';
                itemEl.innerHTML = `
                    <img src="${item.image?.String || 'img/default_product.jpg'}" alt="${item.name}" width="60" class="me-3 rounded">
                    <div class="flex-grow-1">
                        <h6 class="my-0">${item.name}</h6>
                        <small class="text-muted">R$ ${parseFloat(item.value).toFixed(2)}</small>
                    </div>
                    <div class="input-group" style="width: 120px;">
                        <button class="btn btn-outline-secondary btn-sm" type="button" data-id="${item.id}" data-delta="-1">-</button>
                        <input type="text" class="form-control form-control-sm text-center" value="${item.quantity}" readonly>
                        <button class="btn btn-outline-secondary btn-sm" type="button" data-id="${item.id}" data-delta="1">+</button>
                    </div>
                    <strong class="mx-3">R$ ${(item.value * item.quantity).toFixed(2)}</strong>
                    <button class="btn btn-sm btn-outline-danger" data-id="${item.id}"><i class="bi bi-trash"></i></button>
                `;
                itensCarrinhoLista.appendChild(itemEl);
            });
        }
        adicionarEventListeners();
        atualizarResumo();
    }
    
    function adicionarEventListeners() {
        // Event listeners para os botões de quantidade e remoção
        itensCarrinhoLista.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (e.currentTarget.classList.contains('bi-trash')) { // Botão de remover
                    carrinho = carrinho.filter(item => String(item.id) !== id);
                } else { // Botões de +/-
                    const delta = parseInt(e.currentTarget.dataset.delta);
                    const item = carrinho.find(item => String(item.id) === id);
                    if (item) {
                        item.quantity += delta;
                        if (item.quantity < 1) item.quantity = 1;
                    }
                }
                salvarCarrinho();
                renderizarCarrinho();
            });
        });
    }

    function atualizarResumo() {
        const subtotal = carrinho.reduce((acc, item) => acc + (item.value * item.quantity), 0);
        valorSubtotalEl.textContent = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        valorFreteEl.textContent = valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        valorTotalEl.textContent = (subtotal + valorFrete).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        validarCheckout();
    }
    
    function validarCheckout() {
        const enderecoValido = enderecoInput.value.trim() !== '';
        if (carrinho.length > 0 && enderecoValido && valorFrete > 0) {
            checkoutBtn.classList.remove('disabled');
        } else {
            checkoutBtn.classList.add('disabled');
        }
    }

    // Simulação de cálculo de frete
    calcularFreteBtn.addEventListener('click', () => {
        if (cepInput.value.trim().length >= 8) {
            valorFrete = 25.50; // Valor fixo para simulação
            alert('Frete calculado com sucesso!');
        } else {
            valorFrete = 0;
            alert('Por favor, insira um CEP válido.');
        }
        atualizarResumo();
    });

    // Salvar endereço no localStorage
    enderecoInput.addEventListener('input', () => {
        localStorage.setItem('enderecoEntrega', enderecoInput.value);
        validarCheckout();
    });
    
    // Carregar dados iniciais
    enderecoInput.value = localStorage.getItem('enderecoEntrega') || '';
    renderizarCarrinho();
});