// web/script.js
try {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM carregado. Iniciando script FINAL CORRIGIDO.");

        // --- INICIALIZAÇÃO E ELEMENTOS GLOBAIS ---
        if (typeof feather !== 'undefined') feather.replace();
        
        const ui = {
            menuItems: document.querySelectorAll('.menu-item'),
            submenuItems: document.querySelectorAll('.submenu-item'),
            pages: document.querySelectorAll('.page'),
            consultarBtn: document.getElementById('consultar-nf-btn'),
            nfInput: document.getElementById('nf-input'),
            resultsArea: document.getElementById('nf-results-area'),
            cart: {
                icon: document.getElementById('cart-icon'),
                counter: document.getElementById('cart-counter'),
                modalOverlay: document.getElementById('cart-modal-overlay'),
                closeBtn: document.getElementById('close-cart-btn'),
                list: document.getElementById('cart-items-list'),
                finalizarBtn: document.getElementById('finalizar-btn'),
                cancelarBtn: document.getElementById('cancelar-carrinho-btn'),
            },
            imageModal: {
                overlay: document.getElementById('image-modal-overlay'),
                image: document.getElementById('modal-image'),
                closeBtn: document.getElementById('close-image-btn'),
            },
            solicitacoesLists: {
                acompanhar: { list: document.getElementById('solicitacoes-list-acompanhar'), emptyMsg: document.getElementById('empty-message-acompanhar') },
                qualidade: { list: document.getElementById('solicitacoes-list-qualidade'), emptyMsg: document.getElementById('empty-message-qualidade') },
                logistica: { list: document.getElementById('solicitacoes-list-logistica'), emptyMsg: document.getElementById('empty-message-logistica') },
                comercial: { list: document.getElementById('solicitacoes-list-comercial'), emptyMsg: document.getElementById('empty-message-comercial') }
            }
        };

        if (typeof flatpickr !== 'undefined') {
            const hoje = new Date();
            const ontem = new Date();
            ontem.setDate(hoje.getDate() - 1);
            flatpickr("#date-start", { dateFormat: "d/m/Y", locale: "pt", defaultDate: ontem });
            flatpickr("#date-end", { dateFormat: "d/m/Y", locale: "pt", defaultDate: hoje });
        } else {
            console.error("Biblioteca de calendário (flatpickr) não carregou.");
        }

        // --- ESTADO DA APLICAÇÃO ---
        let carrinho = [];
        let dadosOriginaisNF = null;
        let submittedMaterials = new Set();

        // --- LÓGICA DO MENU ---
        ui.menuItems.forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); const targetSubmenu = document.getElementById(item.dataset.target); document.querySelectorAll('.submenu').forEach(sm => { if (sm !== targetSubmenu) sm.classList.remove('active'); }); targetSubmenu.classList.toggle('active'); }); });
        ui.submenuItems.forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); ui.submenuItems.forEach(i => i.classList.remove('active')); ui.pages.forEach(p => p.classList.remove('active')); item.classList.add('active'); document.getElementById(item.dataset.page).classList.add('active'); }); });

        // --- LÓGICA DO CARRINHO ---
        function updateCartView() {
            ui.cart.counter.textContent = carrinho.length;
            if (carrinho.length === 0) {
                ui.cart.list.innerHTML = '<p>Seu carrinho de devolução está vazio.</p>';
                ui.cart.finalizarBtn.disabled = true;
                ui.cart.cancelarBtn.style.display = 'none';
            } else {
                ui.cart.finalizarBtn.disabled = false;
                ui.cart.cancelarBtn.style.display = 'inline-flex';
                ui.cart.list.innerHTML = carrinho.map(item => `<div class="cart-item"><div class="cart-item-info"><span class="material">${item.descricao}</span><span class="motivo">${item.motivo}</span></div><div class="cart-item-qty">Qtd: ${item.quantidade}</div></div>`).join('');
            }
        }

        ui.cart.icon.addEventListener('click', () => { updateCartView(); ui.cart.modalOverlay.classList.add('visible'); });
        ui.cart.closeBtn.addEventListener('click', () => ui.cart.modalOverlay.classList.remove('visible'));
        ui.cart.modalOverlay.addEventListener('click', (e) => { if (e.target === ui.cart.modalOverlay) ui.cart.modalOverlay.classList.remove('visible'); });

        ui.cart.cancelarBtn.addEventListener('click', () => {
            if (carrinho.length > 0 && confirm('Tem certeza que deseja limpar o carrinho?')) {
                carrinho.forEach(itemNoCarrinho => {
                    const row = document.getElementById(`item-row-${itemNoCarrinho.index}`);
                    if (row) {
                        const qtySpan = row.querySelector('.qty-disponivel');
                        const qtdAtual = parseInt(qtySpan.textContent);
                        const qtdDevolvida = parseInt(itemNoCarrinho.quantidade);
                        qtySpan.textContent = qtdAtual + qtdDevolvida;
                    }
                });
                carrinho = [];
                updateCartView();
                document.querySelectorAll('.item-row.added-to-cart').forEach(row => {
                    row.classList.remove('added-to-cart');
                    const iconContainer = row.querySelector('.icon-container');
                    if(iconContainer) iconContainer.innerHTML = `<i data-feather="plus-circle"></i>`;
                });
                feather.replace();
                ui.cart.modalOverlay.classList.remove('visible');
            }
        });
        
        ui.cart.finalizarBtn.addEventListener('click', async () => {
            try {
                if (carrinho.length === 0) return;
                carrinho.forEach(item => submittedMaterials.add(item.material));
                const promises = carrinho.map(item => eel.criar_nova_solicitacao(item)());
                const novasSolicitacoes = await Promise.all(promises);
                novasSolicitacoes.forEach(distributeSolicitationToPages);
                alert(`${carrinho.length} solicitação(ões) criada(s) com sucesso!`);
                carrinho = [];
                dadosOriginaisNF = null;
                updateCartView();
                ui.cart.modalOverlay.classList.remove('visible');
                ui.nfInput.value = '';
                ui.resultsArea.innerHTML = '';
            } catch (error) {
                console.error("Erro ao finalizar o carrinho:", error);
                alert("Ocorreu um erro ao finalizar o carrinho. Por favor, verifique o console (F12) para mais detalhes.");
            }
        });

        // --- LÓGICA DA PÁGINA "NOVA SOLICITAÇÃO" ---
        ui.consultarBtn.addEventListener('click', async () => {
            carrinho = []; updateCartView();
            const nf = ui.nfInput.value;
            if (!nf) { ui.resultsArea.innerHTML = '<p>Por favor, digite uma Nota Fiscal.</p>'; return; }
            ui.resultsArea.innerHTML = '<p>Consultando...</p>';
            const data = await eel.buscar_dados_nf(nf)();
            dadosOriginaisNF = data ? JSON.parse(JSON.stringify(data)) : null;
            renderNFResults(data);
        });

        function renderNFResults(data) {
            if (!data) { ui.resultsArea.innerHTML = '<p style="color: red;">Nota Fiscal não encontrada.</p>'; return; }
            let itemsHtml = `<div class="item-list-header"><span></span><span>Material</span><span>Descrição</span><span class="qty-col">Total</span><span class="qty-col">Disponível</span></div>`;
            data.itens.forEach((item, index) => {
                const isSubmitted = submittedMaterials.has(item.material);
                itemsHtml += `<div class="item-row ${isSubmitted ? 'added-to-cart' : ''}" id="item-row-${index}"><div class="item-summary" data-index="${index}"><span class="icon-container"><i data-feather="${isSubmitted ? 'check-circle' : 'plus-circle'}"></i></span><span>${item.material}</span><span>${item.descricao}</span><span class="qty-col">${item.qtde_total}</span><span class="qty-col qty-disponivel">${item.qtde_disponivel}</span></div><div class="item-details-form" id="details-form-${index}">${generateFormHtml(item, data.motivos_devolucao, index)}</div></div>`;
            });
            ui.resultsArea.innerHTML = itemsHtml;
            feather.replace();

            ui.resultsArea.addEventListener('click', async (e) => {
                const summary = e.target.closest('.item-summary');
                const addItemBtn = e.target.closest('.add-item-btn');
                const cancelBtn = e.target.closest('.form-actions .cancel');
                const fileBtn = e.target.closest('.file-btn');
                
                if (summary) { const row = summary.closest('.item-row'); if (!row.classList.contains('added-to-cart')) { document.getElementById(`details-form-${summary.dataset.index}`).classList.toggle('open'); } }
                if (cancelBtn) { cancelBtn.closest('.item-details-form').classList.remove('open'); }
                if (fileBtn) { fileBtn.closest('.item-details-form').querySelector('.file-input').click(); }
                if (addItemBtn) {
                    const index = addItemBtn.dataset.index;
                    const form = document.getElementById(`details-form-${index}`);
                    const quantidadeInput = form.querySelector(`#quantidade-${index}`);
                    const fileInput = form.querySelector('.file-input');
                    let anexo_data = null; let anexo_filename = null;
                    if (fileInput.files.length > 0) {
                        anexo_filename = fileInput.files[0].name;
                        try { anexo_data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error); reader.readAsDataURL(fileInput.files[0]); }); } catch (error) { console.error("Erro ao ler o arquivo:", error); alert("Não foi possível ler o arquivo de imagem."); return; }
                    }
                    const itemData = dadosOriginaisNF.itens[index];
                    const itemParaCarrinho = { index: index, nota_fiscal: ui.nfInput.value, cod_cliente: dadosOriginaisNF.cod_cliente, nome_cliente: dadosOriginaisNF.nome_cliente, material: itemData.material, cod_item: itemData.cod_item, descricao: itemData.descricao, motivo: form.querySelector(`#motivo-${index}`).value, quantidade: quantidadeInput.value, observacao: form.querySelector(`#observacao-${index}`).value, anexo_filename: anexo_filename, anexo_data: anexo_data };
                    carrinho.push(itemParaCarrinho);
                    updateCartView();
                    alert(`'${itemData.descricao}' adicionado ao carrinho!`);
                    form.classList.remove('open');
                    const row = document.getElementById(`item-row-${index}`);
                    row.classList.add('added-to-cart');
                    row.querySelector('.icon-container').innerHTML = `<i data-feather="check-circle"></i>`;
                    feather.replace();
                    const qtySpan = row.querySelector('.qty-disponivel');
                    qtySpan.textContent = parseInt(qtySpan.textContent) - parseInt(itemParaCarrinho.quantidade);
                }
            });

            data.itens.forEach((item, index) => {
                const form = document.getElementById(`details-form-${index}`);
                const addItemBtn = form.querySelector('.add-item-btn');
                function validate() { const qtd = parseInt(form.querySelector(`#quantidade-${index}`).value); const max = parseInt(form.querySelector(`#quantidade-${index}`).max); const obs = form.querySelector(`#observacao-${index}`).value.trim(); const motivo = form.querySelector(`#motivo-${index}`).value; addItemBtn.disabled = !(!isNaN(qtd) && qtd > 0 && qtd <= max && obs !== '' && motivo); }
                form.querySelectorAll('input, select, textarea').forEach(input => input.addEventListener('input', validate));
                form.querySelector('.file-input').addEventListener('change', (e) => { if (e.target.files.length > 0) { form.querySelector('.file-btn').textContent = e.target.files[0].name; } });
            });
        }
        function generateFormHtml(item, motivos, index) { let motivosOptions = `<option value="" disabled selected hidden>Selecione um motivo...</option>` + motivos.map(m => `<option value="${m}">${m}</option>`).join(''); return `<h4>${item.descricao}</h4><div class="details-form-grid"><div class="form-group"><label>Material</label><input type="text" value="${item.material}" readonly></div><div class="form-group"><label>Informe a Quantidade</label><input type="number" id="quantidade-${index}" placeholder="Ex: ${item.qtde_disponivel}" max="${item.qtde_disponivel}" min="1"></div><div class="form-group" style="grid-column: 1 / -1;"><label>Motivos</label><div class="custom-select"><select id="motivo-${index}">${motivosOptions}</select></div></div><div class="form-group" style="grid-column: 1 / -1;"><label>Foto da Peça</label><input type="file" class="file-input" accept="image/*" hidden><button class="button small file-btn">SELECIONAR ARQUIVO</button></div><div class="form-group" style="grid-column: 1 / -1;"><label>Observação</label><textarea id="observacao-${index}" placeholder="Descreva o ocorrido..."></textarea></div></div><div class="form-actions"><button class="button cancel">CANCELAR</button><button class="button primary add-item-btn" data-index="${index}" disabled>ADICIONAR ITEM</button></div>`; }

        // --- LÓGICA DO CARD EXPANSÍVEL E MODAL DE IMAGEM ---
        ui.imageModal.closeBtn.addEventListener('click', () => ui.imageModal.overlay.classList.remove('visible'));
        ui.imageModal.overlay.addEventListener('click', (e) => { if(e.target === ui.imageModal.overlay) ui.imageModal.overlay.classList.remove('visible'); });
        
        // --- CORREÇÃO: O event listener deve ser na lista correta ---
        ui.solicitacoesLists.acompanhar.list.addEventListener('click', (e) => {
            const summary = e.target.closest('.card-summary');
            const thumbnail = e.target.closest('.anexo-imagem');
            if (thumbnail) {
                e.stopPropagation();
                ui.imageModal.image.src = thumbnail.src;
                ui.imageModal.overlay.classList.add('visible');
                feather.replace();
            } else if (summary) {
                const card = summary.closest('.solicitacao-card.expandable');
                if (card) card.classList.toggle('expanded');
            }
        });

        function distributeSolicitationToPages(data) {
            const mainList = ui.solicitacoesLists.acompanhar.list;
            if(mainList) {
                mainList.querySelector('.empty-list-message').style.display = 'none';
                mainList.insertAdjacentHTML('afterbegin', createSolicitacaoCardHtml(data, true));
            }
            const motivo = data.motivo;
            let targetListKey = null;
            if (motivo.startsWith('(177)')) { targetListKey = 'qualidade'; } 
            else if (motivo.startsWith('(167)') || motivo.startsWith('(104)')) { targetListKey = 'logistica'; }
            else if (motivo.startsWith('(90)')) { targetListKey = 'comercial'; }

            if (targetListKey) {
                const targetUi = ui.solicitacoesLists[targetListKey];
                targetUi.emptyMsg.style.display = 'none';
                targetUi.list.insertAdjacentHTML('afterbegin', createSolicitacaoCardHtml(data, false));
            }
            feather.replace();
        }

        function createSolicitacaoCardHtml(data, isExpandable) {
            let anexoHtml = `<div class="detail-item"><b>Anexo:</b><span>Nenhum anexo.</span></div>`;
            if (data.anexo_path && data.anexo_path !== "Nenhum anexo") { anexoHtml = `<div class="detail-item"><b>Anexo:</b><img class="anexo-imagem" src="${data.anexo_path}" alt="Anexo"></div>`; }
            const cardClasses = `solicitacao-card ${isExpandable ? 'expandable' : ''}`;
            const summaryHtml = `<div class="card-summary"><div class="card-column-left"><span><b>Cód. Solicitação:</b> ${data.cod_solicitacao}</span><span class="status">${data.motivo}</span><span>${data.nome_cliente}</span>${isExpandable ? '<i class="arrow-icon" data-feather="chevron-down"></i>' : ''}</div><div class="card-column-right"><span><b>Nota Fiscal:</b> ${data.nota_fiscal}</span><span><b>Peça:</b> ${data.material}</span><span><b>Data:</b> ${data.data}</span><span class="analise">EM ANÁLISE</span></div></div>`;
            const detailsHtml = isExpandable ? `<div class="card-details">${anexoHtml}<div class="detail-item"><b>Observação:</b><span>${data.observacao || "Nenhuma observação."}</span></div></div>` : '';
            return `<div class="${cardClasses}" data-cod-solicitacao="${data.cod_solicitacao}" data-material="${data.material}" data-cliente="${data.nome_cliente}" data-nota-fiscal="${data.nota_fiscal}" data-motivo="${data.motivo}">${summaryHtml}${detailsHtml}</div>`;
        }

        // --- LÓGICA DE FILTRAGEM ---
        function setupPageFilters(pageKey) {
            const searchInput = document.getElementById(`search-input-${pageKey}`);
            const filterCombo = document.getElementById(`filter-combo-${pageKey}`);
            const list = ui.solicitacoesLists[pageKey].list;
            const emptyMsg = ui.solicitacoesLists[pageKey].emptyMsg;
            function applyFilters() {
                const searchTerm = searchInput.value.toLowerCase();
                const filterType = filterCombo.value;
                let visibleCount = 0;
                list.querySelectorAll('.solicitacao-card').forEach(card => {
                    let textToSearch = card.dataset[filterType.replace(/ /g, '').replace('ó', 'o').replace('çã', 'ca').toLowerCase()] || '';
                    if (textToSearch.toLowerCase().includes(searchTerm)) {
                        card.style.display = 'block'; visibleCount++;
                    } else { card.style.display = 'none'; }
                });
                emptyMsg.style.display = visibleCount > 0 ? 'none' : 'block';
            }
            searchInput.addEventListener('input', applyFilters);
            filterCombo.addEventListener('change', applyFilters);
        }
        ['acompanhar', 'qualidade', 'logistica', 'comercial'].forEach(setupPageFilters);
        
    });
} catch (error) {
    console.error("ERRO FATAL NO SCRIPT:", error);
    alert("Ocorreu um erro crítico. Por favor, abra o console (F12) e envie uma captura de tela do erro.");
}