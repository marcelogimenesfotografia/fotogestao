// app.js (Versão 2 - Com Sidebar e FullCalendar)

// --- Variáveis Globais de Estado ---
let currentUser = null;
let currentUserId = null;
let clientCache = []; // Cache de clientes
let calendar = null; // Objeto do FullCalendar
let isCalendarInitialized = false;

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
const modalAddClient = document.getElementById('modal-add-client');
const formAddClient = document.getElementById('form-add-client');

// --- Seletores (Página Agenda) ---
const calendarEl = document.getElementById('calendar');
const btnShowAddEvent = document.getElementById('btn-show-add-event');
const modalAddEvent = document.getElementById('modal-add-event');
const formAddEvent = document.getElementById('form-add-event');
const eventClientSelect = document.getElementById('event-client-select');
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

// --- 1. LÓGICA DE AUTENTICAÇÃO (Sem alterações) ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        currentUserId = user.uid;
        authContainer.style.display = 'none';
        appContainer.style.display = 'flex'; // Mudou de 'block' para 'flex'
        loadUserData();
        navigateTo('inicial');
        lucide.createIcons(); // Recria ícones ao logar
    } else {
        currentUser = null;
        currentUserId = null;
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
        if (calendar) { // Destrói o calendário ao sair
            calendar.destroy();
            isCalendarInitialized = false;
        }
    }
});
// ... (Funções de login, signup e logout iguais às da v1) ...
// (Vou omitir por brevidade, use as da resposta anterior)
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
// Processar Logout
btnLogout.addEventListener('click', async () => { await auth.signOut(); });
// Alternar Forms
showSignup.addEventListener('click', (e) => { e.preventDefault(); loginForm.style.display = 'none'; signupForm.style.display = 'block'; authError.textContent = ''; });
showLogin.addEventListener('click', (e) => { e.preventDefault(); loginForm.style.display = 'block'; signupForm.style.display = 'none'; authError.textContent = ''; });


// --- 2. LÓGICA DE NAVEGAÇÃO (Atualizada) ---
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

// Menu Mobile Toggle
btnMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// --- 3. GESTÃO DE MODAIS (Novo) ---
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Listeners para abrir modais
btnShowAddClient.addEventListener('click', () => openModal('modal-add-client'));
btnShowAddEvent.addEventListener('click', () => openModal('modal-add-event'));

// Listeners para fechar modais (botão X)
document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        closeModal(btn.dataset.modal);
    });
});
// Listeners para fechar modais (clique fora)
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.id);
        }
    });
});


// --- 4. CARREGAMENTO DE DADOS DAS PÁGINAS ---
async function loadPageData(pageName) {
    switch (pageName) {
        case 'inicial':
            loadDashboard();
            break;
        case 'clientes':
            loadClients();
            break;
        case 'agenda':
            await loadClientsForSelect(); // Garante que clientes estão carregados
            initializeCalendar(); // INICIALIZA O CALENDÁRIO
            break;
        case 'financeiro':
            loadTransactions();
            break;
        case 'configuracoes':
            loadSettings();
            break;
    }
}

async function loadUserData() {
    if (!currentUserId) return;
    const userDoc = await db.collection('users').doc(currentUserId).get();
    if (userDoc.exists) {
        userBusinessName.textContent = userDoc.data().businessName;
    }
}

// --- 5. MÓDULO: DASHBOARD (Igual à v1) ---
// (Omitido por brevidade, use o da v1)
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


// --- 6. MÓDULO: CLIENTES (Atualizado) ---

// Adicionar Cliente (agora pelo modal)
formAddClient.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;
    try {
        await db.collection('clients').add({
            userId: currentUserId,
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
            notes: document.getElementById('client-notes').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        formAddClient.reset();
        closeModal('modal-add-client');
        loadClients(); // Recarrega a lista
        loadClientsForSelect(); // Atualiza o cache
    } catch (error) {
        console.error("Erro ao adicionar cliente: ", error);
        alert("Não foi possível salvar o cliente.");
    }
});

// Carregar Clientes (novo HTML)
async function loadClients() {
    if (!currentUserId) return;
    clientsList.innerHTML = '<p>Carregando clientes...</p>';
    const snapshot = await db.collection('clients')
        .where('userId', '==', currentUserId)
        .orderBy('name', 'asc').get();

    if (snapshot.empty) {
        clientsList.innerHTML = '<p>Nenhum cliente cadastrado.</p>'; return;
    }

    clientsList.innerHTML = ''; // Limpa a lista
    snapshot.forEach(doc => {
        const client = doc.data();
        clientsList.innerHTML += `
            <div class="list-item" data-id="${doc.id}">
                <div class="list-item-info">
                    <h4>${client.name}</h4>
                    <p>${client.email || 'Sem email'} | ${client.phone || 'Sem telefone'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="details-btn" data-notes="${client.notes || ''}">Detalhes</button>
                    <button class="delete-btn" data-collection="clients" data-id="${doc.id}">Excluir</button>
                </div>
            </div>
        `;
    });
}

// Filtro de Clientes (Novo)
searchClient.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const items = clientsList.querySelectorAll('.list-item');
    items.forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
});

// Ações da Lista de Clientes (Detalhes e Deletar)
clientsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('details-btn')) {
        const notes = e.target.dataset.notes;
        alert(notes || "Nenhuma anotação para este cliente.");
    }
    // O de deletar é pego pelo listener global
});


// Carregar Clientes para Select (igual v1)
async function loadClientsForSelect() {
    if (!currentUserId) return;
    const snapshot = await db.collection('clients')
        .where('userId', '==', currentUserId)
        .orderBy('name', 'asc').get();
    
    clientCache = [];
    eventClientSelect.innerHTML = '<option value="">Selecione...</option>';
    
    snapshot.forEach(doc => {
        const client = { id: doc.id, ...doc.data() };
        clientCache.push(client);
        eventClientSelect.innerHTML += `<option value="${client.id}">${client.name}</option>`;
    });
}

// --- 7. MÓDULO: AGENDA (Totalmente Novo com FullCalendar) ---

function initializeCalendar() {
    if (isCalendarInitialized) {
        calendar.refetchEvents(); // Apenas atualiza se já foi criado
        return;
    }

    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'pt-br',
        initialView: 'dayGridMonth',
        headerToolbar: false, // Usamos nossos próprios botões
        events: fetchEventsFromFirebase, // Função que busca no Firebase
        editable: true, // Permite arrastar eventos (requer lógica de update)
        selectable: true,
        // Ao clicar em um dia, abre o modal de novo evento
        select: function(info) {
            openModal('modal-add-event');
            document.getElementById('event-start').value = info.startStr.substring(0, 16);
            document.getElementById('event-end').value = info.endStr.substring(0, 16);
        },
        // Ao clicar em um evento existente
        eventClick: function(info) {
            alert(`Evento: ${info.event.title}\nStatus: ${info.event.extendedProps.status}`);
            // Aqui você pode abrir um modal de "editar evento"
        },
        // Ao arrastar e soltar um evento
        eventDrop: async function(info) {
            if (!confirm("Salvar nova data para este evento?")) {
                info.revert();
            } else {
                try {
                    await db.collection('events').doc(info.event.id).update({
                        start: info.event.start,
                        end: info.event.end
                    });
                } catch(err) {
                    console.error("Erro ao atualizar evento: ", err);
                    info.revert();
                }
            }
        }
    });

    calendar.render();
    isCalendarInitialized = true;
}

// Função para o FullCalendar buscar eventos
async function fetchEventsFromFirebase(fetchInfo, successCallback, failureCallback) {
    if (!currentUserId) {
        failureCallback("Usuário não logado");
        return;
    }
    
    try {
        const snapshot = await db.collection('events')
            .where('userId', '==', currentUserId)
            // Filtra por data (opcional, mas bom para performance)
            .where('start', '>=', fetchInfo.start)
            .where('start', '<=', fetchInfo.end)
            .get();
        
        const events = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                start: data.start.toDate(),
                end: data.end.toDate(),
                status: data.status // Propriedade extendida
            };
        });
        
        successCallback(events);
    } catch (error) {
        console.error("Erro ao buscar eventos: ", error);
        failureCallback(error);
    }
}

// Botões de Mudar Visualização da Agenda
btnViewMonth.addEventListener('click', () => {
    calendar.changeView('dayGridMonth');
    updateViewButtons('month');
});
btnViewWeek.addEventListener('click', () => {
    calendar.changeView('timeGridWeek');
    updateViewButtons('week');
});
btnViewList.addEventListener('click', () => {
    calendar.changeView('listYear'); // Lista dos próximos 12 meses
    updateViewButtons('list');
});
function updateViewButtons(activeView) {
    btnViewMonth.classList.toggle('active', activeView === 'month');
    btnViewWeek.classList.toggle('active', activeView === 'week');
    btnViewList.classList.toggle('active', activeView === 'list');
}

// Adicionar Evento (pelo modal)
formAddEvent.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;

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
        formAddEvent.reset();
        closeModal('modal-add-event');
        calendar.refetchEvents(); // Atualiza o calendário
    } catch (error) {
        console.error("Erro ao adicionar evento: ", error);
        alert("Não foi possível salvar o evento.");
    }
});


// --- 8. MÓDULO: FINANCEIRO (Igual à v1, mas com novo seletor) ---
// (Omitido por brevidade, use o da v1)
formAddTransaction.addEventListener('submit', async (e) => {
    e.preventDefault(); if (!currentUserId) return;
    try {
        await db.collection('transactions').add({
            userId: currentUserId,
            description: document.getElementById('trans-description').value,
            amount: parseFloat(document.getElementById('trans-amount').value),
            type: document.getElementById('trans-type').value,
            date: firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('trans-date').value)),
            status: document.getElementById('trans-status').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        formAddTransaction.reset(); loadTransactions();
    } catch (error) { console.error("Erro: ", error); alert("Não foi possível salvar."); }
});
async function loadTransactions() {
    if (!currentUserId) return; transactionsList.innerHTML = '<p>Carregando...</p>';
    const snapshot = await db.collection('transactions').where('userId', '==', currentUserId).orderBy('date', 'desc').get();
    if (snapshot.empty) { transactionsList.innerHTML = '<p>Nenhum registro.</p>'; return; }
    transactionsList.innerHTML = '';
    snapshot.forEach(doc => {
        const trans = doc.data();
        const amountClass = trans.type === 'income' ? 'income' : 'expense';
        transactionsList.innerHTML += `
            <div class="list-item" data-id="${doc.id}">
                <div class="list-item-info">
                    <h4>${trans.description}</h4>
                    <p class="amount ${amountClass}">${formatCurrency(trans.amount)}</p>
                    <p>Data: ${formatFirebaseTimestamp(trans.date, { dateOnly: true })} | Status: ${trans.status}</p>
                </div>
                <div class="list-item-actions">
                    <button class="delete-btn" data-collection="transactions" data-id="${doc.id}">Excluir</button>
                </div>
            </div>`;
    });
}


// --- 9. MÓDULO: CONFIGURAÇÕES (Igual à v1) ---
// (Omitido por brevidade, use o da v1)
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
        alert('Configurações salvas!');
        userBusinessName.textContent = newName;
    } catch (error) { console.error("Erro: ", error); alert('Não foi possível salvar.'); }
});


// --- 10. AÇÕES GLOBAIS (Deletar) ---
appContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        const collection = e.target.dataset.collection;
        if (!id || !collection) return;
        if (confirm(`Tem certeza que deseja excluir este item?`)) {
            try {
                await db.collection(collection).doc(id).delete();
                e.target.closest('.list-item').remove();
                if (collection === 'clients') { loadClientsForSelect(); }
                if (collection === 'events') { calendar.refetchEvents(); }
            } catch (error) { alert("Não foi possível excluir."); }
        }
    }
});

// --- 11. FUNÇÕES UTILITÁRIAS (Iguais à v1) ---
// (Omitidas por brevidade, use as da v1)
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