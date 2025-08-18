// web/script.js
try {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOM carregado. Iniciando script FINAL.");

        if (typeof feather !== 'undefined') { feather.replace(); }
        if (typeof flatpickr !== 'undefined') {
            const hoje = new Date();
            const ontem = new Date();
            ontem.setDate(hoje.getDate() - 1);
            flatpickr("#date-start", { dateFormat: "d/m/Y", locale: "pt", defaultDate: ontem });
            flatpickr("#date-end", { dateFormat: "d/m/Y", locale: "pt", defaultDate: hoje });
        } else {
            console.error("Biblioteca de calendário (flatpickr) não carregou.");
        }
        
        const menuItems = document.querySelectorAll('.menu-item');
        const submenuItems = document.querySelectorAll('.submenu-item');
        const pages = document.querySelectorAll('.page');
        const consultarBtn = document.getElementById('consultar-nf-btn');
        const nfInput = document.getElementById('nf-input');
        const resultsArea = document.getElementById('nf-results-area');
        const cartIcon = document.getElementById('cart-icon');
        const cartCounter = document.getElementById('cart-counter');
        const cartModalOverlay = document.getElementById('cart-modal-overlay');
        const closeCartBtn = document.getElementById('close-cart-btn');
        const cartItemsList = document.getElementById('cart-items-list');
        const finalizarBtn = document.getElementById('finalizar-btn');
        const cancelarCarrinhoBtn = document.getElementById('cancelar-carrinho-btn');
        const solicitacoesList = document.getElementById('solicitacoes-list');
        const emptyMessage = document.getElementById('empty-list-message');
        const imageModalOverlay = document.getElementById('image-modal-overlay');
        const modalImage = document.getElementById('modal-image');
        const closeImageBtn = document.getElementById('close-image-btn');
        const searchInput = document.getElementById('search-input');
        const filterCombo = document.getElementById('filter-combo');

        let carrinho = [];
        let dadosOriginaisNF = null;
        let submittedMaterials = new Set();

        menuItems.forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); const targetSubmenu = document.getElementById(item.dataset.target); document.querySelectorAll('.submenu').forEach(sm => { if (sm !== targetSubmenu) sm.classList.remove('active'); }); targetSubmenu.classList.toggle('active'); }); });
        submenuItems.forEach(item => { item.addEventListener('click', (e) => { e.preventDefault(); submenuItems.forEach(i => i.classList.remove('active')); pages.forEach(p => p.classList.remove('active')); item.classList.add('active'); document.getElementById(item.dataset.page).classList.add('active'); }); });

        function updateCartView() {
            cartCounter.textContent = carrinho.length;
            if (carrinho.length === 0) {
                cartItemsList.innerHTML = '<p>Seu carrinho de devolução está vazio.</p>';
                finalizarBtn.disabled = true;
                cancelarCarrinhoBtn.style.display = 'none';
            } else {
                finalizarBtn.disabled = false;
                cancelarCarrinhoBtn.style.display = 'inline-flex';
                cartItemsList.innerHTML = carrinho.map(item => `<div class="cart-item"><div class="cart-item-info"><span class="material">${item.descricao}</span><span class="motivo">${item.motivo}</span></div><div class="cart-item-qty">Qtd: ${item.quantidade}</div></div>`).join('');
            }
        }

        cartIcon.addEventListener('click', () => { updateCartView(); cartModalOverlay.classList.add('visible'); });
        closeCartBtn.addEventListener('click', () => cartModalOverlay.classList.remove('visible'));
        cartModalOverlay.addEventListener('click', (e) => { if (e.target === cartModalOverlay) cartModalOverlay.classList.remove('visible'); });

        cancelarCarrinhoBtn.addEventListener('click', () => {
            if (carrinho.length > 0 && confirm('Tem certeza que deseja limpar o carrinho?')) {
                // Devolve as quantidades para os itens que estavam no carrinho
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
                cartModalOverlay.classList.remove('visible');
            }
        });

        finalizarBtn.addEventListener('click', async () => {
            if (carrinho.length === 0) return;
            carrinho.forEach(item => submittedMaterials.add(item.material));
            const promises = carrinho.map(item => eel.criar_nova_solicitacao(item)());
            const novasSolicitacoes = await Promise.all(promises);
            novasSolicitacoes.forEach(addSolicitacaoCard);
            alert(`${carrinho.length} solicitação(ões) criada(s) com sucesso!`);
            
            carrinho = [];
            dadosOriginaisNF = null;
            updateCartView();
            cartModalOverlay.classList.remove('visible');
            nfInput.value = '';
            resultsArea.innerHTML = '';
        });

        consultarBtn.addEventListener('click', async () => {
            carrinho = []; updateCartView();
            const nf = nfInput.value;
            if (!nf) { resultsArea.innerHTML = '<p>Por favor, digite uma Nota Fiscal.</p>'; return; }
            resultsArea.innerHTML = '<p>Consultando...</p>';
            const data = await eel.buscar_dados_nf(nf)();
            dadosOriginaisNF = data ? JSON.parse(JSON.stringify(data)) : null;
            renderNFResults(data);
        });

        function renderNFResults(data) {
            if (!data) { resultsArea.innerHTML = '<p style="color: red;">Nota Fiscal não encontrada.</p>'; return; }
            let itemsHtml = `<div class="item-list-header"><span></span><span>Material</span><span>Descrição</span><span class="qty-col">Total</span><span class="qty-col">Disponível</span></div>`;
            data.itens.forEach((item, index) => {
                const isSubmitted = submittedMaterials.has(item.material);
                itemsHtml += `
                    <div class="item-row ${isSubmitted ? 'added-to-cart' : ''}" id="item-row-${index}">
                        <div class="item-summary" data-index="${index}">
                            <span class="icon-container"><i data-feather="${isSubmitted ? 'check-circle' : 'plus-circle'}"></i></span>
                            <span>${item.material}</span><span>${item.descricao}</span>
                            <span class="qty-col">${item.qtde_total}</span>
                            <span class="qty-col qty-disponivel">${item.qtde_disponivel}</span>
                        </div>
                        <div class="item-details-form" id="details-form-${index}">${generateFormHtml(item, data.motivos_devolucao, index)}</div>
                    </div>`;
            });
            resultsArea.innerHTML = itemsHtml;
            feather.replace();

            resultsArea.addEventListener('click', async (e) => {
                const summary = e.target.closest('.item-summary');
                const addItemBtn = e.target.closest('.add-item-btn');
                const cancelBtn = e.target.closest('.form-actions .cancel');
                const fileBtn = e.target.closest('.file-btn');
                
                if (summary) {
                    const row = summary.closest('.item-row');
                    if (!row.classList.contains('added-to-cart')) {
                        document.getElementById(`details-form-${summary.dataset.index}`).classList.toggle('open');
                    }
                }
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
                        try {
                            anexo_data = await new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onload = () => resolve(reader.result);
                                reader.onerror = error => reject(error);
                                reader.readAsDataURL(fileInput.files[0]);
                            });
                        } catch (error) { console.error("Erro ao ler o arquivo:", error); alert("Não foi possível ler o arquivo de imagem."); return; }
                    }
                    const itemData = dadosOriginaisNF.itens[index];
                    const itemParaCarrinho = {
                        index: index, // Guarda o índice para a lógica de cancelamento
                        nota_fiscal: nfInput.value, cod_cliente: dadosOriginaisNF.cod_cliente, nome_cliente: dadosOriginaisNF.nome_cliente,
                        material: itemData.material, cod_item: itemData.cod_item, descricao: itemData.descricao,
                        motivo: form.querySelector(`#motivo-${index}`).value,
                        quantidade: quantidadeInput.value,
                        observacao: form.querySelector(`#observacao-${index}`).value,
                        anexo_filename: anexo_filename, anexo_data: anexo_data
                    };
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

            data.itens.forEach((item, index) => { /* ... código de validação ... */ });
            data.itens.forEach((item, index) => {
                const form = document.getElementById(`details-form-${index}`);
                const addItemBtn = form.querySelector('.add-item-btn');
                function validate() {
                    const qtd = parseInt(form.querySelector(`#quantidade-${index}`).value);
                    const max = parseInt(form.querySelector(`#quantidade-${index}`).max);
                    const obs = form.querySelector(`#observacao-${index}`).value.trim();
                    const motivo = form.querySelector(`#motivo-${index}`).value;
                    addItemBtn.disabled = !(!isNaN(qtd) && qtd > 0 && qtd <= max && obs !== '' && motivo);
                }
                form.querySelectorAll('input, select, textarea').forEach(input => input.addEventListener('input', validate));
                form.querySelector('.file-input').addEventListener('change', (e) => { if (e.target.files.length > 0) { form.querySelector('.file-btn').textContent = e.target.files[0].name; } });
            });
        }

        function generateFormHtml(item, motivos, index) { /* ... */ }
        function addSolicitacaoCard(data) { /* ... */ }
        
        function applyFilters() {
            const searchTerm = searchInput.value.toLowerCase();
            const filterType = filterCombo.value;
            let visibleCount = 0;
            document.querySelectorAll('.solicitacao-card').forEach(card => {
                let textToSearch = '';
                switch(filterType) {
                    case 'Código de Solicitação': textToSearch = card.dataset.codSolicitacao; break;
                    case 'Material': textToSearch = card.dataset.material; break;
                    case 'Cliente': textToSearch = card.dataset.cliente; break;
                    case 'Nota Fiscal': textToSearch = card.dataset.notaFiscal; break;
                    case 'Motivo': textToSearch = card.dataset.motivo; break;
                }
                if (textToSearch.toLowerCase().includes(searchTerm)) {
                    card.style.display = 'flex'; visibleCount++;
                } else { card.style.display = 'none'; }
            });
            emptyMessage.style.display = visibleCount > 0 ? 'none' : 'block';
        }
        searchInput.addEventListener('input', applyFilters);
        filterCombo.addEventListener('change', applyFilters);
        
        // Colar aqui o restante das funções
        generateFormHtml = (item, motivos, index) => { let motivosOptions = `<option value="" disabled selected hidden>Selecione um motivo...</option>` + motivos.map(m => `<option value="${m}">${m}</option>`).join(''); return `<h4>${item.descricao}</h4><div class="details-form-grid"><div class="form-group"><label>Material</label><input type="text" value="${item.material}" readonly></div><div class="form-group"><label>Informe a Quantidade</label><input type="number" id="quantidade-${index}" placeholder="Ex: ${item.qtde_disponivel}" max="${item.qtde_disponivel}" min="1"></div><div class="form-group" style="grid-column: 1 / -1;"><label>Motivos</label><div class="custom-select"><select id="motivo-${index}">${motivosOptions}</select></div></div><div class="form-group" style="grid-column: 1 / -1;"><label>Foto da Peça</label><input type="file" class="file-input" accept="image/*" hidden><button class="button small file-btn">SELECIONAR ARQUIVO</button></div><div class="form-group" style="grid-column: 1 / -1;"><label>Observação</label><textarea id="observacao-${index}" placeholder="Descreva o ocorrido..."></textarea></div></div><div class="form-actions"><button class="button cancel">CANCELAR</button><button class="button primary add-item-btn" data-index="${index}" disabled>ADICIONAR ITEM</button></div>`; };
        addSolicitacaoCard = (data) => { if (emptyMessage) emptyMessage.style.display = 'none'; const card = document.createElement('div'); card.className = 'solicitacao-card'; card.dataset.codSolicitacao = data.cod_solicitacao; card.dataset.material = data.material; card.dataset.cliente = data.nome_cliente; card.dataset.notaFiscal = data.nota_fiscal; card.dataset.motivo = data.motivo; let anexoHtml = `<div class="detail-item"><b>Anexo:</b><span>Nenhum anexo.</span></div>`; if (data.anexo_path && data.anexo_path !== "Nenhum anexo") { anexoHtml = `<div class="detail-item"><b>Anexo:</b><img class="anexo-imagem" src="${data.anexo_path}" alt="Anexo"></div>`; } card.innerHTML = `<div class="card-summary"><div class="card-column-left"><span><b>Cód. Solicitação:</b> ${data.cod_solicitacao}</span><span class="status">${data.motivo}</span><span>${data.nome_cliente}</span><i class="arrow-icon" data-feather="chevron-down"></i></div><div class="card-column-right"><span><b>Nota Fiscal:</b> ${data.nota_fiscal}</span><span><b>Peça:</b> ${data.material}</span><span><b>Data:</b> ${data.data}</span><span class="analise">EM ANÁLISE</span></div></div><div class="card-details">${anexoHtml}<div class="detail-item"><b>Observação:</b><span>${data.observacao || "Nenhuma observação."}</span></div></div>`; solicitacoesList.prepend(card); feather.replace(); };
    });
} catch (error) {
    alert("Ocorreu um erro crítico. Por favor, abra o console (F12) e envie uma captura de tela do erro.");
    console.error("ERRO FATAL NO SCRIPT:", error);
}