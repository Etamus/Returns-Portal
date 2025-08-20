// web/js/app.js
import { initCart, updateCartView, clearCart } from './cart.js';
import { initNovaSolicitacao, clearNovaSolicitacaoPage } from './novaSolicitacao.js';
import { initAcompanhar, distributeSolicitationToPages } from './acompanhar.js';

try {
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof feather !== 'undefined') feather.replace();

        const state = {
            carrinho: [],
            dadosOriginaisNF: null,
            submittedMaterials: new Set()
        };

        // --- INICIALIZAÇÃO DOS MÓDULOS ---
        initLogin();
        initNavigation();
        initCart(state, { onFinalizar: handleFinalizar, onCancelar: handleCancelar });
        initNovaSolicitacao(state, { updateCartView });
        initAcompanhar({ distributeSolicitationToPages });
        initFerramentas();

        function initLogin() {
            const loginPage = document.getElementById('login-page');
            const appContainer = document.getElementById('app-container');
            const loginBtn = document.getElementById('login-btn');
            const loginInput = document.getElementById('login-input');
            const passwordInput = document.getElementById('password-input');
            const errorMessage = document.getElementById('login-error-message');

            loginBtn.addEventListener('click', () => {
                const login = loginInput.value;
                const password = passwordInput.value;

                if (login === 'admin' && password === 'admin') {
                    loginPage.style.display = 'none';
                    appContainer.style.display = 'flex';
                    feather.replace();
                    initAppDefaults();
                } else {
                    errorMessage.textContent = 'Login ou senha inválidos.';
                }
            });
            passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { loginBtn.click(); } });
        }

        async function handleFinalizar() {
            if (state.carrinho.length === 0) return;
            state.carrinho.forEach(item => state.submittedMaterials.add(item.material));
            const promises = state.carrinho.map(item => eel.criar_nova_solicitacao(item)());
            const novasSolicitacoes = await Promise.all(promises);
            novasSolicitacoes.forEach(distributeSolicitationToPages);
            alert(`${state.carrinho.length} solicitação(ões) criada(s) com sucesso!`);
            clearCart(state);
            clearNovaSolicitacaoPage();
        }

        function handleCancelar() {
            state.carrinho.forEach(itemNoCarrinho => {
                const row = document.getElementById(`item-row-${itemNoCarrinho.index}`);
                if (row) {
                    const qtySpan = row.querySelector('.qty-disponivel');
                    const qtdAtual = parseInt(qtySpan.textContent);
                    qtySpan.textContent = qtdAtual + parseInt(itemNoCarrinho.quantidade);
                }
            });
            document.querySelectorAll('.item-row.added-to-cart').forEach(row => {
                const index = parseInt(row.querySelector('.item-summary').dataset.index, 10);
                if (state.carrinho.some(cartItem => cartItem.index === index)) {
                    row.classList.remove('added-to-cart');
                    const iconContainer = row.querySelector('.icon-container');
                    if (iconContainer) iconContainer.innerHTML = `<i data-feather="plus-circle"></i>`;
                }
            });
            clearCart(state);
            feather.replace();
        }

        function initNavigation() {
            const menuItems = document.querySelectorAll('.menu-item');
            const submenuItems = document.querySelectorAll('.submenu-item');
            const pages = document.querySelectorAll('.page');
            menuItems.forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); const targetSubmenu = document.getElementById(item.dataset.target); document.querySelectorAll('.submenu').forEach(sm => { if (sm !== targetSubmenu) sm.classList.remove('active'); }); targetSubmenu.classList.toggle('active'); }); });
            submenuItems.forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); submenuItems.forEach(i => i.classList.remove('active')); pages.forEach(p => p.classList.remove('active')); item.classList.add('active'); document.getElementById(item.dataset.page).classList.add('active'); }); });
        }

        function initAppDefaults() {
             if (typeof flatpickr !== 'undefined') {
                const hoje = new Date();
                const ontem = new Date();
                ontem.setDate(hoje.getDate() - 1);
                flatpickr("#date-start", { dateFormat: "d/m/Y", locale: "pt", defaultDate: ontem });
                flatpickr("#date-end", { dateFormat: "d/m/Y", locale: "pt", defaultDate: hoje });
            }
        }

        function initFerramentas() {
            const iniciarMacroBtn = document.getElementById('iniciar-macro-btn');
            const macroStatusDiv = document.getElementById('macro-status');
            if(iniciarMacroBtn) {
                iniciarMacroBtn.addEventListener('click', async () => {
                    macroStatusDiv.textContent = "Executando macro, por favor aguarde...";
                    macroStatusDiv.style.color = "orange";
                    iniciarMacroBtn.disabled = true;
                    try {
                        const resultado = await eel.executar_macro_excel()();
                        macroStatusDiv.textContent = resultado;
                        if(resultado.startsWith("Erro:")) { macroStatusDiv.style.color = "red"; } 
                        else { macroStatusDiv.style.color = "green"; }
                    } catch (error) {
                        console.error("Erro na comunicação com Python:", error);
                        macroStatusDiv.textContent = "Erro de comunicação. Verifique o terminal.";
                        macroStatusDiv.style.color = "red";
                    }
                    iniciarMacroBtn.disabled = false;
                });
            }
        }
    });
} catch (error) {
    console.error("ERRO FATAL NO SCRIPT:", error);
    alert("Ocorreu um erro crítico. Por favor, abra o console (F12).");
}