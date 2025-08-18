// web/js/acompanhar.js
let ui = {};
let appCallbacks = {};

export function initAcompanhar(callbacks) {
    appCallbacks = callbacks;
    const pageKeys = ['acompanhar', 'qualidade', 'operacional', 'comercial', 'logisticaReversa'];
    ui.solicitacoesLists = {};
    pageKeys.forEach(key => {
        const listElement = document.getElementById(`solicitacoes-list-${key.replace('R', '-r')}`);
        if (listElement) {
            ui.solicitacoesLists[key] = {
                list: listElement,
                emptyMsg: listElement.querySelector('.empty-list-message')
            };
        }
    });
    ui.imageModal = { overlay: document.getElementById('image-modal-overlay'), image: document.getElementById('modal-image'), closeBtn: document.getElementById('close-image-btn'), };
    
    ui.imageModal.closeBtn.addEventListener('click', () => ui.imageModal.overlay.classList.remove('visible'));
    ui.imageModal.overlay.addEventListener('click', (e) => { if(e.target === ui.imageModal.overlay) ui.imageModal.overlay.classList.remove('visible'); });

    document.querySelector('.main-content').addEventListener('click', handleMainContentClick);
    Object.keys(ui.solicitacoesLists).forEach(setupPageFilters);
}

function handleMainContentClick(e) {
    const summary = e.target.closest('.card-summary');
    if (summary) { const card = summary.closest('.solicitacao-card.expandable'); if (card) card.classList.toggle('expanded'); }
    const thumbnail = e.target.closest('.anexo-imagem');
    if (thumbnail) { e.stopPropagation(); ui.imageModal.image.src = thumbnail.src; ui.imageModal.overlay.classList.add('visible'); feather.replace(); }

    const approveBtn = e.target.closest('.approve-btn');
    const reproveBtn = e.target.closest('.reprove-btn');
    const reproveConfirmBtn = e.target.closest('.reprove-confirm-btn');
    const approveLDBtn = e.target.closest('.approve-btn-lr');
    const reproveLDBtn = e.target.closest('.reprove-btn-lr');
    const confirmApproveLDBtn = e.target.closest('.approve-confirm-btn-lr');
    const confirmReproveLDBtn = e.target.closest('.reprove-confirm-btn-lr');

    if (reproveBtn) { const section = reproveBtn.closest('.approval-section'); section.querySelector('.reproval-reason').classList.toggle('visible'); }
    if (approveBtn) { const card = approveBtn.closest('.solicitacao-card'); const codSolicitacao = card.dataset.codSolicitacao; if(confirm(`Aprovar solicitação #${codSolicitacao}?`)) { processApproval(codSolicitacao, true, ''); } }
    if (reproveConfirmBtn) { const card = reproveConfirmBtn.closest('.solicitacao-card'); const codSolicitacao = card.dataset.codSolicitacao; const justificationTextarea = card.querySelector('.reproval-reason textarea'); if (!justificationTextarea.value.trim()) { alert('Por favor, preencha a justificativa.'); return; } if(confirm(`Reprovar solicitação #${codSolicitacao}?`)) { processApproval(codSolicitacao, false, justificationTextarea.value); } }
    
    if(reproveLDBtn) { const section = reproveLDBtn.closest('.approval-section'); section.querySelector('.approval-reason').classList.remove('visible'); section.querySelector('.reproval-reason').classList.toggle('visible'); }
    if(approveLDBtn) { const section = approveLDBtn.closest('.approval-section'); section.querySelector('.reproval-reason').classList.remove('visible'); section.querySelector('.approval-reason').classList.toggle('visible'); }
    if(confirmApproveLDBtn) {
        const card = confirmApproveLDBtn.closest('.solicitacao-card'); const codSolicitacao = card.dataset.codSolicitacao; const form = card.querySelector('.approval-reason');
        const ordemInversa = form.querySelector('.ordem-inversa-input').value; const dataPrevista = form.querySelector('.data-prevista-input').value; const tipoColeta = form.querySelector('.tipo-coleta-select').value;
        if (!ordemInversa || !dataPrevista || !tipoColeta) { alert('Todos os campos são obrigatórios para aprovar.'); return; }
        if(confirm(`Confirmar aprovação para solicitação #${codSolicitacao}?`)) { processFinalApproval(codSolicitacao, true, { ordemInversa, dataPrevista, tipoColeta }); }
    }
    if(confirmReproveLDBtn) {
        const card = confirmReproveLDBtn.closest('.solicitacao-card'); const codSolicitacao = card.dataset.codSolicitacao;
        const justificationTextarea = card.querySelector('.reproval-reason textarea');
        if (!justificationTextarea.value.trim()) { alert('Por favor, preencha a justificativa.'); return; }
        if(confirm(`Confirmar reprovação para solicitação #${codSolicitacao}?`)) { processFinalApproval(codSolicitacao, false, { justification: justificationTextarea.value }); }
    }
}

function processApproval(codSolicitacao, isApproved, justification) {
    const status = isApproved ? 'EM CRIAÇÃO' : 'Reprovado';
    const today = new Date().toLocaleDateString('pt-BR');
    const mainCard = document.getElementById(`card-acompanhar-${codSolicitacao}`);
    const setorCard = document.querySelector(`.solicitacao-card[data-cod-solicitacao="${codSolicitacao}"]:not(#card-acompanhar-${codSolicitacao})`);

    if (mainCard) {
        const statusSpan = mainCard.querySelector('.analise');
        const approvalDetailsDiv = mainCard.querySelector('.approval-info-placeholder');
        statusSpan.textContent = status.toUpperCase();
        statusSpan.className = `analise ${isApproved ? '' : 'status-reprovado'}`;
        
        if (approvalDetailsDiv) {
             approvalDetailsDiv.innerHTML = generateTimelineHtml(status, 'setor', today, justification);
        }
        
        if (isApproved) {
            // --- CORREÇÃO DEFINITIVA: Recria o objeto de dados corretamente ---
            const originalDataset = mainCard.dataset;
            const data = {
                cod_solicitacao: originalDataset.codSolicitacao,
                motivo: originalDataset.motivo,
                nome_cliente: originalDataset.cliente,
                nota_fiscal: originalDataset.notafiscal,
                material: originalDataset.material,
                data: originalDataset.data,
                anexo_path: originalDataset.anexopath,
                observacao: originalDataset.observacao,
                status: status
            };
            // --- FIM DA CORREÇÃO ---
            
            const lrList = ui.solicitacoesLists.logisticaReversa.list;
            if (lrList) {
                lrList.querySelector('.empty-list-message').style.display = 'none';
                lrList.insertAdjacentHTML('afterbegin', createSolicitacaoCardHtml(data, 'logistica-reversa'));
                feather.replace();
                flatpickr(`#card-logistica-reversa-${data.cod_solicitacao} .data-prevista-input`, { dateFormat: "d/m/Y", locale: "pt" });
            }
        }
    }
    if (setorCard) {
        const listContainer = setorCard.parentElement;
        setorCard.remove();
        if (listContainer.querySelectorAll('.solicitacao-card').length === 0) {
            listContainer.querySelector('.empty-list-message').style.display = 'block';
        }
    }
}

function processFinalApproval(codSolicitacao, isApproved, details) {
    const status = isApproved ? 'AGUARDANDO NFD' : 'Reprovado';
    const today = new Date().toLocaleDateString('pt-BR');
    const mainCard = document.getElementById(`card-acompanhar-${codSolicitacao}`);
    const setorCard = document.getElementById(`card-logistica-reversa-${codSolicitacao}`);

    if (mainCard) {
        const approvalDetailsDiv = mainCard.querySelector('.approval-info-placeholder');
        const statusSpan = mainCard.querySelector('.analise');
        statusSpan.textContent = status.toUpperCase();
        statusSpan.className = `analise status-${isApproved ? 'aprovado' : 'reprovado'}`;
        if (approvalDetailsDiv) { approvalDetailsDiv.innerHTML = generateTimelineHtml(status, 'lr', today, details.justification || ''); }
    }
    if (setorCard) {
        const listContainer = setorCard.parentElement;
        setorCard.remove();
        if (listContainer.querySelectorAll('.solicitacao-card').length === 0) { listContainer.querySelector('.empty-list-message').style.display = 'block'; }
    }
}

function generateTimelineHtml(status, stage, date, justification) {
    let steps = [
        { label: 'Em Análise', state: 'pending', date: ''},
        { label: 'Aprovação do Setor', state: 'pending', date: ''},
        { label: 'Criação de Ordem', state: 'pending', date: ''},
        { label: 'Aguardando NFD', state: 'pending', date: ''},
        { label: 'Coleta', state: 'pending', date: ''}
    ];
    steps[0].state = 'completed';

    if (status === 'Reprovado') {
        if (stage === 'setor') {
            steps[1].state = 'reproved';
            steps[1].label = 'Reprovado';
            steps[1].date = date;
        } else { // Reprovado em 'lr'
            steps[1].state = 'completed';
            steps[1].date = date;
            steps[2].state = 'reproved';
            steps[2].label = 'Reprovado';
            steps[2].date = date;
        }
    } else if (status === 'EM CRIAÇÃO') {
        steps[1].state = 'completed';
        steps[1].date = date;
        steps[2].state = 'in-progress';
    } else if (status === 'AGUARDANDO NFD') {
        steps[1].state = 'completed';
        steps[2].state = 'completed';
        steps[2].date = date;
        steps[3].state = 'in-progress';
    } else if (status === 'Em Análise') {
        steps[0].state = 'in-progress';
    }
    
    const stepsHtml = steps.map(step => `<div class="timeline-step ${step.state}"><div class="icon">${step.state === 'completed' ? '✓' : (step.state === 'reproved' ? 'X' : '')}</div><div class="label">${step.label}</div><div class="date">${step.date}</div></div>`).join('');
    const justificationHtml = (justification) ? `<p style="margin-top: 10px;"><b>Justificativa:</b> ${justification}</p>` : '';
    return `<div class="timeline">${stepsHtml}</div>${justificationHtml}`;
}

export function distributeSolicitationToPages(data) {
    const mainList = ui.solicitacoesLists.acompanhar.list;
    if(mainList) { 
        mainList.querySelector('.empty-list-message').style.display = 'none'; 
        mainList.insertAdjacentHTML('afterbegin', createSolicitacaoCardHtml(data, 'acompanhar'));
        const newCard = mainList.querySelector('.solicitacao-card');
        const placeholder = newCard.querySelector('.approval-info-placeholder');
        if(placeholder) {
            placeholder.innerHTML = generateTimelineHtml('Em Análise', 'inicio', new Date().toLocaleDateString('pt-BR'), '');
        }
    }
    const motivo = data.motivo;
    let targetListKey = null;
    if (motivo.startsWith('(177)')) { targetListKey = 'qualidade'; } 
    else if (motivo.startsWith('(167)') || motivo.startsWith('(104)')) { targetListKey = 'operacional'; }
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
    let anexoHtml = `<div class="detail-item"><b>Anexo:</b><span>${data.anexo_filename || data.anexo || 'Nenhum anexo.'}</span></div>`;
    if (data.anexo_path && data.anexo_path !== "Nenhum anexo") { anexoHtml = `<div class="detail-item"><b>Anexo:</b><img class="anexo-imagem" src="${data.anexo_path}" alt="Anexo"></div>`; }
    const cardId = `card-${pageType}-${data.cod_solicitacao}`;
    const cardClasses = `solicitacao-card ${isExpandable ? 'expandable' : ''}`;
    let statusText = data.status || "EM ANÁLISE";
    const summaryHtml = `<div class="card-summary"><div class="card-column-left"><span><b>Cód. Solicitação:</b> ${data.cod_solicitacao}</span><span class="status">${data.motivo}</span><span>${data.nome_cliente}</span><i class="arrow-icon" data-feather="chevron-down"></i></div><div class="card-column-right"><span><b>Nota Fiscal:</b> ${data.nota_fiscal}</span><span><b>Peça:</b> ${data.material}</span><span><b>Data:</b> ${data.data}</span><span class="analise">${statusText}</span></div></div>`;
    let approvalHtml = '';
    if (pageType === 'acompanhar') {
        approvalHtml = `<div class="approval-info-placeholder"></div>`;
    } else if (pageType === 'logistica-reversa') {
        approvalHtml = `<div class="approval-section"><div class="approval-buttons"><button class="button small approve-btn-lr">APROVAR</button><button class="button small reprove-btn-lr">REPROVAR</button></div><div class="approval-reason"><div class="form-group"><label>Ordem Inversa</label><input type="text" class="ordem-inversa-input"></div><div class="form-group"><label>Data Prevista</label><input type="text" class="data-prevista-input"></div><div class="form-group"><label>Coleta</label><div class="custom-select"><select class="tipo-coleta-select"><option value="">Selecione...</option><option>Sem Coleta</option><option>Com Coleta</option></select></div></div><button class="button small primary approve-confirm-btn-lr" style="margin-top: 10px;">CONFIRMAR</button></div><div class="reproval-reason"><textarea placeholder="Digite a justificativa da reprovação..."></textarea><button class="button small primary reprove-confirm-btn-lr" style="margin-top: 10px;">CONFIRMAR</button></div></div>`;
    } else {
        approvalHtml = `<div class="approval-section"><div class="approval-buttons"><button class="button small approve-btn">APROVAR</button><button class="button small reprove-btn">REPROVAR</button></div><div class="reproval-reason"><textarea placeholder="Digite a justificativa da reprovação..."></textarea><button class="button small primary reprove-confirm-btn" style="margin-top: 10px;">CONFIRMAR</button></div></div>`;
    }
    const detailsHtml = `<div class="card-details"><div class="detail-content">${anexoHtml}<div class="detail-item"><b>Observação:</b><span>${data.observacao || "Nenhuma observação."}</span></div></div>${approvalHtml}</div>`;
    return `<div id="${cardId}" class="${cardClasses}" data-cod-solicitacao="${data.cod_solicitacao}" data-material="${data.material}" data-cliente="${data.nome_cliente}" data-notafiscal="${data.nota_fiscal}" data-motivo="${data.motivo}" data-observacao="${data.observacao || ''}" data-anexopath="${data.anexo_path || ''}" data-data="${data.data}">${summaryHtml}${detailsHtml}</div>`;
}

function setupPageFilters(pageKey) {
    const searchInput = document.getElementById(`search-input-${pageKey}`);
    const filterCombo = document.getElementById(`filter-combo-${pageKey}`);
    if(!searchInput || !filterCombo) return;
    const list = ui.solicitacoesLists[pageKey].list;
    const emptyMsg = ui.solicitacoesLists[pageKey].emptyMsg;
    function applyFilters() { const searchTerm = searchInput.value.toLowerCase(); const filterType = filterCombo.value; let visibleCount = 0; list.querySelectorAll('.solicitacao-card').forEach(card => { const dataAttribute = `data-${filterType.replace(/ /g, '').replace('ó', 'o').replace('çã', 'ca').toLowerCase()}`; let textToSearch = card.getAttribute(dataAttribute) || ''; if (textToSearch.toLowerCase().includes(searchTerm)) { card.style.display = 'block'; visibleCount++; } else { card.style.display = 'none'; } }); emptyMsg.style.display = visibleCount > 0 ? 'none' : 'block'; }
    searchInput.addEventListener('input', applyFilters);
    filterCombo.addEventListener('change', applyFilters);
}