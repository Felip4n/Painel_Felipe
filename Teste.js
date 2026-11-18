const themeToggle = document.getElementById('themeToggle');
const searchBar = document.getElementById('searchBar');

const modal = document.getElementById('linkModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const saveLinkBtn = document.getElementById('saveLinkBtn');

// UTILITÁRIO: escapa texto digitado pelo usuário antes de usar em innerHTML
function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

if (localStorage.getItem('felipe_theme') === 'light') document.body.classList.add('light-theme');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('felipe_theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
});

openModalBtn.addEventListener('click', () => modal.classList.add('active'));
closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));

document.addEventListener('DOMContentLoaded', () => {
    loadUserLinks();
    initMemGame();
    initCalendar();
    initBlackjack();
    initHangman();
    initGenius();
    initBreakout();
    initInvaders();
    initHero();
    updateCounts();
});

saveLinkBtn.addEventListener('click', () => {
    const title = document.getElementById('inputTitle').value.trim();
    const url = document.getElementById('inputUrl').value.trim();
    const tag = document.getElementById('inputTag').value.trim() || 'Customizado';
    const category = document.getElementById('selectCategory').value;
    const icon = document.getElementById('inputIcon').value.trim() || '🔗';

    if (!title || !url) {
        alert('Por favor, preencha pelo menos o Nome e a URL.');
        return;
    }

    const newLink = { id: Date.now(), title, url, tag, category, icon };
    const savedLinks = JSON.parse(localStorage.getItem('felipe_custom_links') || '[]');
    savedLinks.push(newLink);
    localStorage.setItem('felipe_custom_links', JSON.stringify(savedLinks));

    renderCard(newLink);

    document.getElementById('inputTitle').value = '';
    document.getElementById('inputUrl').value = '';
    document.getElementById('inputTag').value = '';
    modal.classList.remove('active');
});

function renderCard(item) {
    const targetCategory = document.getElementById(item.category);
    if (!targetCategory) return;

    const cardsGrid = targetCategory.querySelector('.cards-grid');
    const card = document.createElement('a');
    card.href = /^https?:\/\//i.test(item.url) ? item.url : 'https://' + item.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.className = 'custom-card';
    card.setAttribute('data-id', item.id);

    card.innerHTML = `
        <div class="card-top">
          <div class="card-icon-badge">${esc(item.icon)}</div>
          <span class="card-arrow"><svg class="i" viewBox="0 0 24 24"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></span>
        </div>
        <div class="card-content">
          <span class="card-title">${esc(item.title)}</span>
          <span class="card-tag">${esc(item.tag)}</span>
        </div>
        <button class="btn-delete-card" title="Excluir link" onclick="deleteLink(event, ${item.id})"><svg class="i" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    `;

    cardsGrid.appendChild(card);
    updateCounts();
}

function loadUserLinks() {
    const savedLinks = JSON.parse(localStorage.getItem('felipe_custom_links') || '[]');
    savedLinks.forEach(renderCard);
}

function deleteLink(event, id) {
    event.preventDefault();
    let savedLinks = JSON.parse(localStorage.getItem('felipe_custom_links') || '[]');
    savedLinks = savedLinks.filter(item => item.id !== id);
    localStorage.setItem('felipe_custom_links', JSON.stringify(savedLinks));

    const cardElement = document.querySelector(`[data-id="${id}"]`);
    if (cardElement) cardElement.remove();
    updateCounts();
}

function applyFilter() {
    const query = searchBar.value.toLowerCase().trim();
    let visibleTotal = 0;

    document.querySelectorAll('.category-group').forEach(group => {
        let hasMatchInGroup = false;

        group.querySelectorAll('.custom-card').forEach(card => {
            const title = card.querySelector('.card-title').textContent.toLowerCase();
            const tag = card.querySelector('.card-tag').textContent.toLowerCase();
            const matches = title.includes(query) || tag.includes(query);

            card.style.display = matches ? 'flex' : 'none';
            if (matches) { hasMatchInGroup = true; visibleTotal++; }
        });

        group.style.display = hasMatchInGroup ? 'flex' : 'none';
    });

    const empty = document.getElementById('emptyState');
    if (empty) empty.style.display = visibleTotal === 0 ? 'flex' : 'none';
}
searchBar.addEventListener('input', applyFilter);

function updateCounts() {
    let total = 0;
    document.querySelectorAll('.category-group').forEach(group => {
        const n = group.querySelectorAll('.custom-card').length;
        total += n;
        const badge = group.querySelector('.cat-count');
        if (badge) badge.textContent = n;
    });
    const stat = document.getElementById('statSystems');
    if (stat) stat.textContent = total;
}

/* PAINEL DE FERRAMENTAS (uma ferramenta por vez) */
const toolPanel = document.getElementById('toolPanel');
const toolTitle = document.getElementById('toolTitle');
const toolSub = document.getElementById('toolSub');
const TOOLS = {
    coffee:   { btn: 'coffeeToggleBtn',   view: 'coffeeContainer',   title: '☕ Pausa pro Café', sub: 'Um descanso rápido entre as tarefas' },
    calendar: { btn: 'calendarToggleBtn', view: 'calendarContainer', title: '📅 Calendário',    sub: 'Seus compromissos do dia a dia' },
    ai:       { btn: 'aiToggleBtn',       view: 'aiContainer',       title: '✨ Assistente IA', sub: 'Pergunte qualquer coisa' },
    site:     { btn: 'siteToggleBtn',     view: 'siteContainer',     title: '🌐 Mini Site',     sub: 'Placares ao vivo' }
};

function currentTool() {
    return Object.keys(TOOLS).find(k => document.getElementById(TOOLS[k].view).classList.contains('active')) || null;
}

function pauseGames() {
    if (typeof snakeLoop !== 'undefined' && snakeRunning) { clearInterval(snakeLoop); snakeRunning = false; snakeStatus.textContent = 'Pausado'; }
    pauseGenius();
    pauseBreakout();
    pauseInvaders();
}

function closeTools() {
    pauseGames();
    Object.values(TOOLS).forEach(t => {
        document.getElementById(t.view).classList.remove('active');
        document.getElementById(t.btn).classList.remove('active');
    });
    toolPanel.classList.remove('open');
}

function openTool(key) {
    if (key !== 'coffee') pauseGames();
    Object.keys(TOOLS).forEach(k => {
        const on = k === key;
        document.getElementById(TOOLS[k].view).classList.toggle('active', on);
        document.getElementById(TOOLS[k].btn).classList.toggle('active', on);
    });
    toolTitle.textContent = TOOLS[key].title;
    toolSub.textContent = TOOLS[key].sub;
    toolPanel.classList.toggle('tall', key === 'ai' || key === 'site');
    toolPanel.classList.toggle('compact', key === 'coffee');
    applyPanelGeometry(key);
    toolPanel.classList.add('open');

    if (key === 'site') {
        const frame = document.querySelector('#siteContainer iframe');
        if (frame && !frame.getAttribute('src')) frame.setAttribute('src', frame.dataset.src);
    }
    if (key === 'ai') setTimeout(() => document.getElementById('aiInput')?.focus(), 60);
}

Object.keys(TOOLS).forEach(key => {
    document.getElementById(TOOLS[key].btn).addEventListener('click', () => {
        if (currentTool() === key) closeTools(); else openTool(key);
    });
});
document.getElementById('toolCloseBtn').addEventListener('click', closeTools);

const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!btn.classList.contains('active')) pauseGames();
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.game-content').forEach(card => card.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = document.getElementById(`tab-${btn.dataset.tab}`);
        if (targetTab) targetTab.classList.add('active');
    });
});

/* Painel de ferramentas: arrastar pelo cabeçalho, redimensionar pelo canto, lembrar posição */
const PANEL_KEY = 'felipe_panel_geometry';
const isMobileLayout = () => window.matchMedia('(max-width: 720px)').matches;
const panelHeader = toolPanel.querySelector('.tool-header');
const panelHandle = document.createElement('div');
panelHandle.className = 'tool-resize';
panelHandle.title = 'Arraste para redimensionar';
toolPanel.appendChild(panelHandle);

function loadGeometry() {
    try { return JSON.parse(localStorage.getItem(PANEL_KEY)) || {}; } catch (e) { return {}; }
}
function saveGeometry(key, g) {
    const all = loadGeometry();
    if (g) all[key] = g; else delete all[key];
    localStorage.setItem(PANEL_KEY, JSON.stringify(all));
}

function clampGeometry(g) {
    const w = Math.min(Math.max(g.w, 280), window.innerWidth - 16);
    const h = Math.min(Math.max(g.h, 240), window.innerHeight - 16);
    return {
        w, h,
        x: Math.min(Math.max(g.x, 8), window.innerWidth - w - 8),
        y: Math.min(Math.max(g.y, 8), window.innerHeight - h - 8)
    };
}

function setGeometry(g) {
    Object.assign(toolPanel.style, {
        left: g.x + 'px', top: g.y + 'px', width: g.w + 'px', height: g.h + 'px',
        bottom: 'auto', maxHeight: 'none'
    });
    toolPanel.classList.add('moved');
}

function clearGeometry() {
    ['left', 'top', 'width', 'height', 'bottom', 'maxHeight'].forEach(p => toolPanel.style[p] = '');
    toolPanel.classList.remove('moved');
}

// chamada ao abrir uma ferramenta: aplica o tamanho/posição salvos dela (ou o padrão)
function applyPanelGeometry(key) {
    clearGeometry();
    if (isMobileLayout()) return;
    const g = loadGeometry()[key];
    if (g) setGeometry(clampGeometry(g));
}

function currentRect() {
    const r = toolPanel.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
}

function startPointerAction(e, className, onMove) {
    if (isMobileLayout() || e.button > 0) return;
    e.preventDefault();
    const start = currentRect();
    const sx = e.clientX, sy = e.clientY;
    const target = e.currentTarget;
    let last = start;
    target.setPointerCapture(e.pointerId);
    toolPanel.classList.add(className);

    const move = (ev) => {
        last = clampGeometry(onMove(start, ev.clientX - sx, ev.clientY - sy));
        setGeometry(last);
    };
    const up = () => {
        target.removeEventListener('pointermove', move);
        target.removeEventListener('pointerup', up);
        target.removeEventListener('pointercancel', up);
        toolPanel.classList.remove(className);
        const key = currentTool();
        if (key) saveGeometry(key, last);
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
}

panelHeader.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.btn-tool-close')) return;
    startPointerAction(e, 'dragging', (s, dx, dy) => ({ ...s, x: s.x + dx, y: s.y + dy }));
});
panelHandle.addEventListener('pointerdown', (e) => {
    startPointerAction(e, 'resizing', (s, dx, dy) => ({ ...s, w: s.w + dx, h: s.h + dy }));
});

// duplo clique no cabeçalho volta ao tamanho e posição padrão
panelHeader.addEventListener('dblclick', (e) => {
    if (e.target.closest('.btn-tool-close')) return;
    const key = currentTool();
    if (key) saveGeometry(key, null);
    clearGeometry();
});

window.addEventListener('resize', () => {
    const key = currentTool();
    if (key) applyPanelGeometry(key);
});

/* JOGO DA VELHA */
const gameStatus = document.getElementById('gameStatus');
const cells = document.querySelectorAll('.game-cell');
const resetGameBtn = document.getElementById('resetGameBtn');
const gameDifficulty = document.getElementById('gameDifficulty');
const winningLine = document.getElementById('winningLine');

let boardState = Array(9).fill('');
let gameActive = true;
const playerMark = '❌';
const botMark = '⭕';

const winConditions = [
    { combo: [0, 1, 2], class: 'row-0' },
    { combo: [3, 4, 5], class: 'row-1' },
    { combo: [6, 7, 8], class: 'row-2' },
    { combo: [0, 3, 6], class: 'col-0' },
    { combo: [1, 4, 7], class: 'col-1' },
    { combo: [2, 5, 8], class: 'col-2' },
    { combo: [0, 4, 8], class: 'diag-0' },
    { combo: [2, 4, 6], class: 'diag-1' }
];

if (gameDifficulty) gameDifficulty.addEventListener('change', resetGame);

cells.forEach(cell => {
    cell.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        if (boardState[index] !== '' || !gameActive) return;

        makeMove(index, playerMark);
        if (gameActive) {
            gameStatus.textContent = 'Pensando... 🤖';
            setTimeout(botMove, 300);
        }
    });
});

function makeMove(index, mark) {
    boardState[index] = mark;
    cells[index].textContent = mark;

    const winInfo = getWinningInfo(boardState, mark);
    if (winInfo) {
        gameStatus.textContent = mark === playerMark ? 'Você venceu! 🎉' : 'Bot venceu! 🤖';
        gameActive = false;
        winningLine.className = `winning-line ${winInfo.class}`;
    } else if (boardState.every(cell => cell !== '')) {
        gameStatus.textContent = 'Empate! 🤝';
        gameActive = false;
    } else {
        gameStatus.textContent = mark === playerMark ? 'Vez do Bot 🤖' : 'Sua vez (❌)';
    }
}

function botMove() {
    if (!gameActive) return;
    const diff = gameDifficulty.value;
    let targetIndex;

    if (diff === 'easy') targetIndex = getRandomMove();
    else if (diff === 'medium') targetIndex = Math.random() < 0.5 ? getSmartMove() : getRandomMove();
    else if (diff === 'hard') targetIndex = Math.random() < 0.85 ? getSmartMove() : getRandomMove();
    else if (diff === 'impossible') targetIndex = getBestMoveMinimax();

    if (targetIndex !== null && targetIndex !== undefined) makeMove(targetIndex, botMark);
}

function getRandomMove() {
    const emptyIndices = boardState.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    return emptyIndices.length > 0 ? emptyIndices[Math.floor(Math.random() * emptyIndices.length)] : null;
}

function getWinningMove(mark) {
    for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') {
            boardState[i] = mark;
            if (checkWin(boardState, mark)) {
                boardState[i] = '';
                return i;
            }
            boardState[i] = '';
        }
    }
    return null;
}

function getSmartMove() {
    let winMove = getWinningMove(botMark);
    if (winMove !== null) return winMove;
    let blockMove = getWinningMove(playerMark);
    if (blockMove !== null) return blockMove;
    if (boardState[4] === '') return 4;
    return getRandomMove();
}

function getBestMoveMinimax() {
    let bestScore = -1000;
    let bestMove = null;
    for (let i = 0; i < 9; i++) {
        if (boardState[i] === '') {
            boardState[i] = botMark;
            let score = minimax(boardState, 0, false);
            boardState[i] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

function minimax(board, depth, isMaximizing) {
    if (checkWin(board, botMark)) return 10 - depth;
    if (checkWin(board, playerMark)) return depth - 10;
    if (board.every(cell => cell !== '')) return 0;

    if (isMaximizing) {
        let bestScore = -1000;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = botMark;
                let score = minimax(board, depth + 1, false);
                board[i] = '';
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = 1000;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = playerMark;
                let score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function getWinningInfo(board, mark) {
    return winConditions.find(item => item.combo.every(index => board[index] === mark));
}

function checkWin(board, mark) {
    return winConditions.some(item => item.combo.every(index => board[index] === mark));
}

if (resetGameBtn) resetGameBtn.addEventListener('click', resetGame);

function resetGame() {
    boardState = Array(9).fill('');
    gameActive = true;
    gameStatus.textContent = 'Sua vez (❌)';
    winningLine.className = 'winning-line';
    cells.forEach(cell => cell.textContent = '');
}

/* JOGO DA MEMÓRIA */
const memGameStatus = document.getElementById('memGameStatus');
const memBoard = document.getElementById('memBoard');
const resetMemGameBtn = document.getElementById('resetMemGameBtn');
const memEmojis = ['🎮', '🎯', '🎲', '🕹️', '👾', '🎨'];
let memCards = [], flippedCards = [], matchedPairs = 0, lockBoard = false;

function initMemGame() {
    if (!memBoard) return;
    memBoard.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;
    lockBoard = false;
    memGameStatus.textContent = 'Pares: 0/6';
    memCards = [...memEmojis, ...memEmojis].sort(() => 0.5 - Math.random());

    memCards.forEach((emoji) => {
        const card = document.createElement('div');
        card.classList.add('mem-card');
        card.dataset.emoji = emoji;
        card.textContent = '❓';
        card.addEventListener('click', flipMemCard);
        memBoard.appendChild(card);
    });
}

function flipMemCard() {
    if (lockBoard || this.classList.contains('flipped') || this.classList.contains('matched')) return;
    this.classList.add('flipped');
    this.textContent = this.dataset.emoji;
    flippedCards.push(this);

    if (flippedCards.length === 2) checkMemMatch();
}

function checkMemMatch() {
    lockBoard = true;
    const [card1, card2] = flippedCards;

    if (card1.dataset.emoji === card2.dataset.emoji) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        memGameStatus.textContent = `Pares: ${matchedPairs}/6`;
        flippedCards = [];
        lockBoard = false;

        if (matchedPairs === memEmojis.length) memGameStatus.textContent = 'Você venceu! 🎉';
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            card1.textContent = '❓';
            card2.textContent = '❓';
            flippedCards = [];
            lockBoard = false;
        }, 800);
    }
}

if (resetMemGameBtn) resetMemGameBtn.addEventListener('click', initMemGame);

/* SNAKE */
const snakeStatus = document.getElementById('snakeStatus');
const resetSnakeBtn = document.getElementById('resetSnakeBtn');
const canvas = document.getElementById('snakeCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const gridSize = 10;
const tileCount = canvas ? canvas.width / gridSize : 16;
let snake = [], food = { x: 0, y: 0 }, dx = gridSize, dy = 0, score = 0, snakeLoop = null, snakeRunning = false;

if (resetSnakeBtn) resetSnakeBtn.addEventListener('click', startSnake);

const btnUp = document.getElementById('sUp');
const btnDown = document.getElementById('sDown');
const btnLeft = document.getElementById('sLeft');
const btnRight = document.getElementById('sRight');

if (btnUp) btnUp.addEventListener('click', () => setSnakeDir(0, -gridSize));
if (btnDown) btnDown.addEventListener('click', () => setSnakeDir(0, gridSize));
if (btnLeft) btnLeft.addEventListener('click', () => setSnakeDir(-gridSize, 0));
if (btnRight) btnRight.addEventListener('click', () => setSnakeDir(gridSize, 0));

document.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

    const coffeeContainer = document.getElementById('coffeeContainer');
    const tabSnake = document.getElementById('tab-snake');

    if (!coffeeContainer?.classList.contains('active') || !tabSnake?.classList.contains('active')) return;

    const key = e.key.toLowerCase();
    const isUp = key === 'arrowup' || key === 'w';
    const isDown = key === 'arrowdown' || key === 's';
    const isLeft = key === 'arrowleft' || key === 'a';
    const isRight = key === 'arrowright' || key === 'd';

    if (isUp || isDown || isLeft || isRight) {
        e.preventDefault();
        if (!snakeRunning) { startSnake(); return; }

        if (isUp) setSnakeDir(0, -gridSize);
        if (isDown) setSnakeDir(0, gridSize);
        if (isLeft) setSnakeDir(-gridSize, 0);
        if (isRight) setSnakeDir(gridSize, 0);
    }
});

function setSnakeDir(newDx, newDy) {
    if (newDx === -dx && newDx !== 0) return;
    if (newDy === -dy && newDy !== 0) return;
    dx = newDx;
    dy = newDy;
}

function startSnake() {
    clearInterval(snakeLoop);
    snake = [{ x: 50, y: 50 }, { x: 40, y: 50 }];
    dx = gridSize;
    dy = 0;
    score = 0;
    snakeRunning = true;
    snakeStatus.textContent = 'Pontos: 0';
    spawnFood();
    snakeLoop = setInterval(updateSnake, 120);
}

function spawnFood() {
    food.x = Math.floor(Math.random() * tileCount) * gridSize;
    food.y = Math.floor(Math.random() * tileCount) * gridSize;
}

function updateSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height || snake.some(s => s.x === head.x && s.y === head.y)) {
        clearInterval(snakeLoop);
        snakeRunning = false;
        snakeStatus.textContent = `Game Over! 💥 (${score})`;
        return;
    }

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        snakeStatus.textContent = `Pontos: ${score}`;
        spawnFood();
    } else {
        snake.pop();
    }
    drawSnake();
}

function drawSnake() {
    if (!ctx) return;
    ctx.fillStyle = '#0a1523';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(food.x, food.y, gridSize - 1, gridSize - 1);
    ctx.fillStyle = '#10b981';
    snake.forEach(segment => ctx.fillRect(segment.x, segment.y, gridSize - 1, gridSize - 1));
}

/* CALENDÁRIO INTERATIVO */
const calMonthYear = document.getElementById('calMonthYear');
const calPrevBtn = document.getElementById('calPrevBtn');
const calNextBtn = document.getElementById('calNextBtn');
const calDaysGrid = document.getElementById('calDaysGrid');
const calSelectedDate = document.getElementById('calSelectedDate');
const calEventInput = document.getElementById('calEventInput');
const addCalEventBtn = document.getElementById('addCalEventBtn');
const calEventsList = document.getElementById('calEventsList');

let currentCalDate = new Date();
let selectedDayKey = null;
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

if (calPrevBtn) calPrevBtn.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() - 1); renderCalendar(); });
if (calNextBtn) calNextBtn.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() + 1); renderCalendar(); });
if (addCalEventBtn) addCalEventBtn.addEventListener('click', addCalEvent);
if (calEventInput) calEventInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addCalEvent(); });

function initCalendar() {
    const today = new Date();
    selectedDayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    renderCalendar();
}

function renderCalendar() {
    if (!calMonthYear || !calDaysGrid) return;
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    calMonthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    calDaysGrid.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'cal-day empty';
        calDaysGrid.appendChild(empty);
    }

    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'cal-day';
        dayEl.textContent = day;
        const dayKey = formatDateKey(year, month, day);

        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) dayEl.classList.add('today');
        if (dayKey === selectedDayKey) dayEl.classList.add('selected');
        if (getSavedEvents(dayKey).length > 0) dayEl.classList.add('has-events');

        dayEl.addEventListener('click', () => { selectedDayKey = dayKey; renderCalendar(); });
        calDaysGrid.appendChild(dayEl);
    }
    updateEventsView();
    if (typeof updateHeroStats === "function") updateHeroStats();
}

function updateEventsView() {
    if (!selectedDayKey || !calSelectedDate || !calEventsList) return;
    const [y, m, d] = selectedDayKey.split('-');
    calSelectedDate.textContent = `📅 Dia ${d}/${m}/${y}`;
    calEventsList.innerHTML = '';

    getSavedEvents(selectedDayKey).forEach(item => {
        const li = document.createElement('li');
        li.className = 'cal-event-item';
        li.innerHTML = `<span>${esc(item.text)}</span><button class="btn-del-event" onclick="removeCalEvent(${item.id})">❌</button>`;
        calEventsList.appendChild(li);
    });
}

function addCalEvent() {
    const text = calEventInput.value.trim();
    if (!text || !selectedDayKey) return;

    const events = getSavedEvents(selectedDayKey);
    events.push({ id: Date.now(), text });
    saveEvents(selectedDayKey, events);
    calEventInput.value = '';
    renderCalendar();
}

function removeCalEvent(eventId) {
    let events = getSavedEvents(selectedDayKey).filter(e => e.id !== eventId);
    saveEvents(selectedDayKey, events);
    renderCalendar();
}

function getSavedEvents(key) {
    const allEvents = JSON.parse(localStorage.getItem('felipe_cal_events') || '{}');
    return allEvents[key] || [];
}

function saveEvents(key, events) {
    const allEvents = JSON.parse(localStorage.getItem('felipe_cal_events') || '{}');
    if (events.length > 0) allEvents[key] = events;
    else delete allEvents[key];
    localStorage.setItem('felipe_cal_events', JSON.stringify(allEvents));
}

function formatDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/* INTEGRAÇÃO GEMINI IA */
const GEMINI_API_KEY = 'AQ.Ab8RN6J61qJWwGID-ji-s7v87NV-lR2LG-2nFDnGDggmi9lIvg';
const TAVILY_API_KEY = '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';

async function buscarNaWeb(pergunta) {
    try {
        const r = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TAVILY_API_KEY}`
            },
            body: JSON.stringify({ query: pergunta, max_results: 4, search_depth: 'basic' })
        });
        if (!r.ok) return '';
        const d = await r.json();
        return (d.results || [])
            .map((x, i) => `[${i + 1}] ${x.title}\n${x.content}\nFonte: ${x.url}`)
            .join('\n\n');
    } catch (e) {
        return '';
    }
}
const aiChatBox = document.getElementById('aiChatBox');
const aiInput = document.getElementById('aiInput');
const sendAiBtn = document.getElementById('sendAiBtn');

if (sendAiBtn) sendAiBtn.addEventListener('click', handleAiQuery);
if (aiInput) aiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleAiQuery(); });

async function handleAiQuery() {
    const userText = aiInput.value.trim();
    if (!userText) return;

    appendAiMessage(userText, 'user');
    aiInput.value = '';

    const loadingDiv = appendAiMessage('Pensando... 🤖', 'bot');

    // NOVO: busca na web antes de chamar o Gemini
    const resultadosWeb = await buscarNaWeb(userText);
    const hoje = new Date().toLocaleDateString('pt-BR');
    const prompt = resultadosWeb
        ? `Hoje é ${hoje}. Responda em português usando os resultados de busca abaixo, que são atuais. Se não forem suficientes, diga isso.\n\nRESULTADOS:\n${resultadosWeb}\n\nPERGUNTA: ${userText}`
        : userText;

    const MAX_RETRIES = 3;
    const model = 'gemini-3.6-flash';

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            if (attempt > 1) {
                loadingDiv.textContent = `Aguardando servidor (${attempt}/${MAX_RETRIES})... ⏳`;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]   // NOVO: era userText
                    }),
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);
            const data = await response.json();

            if (data.error) {
                if ((data.error.code === 503 || data.error.message?.includes('high demand')) && attempt < MAX_RETRIES) continue;
                loadingDiv.textContent = `⚠️ Erro (${data.error.code || 'Erro'}): ${data.error.message}`;
                return;
            }

            const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (botReply) {
                loadingDiv.innerHTML = esc(botReply)
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/^\s*[\*\-]\s+/gm, '• ')
                    .replace(/\n/g, '<br>');
                aiChatBox.scrollTop = aiChatBox.scrollHeight;
                return;
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (attempt < MAX_RETRIES) continue;
            loadingDiv.textContent = error.name === 'AbortError' ? '⏱️ Servidor demorou a responder.' : `⏱️ Erro de conexão: ${error.message}`;
        }
    }
}

function appendAiMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender}`;
    msgDiv.textContent = text;
    aiChatBox.appendChild(msgDiv);
    aiChatBox.scrollTop = aiChatBox.scrollHeight;
    return msgDiv;
}

/* BLACKJACK (21) */
const suits = ['♠', '♥', '♦', '♣'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
let bjDeck = [], playerHand = [], dealerHand = [], bjGameOver = false;

const bjStatus = document.getElementById('bjStatus');
const dealerScore = document.getElementById('dealerScore');
const playerScore = document.getElementById('playerScore');
const dealerCards = document.getElementById('dealerCards');
const playerCards = document.getElementById('playerCards');
const bjHitBtn = document.getElementById('bjHitBtn');
const bjStandBtn = document.getElementById('bjStandBtn');
const resetBjBtn = document.getElementById('resetBjBtn');

function createBjDeck() {
    bjDeck = [];
    for (let suit of suits) {
        for (let value of values) bjDeck.push({ suit, value });
    }
    for (let i = bjDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bjDeck[i], bjDeck[j]] = [bjDeck[j], bjDeck[i]];
    }
}

function getHandValue(hand) {
    let value = 0, aces = 0;
    for (let card of hand) {
        if (card.value === 'A') { aces += 1; value += 11; }
        else if (['K', 'Q', 'J'].includes(card.value)) value += 10;
        else value += parseInt(card.value);
    }
    while (value > 21 && aces > 0) { value -= 10; aces -= 1; }
    return value;
}

function renderCardHTML(card, isHidden = false) {
    if (isHidden) return `<div class="playing-card back">🂠</div>`;
    const isRed = card.suit === '♥' || card.suit === '♦';
    return `<div class="playing-card ${isRed ? 'red' : ''}">${card.value}${card.suit}</div>`;
}

function initBlackjack() {
    if (!bjHitBtn) return;
    createBjDeck();
    playerHand = [bjDeck.pop(), bjDeck.pop()];
    dealerHand = [bjDeck.pop(), bjDeck.pop()];
    bjGameOver = false;

    bjHitBtn.disabled = false;
    bjStandBtn.disabled = false;
    bjStatus.textContent = 'Sua vez!';

    updateBjUI(true);
    if (getHandValue(playerHand) === 21) {
        bjStatus.textContent = 'Blackjack! 🎉';
        endBjGame();
    }
}

function updateBjUI(hideDealerCard = true) {
    playerCards.innerHTML = playerHand.map(c => renderCardHTML(c)).join('');
    playerScore.textContent = getHandValue(playerHand);

    if (hideDealerCard) {
        dealerCards.innerHTML = renderCardHTML(dealerHand[0]) + renderCardHTML(null, true);
        const firstVal = dealerHand[0].value === 'A' ? 11 : (['K', 'Q', 'J'].includes(dealerHand[0].value) ? 10 : parseInt(dealerHand[0].value));
        dealerScore.textContent = `${firstVal} + ?`;
    } else {
        dealerCards.innerHTML = dealerHand.map(c => renderCardHTML(c)).join('');
        dealerScore.textContent = getHandValue(dealerHand);
    }
}

if (bjHitBtn) bjHitBtn.addEventListener('click', () => {
    if (bjGameOver) return;
    playerHand.push(bjDeck.pop());
    const pScore = getHandValue(playerHand);

    if (pScore > 21) {
        updateBjUI(false);
        bjStatus.textContent = 'Estourou! 💥 Banca venceu.';
        endBjGame();
    } else if (pScore === 21) bjStand();
    else updateBjUI(true);
});

if (bjStandBtn) bjStandBtn.addEventListener('click', bjStand);
if (resetBjBtn) resetBjBtn.addEventListener('click', initBlackjack);

function bjStand() {
    if (bjGameOver) return;
    while (getHandValue(dealerHand) < 17) dealerHand.push(bjDeck.pop());

    const pScore = getHandValue(playerHand);
    const dScore = getHandValue(dealerHand);

    updateBjUI(false);
    if (dScore > 21) bjStatus.textContent = 'Banca estourou! Você venceu! 🎉';
    else if (pScore > dScore) bjStatus.textContent = 'Você venceu! 🎉';
    else if (dScore > pScore) bjStatus.textContent = 'Banca venceu! 🤖';
    else bjStatus.textContent = 'Empate! 🤝';

    endBjGame();
}

function endBjGame() {
    bjGameOver = true;
    bjHitBtn.disabled = true;
    bjStandBtn.disabled = true;
}

/* ===== JOGOS EXTRAS: Genius, Forca, Breakout e Space Invaders ===== */

// aba de jogo visível e sem digitação em campos (mesma regra do Snake)
function isGameTabActive(tabId) {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return false;
    return !!document.getElementById('coffeeContainer')?.classList.contains('active')
        && !!document.getElementById(tabId)?.classList.contains('active');
}

// botão que fica "pressionado" enquanto o dedo/mouse está sobre ele (controles de toque)
function holdButton(btn, onDown, onUp) {
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); onDown(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, onUp));
}

function blurActive() {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}

/* GENIUS (SIMON SAYS) */
const geniusStatus = document.getElementById('geniusStatus');
const geniusBoard = document.getElementById('geniusBoard');
const resetGeniusBtn = document.getElementById('resetGeniusBtn');
const geniusPads = geniusBoard ? [...geniusBoard.querySelectorAll('.genius-pad')] : [];
let geniusSeq = [], geniusStep = 0, geniusTimers = [];

function geniusLater(fn, ms) { geniusTimers.push(setTimeout(fn, ms)); }

function geniusStopTimers() {
    geniusTimers.forEach(clearTimeout);
    geniusTimers = [];
}

function initGenius() {
    if (!geniusBoard) return;
    geniusStopTimers();
    geniusSeq = [];
    geniusStep = 0;
    geniusBoard.classList.add('locked');
    geniusPads.forEach(p => p.classList.remove('lit'));
    geniusStatus.textContent = 'Nível: 0';
}

function startGenius() {
    blurActive();
    initGenius();
    geniusNextRound();
}

function flashPad(i, ms) {
    const pad = geniusPads[i];
    pad.classList.add('lit');
    geniusLater(() => pad.classList.remove('lit'), ms);
}

function geniusNextRound() {
    geniusSeq.push(Math.floor(Math.random() * 4));
    geniusStep = 0;
    geniusBoard.classList.add('locked');
    geniusStatus.textContent = `Nível ${geniusSeq.length} · Observe...`;

    const gap = Math.max(300, 650 - geniusSeq.length * 25);
    geniusSeq.forEach((pad, i) => geniusLater(() => flashPad(pad, gap - 150), 700 + i * gap));
    geniusLater(() => {
        geniusBoard.classList.remove('locked');
        geniusStatus.textContent = `Nível ${geniusSeq.length} · Sua vez!`;
    }, 700 + geniusSeq.length * gap);
}

function pressGeniusPad(i) {
    if (geniusBoard.classList.contains('locked') || !geniusSeq.length) return;
    flashPad(i, 200);

    if (geniusSeq[geniusStep] !== i) {
        geniusStatus.textContent = `Game Over! 💥 (${geniusSeq.length - 1})`;
        geniusBoard.classList.add('locked');
        geniusSeq = [];
        return;
    }

    geniusStep++;
    if (geniusStep === geniusSeq.length) {
        geniusBoard.classList.add('locked');
        geniusStatus.textContent = `Nível ${geniusSeq.length} ✔️`;
        geniusLater(geniusNextRound, 800);
    }
}

function pauseGenius() {
    if (!geniusSeq.length) return;
    initGenius();
    geniusStatus.textContent = 'Pausado';
}

geniusPads.forEach((pad, i) => pad.addEventListener('click', () => pressGeniusPad(i)));
if (resetGeniusBtn) resetGeniusBtn.addEventListener('click', startGenius);

/* JOGO DA FORCA */
const HANGMAN_WORDS = [
    { cat: 'Animais', words: ['ELEFANTE', 'GIRAFA', 'CROCODILO', 'PINGUIM', 'BORBOLETA', 'CAMALEÃO', 'TARTARUGA', 'GOLFINHO', 'PAPAGAIO', 'ORNITORRINCO', 'TUBARÃO', 'ESQUILO'] },
    { cat: 'Comidas', words: ['FEIJOADA', 'BRIGADEIRO', 'COXINHA', 'LASANHA', 'PAMONHA', 'CHOCOLATE', 'MORANGO', 'PIPOCA', 'TAPIOCA', 'HAMBÚRGUER', 'SORVETE', 'ABACAXI'] },
    { cat: 'Lugares', words: ['BRASIL', 'JAPÃO', 'EGITO', 'AMAZÔNIA', 'PIRÂMIDE', 'CANADÁ', 'ISLÂNDIA', 'PATAGÔNIA', 'VENEZA', 'DESERTO', 'CACHOEIRA', 'VULCÃO'] },
    { cat: 'Esportes', words: ['FUTEBOL', 'NATAÇÃO', 'BASQUETE', 'SKATE', 'SURFE', 'ESGRIMA', 'MARATONA', 'VOLEIBOL', 'BOXE', 'CICLISMO', 'ESCALADA', 'XADREZ'] },
    { cat: 'Objetos', words: ['SOMBRINHA', 'TELESCÓPIO', 'BICICLETA', 'VIOLÃO', 'TRAVESSEIRO', 'LANTERNA', 'BÚSSOLA', 'ESPELHO', 'RELÓGIO', 'CANIVETE', 'MOCHILA', 'GELADEIRA'] },
    { cat: 'Tecnologia', words: ['JAVASCRIPT', 'NAVEGADOR', 'ALGORITMO', 'FIREWALL', 'SOFTWARE', 'PROCESSADOR', 'CRIPTOGRAFIA', 'NOTEBOOK'] },
    { cat: 'Games', words: ['MINECRAFT', 'PLAYSTATION', 'FORTNITE', 'JOYSTICK', 'MULTIPLAYER', 'CHECKPOINT', 'SPEEDRUN', 'ARCADE'] }
];
const HM_MAX_ERRORS = 6;
const hmStatus = document.getElementById('hmStatus');
const hmWordEl = document.getElementById('hmWord');
const hmKeysEl = document.getElementById('hmKeys');
const hmHint = document.getElementById('hmHint');
const resetHmBtn = document.getElementById('resetHmBtn');
const hmParts = [...document.querySelectorAll('#tab-forca .hm-part')];
let hmWord = '', hmCat = '', hmGuessed = new Set(), hmErrors = 0, hmOver = false;

const hmBase = (ch) => ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function initHangman() {
    if (!hmWordEl) return;
    const pool = HANGMAN_WORDS.flatMap(g => g.words.map(w => ({ cat: g.cat, word: w })));
    let pick;
    do { pick = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && pick.word === hmWord);

    hmWord = pick.word;
    hmCat = pick.cat;
    hmGuessed = new Set();
    hmErrors = 0;
    hmOver = false;

    hmKeysEl.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
        const key = document.createElement('button');
        key.className = 'hm-key';
        key.dataset.letter = letter;
        key.textContent = letter;
        key.addEventListener('click', () => guessHangman(letter));
        hmKeysEl.appendChild(key);
    });
    renderHangman();
}

function guessHangman(letter) {
    if (hmOver || hmGuessed.has(letter)) return;
    hmGuessed.add(letter);

    const hit = [...hmWord].some(ch => hmBase(ch) === letter);
    const key = hmKeysEl.querySelector(`[data-letter="${letter}"]`);
    if (key) { key.disabled = true; key.classList.add(hit ? 'right' : 'wrong'); }
    if (!hit) hmErrors++;

    const won = [...hmWord].every(ch => hmGuessed.has(hmBase(ch)));
    if (won || hmErrors >= HM_MAX_ERRORS) {
        hmOver = true;
        hmKeysEl.querySelectorAll('.hm-key').forEach(k => { k.disabled = true; });
    }
    renderHangman(won);
}

function renderHangman(won = false) {
    hmWordEl.innerHTML = '';
    [...hmWord].forEach(ch => {
        const slot = document.createElement('span');
        slot.className = 'hm-letter';
        if (hmGuessed.has(hmBase(ch))) {
            slot.textContent = ch;
        } else if (hmOver) {
            slot.textContent = ch;
            slot.classList.add('lost');
        }
        hmWordEl.appendChild(slot);
    });
    hmParts.forEach((part, i) => part.classList.toggle('show', i < hmErrors));
    hmHint.textContent = `Dica: ${hmCat}`;

    if (won) hmStatus.textContent = 'Você venceu! 🎉';
    else if (hmOver) hmStatus.textContent = 'Game Over! 💥';
    else hmStatus.textContent = `Erros: ${hmErrors}/${HM_MAX_ERRORS}`;
}

if (resetHmBtn) resetHmBtn.addEventListener('click', initHangman);

document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (!isGameTabActive('tab-forca')) return;
    if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); guessHangman(e.key.toUpperCase()); }
});

/* BREAKOUT (QUEBRA-TIJOLOS) */
const boStatus = document.getElementById('boStatus');
const resetBoBtn = document.getElementById('resetBoBtn');
const boCanvas = document.getElementById('boCanvas');
const boCtx = boCanvas ? boCanvas.getContext('2d') : null;

const BO_W = boCanvas ? boCanvas.width : 240;
const BO_H = boCanvas ? boCanvas.height : 240;
const BO_COLS = 8, BO_ROWS = 5, BO_GAP = 3, BO_MARGIN = 8, BO_TOP = 26, BO_BRICK_H = 11;
const BO_BRICK_W = (BO_W - BO_MARGIN * 2 - BO_GAP * (BO_COLS - 1)) / BO_COLS;
const BO_PADDLE_Y = BO_H - 14;
const BO_COLORS = ['#f1f5f9', '#cbd5e1', '#94a3b8', '#60a5fa', '#2563eb'];

let boBricks = [], boLives = 3, boScore = 0, boSpeed = 3;
let boState = 'idle', boPrev = 'ready', boLoop = null; // idle | ready | running | paused | over
const boPaddle = { x: 0, w: 48, h: 8 };
const boBall = { x: 0, y: 0, dx: 0, dy: 0, r: 4 };
const boKeys = { left: false, right: false };

function boResetBall() {
    boBall.x = boPaddle.x + boPaddle.w / 2;
    boBall.y = BO_PADDLE_Y - boBall.r;
    boBall.dx = 0;
    boBall.dy = 0;
}

function boUpdateStatus() {
    boStatus.textContent = `Pontos: ${boScore} · ❤️ ${boLives}`;
}

function initBreakout() {
    if (!boCanvas) return;
    clearInterval(boLoop);
    boLoop = null;
    boKeys.left = boKeys.right = false;

    boBricks = [];
    for (let r = 0; r < BO_ROWS; r++) {
        for (let c = 0; c < BO_COLS; c++) {
            boBricks.push({
                x: BO_MARGIN + c * (BO_BRICK_W + BO_GAP),
                y: BO_TOP + r * (BO_BRICK_H + BO_GAP),
                color: BO_COLORS[r],
                alive: true
            });
        }
    }
    boPaddle.x = (BO_W - boPaddle.w) / 2;
    boLives = 3;
    boScore = 0;
    boSpeed = 3;
    boState = 'idle';
    boResetBall();
    boUpdateStatus();
    drawBreakout();
}

function startBreakout() {
    blurActive();
    initBreakout();
    boState = 'ready';
    boLoop = setInterval(boTick, 16);
    drawBreakout();
}

function boLaunch() {
    if (boState === 'idle' || boState === 'over') { startBreakout(); return; }
    if (boState === 'paused') { boResume(); return; }
    if (boState !== 'ready') return;
    const angle = Math.random() * 0.7 - 0.35;
    boBall.dx = boSpeed * Math.sin(angle);
    boBall.dy = -boSpeed * Math.cos(angle);
    boState = 'running';
}

function boResume() {
    boState = boPrev;
    boUpdateStatus();
    boLoop = setInterval(boTick, 16);
}

function pauseBreakout() {
    if (boState !== 'running' && boState !== 'ready') return;
    clearInterval(boLoop);
    boLoop = null;
    boKeys.left = boKeys.right = false;
    boPrev = boState;
    boState = 'paused';
    boStatus.textContent = 'Pausado';
    drawBreakout();
}

function boFinish(won) {
    clearInterval(boLoop);
    boLoop = null;
    boState = 'over';
    boKeys.left = boKeys.right = false;
    boStatus.textContent = won ? `Você venceu! 🎉 (${boScore})` : `Game Over! 💥 (${boScore})`;
    drawBreakout();
}

function boTick() {
    const b = boBall, p = boPaddle;
    if (boKeys.left) p.x -= 4;
    if (boKeys.right) p.x += 4;
    p.x = Math.max(0, Math.min(BO_W - p.w, p.x));

    if (boState === 'ready') { boResetBall(); drawBreakout(); return; }

    b.x += b.dx;
    b.y += b.dy;
    if (b.x - b.r < 0) { b.x = b.r; b.dx = Math.abs(b.dx); }
    if (b.x + b.r > BO_W) { b.x = BO_W - b.r; b.dx = -Math.abs(b.dx); }
    if (b.y - b.r < 0) { b.y = b.r; b.dy = Math.abs(b.dy); }

    // raquete: o ângulo da rebatida depende de onde a bola bate
    if (b.dy > 0 && b.y + b.r >= BO_PADDLE_Y && b.y - b.r <= BO_PADDLE_Y + p.h && b.x >= p.x - b.r && b.x <= p.x + p.w + b.r) {
        const hit = Math.max(-1, Math.min(1, (b.x - (p.x + p.w / 2)) / (p.w / 2)));
        const angle = hit * (Math.PI / 3);
        b.dx = boSpeed * Math.sin(angle);
        b.dy = -boSpeed * Math.cos(angle);
        b.y = BO_PADDLE_Y - b.r;
    }

    // tijolos: um por quadro; a menor sobreposição define o lado da batida
    for (const br of boBricks) {
        if (!br.alive) continue;
        if (b.x + b.r > br.x && b.x - b.r < br.x + BO_BRICK_W && b.y + b.r > br.y && b.y - b.r < br.y + BO_BRICK_H) {
            br.alive = false;
            boScore += 10;
            const overlapX = Math.min(b.x + b.r - br.x, br.x + BO_BRICK_W - (b.x - b.r));
            const overlapY = Math.min(b.y + b.r - br.y, br.y + BO_BRICK_H - (b.y - b.r));
            if (overlapX < overlapY) b.dx = -b.dx; else b.dy = -b.dy;
            boSpeed = Math.min(boSpeed + 0.04, 5.5);
            const m = Math.hypot(b.dx, b.dy) || 1;
            b.dx = b.dx / m * boSpeed;
            b.dy = b.dy / m * boSpeed;
            boUpdateStatus();
            break;
        }
    }

    if (boBricks.every(br => !br.alive)) { boFinish(true); return; }

    if (b.y - b.r > BO_H) {
        boLives--;
        boUpdateStatus();
        if (boLives <= 0) { boFinish(false); return; }
        boState = 'ready';
        boResetBall();
    }
    drawBreakout();
}

function drawBreakout() {
    if (!boCtx) return;
    boCtx.fillStyle = '#0a1523';
    boCtx.fillRect(0, 0, BO_W, BO_H);
    boBricks.forEach(br => {
        if (!br.alive) return;
        boCtx.fillStyle = br.color;
        boCtx.fillRect(br.x, br.y, BO_BRICK_W, BO_BRICK_H);
    });
    boCtx.fillStyle = '#34d399';
    boCtx.fillRect(boPaddle.x, BO_PADDLE_Y, boPaddle.w, boPaddle.h);
    boCtx.fillStyle = '#f1f5f9';
    boCtx.beginPath();
    boCtx.arc(boBall.x, boBall.y, boBall.r, 0, Math.PI * 2);
    boCtx.fill();

    const hint = boState === 'idle' ? 'Pressione Iniciar'
        : boState === 'ready' ? 'Espaço ou toque para lançar'
        : boState === 'paused' ? 'Pausado · toque para continuar' : '';
    if (hint) {
        boCtx.fillStyle = '#8094ad';
        boCtx.font = '600 11px sans-serif';
        boCtx.textAlign = 'center';
        boCtx.fillText(hint, BO_W / 2, BO_H / 2 + 40);
    }
}

const BO_KEYMAP = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', ' ': 'launch', arrowup: 'launch', w: 'launch' };

function boPress(action) {
    if (action === 'launch') { boLaunch(); return; }
    boKeys[action] = true;
    if (boState === 'idle' || boState === 'over') startBreakout();
    else if (boState === 'paused') boResume();
}

document.addEventListener('keydown', (e) => {
    if (!isGameTabActive('tab-breakout')) return;
    const action = BO_KEYMAP[e.key.toLowerCase()];
    if (!action) return;
    e.preventDefault();
    boPress(action);
});

if (boCanvas) {
    boCanvas.addEventListener('pointermove', (e) => {
        const rect = boCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (BO_W / rect.width) - boPaddle.w / 2;
        boPaddle.x = Math.max(0, Math.min(BO_W - boPaddle.w, x));
        if (boState === 'idle') boResetBall();
        if (!boLoop) drawBreakout();
    });
    boCanvas.addEventListener('pointerdown', (e) => { e.preventDefault(); boLaunch(); });
}
holdButton(document.getElementById('boBtnLeft'), () => boPress('left'), () => { boKeys.left = false; });
holdButton(document.getElementById('boBtnRight'), () => boPress('right'), () => { boKeys.right = false; });
holdButton(document.getElementById('boBtnLaunch'), () => boPress('launch'), () => {});
if (resetBoBtn) resetBoBtn.addEventListener('click', startBreakout);

/* SPACE INVADERS */
const invStatus = document.getElementById('invStatus');
const resetInvBtn = document.getElementById('resetInvBtn');
const invCanvas = document.getElementById('invCanvas');
const invCtx = invCanvas ? invCanvas.getContext('2d') : null;

const INV_W = invCanvas ? invCanvas.width : 240;
const INV_H = invCanvas ? invCanvas.height : 240;
const INV_COLS = 8, INV_ROWS = 4, INV_CELL_W = 24, INV_CELL_H = 18;
const INV_SCALE = 2, INV_SPR_W = 16, INV_SPR_H = 12;
const INV_PLAYER_Y = INV_H - 16;
const INV_COLORS = ['#f8fafc', '#cbd5e1', '#94a3b8', '#60a5fa'];
const INV_SPRITES = [
    ['00111100', '01111110', '11011011', '11111111', '00100100', '01000010'],
    ['00111100', '01111110', '11011011', '11111111', '01011010', '10000001']
];

let invAliens = [], invShots = [], invBombs = [];
let invOx = 8, invOy = 26, invDir = 1, invAnim = 0, invMoveTimer = 0;
let invLives = 3, invScore = 0, invWave = 1, invFrame = 0, invCooldown = 0, invHurt = 0;
let invState = 'idle', invLoop = null; // idle | running | paused | over
const invPlayer = { x: 0, w: 18, h: 8 };
const invKeys = { left: false, right: false, fire: false };

function invUpdateStatus() {
    invStatus.textContent = `Pontos: ${invScore} · ❤️ ${invLives} · Onda ${invWave}`;
}

function invBuildWave() {
    invAliens = [];
    for (let r = 0; r < INV_ROWS; r++) {
        for (let c = 0; c < INV_COLS; c++) invAliens.push({ r, c, alive: true });
    }
    invOx = 8;
    invOy = 26;
    invDir = 1;
    invAnim = 0;
    invMoveTimer = 0;
    invShots = [];
    invBombs = [];
}

function initInvaders() {
    if (!invCanvas) return;
    clearInterval(invLoop);
    invLoop = null;
    invKeys.left = invKeys.right = invKeys.fire = false;
    invLives = 3;
    invScore = 0;
    invWave = 1;
    invFrame = 0;
    invCooldown = 0;
    invHurt = 0;
    invState = 'idle';
    invPlayer.x = (INV_W - invPlayer.w) / 2;
    invBuildWave();
    invUpdateStatus();
    drawInvaders();
}

function startInvaders() {
    blurActive();
    initInvaders();
    invState = 'running';
    invLoop = setInterval(invTick, 16);
}

function invResume() {
    invState = 'running';
    invUpdateStatus();
    invLoop = setInterval(invTick, 16);
}

function pauseInvaders() {
    if (invState !== 'running') return;
    clearInterval(invLoop);
    invLoop = null;
    invKeys.left = invKeys.right = invKeys.fire = false;
    invState = 'paused';
    invStatus.textContent = 'Pausado';
    drawInvaders();
}

function invFinish() {
    clearInterval(invLoop);
    invLoop = null;
    invState = 'over';
    invKeys.left = invKeys.right = invKeys.fire = false;
    invStatus.textContent = `Game Over! 💥 (${invScore})`;
    drawInvaders();
}

function invTick() {
    invFrame++;
    const p = invPlayer;
    if (invKeys.left) p.x -= 3;
    if (invKeys.right) p.x += 3;
    p.x = Math.max(0, Math.min(INV_W - p.w, p.x));
    if (invCooldown > 0) invCooldown--;
    if (invHurt > 0) invHurt--;

    if (invKeys.fire && invCooldown === 0 && invShots.length < 3) {
        invShots.push({ x: p.x + p.w / 2, y: INV_PLAYER_Y });
        invCooldown = 20;
    }
    invShots.forEach(s => { s.y -= 5; });

    // tiro x alien
    for (const s of invShots) {
        for (const a of invAliens) {
            if (!a.alive) continue;
            const ax = invOx + a.c * INV_CELL_W, ay = invOy + a.r * INV_CELL_H;
            if (s.x >= ax && s.x <= ax + INV_SPR_W && s.y >= ay && s.y <= ay + INV_SPR_H) {
                a.alive = false;
                s.y = -100;
                invScore += (INV_ROWS - a.r) * 10;
                invUpdateStatus();
                break;
            }
        }
    }
    invShots = invShots.filter(s => s.y > -4);

    // onda limpa: recomeça mais rápida, mantendo pontos e vidas
    const alive = invAliens.filter(a => a.alive);
    if (!alive.length) {
        invWave++;
        invBuildWave();
        invUpdateStatus();
        drawInvaders();
        return;
    }

    // a marcha acelera conforme sobram menos aliens
    const interval = Math.max(3, Math.round(alive.length * 0.85) + 6 - (invWave - 1) * 4);
    if (++invMoveTimer >= interval) {
        invMoveTimer = 0;
        invAnim = 1 - invAnim;
        const minC = Math.min(...alive.map(a => a.c));
        const maxC = Math.max(...alive.map(a => a.c));
        const left = invOx + minC * INV_CELL_W;
        const right = invOx + maxC * INV_CELL_W + INV_SPR_W;
        if ((invDir > 0 && right + 4 > INV_W - 4) || (invDir < 0 && left - 4 < 4)) {
            invDir = -invDir;
            invOy += 8;
        } else {
            invOx += 4 * invDir;
        }
    }

    // aliens atiram (sempre os da frente de cada coluna)
    if (invFrame % Math.max(22, 70 - invWave * 8) === 0) {
        const front = {};
        alive.forEach(a => { if (!front[a.c] || a.r > front[a.c].r) front[a.c] = a; });
        const shooters = Object.values(front);
        const a = shooters[Math.floor(Math.random() * shooters.length)];
        invBombs.push({ x: invOx + a.c * INV_CELL_W + INV_SPR_W / 2, y: invOy + a.r * INV_CELL_H + INV_SPR_H });
    }
    invBombs.forEach(b => { b.y += 2 + (invWave - 1) * 0.3; });

    for (const b of invBombs) {
        if (invHurt === 0 && b.y >= INV_PLAYER_Y && b.y <= INV_PLAYER_Y + p.h && b.x >= p.x && b.x <= p.x + p.w) {
            b.y = INV_H + 10;
            invLives--;
            invHurt = 60;
            invUpdateStatus();
            if (invLives <= 0) { invFinish(); return; }
        }
    }
    invBombs = invBombs.filter(b => b.y < INV_H);

    // aliens chegaram na linha da nave
    const lowest = Math.max(...alive.map(a => invOy + a.r * INV_CELL_H + INV_SPR_H));
    if (lowest >= INV_PLAYER_Y) { invFinish(); return; }

    drawInvaders();
}

function invDrawSprite(sprite, x, y, color) {
    invCtx.fillStyle = color;
    sprite.forEach((row, ry) => {
        for (let rx = 0; rx < row.length; rx++) {
            if (row[rx] === '1') invCtx.fillRect(x + rx * INV_SCALE, y + ry * INV_SCALE, INV_SCALE, INV_SCALE);
        }
    });
}

function drawInvaders() {
    if (!invCtx) return;
    invCtx.fillStyle = '#0a1523';
    invCtx.fillRect(0, 0, INV_W, INV_H);

    invAliens.forEach(a => {
        if (!a.alive) return;
        invDrawSprite(INV_SPRITES[invAnim], invOx + a.c * INV_CELL_W, invOy + a.r * INV_CELL_H, INV_COLORS[a.r]);
    });

    invCtx.fillStyle = 'rgba(16, 185, 129, .35)';
    invCtx.fillRect(0, INV_H - 6, INV_W, 1);

    // nave (pisca depois de ser atingida)
    if (invHurt === 0 || Math.floor(invHurt / 6) % 2 === 0) {
        const p = invPlayer;
        invCtx.fillStyle = '#10b981';
        invCtx.fillRect(p.x, INV_PLAYER_Y + 4, p.w, 4);
        invCtx.fillRect(p.x + 6, INV_PLAYER_Y + 2, 6, 2);
        invCtx.fillRect(p.x + 8, INV_PLAYER_Y, 2, 2);
    }

    invCtx.fillStyle = '#f1f5f9';
    invShots.forEach(s => invCtx.fillRect(s.x - 1, s.y - 6, 2, 6));
    invCtx.fillStyle = '#ef4444';
    invBombs.forEach(b => invCtx.fillRect(b.x - 1, b.y, 2, 6));

    const hint = invState === 'idle' ? 'Pressione Iniciar · Espaço atira'
        : invState === 'paused' ? 'Pausado · toque para continuar' : '';
    if (hint) {
        invCtx.fillStyle = '#8094ad';
        invCtx.font = '600 11px sans-serif';
        invCtx.textAlign = 'center';
        invCtx.fillText(hint, INV_W / 2, INV_H / 2 + 40);
    }
}

const INV_KEYMAP = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', ' ': 'fire', arrowup: 'fire', w: 'fire' };

function invPress(action, down) {
    invKeys[action] = down;
    if (!down) return;
    if (invState === 'idle' || invState === 'over') startInvaders();
    else if (invState === 'paused') invResume();
}

document.addEventListener('keydown', (e) => {
    if (!isGameTabActive('tab-invaders')) return;
    const action = INV_KEYMAP[e.key.toLowerCase()];
    if (!action) return;
    e.preventDefault();
    invPress(action, true);
});

// soltar as teclas sempre limpa o estado, mesmo se a aba mudou no meio
document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    const boAction = BO_KEYMAP[key], invAction = INV_KEYMAP[key];
    if (boAction === 'left' || boAction === 'right') boKeys[boAction] = false;
    if (invAction) invKeys[invAction] = false;
    if (e.key === ' ' && (isGameTabActive('tab-breakout') || isGameTabActive('tab-invaders'))) e.preventDefault();
});

if (invCanvas) {
    invCanvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (invState === 'idle' || invState === 'over') startInvaders();
        else if (invState === 'paused') invResume();
    });
}
holdButton(document.getElementById('invBtnLeft'), () => invPress('left', true), () => { invKeys.left = false; });
holdButton(document.getElementById('invBtnRight'), () => invPress('right', true), () => { invKeys.right = false; });
holdButton(document.getElementById('invBtnFire'), () => invPress('fire', true), () => { invKeys.fire = false; });
if (resetInvBtn) resetInvBtn.addEventListener('click', startInvaders);

/* SISTEMA DE NOTAS */
const openNotesModalBtn = document.getElementById('openNotesModalBtn');
const closeNotesModalBtn = document.getElementById('closeNotesModalBtn');
const notesModalOverlay = document.getElementById('notesModalOverlay');
const notesModalTitle = document.getElementById('notesModalTitle');
const notesModalStatus = document.getElementById('notesModalStatus');

const viewFolders = document.getElementById('viewFolders');
const viewEditor = document.getElementById('viewEditor');
const foldersGrid = document.getElementById('foldersGrid');
const topicsContainerModal = document.getElementById('topicsContainerModal');

const btnCreateFolder = document.getElementById('btnCreateFolder');
const btnBackToFolders = document.getElementById('btnBackToFolders');
const btnAddTopicModal = document.getElementById('btnAddTopicModal');
const btnDelFolderModal = document.getElementById('btnDelFolderModal');

let activeFolderId = null;
let notesDatabase = JSON.parse(localStorage.getItem('felipe_center_notes')) || [
    {
        id: 'f_1',
        name: 'Geral',
        icon: '📁',
        topics: [{ id: 't_1', title: 'Anotações Rápidas', content: 'Escreva suas tarefas e ideias aqui...' }]
    }
];

if (openNotesModalBtn && notesModalOverlay) {
    openNotesModalBtn.addEventListener('click', () => {
        notesModalOverlay.classList.add('active');
        openFoldersView();
    });
}

if (closeNotesModalBtn) {
    closeNotesModalBtn.addEventListener('click', () => notesModalOverlay.classList.remove('active'));
}

if (notesModalOverlay) {
    notesModalOverlay.addEventListener('click', (e) => {
        if (e.target === notesModalOverlay) notesModalOverlay.classList.remove('active');
    });
}

function saveCenterNotes() {
    localStorage.setItem('felipe_center_notes', JSON.stringify(notesDatabase));
    if (notesModalStatus) {
        notesModalStatus.textContent = 'Salvo! ✔️';
        setTimeout(() => notesModalStatus.textContent = 'Pronto', 1500);
    }
}

function openFoldersView() {
    activeFolderId = null;
    viewEditor.classList.remove('active');
    viewFolders.classList.add('active');
    notesModalTitle.textContent = '📁 Suas Pastas';
    foldersGrid.innerHTML = '';

    notesDatabase.forEach(folder => {
        const card = document.createElement('div');
        card.className = 'folder-card-item';
        card.innerHTML = `
            <span class="folder-card-icon">${esc(folder.icon || '📁')}</span>
            <span class="folder-card-name">${esc(folder.name)}</span>
            <span class="folder-card-count">${folder.topics.length} tópico(s)</span>
        `;
        card.onclick = () => openEditorView(folder.id);
        foldersGrid.appendChild(card);
    });
}

function openEditorView(folderId) {
    activeFolderId = folderId;
    const folder = notesDatabase.find(f => f.id === folderId);
    if (!folder) return;

    viewFolders.classList.remove('active');
    viewEditor.classList.add('active');
    notesModalTitle.textContent = `${folder.icon || '📁'} ${folder.name}`;
    renderTopicsModal();
}

function renderTopicsModal() {
    topicsContainerModal.innerHTML = '';
    const folder = notesDatabase.find(f => f.id === activeFolderId);
    if (!folder) return;

    if (folder.topics.length === 0) {
        topicsContainerModal.innerHTML = `<p style="text-align:center; color:var(--text-muted); margin-top:20px;">Esta pasta está vazia. Clique em "＋ Novo Tópico" para começar.</p>`;
        return;
    }

    folder.topics.forEach(topic => {
        const topicCard = document.createElement('div');
        topicCard.className = 'modal-topic-card';

        topicCard.innerHTML = `
            <div class="modal-topic-header">
                <input type="text" class="modal-topic-title" value="${esc(topic.title)}" placeholder="Título do tópico...">
                <button class="btn-del-topic" style="background:transparent; border:none; color:#ef4444; cursor:pointer;">❌</button>
            </div>
            <textarea class="modal-topic-body" placeholder="Escreva aqui...">${esc(topic.content)}</textarea>
        `;

        const titleInput = topicCard.querySelector('.modal-topic-title');
        const bodyInput = topicCard.querySelector('.modal-topic-body');
        const delBtn = topicCard.querySelector('.btn-del-topic');

        titleInput.oninput = () => { topic.title = titleInput.value; debouncedModalSave(); };
        bodyInput.oninput = () => { topic.content = bodyInput.value; debouncedModalSave(); };
        delBtn.onclick = () => {
            folder.topics = folder.topics.filter(t => t.id !== topic.id);
            saveCenterNotes();
            renderTopicsModal();
        };

        topicsContainerModal.appendChild(topicCard);
    });
}

if (btnBackToFolders) btnBackToFolders.addEventListener('click', openFoldersView);

const customFolderModal = document.getElementById('customFolderModal');
const inputFolderName = document.getElementById('inputFolderName');
const inputFolderIcon = document.getElementById('inputFolderIcon');
const closeFolderModalBtn = document.getElementById('closeFolderModalBtn');
const saveFolderBtn = document.getElementById('saveFolderBtn');

if (btnCreateFolder) {
    btnCreateFolder.addEventListener('click', () => {
        inputFolderName.value = '';
        inputFolderIcon.value = '📁';
        customFolderModal.classList.add('active');
        inputFolderName.focus();
    });
}

if (closeFolderModalBtn) {
    closeFolderModalBtn.addEventListener('click', () => customFolderModal.classList.remove('active'));
}

if (saveFolderBtn) {
    saveFolderBtn.addEventListener('click', () => {
        const name = inputFolderName.value.trim();
        const icon = inputFolderIcon.value.trim() || '📁';
        if (!name) { alert('Digite um nome para a pasta.'); return; }

        notesDatabase.push({ id: 'f_' + Date.now(), name, icon, topics: [] });
        saveCenterNotes();
        openFoldersView();
        customFolderModal.classList.remove('active');
    });
}

if (btnDelFolderModal) {
    btnDelFolderModal.addEventListener('click', () => {
        const folder = notesDatabase.find(f => f.id === activeFolderId);
        if (folder && confirm(`Deseja excluir a pasta "${folder.name}" e todas as suas anotações?`)) {
            notesDatabase = notesDatabase.filter(f => f.id !== activeFolderId);
            saveCenterNotes();
            openFoldersView();
        }
    });
}

let modalSaveTimer;
function debouncedModalSave() {
    if (notesModalStatus) notesModalStatus.textContent = 'Digitando...';
    clearTimeout(modalSaveTimer);
    modalSaveTimer = setTimeout(saveCenterNotes, 800);
}

if (btnAddTopicModal) {
    btnAddTopicModal.onclick = () => {
        const folder = notesDatabase.find(f => f.id === activeFolderId);
        if (!folder) return;

        folder.topics.unshift({ id: 't_' + Date.now(), title: '', content: '' });
        saveCenterNotes();
        renderTopicsModal();
    };
}

/* HERO: saudação, data, hora e indicadores */
function renderHero() {
    const now = new Date();
    const h = now.getHours();
    document.getElementById('heroGreeting').textContent = h < 12 ? 'Bom dia' : (h < 18 ? 'Boa tarde' : 'Boa noite');
    const date = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('heroDate').textContent = date;
    document.getElementById('heroClock').textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function updateHeroStats() {
    const t = new Date();
    const n = getSavedEvents(formatDateKey(t.getFullYear(), t.getMonth(), t.getDate())).length;
    document.getElementById('statEvents').textContent = n;
    document.getElementById('statEventsLabel').textContent = n === 1 ? 'compromisso hoje' : 'compromissos hoje';
}

function initHero() {
    renderHero();
    updateHeroStats();
    setInterval(renderHero, 20000);
}

document.addEventListener('keydown', (e) => {
    const tag = document.activeElement ? document.activeElement.tagName : '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if (e.key === '/' && !typing) { e.preventDefault(); searchBar.focus(); return; }

    if (e.key === 'Escape') {
        const folderModal = document.getElementById('customFolderModal');
        if (folderModal.classList.contains('active')) folderModal.classList.remove('active');
        else if (notesModalOverlay.classList.contains('active')) notesModalOverlay.classList.remove('active');
        else if (modal.classList.contains('active')) modal.classList.remove('active');
        else if (toolPanel.classList.contains('open')) closeTools();
        else if (document.activeElement === searchBar && searchBar.value) { searchBar.value = ''; applyFilter(); }
    }
});

modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

document.addEventListener('mousemove', (e) => {
    const card = e.target.closest ? e.target.closest('.custom-card') : null;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
});

/* JOGOS ESCONDIDOS: 3 cliques rápidos no logo (ou no relógio, no celular) · ou Alt+G */
(function secretGames() {
    let taps = 0, timer = null;
    const toggleGames = () => { if (currentTool() === 'coffee') closeTools(); else openTool('coffee'); };

    document.querySelectorAll('.rail-logo, #heroClock').forEach(el => {
        el.addEventListener('click', () => {
            taps++;
            clearTimeout(timer);
            timer = setTimeout(() => { taps = 0; }, 600);
            if (taps >= 3) { taps = 0; toggleGames(); }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyG') { e.preventDefault(); toggleGames(); }
    });
})();

const aiChips = document.getElementById('aiChips');
function hideAiChips() { if (aiChips) aiChips.style.display = 'none'; }
document.querySelectorAll('.ai-chip').forEach(chip => {
    chip.addEventListener('click', () => { aiInput.value = chip.dataset.prompt; hideAiChips(); handleAiQuery(); });
});
if (sendAiBtn) sendAiBtn.addEventListener('click', hideAiChips);
if (aiInput) aiInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') hideAiChips(); });