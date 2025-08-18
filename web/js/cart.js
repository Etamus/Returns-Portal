// web/js/cart.js
let appState = null;
let appCallbacks = null;

const ui = {};

// Função de inicialização que recebe o estado global e callbacks
export function initCart(state, callbacks) {
    appState = state;
    appCallbacks = callbacks;

    // Seleciona os elementos da UI do carrinho
    ui.icon = document.getElementById('cart-icon');
    ui.counter = document.getElementById('cart-counter');
    ui.modalOverlay = document.getElementById('cart-modal-overlay');
    ui.closeBtn = document.getElementById('close-cart-btn');
    ui.list = document.getElementById('cart-items-list');
    ui.finalizarBtn = document.getElementById('finalizar-btn');
    ui.cancelarBtn = document.getElementById('cancelar-carrinho-btn');

    // Anexa os eventos
    ui.icon.addEventListener('click', () => { updateCartView(); ui.modalOverlay.classList.add('visible'); });
    ui.closeBtn.addEventListener('click', () => ui.modalOverlay.classList.remove('visible'));
    ui.modalOverlay.addEventListener('click', (e) => { if (e.target === ui.modalOverlay) ui.modalOverlay.classList.remove('visible'); });
    
    ui.finalizarBtn.addEventListener('click', () => appCallbacks.onFinalizar());
    ui.cancelarBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar o carrinho?')) {
            appCallbacks.onCancelar();
            ui.modalOverlay.classList.remove('visible');
        }
    });
}

// Função que atualiza a interface do carrinho, agora exportada
export function updateCartView() {
    if (!appState) return;
    
    ui.counter.textContent = appState.carrinho.length;
    if (appState.carrinho.length === 0) {
        ui.list.innerHTML = '<p>Seu carrinho de devolução está vazio.</p>';
        ui.finalizarBtn.disabled = true;
        ui.cancelarBtn.style.display = 'none';
    } else {
        ui.finalizarBtn.disabled = false;
        ui.cancelarBtn.style.display = 'inline-flex';
        ui.list.innerHTML = appState.carrinho.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="material">${item.descricao}</span>
                    <span class="motivo">${item.motivo}</span>
                </div>
                <div class="cart-item-qty">Qtd: ${item.quantidade}</div>
            </div>`).join('');
    }
}

// Função para limpar o carrinho, chamada por outros módulos
export function clearCart(state) {
    state.carrinho = [];
    updateCartView();
}