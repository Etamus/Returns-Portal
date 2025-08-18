// web/js/app.js
import { initCart, updateCartView, clearCart } from './cart.js';
import { initNovaSolicitacao, clearNovaSolicitacaoPage } from './novaSolicitacao.js';
import { initAcompanhar, distributeSolicitationToPages } from './acompanhar.js';

try {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM carregado. Iniciando script MODULAR CORRIGIDO.");
        if (typeof feather !== 'undefined') feather.replace();

        // --- ESTADO GLOBAL DA APLICAÇÃO ---
        const state = {
            carrinho: [],
            dadosOriginaisNF: null,
            submittedMaterials: new Set()
        };

        // --- INICIALIZAÇÃO DOS MÓDULOS ---
        initNavigation();
        initCart(state, { onFinalizar: handleFinalizar, onCancelar: handleCancelar });
        initNovaSolicitacao(state, { updateCartView });
        initAcompanhar({ distributeSolicitationToPages }); // Passa a função necessária

        // --- FUNÇÕES DE COORDENAÇÃO ---
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
            // Lógica restaurada para reativar itens e devolver quantidade
            state.carrinho.forEach(itemNoCarrinho => {
                const row = document.getElementById(`item-row-${itemNoCarrinho.index}`);
                if (row) {
                    const qtySpan = row.querySelector('.qty-disponivel');
                    const qtdAtual = parseInt(qtySpan.textContent);
                    qtySpan.textContent = qtdAtual + parseInt(itemNoCarrinho.quantidade);
                }
            });

            document.querySelectorAll('.item-row.added-to-cart').forEach(row => {
                row.classList.remove('added-to-cart');
                const iconContainer = row.querySelector('.icon-container');
                if (iconContainer) iconContainer.innerHTML = `<i data-feather="plus-circle"></i>`;
            });
            clearCart(state);
            feather.replace();
        }

        function initNavigation() {
            if (typeof flatpickr !== 'undefined') {
                const hoje = new Date();
                const ontem = new Date();
                ontem.setDate(hoje.getDate() - 1);
                flatpickr("#date-start", { dateFormat: "d/m/Y", locale: "pt", defaultDate: ontem });
                flatpickr("#date-end", { dateFormat: "d/m/Y", locale: "pt", defaultDate: hoje });
            }
            const menuItems = document.querySelectorAll('.menu-item');
            const submenuItems = document.querySelectorAll('.submenu-item');
            const pages = document.querySelectorAll('.page');
            menuItems.forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); const targetSubmenu = document.getElementById(item.dataset.target); document.querySelectorAll('.submenu').forEach(sm => { if (sm !== targetSubmenu) sm.classList.remove('active'); }); targetSubmenu.classList.toggle('active'); }); });
            submenuItems.forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); submenuItems.forEach(i => i.classList.remove('active')); pages.forEach(p => p.classList.remove('active')); item.classList.add('active'); document.getElementById(item.dataset.page).classList.add('active'); }); });
        }
    });
} catch (error) {
    console.error("ERRO FATAL NO SCRIPT:", error);
    alert("Ocorreu um erro crítico. Por favor, abra o console (F12).");
}