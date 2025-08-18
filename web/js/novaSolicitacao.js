// web/js/novaSolicitacao.js
let appState = null;
let appCallbacks = null;

const ui = {};

export function initNovaSolicitacao(state, callbacks) {
    appState = state;
    appCallbacks = callbacks;
    
    ui.consultarBtn = document.getElementById('consultar-nf-btn');
    ui.nfInput = document.getElementById('nf-input');
    ui.resultsArea = document.getElementById('nf-results-area');

    ui.consultarBtn.addEventListener('click', async () => {
        appState.carrinho = [];
        appCallbacks.updateCartView();
        
        const nf = ui.nfInput.value;
        if (!nf) { ui.resultsArea.innerHTML = '<p>Por favor, digite uma Nota Fiscal.</p>'; return; }
        
        ui.resultsArea.innerHTML = '<p>Consultando...</p>';
        const data = await eel.buscar_dados_nf(nf)();
        
        appState.dadosOriginaisNF = data ? JSON.parse(JSON.stringify(data)) : null;
        renderNFResults(data);
    });
}

export function clearNovaSolicitacaoPage() {
    ui.nfInput.value = '';
    ui.resultsArea.innerHTML = '';
}

function renderNFResults(data) {
    if (!data) { ui.resultsArea.innerHTML = '<p style="color: red;">Nota Fiscal não encontrada.</p>'; return; }
    
    let itemsHtml = `<div class="item-list-header"><span></span><span>Material</span><span>Descrição</span><span class="qty-col">Total</span><span class="qty-col">Disponível</span></div>`;
    data.itens.forEach((item, index) => {
        const isSubmitted = appState.submittedMaterials.has(item.material);
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
    
    ui.resultsArea.innerHTML = itemsHtml;
    feather.replace();
    attachResultsAreaListeners(data);
}

function attachResultsAreaListeners(data) {
    ui.resultsArea.addEventListener('click', async (e) => {
        const addItemBtn = e.target.closest('.add-item-btn');
        if (e.target.closest('.item-summary') && !addItemBtn) {
            const row = e.target.closest('.item-row');
            if (!row.classList.contains('added-to-cart')) {
                document.getElementById(`details-form-${e.target.closest('.item-summary').dataset.index}`).classList.toggle('open');
            }
        }
        if (e.target.closest('.form-actions .cancel')) { e.target.closest('.item-details-form').classList.remove('open'); }
        if (e.target.closest('.file-btn')) { e.target.closest('.item-details-form').querySelector('.file-input').click(); }
        if (addItemBtn) {
            const index = addItemBtn.dataset.index;
            const form = document.getElementById(`details-form-${index}`);
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
            const itemData = appState.dadosOriginaisNF.itens[index];
            appState.carrinho.push({
                index: index,
                nota_fiscal: ui.nfInput.value,
                cod_cliente: appState.dadosOriginaisNF.cod_cliente,
                nome_cliente: appState.dadosOriginaisNF.nome_cliente,
                material: itemData.material,
                cod_item: itemData.cod_item,
                descricao: itemData.descricao,
                motivo: form.querySelector(`#motivo-${index}`).value,
                quantidade: form.querySelector(`#quantidade-${index}`).value,
                observacao: form.querySelector(`#observacao-${index}`).value,
                anexo_filename: anexo_filename,
                anexo_data: anexo_data
            });
            appCallbacks.updateCartView();
            alert(`'${itemData.descricao}' adicionado ao carrinho!`);
            form.classList.remove('open');
            const row = document.getElementById(`item-row-${index}`);
            row.classList.add('added-to-cart');
            row.querySelector('.icon-container').innerHTML = `<i data-feather="check-circle"></i>`;
            feather.replace();
            const qtySpan = row.querySelector('.qty-disponivel');
            qtySpan.textContent = parseInt(qtySpan.textContent) - parseInt(form.querySelector(`#quantidade-${index}`).value);
        }
    });
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
        form.querySelector('.file-input').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                form.querySelector('.file-btn').textContent = e.target.files[0].name;
            }
        });
    });
}

function generateFormHtml(item, motivos, index) {
    let motivosOptions = `<option value="" disabled selected hidden>Selecione um motivo...</option>` +
        motivos.map(m => `<option value="${m}">${m}</option>`).join('');
    return `<h4>${item.descricao}</h4><div class="details-form-grid"><div class="form-group"><label>Material</label><input type="text" value="${item.material}" readonly></div><div class="form-group"><label>Informe a Quantidade</label><input type="number" id="quantidade-${index}" placeholder="Ex: ${item.qtde_disponivel}" max="${item.qtde_disponivel}" min="1"></div><div class="form-group" style="grid-column: 1 / -1;"><label>Motivos</label><div class="custom-select"><select id="motivo-${index}">${motivosOptions}</select></div></div><div class="form-group" style="grid-column: 1 / -1;"><label>Foto da Peça</label><input type="file" class="file-input" accept="image/*" hidden><button class="button small file-btn">SELECIONAR ARQUIVO</button></div><div class="form-group" style="grid-column: 1 / -1;"><label>Observação</label><textarea id="observacao-${index}" placeholder="Descreva o ocorrido..."></textarea></div></div><div class="form-actions"><button class="button cancel">CANCELAR</button><button class="button primary add-item-btn" data-index="${index}" disabled>ADICIONAR ITEM</button></div>`;
}