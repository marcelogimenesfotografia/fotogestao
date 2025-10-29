// app.js (Versão 3.1 - SINTAXE V8 e 100% MODAIS)

// --- Variáveis Globais de Estado ---
let currentUser = null;
let currentUserId = null;
let clientCache = []; 
let calendar = null; 
let isCalendarInitialized = false;
let genericConfirmCallback = null; // Para o modal de confirmação genérico
let genericCancelCallback = null;

// --- Seletores de DOM (Auth) ---
const authContainer = document.getElementById('auth-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authError = document.getElementById('auth-error');
const btnLogin = document.getElementById('btn-login');
const btnSignup = document.getElementById('btn-signup');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');

// --- Seletores de DOM (App Layout) ---
const appContainer = document.getElementById('app-container');
const sidebar = document.querySelector('.sidebar');
const btnMenuToggle = document.getElementById('btn-menu-toggle');
const pageTitle = document.getElementById('page-title');
const appNav = document.querySelector('.sidebar-nav');
const allPages = document.querySelectorAll('#app-content .page');
const userBusinessName = document.getElementById('user-business-name');
const btnLogout = document.getElementById('btn-logout');

// --- Seletores (Página Clientes) ---
const clientsList = document.getElementById('clients-list');
const searchClient = document.getElementById('search-client');
const btnShowAddClient = document.getElementById('btn-show-add-client');

// --- Seletores (Página Agenda) ---
const calendarEl = document.getElementById('calendar');
const btnShowAddEvent = document.getElementById('btn-show-add-event');
const btnViewMonth = document.getElementById('btn-view-month');
const btnViewWeek = document.getElementById('btn-view-week');
const btnViewList = document.getElementById('btn-view-list');

// --- Seletores (Páginas Financeiro/Config) ---
const formAddTransaction = document.getElementById('form-add-transaction');
const transactionsList = document.getElementById('transactions-list');
const formSettings = document.getElementById('form-settings');

// --- Seletores (Dashboard) ---
const summaryEventos = document.getElementById('summary-eventos');
const summaryFinanceiro = document.getElementById('summary-financeiro');

// --- Seletores (Modais de Conteúdo) ---
const modalAddClient = document.getElementById('modal-add-client');
const modalAddEvent = document.getElementById('modal-add-event');
const modalClientDetails = document.getElementById('modal-client-details');
const modalConfirmDelete = document.getElementById('modal-confirm-delete');

// --- Seletores (Modais Genéricos - NOVOS) ---
const modalMessage = document.getElementById('modal-message');
const modalMessageTitle = document.getElementById('modal-message-title');
const modalMessageText = document.getElementById('modal-message-text');
const modalConfirmGeneric = document.getElementById('modal-confirm-generic');
const modalConfirmGenericTitle = document.getElementById('modal-confirm-generic-title');
const modalConfirmGenericText = document.getElementById('modal-confirm-generic-text');
const btnConfirmGenericOk = document.getElementById('btn-confirm-generic-ok');
const btnConfirmGenericCancel = document.getElementById('btn-confirm-generic-cancel');

// --- Seletores (Form Novo Cliente) ---
const formAddClient = document.getElementById('form-add-client');
const modalClientTitle = document.getElementById('modal-client-title');
const clientTypeSelect = document.getElementById('client-type');
const fieldsPf = document.getElementById('fields-pf');
const fieldsPj = document.getElementById('fields-pj');
const cepInput = document.getElementById('client-cep');
const editingClientId = document.getElementById('editing-client-id');
const btnSaveClient = document.getElementById('btn-save-client');

// --- Seletores (Modal Detalhes Cliente) ---
const detailsClientName = document.getElementById('details-client-name');
const detailsClientContent = document.getElementById('details-client-content');
const btnEditClient = document.getElementById('btn-edit-client');
const btnDeleteClient = document.getElementById('btn-delete-client');

// --- Seletores (Modal Confirmação Exclusão) ---
const deleteItemName = document.getElementById('delete-item-name');
const deleteItemId = document.getElementById('delete-item-id');
const deleteItemCollection = document.getElementById('delete-item-collection');
const btnConfirmDeleteAction = document.getElementById('btn-confirm-delete-action');


// --- 1. LÓGICA DE AUTENTICAÇÃO (SINTAXE V8) ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user; currentUserId = user.uid;
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex';
        loadUserData();
        navigateTo('inicial');
        lucide.createIcons(); 
    } else {
        currentUser = null; currentUserId = null;
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
        if (calendar) { calendar.destroy(); isCalendarInitialized = false; }
    }
});
// Processar Cadastro (Signup)
btnSignup.addEventListener('click', async () => {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    if (!name || !email || !password) { authError.textContent = 'Preencha todos os campos.'; return; }
    authError.textContent = ''; btnSignup.disabled = true; btnSignup.textContent = 'Criando...';
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await db.collection('users').doc(user.uid).set({
            businessName: name, email: email, createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        authError.textContent = getFirebaseAuthErrorMessage(error);
    } finally {
        btnSignup.disabled = false; btnSignup.textContent = 'Criar Conta';
    }
});
// Processar Login
btnLogin.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (!email || !password) { authError.textContent = 'Preencha email e senha.'; return; }
    authError.textContent = ''; btnLogin.disabled = true; btnLogin.textContent = 'Entrando...';
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        authError.textContent = getFirebaseAuthErrorMessage(error);
    } finally {
        btnLogin.disabled = false; btnLogin.textContent = 'Entrar';
    }
});
btnLogout.addEventListener('click', async () => { await auth.signOut(); });
showSignup.addEventListener('click', (e) => { e.preventDefault(); loginForm.style.display = 'none'; signupForm.style.display = 'block'; authError.textContent = ''; });
showLogin.addEventListener('click', (e) => { e.preventDefault(); loginForm.style.display = 'block'; signupForm.style.display = 'none'; authError.textContent = ''; });


// --- 2. LÓGICA DE NAVEGAÇÃO ---
appNav.addEventListener('click', (e) => {
    const navBtn = e.target.closest('.nav-btn');
    if (navBtn) {
        const pageName = navBtn.dataset.page;
        navigateTo(pageName);
        if (window.innerWidth <= 768) { // Fecha o menu no mobile
            sidebar.classList.remove('open');
        }
    }
});
function navigateTo(pageName) {
    allPages.forEach(page => page.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');
    const pageTitles = {
        'inicial': 'Inicial', 'clientes': 'Clientes', 'agenda': 'Agenda',
        'financeiro': 'Financeiro', 'configuracoes': 'Configurações'
    };
    pageTitle.textContent = pageTitles[pageName] || 'FotoCRM';
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageName);
    });
    loadPageData(pageName);
}
btnMenuToggle.addEventListener('click', () => { sidebar.classList.toggle('open'); });


// --- 3. GESTÃO DE MODAIS (100% SEM ALERTS) ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.add('active');
        lucide.createIcons(); // Recria ícones dentro do modal
    }
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.classList.remove('active');
}

// Listeners para fechar modais (botão X e fundo)
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        // Se clicar no fundo (o próprio modal) ou num botão .modal-close-btn
        if (e.target === modal || e.target.closest('.modal-close-btn')) {
            // Exceção para o modal de confirmação genérico (só fecha no cancelar)
            if(modal.id === 'modal-confirm-generic' && !e.target.closest('#btn-confirm-generic-cancel')) {
                // Não fecha se clicar no OK ou no fundo
                if(e.target === modal) return; 
            }
            closeModal(modal.id);
        }
    });
});

// Listeners para abrir modais de CONTEÚDO
btnShowAddClient.addEventListener('click', () => {
    formAddClient.reset();
    editingClientId.value = '';
    modalClientTitle.textContent = 'Novo Cliente';
    btnSaveClient.textContent = 'Salvar Cliente';
    toggleClientFields('PF');
    openModal('modal-add-client');
});
btnShowAddEvent.addEventListener('click', () => openModal('modal-add-event'));

// Funções para Modais GENÉRICOS (Substitutos de Alert/Confirm)
function openModalMessage(message, title = 'Aviso') {
    modalMessageText.innerHTML = message; // .innerHTML para permitir <br>
    modalMessageTitle.textContent = title;
    openModal('modal-message');
}

function openModalConfirm(message, onConfirm, onCancel = null, title = 'Confirmação') {
    modalConfirmGenericText.innerHTML = message;
    modalConfirmGenericTitle.textContent = title;
    genericConfirmCallback = onConfirm; // Armazena o callback
    genericCancelCallback = onCancel;
    openModal('modal-confirm-generic');
}

// Listeners para os botões de confirmação genérica
btnConfirmGenericOk.addEventListener('click', () => {
    if (typeof genericConfirmCallback === 'function') {
        genericConfirmCallback();
    }
    closeModal('modal-confirm-generic');
});
btnConfirmGenericCancel.addEventListener('click', () => {
    if (typeof genericCancelCallback === 'function') {
        genericCancelCallback();
    }
    closeModal('modal-confirm-generic');
});


// --- 4. CARREGAMENTO DE DADOS DAS PÁGINAS ---
async function loadPageData(pageName) {
    switch (pageName) {
        case 'inicial': loadDashboard(); break;
        case 'clientes': loadClients(); break;
        case 'agenda': await loadClientsForSelect(); initializeCalendar(); break;
        case 'financeiro': await loadClientsForSelect(); loadTransactions(); break;
        case 'configuracoes': loadSettings(); break;
    }
}
async function loadUserData() {
    if (!currentUserId) return;
    const userDoc = await db.collection('users').doc(currentUserId).get();
    if (userDoc.exists) {
        userBusinessName.textContent = userDoc.data().businessName;
    }
}


// --- 5. MÓDULO: DASHBOARD ---
async function loadDashboard() { loadSummaryEvents(); loadSummaryFinance(); }
async function loadSummaryEvents() {
    if (!currentUserId) return; summaryEventos.innerHTML = '<p>Carregando...</p>';
    const now = firebase.firestore.Timestamp.now();
    const query = db.collection('events').where('userId', '==', currentUserId).where('start', '>=', now).orderBy('start', 'asc').limit(3);
    const snapshot = await query.get();
    if (snapshot.empty) { summaryEventos.innerHTML = '<p>Nenhum evento futuro.</p>'; return; }
    summaryEventos.innerHTML = '';
    snapshot.forEach(doc => {
        const event = doc.data();
        summaryEventos.innerHTML += `<div class="list-item"><div class="list-item-info"><h4>${event.title}</h4><p>${formatFirebaseTimestamp(event.start)}</p></div></div>`;
    });
}
async function loadSummaryFinance() {
     if (!currentUserId) return; summaryFinanceiro.innerHTML = '<p>Carregando...</p>';
    const query = db.collection('transactions').where('userId', '==', currentUserId).where('status', '==', 'pending').where('type', '==', 'income').orderBy('date', 'asc').limit(3);
    const snapshot = await query.get();
    if (snapshot.empty) { summaryFinanceiro.innerHTML = '<p>Nenhum pagamento pendente.</p>'; return; }
    summaryFinanceiro.innerHTML = '';
    snapshot.forEach(doc => {
        const trans = doc.data();
        summaryFinanceiro.innerHTML += `<div class="list-item"><div class="list-item-info"><h4>${trans.description}</h4><p class="amount income">${formatCurrency(trans.amount)}</p></div></div>`;
    });
}


// --- 6. MÓDULO: CLIENTES (100% Modais) ---

// Toggle PF/PJ
clientTypeSelect.addEventListener('change', (e) => toggleClientFields(e.target.value));
function toggleClientFields(type) {
    fieldsPf.style.display = (type === 'PF') ? 'block' : 'none';
    fieldsPj.style.display = (type === 'PJ') ? 'block' : 'none';
}

// Auto-preenchimento ViaCEP (CORRIGIDO: usa openModalMessage)
cepInput.addEventListener('blur', async (e) => {
    const cep = e.target.value.replace(/\D/g, ''); 
    if (cep.length !== 8) return;
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error('CEP não encontrado');
        const data = await response.json();
        
        if (data.erro) {
            openModalMessage('CEP não encontrado.', 'Erro de CEP');
            return;
        }
        
        formAddClient.querySelector('#client-address').value = data.logradouro;
        formAddClient.querySelector('#client-neighborhood').value = data.bairro;
        formAddClient.querySelector('#client-city').value = data.localidade;
        formAddClient.querySelector('#client-state').value = data.uf;
        formAddClient.querySelector('#client-number').focus();
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        openModalMessage('Não foi possível buscar o CEP. Verifique sua conexão.', 'Erro de Rede');
    }
});

// Adicionar/Atualizar Cliente
formAddClient.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;
    
    const clientId = editingClientId.value;
    const clientType = clientTypeSelect.value;

    let clientData = {
        userId: currentUserId,
        type: clientType,
        email: formAddClient.querySelector('#client-email').value,
        phone: formAddClient.querySelector('#client-phone').value,
        cep: formAddClient.querySelector('#client-cep').value,
        address: formAddClient.querySelector('#client-address').value,
        number: formAddClient.querySelector('#client-number').value,
        neighborhood: formAddClient.querySelector('#client-neighborhood').value,
        city: formAddClient.querySelector('#client-city').value,
        state: formAddClient.querySelector('#client-state').value,
    };

    if (clientType === 'PF') {
        clientData = { ...clientData,
            name: formAddClient.querySelector('#client-name-pf').value,
            cpf: formAddClient.querySelector('#client-cpf').value,
            rg: formAddClient.querySelector('#client-rg').value,
            dob: formAddClient.querySelector('#client-dob').value,
        };
    } else { // PJ
        clientData = { ...clientData,
            name: formAddClient.querySelector('#client-razaoSocial').value, // 'name' será a Razão Social
            razaoSocial: formAddClient.querySelector('#client-razaoSocial').value,
            cnpj: formAddClient.querySelector('#client-cnpj').value,
            contactName: formAddClient.querySelector('#client-contactName-pj').value,
        };
    }

    try {
        btnSaveClient.disabled = true;
        if (clientId) {
            btnSaveClient.textContent = 'Atualizando...';
            await db.collection('clients').doc(clientId).update(clientData);
        } else {
            btnSaveClient.textContent = 'Salvando...';
            await db.collection('clients').add({
                ...clientData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        formAddClient.reset();
        closeModal('modal-add-client');
        loadClients();
        loadClientsForSelect();
        
    } catch (error) {
        console.error("Erro ao salvar cliente: ", error);
        openModalMessage("Erro ao salvar cliente. Verifique o console.", "Erro");
    } finally {
        btnSaveClient.disabled = false;
        btnSaveClient.textContent = 'Salvar Cliente';
    }
});

// Carregar Clientes (Lista)
async function loadClients() {
    if (!currentUserId) return;
    clientsList.innerHTML = '<p>Carregando clientes...</p>';
    const snapshot = await db.collection('clients')
        .where('userId', '==', currentUserId)
        .orderBy('name', 'asc').get();

    if (snapshot.empty) {
        clientsList.innerHTML = '<p>Nenhum cliente cadastrado.</p>'; return;
    }
    clientsList.innerHTML = '';
    snapshot.forEach(doc => {
        const client = doc.data();
        const displayName = client.name || client.razaoSocial;
        const displaySub = client.type === 'PF' ? (client.email || 'Sem email') : (`Contato: ${client.contactName}` || 'Sem contato');

        clientsList.innerHTML += `
            <div class="list-item" data-id="${doc.id}">
                <div class="list-item-info">
                    <h4>${displayName}</h4>
                    <p>${displaySub}</p>
                </div>
                <div class="list-item-actions">
                    <button class="details-btn" data-id="${doc.id}">Detalhes</button>
                    <button class="delete-btn" data-id="${doc.id}" data-name="${displayName}" data-collection="clients">Excluir</button>
                </div>
            </div>
        `;
    });
}

// Filtro de Clientes
searchClient.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const items = clientsList.querySelectorAll('.list-item');
    items.forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
    });
});

// Ações da Lista de Clientes (Abrir Detalhes ou Modal de Exclusão)
clientsList.addEventListener('click', (e) => {
    const target = e.target;
    if (target.classList.contains('details-btn')) {
        openClientDetailsModal(target.dataset.id);
    }
    if (target.classList.contains('delete-btn')) {
        openDeleteConfirmModal(
            target.dataset.id,
            target.dataset.name,
            target.dataset.collection
        );
    }
});

// Abrir Modal de Detalhes do Cliente
async function openClientDetailsModal(clientId) {
    detailsClientContent.innerHTML = '<p>Carregando...</p>';
    openModal('modal-client-details');
    
    // 1. Buscar Dados do Cliente
    const clientDoc = await db.collection('clients').doc(clientId).get();
    if (!clientDoc.exists) {
        detailsClientContent.innerHTML = '<p>Cliente não encontrado.</p>'; return;
    }
    const client = clientDoc.data();
    detailsClientName.textContent = client.name || client.razaoSocial;
    
    // 2. Buscar Eventos
    const eventsQuery = await db.collection('events')
        .where('userId', '==', currentUserId)
        .where('clientId', '==', clientId)
        .orderBy('start', 'desc').get();
    
    // 3. Buscar Pagamentos
    const transactionsQuery = await db.collection('transactions')
        .where('userId', '==', currentUserId)
        .where('clientId', '==', clientId) 
        .orderBy('date', 'desc').get();

    // 4. Montar HTML do Relatório
    let detailsHtml = `
        <div class="client-details-container">
            <div class="client-details-section">
                <h3>Dados Cadastrais</h3>
                ${generateClientDataHtml(client)}
            </div>
            <div class="client-details-section">
                <h3>Eventos Agendados (${eventsQuery.size})</h3>
                <div class="details-list">
                    ${eventsQuery.empty ? '<p>Nenhum evento encontrado.</p>' : 
                        eventsQuery.docs.map(doc => {
                            const event = doc.data();
                            return `<div class="list-item"><strong>${event.title}</strong> (${formatFirebaseTimestamp(event.start)})</div>`;
                        }).join('')
                    }
                </div>
            </div>
            <div class="client-details-section">
                <h3>Financeiro</h3>
                <div class="details-list">
                    ${transactionsQuery.empty ? '<p>Nenhuma transação encontrada.</p>' : 
                        transactionsQuery.docs.map(doc => {
                            const trans = doc.data();
                            const amountClass = trans.type === 'income' ? 'income' : 'expense';
                            return `<div class="list-item">
                                ${trans.description} 
                                (<span class="amount ${amountClass}">${formatCurrency(trans.amount)}</span>) 
                                - Status: ${trans.status}
                            </div>`;
                        }).join('')
                    }
                </div>
            </div>
            <div class="client-details-section">
                <h3>Contratos</h3>
                <div class="details-list"><p>Nenhum contrato encontrado.</p></div>
            </div>
        </div>
    `;
    
    detailsClientContent.innerHTML = detailsHtml;
    
    // 5. Adicionar Ações aos Botões do Footer
    btnEditClient.onclick = () => {
        closeModal('modal-client-details');
        openEditClientModal(clientId, client);
    };
    btnDeleteClient.onclick = () => {
        openDeleteConfirmModal(clientId, client.name || client.razaoSocial, 'clients');
    };
}

// Helper para gerar o HTML dos dados
function generateClientDataHtml(client) {
    let html = '<div class="details-grid">';
    if (client.type === 'PJ') {
        html += `<div class="details-item" style="grid-column: 1 / 3;"><strong>Razão Social</strong> ${client.razaoSocial || 'N/A'}</div>`;
        html += `<div class="details-item"><strong>CNPJ</strong> ${client.cnpj || 'N/A'}</div>`;
        html += `<div class="details-item"><strong>Contato</strong> ${client.contactName || 'N/A'}</div>`;
    } else { // PF
        html += `<div class="details-item" style="grid-column: 1 / 3;"><strong>Nome Completo</strong> ${client.name || 'N/A'}</div>`;
        html += `<div class="details-item"><strong>CPF</strong> ${client.cpf || 'N/A'}</div>`;
        html += `<div class="details-item"><strong>RG</strong> ${client.rg || 'N/A'}</div>`;
    }
    html += `<div class="details-item"><strong>Email</strong> ${client.email || 'N/A'}</div>`;
    html += `<div class="details-item"><strong>Telefone</strong> ${client.phone || 'N/A'}</div>`;
    html += `<div class="details-item" style="grid-column: 1 / 3;"><strong>Endereço</strong> ${client.address || ''}, ${client.number || ''}</div>`;
    html += `<div class="details-item"><strong>Bairro</strong> ${client.neighborhood || 'N/A'}</div>`;
    html += `<div class="details-item"><strong>Cidade / UF</strong> ${client.city || ''} / ${client.state || ''}</div>`;
    html += '</div>';
    return html;
}

// Abrir Modal de Edição
function openEditClientModal(clientId, client) {
    formAddClient.reset();
    editingClientId.value = clientId;
    modalClientTitle.textContent = 'Editar Cliente';
    btnSaveClient.textContent = 'Atualizar Cliente';
    
    // Preenche os campos
    clientTypeSelect.value = client.type;
    toggleClientFields(client.type);
    
    // Comuns
    formAddClient.querySelector('#client-email').value = client.email || '';
    formAddClient.querySelector('#client-phone').value = client.phone || '';
    formAddClient.querySelector('#client-cep').value = client.cep || '';
    formAddClient.querySelector('#client-address').value = client.address || '';
    formAddClient.querySelector('#client-number').value = client.number || '';
    formAddClient.querySelector('#client-neighborhood').value = client.neighborhood || '';
    formAddClient.querySelector('#client-city').value = client.city || '';
    formAddClient.querySelector('#client-state').value = client.state || '';
    
    if (client.type === 'PF') {
        formAddClient.querySelector('#client-name-pf').value = client.name || '';
        formAddClient.querySelector('#client-cpf').value = client.cpf || '';
        formAddClient.querySelector('#client-rg').value = client.rg || '';
        formAddClient.querySelector('#client-dob').value = client.dob || '';
    } else { // PJ
        formAddClient.querySelector('#client-razaoSocial').value = client.razaoSocial || '';
        formAddClient.querySelector('#client-cnpj').value = client.cnpj || '';
        formAddClient.querySelector('#client-contactName-pj').value = client.contactName || '';
    }
    
    openModal('modal-add-client');
}

// Carregar Clientes para Select
async function loadClientsForSelect() {
    if (!currentUserId) return;
    const snapshot = await db.collection('clients').where('userId', '==', currentUserId).orderBy('name', 'asc').get();
    clientCache = [];
    
    const eventClientSelect = document.getElementById('event-client-select');
    const transClientSelect = document.getElementById('trans-client-select');
    
    eventClientSelect.innerHTML = '<option value="">Selecione...</option>';
    if (transClientSelect) transClientSelect.innerHTML = '<option value="">(Opcional) Vincular a cliente...</option>';
    
    snapshot.forEach(doc => {
        const client = { id: doc.id, ...doc.data() };
        clientCache.push(client);
        const displayName = client.name || client.razaoSocial;
        eventClientSelect.innerHTML += `<option value="${client.id}">${displayName}</option>`;
        if (transClientSelect) transClientSelect.innerHTML += `<option value="${client.id}">${displayName}</option>`;
    });
}


// --- 7. MÓDULO: AGENDA (100% Modais) ---
function initializeCalendar() {
    if (isCalendarInitialized) { calendar.refetchEvents(); return; }
    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'pt-br', initialView: 'dayGridMonth', headerToolbar: false, 
        events: fetchEventsFromFirebase, editable: true, selectable: true,
        select: function(info) {
            openModal('modal-add-event');
            document.getElementById('event-start').value = info.startStr.substring(0, 16);
            document.getElementById('event-end').value = info.endStr.substring(0, 16);
        },
        // CORRIGIDO: usa openModalMessage
        eventClick: function(info) {
            const client = clientCache.find(c => c.id === info.event.extendedProps.clientId);
            const clientName = client ? (client.name || client.razaoSocial) : 'N/A';
            openModalMessage(
                `<strong>Cliente:</strong> ${clientName}<br><strong>Status:</strong> ${info.event.extendedProps.status}`,
                `Evento: ${info.event.title}`
            );
        },
        // CORRIGIDO: usa openModalConfirm
        eventDrop: async function(info) {
            openModalConfirm("Salvar nova data para este evento?", async () => {
                try {
                    await db.collection('events').doc(info.event.id).update({
                        start: info.event.start, end: info.event.end
                    });
                } catch(err) { 
                    console.error("Erro: ", err); 
                    openModalMessage('Erro ao atualizar data.', 'Erro');
                    info.revert(); 
                }
            }, () => info.revert()); // Callback de Cancelar
        }
    });
    calendar.render(); isCalendarInitialized = true;
}

async function fetchEventsFromFirebase(fetchInfo, successCallback, failureCallback) {
    if (!currentUserId) { failureCallback("Usuário não logado"); return; }
    try {
        const snapshot = await db.collection('events').where('userId', '==', currentUserId).where('start', '>=', fetchInfo.start).where('start', '<=', fetchInfo.end).get();
        const events = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id, title: data.title, start: data.start.toDate(), end: data.end.toDate(),
                status: data.status, clientId: data.clientId 
            };
        });
        successCallback(events);
    } catch (error) { console.error("Erro: ", error); failureCallback(error); }
}
btnViewMonth.addEventListener('click', () => { calendar.changeView('dayGridMonth'); updateViewButtons('month'); });
btnViewWeek.addEventListener('click', () => { calendar.changeView('timeGridWeek'); updateViewButtons('week'); });
btnViewList.addEventListener('click', () => { calendar.changeView('listYear'); updateViewButtons('list'); });
function updateViewButtons(activeView) {
    btnViewMonth.classList.toggle('active', activeView === 'month');
    btnViewWeek.classList.toggle('active', activeView === 'week');
    btnViewList.classList.toggle('active', activeView === 'list');
}
formAddEvent.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!currentUserId) return;
    try {
        await db.collection('events').add({
            userId: currentUserId,
            title: document.getElementById('event-title').value,
            clientId: document.getElementById('event-client-select').value,
            start: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('event-start').value)),
            end: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('event-end').value)),
            location: document.getElementById('event-location').value,
            status: document.getElementById('event-status').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        formAddEvent.reset(); closeModal('modal-add-event');
        calendar.refetchEvents();
    } catch (error) { console.error("Erro: ", error); openModalMessage("Não foi possível salvar o evento.", "Erro"); }
});


// --- 8. MÓDULO: FINANCEIRO (100% Modais) ---
formAddTransaction.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!currentUserId) return;
    const clientId = document.getElementById('trans-client-select') ? document.getElementById('trans-client-select').value : '';
    try {
        const transData = {
            userId: currentUserId,
            description: document.getElementById('trans-description').value,
            amount: parseFloat(document.getElementById('trans-amount').value),
            type: document.getElementById('trans-type').value,
            date: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('trans-date').value)),
            status: document.getElementById('trans-status').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (clientId) { transData.clientId = clientId; }
        
        await db.collection('transactions').add(transData);
        formAddTransaction.reset(); loadTransactions();
    } catch (error) { console.error("Erro: ", error); openModalMessage("Não foi possível salvar a transação.", "Erro"); }
});
async function loadTransactions() {
    if (!currentUserId) return; transactionsList.innerHTML = '<p>Carregando...</p>';
    const snapshot = await db.collection('transactions').where('userId', '==', currentUserId).orderBy('date', 'desc').get();
    if (snapshot.empty) { transactionsList.innerHTML = '<p>Nenhum registro.</p>'; return; }
    transactionsList.innerHTML = '';
    snapshot.forEach(doc => {
        const trans = doc.data();
        const client = clientCache.find(c => c.id === trans.clientId);
        const clientName = client ? (client.name || client.razaoSocial) : 'Sem cliente';
        
        const amountClass = trans.type === 'income' ? 'income' : 'expense';
        transactionsList.innerHTML += `
            <div class="list-item" data-id="${doc.id}">
                <div class="list-item-info">
                    <h4>${trans.description}</h4>
                    <p class="amount ${amountClass}">${formatCurrency(trans.amount)}</p>
                    <p>Cliente: ${clientName}</p>
                    <p>Data: ${formatFirebaseTimestamp(trans.date, { dateOnly: true })} | Status: ${trans.status}</p>
                </div>
                <div class="list-item-actions">
                    <button class="delete-btn" data-id="${doc.id}" data-name="${trans.description}" data-collection="transactions">Excluir</button>
                </div>
            </div>`;
    });
}


// --- 9. MÓDULO: CONFIGURAÇÕES (100% Modais) ---
async function loadSettings() {
    if (!currentUserId) return;
    const userDoc = await db.collection('users').doc(currentUserId).get();
    if (userDoc.exists) { document.getElementById('config-name').value = userDoc.data().businessName; }
}
formSettings.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!currentUserId) return;
    const newName = document.getElementById('config-name').value;
    try {
        await db.collection('users').doc(currentUserId).update({ businessName: newName });
        openModalMessage('Configurações salvas com sucesso!'); // CORRIGIDO
        userBusinessName.textContent = newName;
    } catch (error) { console.error("Erro: ", error); openModalMessage('Não foi possível salvar.', 'Erro'); }
});


// --- 10. AÇÕES GLOBAIS (Deletar com Modal) ---
// Função para abrir o modal de confirmação DE EXCLUSÃO
function openDeleteConfirmModal(id, name, collection) {
    deleteItemName.textContent = `"${name}"`;
    deleteItemId.value = id;
    deleteItemCollection.value = collection;
    openModal('modal-confirm-delete');
}

// Listener global para pegar cliques de deletar
appContainer.addEventListener('click', async (e) => {
    const target = e.target.closest('.delete-btn'); // Mais seguro
    if (target) {
        const id = target.dataset.id;
        const name = target.dataset.name;
        const collection = target.dataset.collection;
        if (id && name && collection) {
            openDeleteConfirmModal(id, name, collection);
        }
    }
});

// Ação de Deletar (botão "Sim, Excluir")
btnConfirmDeleteAction.addEventListener('click', async () => {
    const id = deleteItemId.value;
    const collection = deleteItemCollection.value;
    if (!id || !collection) return;
    
    try {
        btnConfirmDeleteAction.disabled = true;
        btnConfirmDeleteAction.textContent = "Excluindo...";
        
        await db.collection(collection).doc(id).delete();
        
        closeModal('modal-confirm-delete');
        closeModal('modal-client-details'); 
        
        // Recarrega a lista relevante
        if (collection === 'clients') { loadClients(); loadClientsForSelect(); }
        else if (collection === 'events') { calendar.refetchEvents(); }
        else if (collection === 'transactions') { loadTransactions(); }
        
    } catch (error) {
        console.error("Erro ao deletar: ", error);
        openModalMessage("Não foi possível excluir o item.", "Erro");
    } finally {
        btnConfirmDeleteAction.disabled = false;
        btnConfirmDeleteAction.textContent = "Sim, Excluir";
    }
});


// --- 11. FUNÇÕES UTILITÁRIAS (Helpers) ---
function getFirebaseAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/user-not-found': case 'auth/wrong-password': return 'Email ou senha incorretos.';
        case 'auth/email-already-in-use': return 'Este email já está cadastrado.';
        case 'auth/weak-password': return 'A senha deve ter no mínimo 6 caracteres.';
        case 'auth/invalid-email': return 'Email inválido.';
        default: return 'Ocorreu um erro. Tente novamente.';
    }
}
function formatFirebaseTimestamp(timestamp, options = { dateOnly: false }) {
    if (!timestamp || !timestamp.toDate) return '...';
    const date = timestamp.toDate();
    const_dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    if (options.dateOnly) { return date.toLocaleDateString('pt-BR',_dateOptions); }
    return date.toLocaleString('pt-BR', { ..._dateOptions, hour: '2-digit', minute: '2-digit' });
}
function formatCurrency(value) {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}