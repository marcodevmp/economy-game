const state = {
    currentRate: 10.00,
    inflation: 4.50,
    gdpGrowth: 2.00,
    creditCost: 15.00,
    publicDebt: 60.00,

    turn: 1,
    maxTurns: 6,
    gameActive: false,
    lastAction: null,
    lastShock: null,
    lastShockId: null
};

const rateSlider = document.getElementById('rate-slider');
const rateDisplay = document.getElementById('rate-display');
const nextTurnBtn = document.getElementById('next-turn-btn');
const turnDisplay = document.getElementById('turn-display');
const newsFeed = document.getElementById('news-feed');

const ui = {
    inflation: { val: document.getElementById('val-inflation'), bar: document.getElementById('bar-inflation') },
    gdp: { val: document.getElementById('val-gdp'), bar: document.getElementById('bar-gdp') },
    credit: { val: document.getElementById('val-credit'), bar: document.getElementById('bar-credit') },
    debt: { val: document.getElementById('val-debt'), bar: document.getElementById('bar-debt') },
    employment: { val: document.getElementById('val-welfare'), bar: document.getElementById('bar-welfare') }
};

const shocks = [
    {
        id: 'oil_crisis',
        title: "CRISE DO PETRÓLEO",
        desc: "Um choque de oferta encareceu os combustíveis no mercado internacional. Isso gera uma inflação de custos que pressiona os preços internos e corrói o salário real.",
        effect: { inflation: 1.5, gdp: -0.5, employment: -5 },
        type: 'warning',
        explanation: "A inflação de custos ocorre quando os insumos ficam mais caros. O Banco Central não controla o preço do petróleo, mas pode evitar que a inflação se espalhe. Aumentar juros pode não resolver a causa e ainda travar o PIB e o emprego.",
        condition: (s) => s.inflation < 8.0
    },
    {
        id: 'pandemic',
        title: "PANDEMIA GLOBAL",
        desc: "Uma crise sanitária reduziu drasticamente o consumo das famílias e a atividade econômica. O PIB cai, o desemprego aumenta e a inflação desacelera.",
        effect: { inflation: -1.0, gdp: -2.0, debt: 2.0, employment: -10 },
        type: 'danger',
        explanation: "Em crises de demanda, o governo deve estimular a economia com gastos públicos ou juros baixos. Mas cuidado com o aumento da dívida pública.",
        condition: (s) => s.gdpGrowth > -1.0
    },
    {
        id: 'tech_boom',
        title: "AVANÇO TECNOLÓGICO",
        desc: "Um novo ciclo de inovação aumentou a produtividade da economia. Isso permite um crescimento do PIB sem gerar pressão inflacionária e cria empregos qualificados.",
        effect: { inflation: -0.5, gdp: 1.5, employment: 5 },
        type: 'success',
        explanation: "A produtividade é a chave para o crescimento sustentável. Com mais tecnologia, o país produz mais com os mesmos recursos, gerando renda e emprego.",
        condition: (s) => s.gdpGrowth < 5.0
    },
    {
        id: 'currency_crisis',
        title: "DESVALORIZAÇÃO CAMBIAL",
        desc: "O dólar disparou no mercado internacional. Os produtos importados ficaram mais caros, gerando repasse para a inflação (pass-through) e reduzindo o poder de compra.",
        effect: { inflation: 2.0, gdp: -0.3, debt: 1.0, employment: -5 },
        type: 'warning',
        explanation: "O 'pass-through' é o repasse do câmbio para os preços. Para conter, o BC pode subir juros, mas isso atrai mais dólares e pode valorizar a moeda. É um dilema.",
        condition: (s) => s.inflation < 10.0
    },
    {
        id: 'investor_confidence',
        title: "CONFIANÇA DO INVESTIDOR",
        desc: "O mercado financeiro reagiu bem às suas últimas decisões. Investidores estão otimistas, o que estimula o investimento, a atividade econômica e a geração de empregos.",
        effect: { gdp: 1.0, inflation: 0.2, employment: 5 },
        type: 'success',
        explanation: "A credibilidade do Banco Central atrai investimentos. Quando o mercado confia, os juros de longo prazo caem e o país cresce de forma mais saudável.",
        condition: (s) => s.publicDebt < 90.0
    }
];

function startGame() {
    document.getElementById('tutorial-modal').classList.remove('active');
    state.gameActive = true;
    updateUI();
}

function showTutorial() {
    document.getElementById('tutorial-modal').classList.add('active');
}

function showFundamentals() {
    document.getElementById('fundamentals-modal').classList.add('active');

    const firstTab = document.querySelector('.tab-btn');
    if (firstTab) {
    
        firstTab.click();
    }
}

function closeFundamentalsModal() {
    document.getElementById('fundamentals-modal').classList.remove('active');
}

function openTab(evt, tabName) {

    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }


    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].classList.remove("active");
    }


    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function resetGame() {
    if (!confirm("Tem certeza que deseja reiniciar? Todo o progresso será perdido.")) return;
    
    Object.assign(state, {
        currentRate: 10.00,
        inflation: 4.50,
        gdpGrowth: 2.00,
        creditCost: 15.00,
        publicDebt: 60.00,
        employment: 50.00,
        turn: 1,
        gameActive: false,
        lastAction: null,
        lastShock: null,
        lastShockId: null
    });

    rateSlider.value = 10;
    rateDisplay.textContent = '10.00%';
    newsFeed.innerHTML = '<div class="news-item info">Sistema online. Aguardando primeira decisão de política monetária...</div>';
    nextTurnBtn.disabled = false;
    nextTurnBtn.textContent = "Executar Mandato";
    rateSlider.disabled = false;
    
    document.getElementById('tutorial-modal').classList.add('active');
    updateUI();
}

function advanceTurn() {
    if (!state.gameActive || state.turn > state.maxTurns) return;

    const newRate = parseFloat(rateSlider.value);
    const previousRate = state.currentRate;
    state.lastAction = { rate: newRate, previousRate: previousRate };


    state.creditCost = newRate + 8.0; 


    const gdpImpact = (10 - newRate) * 0.4; 
    state.gdpGrowth = Math.max(-4.0, Math.min(8.0, (state.gdpGrowth * 0.6) + gdpImpact));


    const inflationPressure = (state.gdpGrowth - 2.0) * 0.5;
    const interestDeflationEffect = (newRate - 10) * 0.15;
    const inertia = state.inflation * 0.7;
    state.inflation = inertia + inflationPressure - interestDeflationEffect;
    state.inflation = Math.max(-2.0, Math.min(20.0, state.inflation));


    const realInterest = newRate - state.inflation;
    const debtServiceCost = (realInterest / 100) * 0.5;
    state.publicDebt += debtServiceCost * 2; 
    state.publicDebt = Math.min(120.0, state.publicDebt);


    let employmentChange = 0;

    if (state.gdpGrowth > 2.5) employmentChange += 3;
    else if (state.gdpGrowth < 1.0) employmentChange -= 4;

    if (state.inflation > 6.0) employmentChange -= 3;
    else if (state.inflation > 4.0) employmentChange -= 1;
    else if (state.inflation < 3.0) employmentChange += 1;

    if (newRate > 14.0) employmentChange -= 2; 

    state.employment = Math.max(0, Math.min(100, state.employment + employmentChange));


    state.currentRate = newRate;
    state.turn++;

    updateUI();
    generateNews(newRate);
    checkCrisisEvents();
    
    if (Math.random() < 0.35) {
        triggerRandomShock();
    } else {
        state.lastShock = null; 
    }

    if (state.turn > state.maxTurns) {
        endGame();
    }
}

function triggerRandomShock() {
    const availableShocks = shocks.filter(s => 
        s.id !== state.lastShockId && s.condition(state)
    );
    
    if (availableShocks.length === 0) return;

    const shock = availableShocks[Math.floor(Math.random() * availableShocks.length)];
    
    state.lastShockId = shock.id;
    state.lastShock = shock; 


    state.inflation += shock.effect.inflation || 0;
    state.gdpGrowth += shock.effect.gdp || 0;
    state.publicDebt += shock.effect.debt || 0;
    state.employment += shock.effect.employment || 0;


    state.inflation = Math.max(-2.0, Math.min(20.0, state.inflation));
    state.gdpGrowth = Math.max(-4.0, Math.min(8.0, state.gdpGrowth));
    state.publicDebt = Math.min(120.0, state.publicDebt);
    state.employment = Math.max(0, Math.min(100, state.employment));

    addNews(`[EVENTO] ${shock.title}: ${shock.desc}`, shock.type, shock.explanation);
    triggerShockModal(shock);
}

function triggerShockModal(shock) {
    const modal = document.getElementById('shock-modal');
    const titleEl = document.getElementById('shock-title');
    const descEl = document.getElementById('shock-desc');
    const impactEl = document.getElementById('shock-impact');
    const expEl = document.getElementById('shock-explanation');
    const contentBox = document.getElementById('shock-modal-content');

    titleEl.textContent = shock.title;
    descEl.textContent = shock.desc;

    let impactText = [];
    if (shock.effect.inflation) impactText.push(`Inflação ${shock.effect.inflation > 0 ? '+' : ''}${shock.effect.inflation.toFixed(1)}%`);
    if (shock.effect.gdp) impactText.push(`PIB ${shock.effect.gdp > 0 ? '+' : ''}${shock.effect.gdp.toFixed(1)}%`);
    if (shock.effect.debt) impactText.push(`Dívida ${shock.effect.debt > 0 ? '+' : ''}${shock.effect.debt.toFixed(1)}%`);
    if (shock.effect.employment) impactText.push(`Emprego ${shock.effect.employment > 0 ? '+' : ''}${shock.effect.employment.toFixed(1)}%`);
    
    impactEl.textContent = impactText.join(' | ');
    expEl.textContent = shock.explanation;

    if (shock.type === 'danger' || shock.type === 'warning') {
        contentBox.style.borderColor = 'var(--neon-red)';
        titleEl.style.color = 'var(--neon-red)';
    } else if (shock.type === 'success') {
        contentBox.style.borderColor = 'var(--neon-green)';
        titleEl.style.color = 'var(--neon-green)';
    } else {
        contentBox.style.borderColor = 'var(--neon-blue)';
        titleEl.style.color = 'var(--neon-blue)';
    }

    modal.classList.add('active');
}

function closeShockModal() {
    document.getElementById('shock-modal').classList.remove('active');
}

function showHint() {
    if (!state.gameActive) return;

    let hintMessage = "";
    let title = "💡 DICA DO GESTOR";

    if (state.lastShock) {
        if (state.lastShock.type === 'warning') {
            hintMessage = `Atenção: O último evento foi "${state.lastShock.title}", um choque que pressiona a inflação. Cuidado ao aumentar juros bruscamente, pois isso pode piorar o desemprego. Avalie se o choque é temporário.`;
        } else if (state.lastShock.type === 'danger') {
            hintMessage = `Atenção: O último evento foi "${state.lastShock.title}", uma crise de demanda. O ideal seria estimular a economia com juros baixos para gerar empregos, mas a dívida pode ser um problema. Analise o cenário.`;
        } else {
            hintMessage = `O último evento foi "${state.lastShock.title}", que foi positivo. Aproveite o momento para consolidar a estabilidade e não deixar a inflação fugir.`;
        }
    } 
    else if (state.inflation > 6.0) {
        hintMessage = "A inflação está alta. Considere AUMENTAR a taxa de juros. Isso vai esfriar a economia e trazer a inflação de volta para a meta. No entanto, cuidado: juros altos aumentam o desemprego e a dívida pública.";
    } else if (state.employment < 40.0) {
        hintMessage = "O nível de emprego está baixo. A economia está fraca. Tente DIMINUIR os juros para estimular as contratações. Mas atenção: se a inflação estiver alta, isso pode piorar a situação.";
    } else if (state.gdpGrowth < 0.5) {
        hintMessage = "O PIB está crescendo pouco. A economia está desacelerando. Tente DIMINUIR os juros para estimular a atividade. Lembre-se que o efeito não é imediato.";
    } else if (state.publicDebt > 80.0) {
        hintMessage = "A dívida pública está em nível crítico. O alto custo do serviço da dívida está consumindo o orçamento. Tente manter os juros mais baixos para aliviar o fardo da dívida, mas sem perder o controle da inflação.";
    } else {
        hintMessage = "A economia está relativamente estável. Mantenha a taxa de juros atual ou faça pequenos ajustes. Fique de olho em eventos externos que podem mudar o cenário.";
    }

    triggerReportModal(title, hintMessage, "info");
}

function triggerReportModal(title, message, type = "info") {
    const modal = document.getElementById('report-modal');
    const titleEl = document.getElementById('report-title');
    const descEl = document.getElementById('report-desc');
    const contentBox = document.getElementById('report-modal-content');

    titleEl.textContent = title;
    descEl.textContent = message;

    if (type === 'danger' || type === 'warning') {
        contentBox.style.borderColor = 'var(--neon-red)';
        titleEl.style.color = 'var(--neon-red)';
    } else if (type === 'success') {
        contentBox.style.borderColor = 'var(--neon-green)';
        titleEl.style.color = 'var(--neon-green)';
    } else {
        contentBox.style.borderColor = 'var(--neon-blue)';
        titleEl.style.color = 'var(--neon-blue)';
    }

    modal.classList.add('active');
}

function closeReportModal() {
    document.getElementById('report-modal').classList.remove('active');
}

function updateUI() {
    rateDisplay.textContent = state.currentRate.toFixed(2) + '%';
    turnDisplay.textContent = `MANDATO: ${Math.min(state.turn, state.maxTurns)} / ${state.maxTurns}`;

    ui.inflation.val.textContent = state.inflation.toFixed(2) + '%';
    ui.gdp.val.textContent = state.gdpGrowth.toFixed(2) + '%';
    ui.credit.val.textContent = state.creditCost.toFixed(2) + '%';
    ui.debt.val.textContent = state.publicDebt.toFixed(2) + '%';
    ui.employment.val.textContent = state.employment.toFixed(2) + '%';

    updateBar(ui.inflation.bar, state.inflation, 20, '#ff9f43', '#ff3366', 6.0, 2.0);
    updateBar(ui.gdp.bar, state.gdpGrowth, 8, '#00ff87', '#ff3366', 0.5, 5.5);
    updateBar(ui.credit.bar, state.creditCost, 25, '#00d2ff', '#ff9f43', 20.0, 10.0);
    updateBar(ui.debt.bar, state.publicDebt, 100, '#00d2ff', '#ff3366', 80.0, 50.0);
    

    updateBar(ui.employment.bar, state.employment, 100, '#00ff87', '#ff3366', 40.0, 70.0); 
}

function updateBar(barElement, value, max, colorNormal, colorDanger, dangerThreshold, safeThreshold) {
    let percentage = (value / max) * 100;
    percentage = Math.max(5, Math.min(100, percentage));
    barElement.style.width = percentage + '%';
    

    if (barElement.id === 'bar-welfare') {
        if (value < dangerThreshold) {
            barElement.style.backgroundColor = colorDanger;
            barElement.style.boxShadow = `0 0 10px ${colorDanger}`;
        } else {
            barElement.style.backgroundColor = colorNormal;
            barElement.style.boxShadow = `0 0 10px ${colorNormal}`;
        }
    } else {
        if (value > dangerThreshold || (safeThreshold && value < safeThreshold)) {
            barElement.style.backgroundColor = colorDanger;
            barElement.style.boxShadow = `0 0 10px ${colorDanger}`;
        } else {
            barElement.style.backgroundColor = colorNormal;
            barElement.style.boxShadow = `0 0 10px ${colorNormal}`;
        }
    }
}

function addNews(message, type = 'info', explanation = null) {
    const div = document.createElement('div');
    div.className = `news-item ${type}`;
    
    const textSpan = document.createElement('span');
    textSpan.textContent = `> ${message}`;
    div.appendChild(textSpan);

    if (explanation) {
        const infoBtn = document.createElement('button');
        infoBtn.className = 'btn-info-news';
        infoBtn.innerHTML = '?';
        infoBtn.title = 'Clique para entender o conceito econômico';
        infoBtn.onclick = () => triggerReportModal("CONCEITO ECONÔMICO", explanation, "info");
        div.appendChild(infoBtn);
    }

    newsFeed.appendChild(div);
    newsFeed.scrollTop = newsFeed.scrollHeight;

    if (newsFeed.children.length > 6) {
        newsFeed.removeChild(newsFeed.firstChild);
    }
}

function generateNews(chosenRate) {
    let news = [];
    let type = 'info';
    let explanation = null;

    if (state.inflation > 8.0) {
        news.push("Manchete: Inflação fora de controle! Supermercados registram aumentos abusivos.");
        type = 'alert';
        explanation = "A inflação alta corrói o poder de compra. Se os preços sobem 8% ao ano, seu salário precisa subir mais que isso para você não ficar mais pobre. O Banco Central deve agir para conter.";
    } else if (state.inflation < 1.0) {
        news.push("Análise: Risco de deflação. A economia está perdendo dinamismo.");
        type = 'alert';
        explanation = "A deflação é a queda generalizada dos preços. Parece bom, mas é perigosa: as pessoas param de consumir esperando preços menores, o que gera recessão e desemprego.";
    } else if (state.inflation > 3.0 && state.inflation < 5.0) {
        news.push("Boletim: Inflação dentro da meta. Mercado respira aliviado.");
        type = 'success';
        explanation = "A meta de inflação é uma âncora para as expectativas. Quando o mercado confia que a inflação vai ficar sob controle, os contratos e salários são ajustados com mais previsibilidade.";
    }

    if (state.gdpGrowth < 0) {
        news.push("Notícia: PIB recua. Desemprego começa a preocupar o governo.");
        type = 'alert';
        explanation = "O PIB é a soma de tudo que o país produz. Quando ele cai, as empresas vendem menos, demitem e o desemprego aumenta. É o ciclo econômico.";
    } else if (state.gdpGrowth > 5.0) {
        news.push("Economia: Aquecimento excessivo. Indústrias operam no limite da capacidade.");
        type = 'alert';
        explanation = "Quando o PIB cresce muito rápido, a economia se aquece. As fábricas não conseguem produzir o suficiente para atender a demanda, e os preços começam a subir (inflação de demanda).";
    }

    if (state.employment < 40.0) {
        news.push("Trabalho: Taxa de desemprego preocupa. Famílias perdem poder de compra.");
        type = 'alert';
        explanation = "O desemprego é a falta de renda. Quando o PIB não cresce o suficiente, as empresas não contratam. O governo deve estimular a economia, mas com cuidado para não gerar inflação.";
    } else if (state.employment > 70.0) {
        news.push("Trabalho: Mercado de trabalho aquecido. Salários em alta.");
        type = 'success';
        explanation = "Com o emprego em alta, as pessoas têm mais renda e consomem mais. Isso é bom, mas se a economia estiver no limite, pode gerar inflação de demanda.";
    }

    if (state.publicDebt > 80.0) {
        news.push("Tesouro: Dívida Pública atinge patamar crítico. Custo de rolagem assusta investidores.");
        type = 'alert';
        explanation = "A dívida pública é o que o governo deve. Se ela é muito alta, o governo gasta mais com juros e sobra menos para saúde, educação e infraestrutura.";
    }

    if (news.length === 0) {
        news.push(`Relatório: Taxa ajustada para ${chosenRate.toFixed(2)}%. Mercado opera sem grandes sobressaltos.`);
    }

    news.forEach(msg => addNews(msg, type, explanation));
}

function checkCrisisEvents() {
    if (state.inflation >= 15.0) {
        triggerEventModal("CRISE INFLACIONÁRIA", "A inflação atingiu dois dígitos e o poder de compra da população despencou. O mercado perdeu a confiança no Banco Central.", "danger");
    } else if (state.publicDebt >= 95.0) {
        triggerEventModal("CALOTE DA DÍVIDA", "O Estado não consegue mais rolar sua dívida. Os juros altos sugam todo o orçamento público. Crise fiscal instaurada.", "danger");
    } else if (state.gdpGrowth <= -2.0) {
        triggerEventModal("RECESSÃO PROFUNDA", "A economia encolheu drasticamente. O desemprego explodiu e a população exige intervenção imediata.", "danger");
    } else if (state.employment <= 20.0) {
        triggerEventModal("CRISE SOCIAL", "O desemprego atingiu níveis insustentáveis. A população está nas ruas e o governo perdeu o apoio. É preciso mudar de estratégia urgentemente.", "danger");
    }
}

function triggerEventModal(title, desc, type) {
    const modal = document.getElementById('event-modal');
    document.getElementById('event-title').textContent = title;
    document.getElementById('event-desc').textContent = desc;
    
    const box = document.getElementById('event-modal-content');
    if (type === 'danger') {
        box.style.borderColor = 'var(--neon-red)';
        box.style.boxShadow = '0 0 30px rgba(255, 51, 102, 0.4)';
        document.getElementById('event-title').style.color = 'var(--neon-red)';
    }
    modal.classList.add('active');
}

function closeEventModal() {
    document.getElementById('event-modal').classList.remove('active');
}

function endGame() {
    nextTurnBtn.disabled = true;
    nextTurnBtn.textContent = "MANDATO ENCERRADO";
    rateSlider.disabled = true;
    
    let finalMessage = "Seu mandato terminou. ";
    
    if (state.inflation > 6) finalMessage += "A inflação saiu do controle. ";
    else if (state.inflation < 2) finalMessage += "A economia estagnou. ";
    else finalMessage += "A inflação foi controlada. ";

    if (state.gdpGrowth < 0) finalMessage += "O país entrou em recessão. ";
    else finalMessage += "Houve crescimento econômico. ";

    if (state.publicDebt > 80) finalMessage += "A dívida pública explodiu. ";
    
    if (state.employment > 60) finalMessage += "O nível de emprego e renda está bom! A população agradece.";
    else if (state.employment > 40) finalMessage += "O emprego está razoável, mas poderia ser melhor.";
    else finalMessage += "O desemprego está alto. A população está insatisfeita.";

    triggerEventModal("FIM DO MANDATO", finalMessage, "info");
}

rateSlider.addEventListener('input', (e) => {
    rateDisplay.textContent = parseFloat(e.target.value).toFixed(2) + '%';
});