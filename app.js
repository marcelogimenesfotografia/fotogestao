// app.js

// --- Inicialização do Firebase (obtido do firebase-config.js) ---
// const auth = firebase.auth();
// const db = firebase.firestore();

// --- Variável Global de Estado ---
let currentUser = null;
let currentUserId = null;
let clientCache = []; // Cache de clientes para popular selects

// --- Seletores de DOM (Elementos da UI) ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authError = document.getElementById('auth-error');

const pageTitle = document.getElementById('page-title');
const appNav = document.querySelector('.app-nav');
const allPages = document.querySelectorAll('#app-content .page');
const userBusinessName = document.getElementById('user-business-name');

// Botões
const btnLogin = document.getElementById('btn-login');
const btnSignup = document.getElementById('btn-signup');
const btnLogout = document.getElementById('btn-logout');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');

// Formulários
const formAddClient = document.getElementById('form-add-client');
const formAddEvent = document.getElementById('form-add-event');
const formAddTransaction = document.getElementById('form-add-transaction');
const formSettings = document.getElementById('form-settings');

// Listas de Dados
const clientsList = document.getElementById('clients-list');
const eventsList = document.getElementById('events-list');
const transactionsList = document.getElementById('transactions-list');
const eventClientSelect = document.getElementById('event-client-select');

// Dashboard
const summaryEventos = document.getElementById('summary-eventos');
const summaryFinanceiro = document.getElementById('summary-financeiro');

// --- 1. LÓGICA DE AUTENTICAÇÃO ---

// Monitora o estado da autenticação
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário está logado
        currentUser = user;
        currentUserId = user.uid;
        authContainer.style.display = 'none';
        appContainer.style.display = 'block';
        
        // Carregar dados iniciais
        loadUserData();
        navigateTo('inicial'); // Navega para a home após o login
    } else {
        // Usuário está deslogado
        currentUser = null;
        currentUserId = null;
        authContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }
});

// Alternar entre Login e Cadastro
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    authError.textContent = '';
});
showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    authError.textContent = '';
});

// Processar Cadastro (Signup)
btnSignup.addEventListener('click', async () => {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) {
        authError.textContent = 'Preencha todos os campos.';
        return;
    }

    authError.textContent = '';
    btnSignup.disabled = true;
    btnSignup.textContent = 'Criando...';

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Salva os dados adicionais do usuário no Firestore
        await db.collection('users').doc(user.uid).set({
            businessName: name,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        // O onAuthStateChanged vai cuidar de redirecionar
    } catch (error) {
        authError.textContent = getFirebaseAuthErrorMessage(error);
    } finally {
        btnSignup.disabled = false;
        btnSignup.textContent = 'Criar Conta';
    }
});

// Processar Login
btnLogin.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        authError.textContent = 'Preencha email e senha.';
        return;
    }

    authError.textContent = '';
    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';

    try {
        await auth.signInWithEmailAndPassword(email, password);
        // O onAuthStateChanged vai cuidar de redirecionar
    } catch (error) {
        authError.textContent = getFirebaseAuthErrorMessage(error);
    } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
});

// Processar Logout
btnLogout.addEventListener('click', async () => {
    await auth.signOut();
});

// --- 2. LÓGICA DE NAVEGAÇÃO (SPA) ---
appNav.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-btn')) {
        const pageName = e.target.dataset.page;
        navigateTo(pageName);
    }
});

function navigateTo(pageName) {
    // Esconde todas as páginas
    allPages.forEach(page => page.classList.remove('active'));
    
    // Mostra a página correta
    const activePage = document.getElementById(`page-${pageName}`);
    if (activePage) {
        activePage.classList.add('active');
    }

    // Atualiza o título do Header
    const pageTitles = {
        'inicial': 'Inicial',
        'clientes': 'Clientes',
        'agenda': 'Agenda',
        'financeiro': 'Financeiro',
        'configuracoes': 'Configurações'
    };
    pageTitle.textContent = pageTitles[pageName] || 'FotoCRM';

    // Atualiza o botão ativo no menu
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === pageName);
    });

    // Carrega os dados da página específica
    loadPageData(pageName);
}

// Carrega dados sob demanda ao navegar
function loadPageData(pageName) {
    switch (pageName) {
        case 'inicial':
            loadDashboard();
            break;
        case 'clientes':
            loadClients();
            break;
        case 'agenda':
            loadEvents();
            loadClientsForSelect(); // Carrega clientes para o dropdown
            break;
        case 'financeiro':
            loadTransactions();
            break;
        case 'configuracoes':
            loadSettings();
            break;
    }
}

// --- 3. CARREGAMENTO DE DADOS GERAIS ---
async function loadUserData() {
    if (!currentUserId) return;
    const userDoc = await db.collection('users').doc(currentUserId).get();
    if (userDoc.exists) {
        userBusinessName.textContent = userDoc.data().businessName;
    }
}

// --- 4. MÓDULO: DASHBOARD (INICIAL) ---
async function loadDashboard() {
    loadSummaryEvents();
    loadSummaryFinance();
}

async function loadSummaryEvents() {
    if (!currentUserId) return;
    summaryEventos.innerHTML = '<p>Carregando...</p>';
    
    const now = firebase.firestore.Timestamp.now();
    const query = db.collection('events')
        .where('userId', '==', currentUserId)
        .where('start', '>=', now)
        .orderBy('start', 'asc')
        .limit(3);
        
    const snapshot = await query.get();
    if (snapshot.empty) {
        summaryEventos.innerHTML = '<p>Nenhum evento futuro.</p>';
        return;
    }
    
    summaryEventos.innerHTML = '';
    snapshot.forEach(doc => {
        const event = doc.data();
        summaryEventos.innerHTML += `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${event.title}</h4>
                    <p>${formatFirebaseTimestamp(event.start)}</p>
                </div>
            </div>
        `;
    });
}

async function loadSummaryFinance() {
     if (!currentUserId) return;
    summaryFinanceiro.innerHTML = '<p>Carregando...</p>';
    
    const query = db.collection('transactions')
        .where('userId', '==', currentUserId)
        .where('status', '==', 'pending')
        .where('type', '==', 'income')
        .orderBy('date', 'asc')
        .limit(3);
        
    const snapshot = await query.get();
    if (snapshot.empty) {
        summaryFinanceiro.innerHTML = '<p>Nenhum pagamento pendente.</p>';
        return;
    }
    
    summaryFinanceiro.innerHTML = '';
    snapshot.forEach(doc => {
        const trans = doc.data();
        summaryFinanceiro.innerHTML += `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${trans.description}</h4>
                    <p class="amount income">${formatCurrency(trans.amount)}</p>
                </div>
            </div>
        `;
    });
}


// --- 5. MÓDULO: CLIENTES ---

// Adicionar Cliente
formAddClient.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;

    const name = document.getElementById('client-name').value;
    const email = document.getElementById('client-email').value;
    const phone = document.getElementById('client-phone').value;
    const notes = document.getElementById('client-notes').value;

    try {
        await db.collection('clients').add({
            userId: currentUserId,
            name: name,
            email: email,
            phone: phone,
            notes: notes,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        formAddClient.reset();
        loadClients(); // Recarrega a lista
        loadClientsForSelect(); // Atualiza o cache
    } catch (error) {
        console.error("Erro ao adicionar cliente: ", error);
        alert("Não foi possível salvar o cliente.");
    }
});

// Carregar Clientes
async function loadClients() {
    if (!currentUserId) return;
    clientsList.innerHTML = '<p>Carregando clientes...</p>';

    try {
        const snapshot = await db.collection('clients')
            .where('userId', '==', currentUserId)
            .orderBy('name', 'asc')
            .get();

        if (snapshot.empty) {
            clientsList.innerHTML = '<p>Nenhum cliente cadastrado.</p>';
            return;
        }

        clientsList.innerHTML = ''; // Limpa a lista
        snapshot.forEach(doc => {
            const client = doc.data();
            clientsList.innerHTML += `
                <div class="list-item" data-id="${doc.id}">
                    <div class="list-item-info">
                        <h4>${client.name}</h4>
                        <p>${client.email || 'Sem email'}</p>
                        <p>${client.phone || 'Sem telefone'}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="delete-btn" data-collection="clients" data-id="${doc.id}">🗑️</button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar clientes: ", error);
        clientsList.innerHTML = '<p>Erro ao carregar clientes.</p>';
    }
}

// Carregar Clientes para o Select (Dropdown)
async function loadClientsForSelect() {
    if (!currentUserId) return;

    try {
        const snapshot = await db.collection('clients')
            .where('userId', '==', currentUserId)
            .orderBy('name', 'asc')
            .get();
        
        clientCache = []; // Limpa o cache
        eventClientSelect.innerHTML = '<option value="">Selecione um cliente...</option>'; // Reseta
        
        snapshot.forEach(doc => {
            const client = { id: doc.id, ...doc.data() };
            clientCache.push(client);
            eventClientSelect.innerHTML += `<option value="${client.id}">${client.name}</option>`;
        });

    } catch (error) {
        console.error("Erro ao carregar clientes para select: ", error);
    }
}

// --- 6. MÓDULO: AGENDA (EVENTOS) ---

// Adicionar Evento
formAddEvent.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;

    const title = document.getElementById('event-title').value;
    const clientId = document.getElementById('event-client-select').value;
    const start = document.getElementById('event-start').value;
    const end = document.getElementById('event-end').value;
    const location = document.getElementById('event-location').value;
    const status = document.getElementById('event-status').value;

    try {
        await db.collection('events').add({
            userId: currentUserId,
            title: title,
            clientId: clientId,
            start: firebase.firestore.Timestamp.fromDate(new Date(start)),
            end: firebase.firestore.Timestamp.fromDate(new Date(end)),
            location: location,
            status: status,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        formAddEvent.reset();
        loadEvents(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao adicionar evento: ", error);
        alert("Não foi possível salvar o evento.");
    }
});

// Carregar Eventos
async function loadEvents() {
    if (!currentUserId) return;
    eventsList.innerHTML = '<p>Carregando eventos...</p>';

    try {
        const snapshot = await db.collection('events')
            .where('userId', '==', currentUserId)
            .orderBy('start', 'asc')
            .get();

        if (snapshot.empty) {
            eventsList.innerHTML = '<p>Nenhum evento na agenda.</p>';
            return;
        }

        eventsList.innerHTML = ''; // Limpa a lista
        snapshot.forEach(doc => {
            const event = doc.data();
            // Busca o nome do cliente no cache
            const client = clientCache.find(c => c.id === event.clientId);
            const clientName = client ? client.name : 'Cliente não encontrado';

            eventsList.innerHTML += `
                <div class="list-item" data-id="${doc.id}">
                    <div class="list-item-info">
                        <h4>${event.title}</h4>
                        <p>Cliente: ${clientName}</p>
                        <p>Início: ${formatFirebaseTimestamp(event.start)}</p>
                        <p>Status: ${event.status}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="delete-btn" data-collection="events" data-id="${doc.id}">🗑️</button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar eventos: ", error);
        eventsList.innerHTML = '<p>Erro ao carregar eventos.</p>';
    }
}


// --- 7. MÓDULO: FINANCEIRO (TRANSAÇÕES) ---

// Adicionar Transação
formAddTransaction.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;

    const description = document.getElementById('trans-description').value;
    const amount = parseFloat(document.getElementById('trans-amount').value);
    const type = document.getElementById('trans-type').value;
    const date = document.getElementById('trans-date').value;
    const status = document.getElementById('trans-status').value;
    
    try {
        await db.collection('transactions').add({
            userId: currentUserId,
            description: description,
            amount: amount,
            type: type,
            date: firebase.firestore.Timestamp.fromDate(new Date(date)),
            status: status,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        formAddTransaction.reset();
        loadTransactions(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao adicionar transação: ", error);
        alert("Não foi possível salvar a transação.");
    }
});

// Carregar Transações
async function loadTransactions() {
    if (!currentUserId) return;
    transactionsList.innerHTML = '<p>Carregando transações...</p>';

    try {
        const snapshot = await db.collection('transactions')
            .where('userId', '==', currentUserId)
            .orderBy('date', 'desc')
            .get();

        if (snapshot.empty) {
            transactionsList.innerHTML = '<p>Nenhuma transação registrada.</p>';
            return;
        }

        transactionsList.innerHTML = ''; // Limpa a lista
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
                        <button class="delete-btn" data-collection="transactions" data-id="${doc.id}">🗑️</A>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error("Erro ao carregar transações: ", error);
        transactionsList.innerHTML = '<p>Erro ao carregar transações.</p>';
    }
}


// --- 8. MÓDULO: CONFIGURAÇÕES ---

// Carregar Configurações
async function loadSettings() {
    if (!currentUserId) return;
    const userDoc = await db.collection('users').doc(currentUserId).get();
    if (userDoc.exists) {
        document.getElementById('config-name').value = userDoc.data().businessName;
    }
}

// Salvar Configurações
formSettings.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) return;

    const newName = document.getElementById('config-name').value;
    try {
        await db.collection('users').doc(currentUserId).update({
            businessName: newName
        });
        alert('Configurações salvas!');
        userBusinessName.textContent = newName; // Atualiza o nome no header
    } catch (error) {
        console.error("Erro ao salvar configurações: ", error);
        alert('Não foi possível salvar.');
    }
});


// --- 9. AÇÕES GLOIS (Ex: Deletar Item) ---
// Listener genérico para botões de deletar
appContainer.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        const collection = e.target.dataset.collection;
        
        if (!id || !collection) return;

        if (confirm(`Tem certeza que deseja excluir este item?`)) {
            try {
                await db.collection(collection).doc(id).delete();
                // Remove o item da UI
                e.target.closest('.list-item').remove();
                
                // Recarrega dados dependentes (ex: se deletar cliente, recarrega o select)
                if (collection === 'clients') {
                    loadClientsForSelect();
                }
            } catch (error) {
                console.error("Erro ao deletar: ", error);
                alert("Não foi possível excluir o item.");
            }
        }
    }
});


// --- 10. FUNÇÕES UTILITÁRIAS ---

// Formata mensagens de erro do Firebase Auth
function getFirebaseAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return 'Email ou senha incorretos.';
        case 'auth/email-already-in-use':
            return 'Este email já está cadastrado.';
        case 'auth/weak-password':
            return 'A senha deve ter no mínimo 6 caracteres.';
        case 'auth/invalid-email':
            return 'Email inválido.';
        default:
            return 'Ocorreu um erro. Tente novamente.';
    }
}

// Formata Timestamps do Firebase
function formatFirebaseTimestamp(timestamp, options = { dateOnly: false }) {
    if (!timestamp || !timestamp.toDate) {
        return 'Data inválida';
    }
    const date = timestamp.toDate();
    const_dateOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    if (options.dateOnly) {
         return date.toLocaleDateString('pt-BR',_dateOptions);
    }
    return date.toLocaleString('pt-BR', { ..._dateOptions, hour: '2-digit', minute: '2-digit' });
}

// Formata valores monetários
function formatCurrency(value) {
    return (value || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}