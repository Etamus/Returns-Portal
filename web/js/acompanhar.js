// web/js/acompanhar.js

let ui = {};

export function initAcompanhar() {
    ui.solicitacoesLists = {
        acompanhar: { list: document.getElementById('solicitacoes-list-acompanhar'), emptyMsg: document.getElementById('empty-message-acompanhar') },
        qualidade: { list: document.getElementById('solicitacoes-list-qualidade'), emptyMsg: document.getElementById('empty-message-qualidade') },
        logistica: { list: document.getElementById('solicitacoes-list-logistica'), emptyMsg: document.getElementById('empty-message-logistica') },
        comercial: { list: document.getElementById('solicitacoes-list-comercial'), emptyMsg: document.getElementById('empty-message-comercial') }
    };
    ui.imageModal = {
        overlay: document.getElementById('image-modal-overlay'),
        image: document.getElementById('modal-image'),
        closeBtn: document.getElementById('close-image-btn'),
    };
    
    // Anexa eventos
    ui.imageModal.closeBtn.addEventListener('click', () => ui.imageModal.overlay.classList.remove('visible'));
    ui.imageModal.overlay.addEventListener('click', (e) => { if(e.target === ui.imageModal.overlay) ui.imageModal.overlay.classList.remove('visible'); });

    // Anexa um grande event listener para todas as listas
    document.querySelector('.main-content').addEventListener('click', (e) => {
        handleMainContentClick(e);
    });

    Object.keys(ui.solicitacoesLists).forEach(setupPageFilters);
}

function handleMainContentClick(e) {
    // Lógica de expandir/recolher
    const summary = e.target.closest('.card-summary');
    if (summary) {
        const card = summary.closest('.solicitacao-card.expandable');
        if (card) card.classList.toggle('expanded');
    }

    // Lógica de abrir imagem
    const thumbnail = e.target.closest('.anexo-imagem');
    if (thumbnail) {
        e.stopPropagation();
        ui.imageModal.image.src = thumbnail.src;
        ui.imageModal.overlay.classList.add('visible');
        feather.replace();
    }

    // Lógica de Aprovação/Reprovação
    const approveBtn = e.target.closest('.approve-btn');
    const reproveBtn = e.target.closest('.reprove-btn');
    const reproveConfirmBtn = e.target.closest('.reprove-confirm-btn');

    if (reproveBtn) {
        const reasonDiv = reproveBtn.closest('.approval-section').querySelector('.reproval-reason');
        reasonDiv.classList.toggle('visible');
    }
    if (approveBtn) {
        const card = approveBtn.closest('.solicitacao-card');
        const codSolicitacao = card.dataset.codSolicitacao;
        if(confirm(`Tem certeza que deseja APROVAR a solicitação #${codSolicitacao}?`)) {
            processApproval(codSolicitacao, true, '');
        }
    }
    if (reproveConfirmBtn) {
        const card = reproveConfirmBtn.closest('.solicitacao-card');
        const codSolicitacao = card.dataset.codSolicitacao;
        const justificationTextarea = card.querySelector('.reproval-reason textarea');
        if (!justificationTextarea.value.trim()) {
            alert('Por favor, preencha a justificativa da reprovação.');
            return;
        }
        if(confirm(`Tem certeza que deseja REPROVAR a solicitação #${codSolicitacao}?`)) {
            processApproval(codSolicitacao, false, justificationTextarea.value);
        }
    }
}

function processApproval(codSolicitacao, isApproved, justification) {
    const status = isApproved ? 'Aprovado' : 'Reprovado';
    const today = new Date().toLocaleDateString('pt-BR');
    
    const mainCard = document.getElementById(`card-acompanhar-${codSolicitacao}`);
    const setorCard = document.querySelector(`.solicitacao-card[data-cod-solicitacao="${codSolicitacao}"]:not(#card-acompanhar-${codSolicitacao})`);

    if (mainCard) {
        const statusSpan = mainCard.querySelector('.analise');
        const approvalDetailsDiv = mainCard.querySelector('.approval-info-placeholder');
        
        statusSpan.textContent = status.toUpperCase();
        statusSpan.className = `analise status-${status.toLowerCase()}`;
        
        if (approvalDetailsDiv) {
            approvalDetailsDiv.innerHTML = generateTimelineHtml(status, today, justification);
        }
    }
    if (setorCard) {
        const listContainer = setorCard.parentElement;
        setorCard.remove();
        if (listContainer && listContainer.querySelectorAll('.solicitacao-card').length === 0) {
            listContainer.querySelector('.empty-list-message').style.display = 'block';
        }
    }
}

function generateTimelineHtml(status, date, justification) {
    const isApproved = status === 'Aprovado';
    const isReproved = status === 'Reprovado';
    
    const steps = [
        { label: 'Em Análise', status: 'completed' },
        { label: status, status: isApproved ? 'completed' : 'reproved' },
        { label: 'Criação de Ordem', status: isApproved ? 'in-progress' : 'pending' },
        { label: 'Aguardando NFD', status: 'pending' },
        { label: 'Coleta', status: 'pending' }
    ];

    const stepsHtml = steps.map(step => `
        <div class="timeline-step ${step.status}">
            <div class="icon">${step.status === 'completed' ? '✓' : ''}</div>
            <div class="label">${step.label}</div>
            ${step.label === status ? `<div class="date">${date}</div>` : ''}
        </div>`).join('');
    const justificationHtml = isReproved ? `<p style="margin-top: 10px;"><b>Justificativa:</b> ${justification}</p>` : '';
    return `<div class="timeline">${stepsHtml}</div>${justificationHtml}`;
}

export function distributeSolicitationToPages(data) {
    const mainList = ui.solicitacoesLists.acompanhar.list;
    if(mainList) {
        mainList.querySelector('.empty-list-message').style.display = 'none';
        mainList.insertAdjacentHTML('afterbegin', createSolicitacaoCardHtml(data, 'acompanhar'));
    }
    const motivo = data.motivo;
    let targetListKey = null;
    if (motivo.startsWith('(177)')) { targetListKey = 'qualidade'; } 
    else if (motivo.startsWith('(167)') || motivo.startsWith('(104)')) { targetListKey = 'logistica'; }
    else if (motivo.startsWith('(90)')) { targetListKey = 'comercial'; }

    if (targetListKey) {
        const targetUi = ui.solicitacoesLists[targetListKey];
        targetUi.emptyMsg.style.display = 'none';
        targetUi.list.insertAdjacentHTML('afterbegin', createSolicitacaoCardHtml(data, targetListKey));
    }
    feather.replace();
}

function createSolicitacaoCardHtml(data, pageType) {
    const isExpandable = true;
    let anexoHtml = `<div class="detail-item"><b>Anexo:</b><span>Nenhum anexo.</span></div>`;
    if (data.anexo_path && data.anexo_path !== "Nenhum anexo") {
        anexoHtml = `<div class="detail-item"><b>Anexo:</b><img class="anexo-imagem" src="${data.anexo_path}" alt="Anexo"></div>`;
    }
    
    const cardId = `card-${pageType}-${data.cod_solicitacao}`;
    const cardClasses = `solicitacao-card ${isExpandable ? 'expandable' : ''}`;
    const summaryHtml = `<div class="card-summary"><div class="card-column-left"><span><b>Cód. Solicitação:</b> ${data.cod_solicitacao}</span><span class="status">${data.motivo}</span><span>${data.nome_cliente}</span><i class="arrow-icon" data-feather="chevron-down"></i></div><div class="card-column-right"><span><b>Nota Fiscal:</b> ${data.nota_fiscal}</span><span><b>Peça:</b> ${data.material}</span><span><b>Data:</b> ${data.data}</span><span class="analise">EM ANÁLISE</span></div></div>`;
    
    let approvalHtml = '';
    if (pageType !== 'acompanhar') {
        approvalHtml = `<div class="approval-section"><div class="approval-buttons"><button class="button small approve-btn">APROVAR</button><button class="button small reprove-btn">REPROVAR</button></div><div class="reproval-reason"><textarea placeholder="Digite a justificativa da reprovação..."></textarea><button class="button small primary reprove-confirm-btn" style="margin-top: 10px;">CONFIRMAR</button></div></div>`;
    } else {
        approvalHtml = `<div class="approval-info-placeholder"></div>`;
    }

    const detailsHtml = `<div class="card-details"><div class="detail-content">${anexoHtml}<div class="detail-item"><b>Observação:</b><span>${data.observacao || "Nenhuma observação."}</span></div></div>${approvalHtml}</div>`;
    return `<div id="${cardId}" class="${cardClasses}" data-cod-solicitacao="${data.cod_solicitacao}" data-material="${data.material}" data-cliente="${data.nome_cliente}" data-notafiscal="${data.nota_fiscal}" data-motivo="${data.motivo}">${summaryHtml}${detailsHtml}</div>`;
}

function setupPageFilters(pageKey) {
    const searchInput = document.getElementById(`search-input-${pageKey}`);
    const filterCombo = document.getElementById(`filter-combo-${pageKey}`);
    if(!searchInput || !filterCombo) return;

    const list = ui.solicitacoesLists[pageKey].list;
    const emptyMsg = ui.solicitacoesLists[pageKey].emptyMsg;

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterType = filterCombo.value;
        let visibleCount = 0;
        list.querySelectorAll('.solicitacao-card').forEach(card => {
            const dataAttribute = `data-${filterType.replace(/ /g, '').replace('ó', 'o').replace('çã', 'ca').toLowerCase()}`;
            let textToSearch = card.getAttribute(dataAttribute) || '';
            if (textToSearch.toLowerCase().includes(searchTerm)) {
                card.style.display = 'block'; visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        emptyMsg.style.display = visibleCount > 0 ? 'none' : 'block';
    }
    searchInput.addEventListener('input', applyFilters);
    filterCombo.addEventListener('change', applyFilters);
}