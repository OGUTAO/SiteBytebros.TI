import { supabase } from './supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const addressForm = document.getElementById('address-form');
    const saveAddressBtn = document.getElementById('save-address-btn');
    const addressModalEl = document.getElementById('addressModal');
    const addressModal = new bootstrap.Modal(addressModalEl);
    const addressListContainer = document.getElementById('address-list');
    const modalTitle = document.getElementById('modalTitle');
    
    let currentUser = null;
    let editingAddressId = null;

    // Função para buscar e exibir os endereços do usuário
    async function loadAddresses() {
        if (!currentUser) return;
        addressListContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';

        const { data: addresses, error } = await supabase
            .from('enderecos')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('criado_em', { ascending: false });

        if (error) {
            addressListContainer.innerHTML = '<div class="alert alert-danger">Erro ao carregar endereços.</div>';
            console.error(error);
            return;
        }

        if (addresses.length === 0) {
            addressListContainer.innerHTML = '<p class="text-muted text-center">Nenhum endereço cadastrado ainda.</p>';
            return;
        }

        addressListContainer.innerHTML = '';
        addresses.forEach(renderAddress);
    }

    // Função para renderizar um único cartão de endereço
    function renderAddress(address) {
        const addressEl = document.createElement('div');
        addressEl.className = 'list-group-item list-group-item-action';
        addressEl.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${address.apelido}</h5>
                <div>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${address.id}"><i class="bi bi-pencil-fill"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${address.id}"><i class="bi bi-trash-fill"></i></button>
                </div>
            </div>
            <p class="mb-1">${address.endereco}, ${address.numero} ${address.complemento ? '- ' + address.complemento : ''}</p>
            <small>${address.bairro}, ${address.cidade} - ${address.uf}, CEP: ${address.cep}</small>
        `;
        addressListContainer.appendChild(addressEl);
    }

    // Evento de submit do formulário (para salvar ou atualizar)
    addressForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!addressForm.checkValidity()) {
            addressForm.classList.add('was-validated');
            return;
        }

        saveAddressBtn.disabled = true;
        saveAddressBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Salvando...';

        const addressData = {
            user_id: currentUser.id,
            apelido: document.getElementById('apelido').value,
            cep: document.getElementById('cep').value,
            endereco: document.getElementById('endereco').value,
            numero: document.getElementById('numero').value,
            complemento: document.getElementById('complemento').value,
            referencia: document.getElementById('referencia').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            uf: document.getElementById('uf').value.toUpperCase(),
        };

        let response;
        if (editingAddressId) {
            // Atualizar endereço existente
            response = await supabase.from('enderecos').update(addressData).eq('id', editingAddressId);
        } else {
            // Inserir novo endereço
            response = await supabase.from('enderecos').insert([addressData]);
        }
        
        if (response.error) {
            alert('Erro ao salvar endereço: ' + response.error.message);
        } else {
            addressModal.hide();
            await loadAddresses(); // Recarrega a lista
        }

        saveAddressBtn.disabled = false;
        saveAddressBtn.innerHTML = 'Salvar Endereço';
    });

    // Listener para os botões de editar e deletar
    addressListContainer.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (editBtn) {
            editingAddressId = editBtn.dataset.id;
            const { data: address, error } = await supabase.from('enderecos').select('*').eq('id', editingAddressId).single();
            if (error) {
                alert("Erro ao carregar dados do endereço.");
                return;
            }
            // Preenche o formulário
            document.getElementById('apelido').value = address.apelido;
            document.getElementById('cep').value = address.cep;
            document.getElementById('endereco').value = address.endereco;
            document.getElementById('numero').value = address.numero;
            document.getElementById('complemento').value = address.complemento;
            document.getElementById('referencia').value = address.referencia;
            document.getElementById('bairro').value = address.bairro;
            document.getElementById('cidade').value = address.cidade;
            document.getElementById('uf').value = address.uf;
            
            modalTitle.textContent = 'Editar Endereço';
            addressModal.show();
        }

        if (deleteBtn) {
            const addressId = deleteBtn.dataset.id;
            if (confirm('Tem certeza que deseja excluir este endereço?')) {
                const { error } = await supabase.from('enderecos').delete().eq('id', addressId);
                if (error) {
                    alert('Erro ao excluir endereço: ' + error.message);
                } else {
                    await loadAddresses();
                }
            }
        }
    });

    // Limpa o formulário quando o modal é fechado
    addressModalEl.addEventListener('hidden.bs.modal', () => {
        addressForm.reset();
        addressForm.classList.remove('was-validated');
        editingAddressId = null;
        modalTitle.textContent = 'Adicionar Novo Endereço';
    });
    
    // Função principal para iniciar a página
    async function initializePage() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = session.user;
        await loadAddresses();
    }

    initializePage();
});