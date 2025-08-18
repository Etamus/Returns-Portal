// web/script.js

document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    flatpickr("#date-start", { dateFormat: "d/m/Y", locale: "pt" });
    flatpickr("#date-end", { dateFormat: "d/m/Y", locale: "pt" });

    // Lógica do menu lateral
    const menuItems = document.querySelectorAll('.menu-item');
    const submenuItems = document.querySelectorAll('.submenu-item');
    const pages = document.querySelectorAll('.page');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSubmenu = document.getElementById(item.dataset.target);
            document.querySelectorAll('.submenu').forEach(sm => {
                if (sm !== targetSubmenu) sm.classList.remove('active');
            });
            targetSubmenu.classList.toggle('active');
        });
    });
    submenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            submenuItems.forEach(i => i.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.page).classList.add('active');
        });
    });

    // Lógica da página "Nova Solicitação"
    const consultarBtn = document.getElementById('consultar-nf-btn');
    const nfInput = document.getElementById('nf-input');
    const resultsArea = document.getElementById('nf-results-area');
    consultarBtn.addEventListener('click', async () => {
        const nf = nfInput.value;
        if (!nf) { resultsArea.innerHTML = '<p>Por favor, digite uma Nota Fiscal.</p>'; return; }
        resultsArea.innerHTML = '<p>Consultando...</p>';
        const data = await eel.buscar_dados_nf(nf)();
        renderNFResults(data);
    });

    function renderNFResults(data) {
        if (!data) { resultsArea.innerHTML = '<p style="color: red;">Nota Fiscal não encontrada.</p>'; return; }
        
        let itemsHtml = `
            <div class="item-list-header">
                <span></span>
                <span>Material</span>
                <span>Descrição</span>
                <span class="centered-col">Total</span>
                <span class="centered-col">Disponível</span>
            </div>`;

        data.itens.forEach((item, index) => {
            itemsHtml += `
                <div class="item-row" id="item-row-${index}">
                    <div class="item-summary" data-index="${index}">
                        <i data-feather="plus-circle"></i>
                        <span>${item.material}</span>
                        <span>${item.descricao}</span>
                        <span class="centered-col">${item.qtde_total}</span>
                        <span class="centered-col">${item.qtde_disponivel}</span>
                    </div>
                    <div class="item-details-form" id="details-form-${index}">${generateFormHtml(item, data.motivos_devolucao, index)}</div>
                </div>`;
        });

        resultsArea.innerHTML = itemsHtml;
        feather.replace();
        document.querySelectorAll('.item-summary').forEach(summary => {
            summary.addEventListener('click', () => {
                document.getElementById(`details-form-${summary.dataset.index}`).classList.toggle('open');
            });
        });
        document.querySelectorAll('.add-item-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const index = e.target.dataset.index;
                const dadosForm = {
                    nota_fiscal: nfInput.value, cod_cliente: data.cod_cliente, nome_cliente: data.nome_cliente,
                    material: data.itens[index].material, cod_item: data.itens[index].cod_item,
                    motivo: document.getElementById(`motivo-${index}`).value,
                    quantidade: document.getElementById(`quantidade-${index}`).value,
                    observacao: document.getElementById(`observacao-${index}`).value,
                };
                const novaSolicitacao = await eel.criar_nova_solicitacao(dadosForm)();
                addSolicitacaoCard(novaSolicitacao);
                alert('Solicitação criada com sucesso!');
                nfInput.value = '';
                resultsArea.innerHTML = '';
            });
        });
    }

    function generateFormHtml(item, motivos, index) {
        let motivosOptions = motivos.map(m => `<option>${m}</option>`).join('');
        return `
            <h4>${item.descricao}</h4>
            <div class="details-form-grid">
                <div class="form-group"><label>Material</label><input type="text" value="${item.material}" readonly></div>
                <div class="form-group"><label>Informe a Quantidade</label><input type="number" id="quantidade-${index}" placeholder="0"></div>
                <div class="form-group" style="grid-column: 1 / -1;"><label>Motivos*</label><div class="custom-select"><select id="motivo-${index}">${motivosOptions}</select></div></div>
                <div class="form-group" style="grid-column: 1 / -1;"><label>Foto da Peça</label><button class="button small">SELECIONAR ARQUIVO</button></div>
                <div class="form-group" style="grid-column: 1 / -1;"><label>Observação</label><textarea id="observacao-${index}" placeholder="Descreva o ocorrido..."></textarea></div>
            </div>
            <div class="form-actions">
                <button class="button cancel">CANCELAR</button>
                <button class="button primary add-item-btn" data-index="${index}">ADICIONAR ITEM</button>
            </div>`;
    }

    // Lógica da página "Acompanhar Solicitações"
    const solicitacoesList = document.getElementById('solicitacoes-list');
    const emptyMessage = document.getElementById('empty-list-message');

    function addSolicitacaoCard(data) {
        if (emptyMessage) emptyMessage.style.display = 'none';
        const card = document.createElement('div');
        card.className = 'solicitacao-card';
        card.innerHTML = `
            <div class="card-column-left">
                <span><b>Cód. Solicitação:</b> ${data.cod_solicitacao}</span>
                <span class="status">${data.motivo}</span>
                <span>${data.nome_cliente}</span>
            </div>
            <div class="card-column-right">
                <span><b>Nota Fiscal:</b> ${data.nota_fiscal}</span>
                <span><b>Peça:</b> ${data.material}</span>
                <span><b>Data:</b> ${data.data}</span>
                <span class="analise">EM ANÁLISE</span>
            </div>
        `;
        solicitacoesList.prepend(card);
    }
});