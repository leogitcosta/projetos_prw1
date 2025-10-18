(function(){
  const COLORS = [
    { name: 'Azul',    value: '#007bff' },
    { name: 'Vermelho',value: '#e03131' },
    { name: 'Roxo',    value: '#7048e8' },
    { name: 'Amarelo', value: '#f59f00' }
  ];

  const COLS = 7, ROWS = 6;
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const startBtn = document.getElementById('start');
  const resetBtn = document.getElementById('reset');
  const changeColorsBtn = document.getElementById('changeColors');

  let board = [];
  let current = 'p1';
  let gameOver = false;
  let selected = { p1: null, p2: null };

  // ---------- Construção do tabuleiro ----------
  function buildBoard(){
    boardEl.innerHTML = '';
    board = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null));

    // Cria todas as células direto no grid
    for (let r = 0; r < ROWS; r++){
      for (let c = 0; c < COLS; c++){
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.dataset.r = r;
        cellEl.dataset.c = c;

        const discEl = document.createElement('div');
        discEl.className = 'disc';
        discEl.style.background = '#eaeaea';

        cellEl.appendChild(discEl);
        // clique solta peça naquela coluna
        cellEl.addEventListener('click', () => dropInColumn(c));

        boardEl.appendChild(cellEl);
      }
    }
  }

  // ---------- Seletores de cores ----------
  function buildColorPickers(){
    const p1 = document.querySelector('.colors[data-player="1"]');
    const p2 = document.querySelector('.colors[data-player="2"]');
    p1.innerHTML = ''; p2.innerHTML = '';

    COLORS.forEach(({name, value}, idx) => {
      const b1 = document.createElement('button');
      b1.className = 'color-btn';
      b1.title = name;
      b1.style.background = value;
      b1.addEventListener('click', () => selectColor('p1', idx));

      const b2 = document.createElement('button');
      b2.className = 'color-btn';
      b2.title = name;
      b2.style.background = value;
      b2.addEventListener('click', () => selectColor('p2', idx));

      p1.appendChild(b1);
      p2.appendChild(b2);
    });

    applyPickerState();
  }

  function selectColor(player, idx){
    selected[player] = idx;
    if (selected.p1 !== null && selected.p1 === selected.p2){
      const other = player === 'p1' ? 'p2' : 'p1';
      selected[other] = null;
    }
    applyPickerState();
    statusEl.textContent = 'Cores escolhidas? Clique em "Começar".';
  }

  function applyPickerState(){
    const groups = document.querySelectorAll('.colors');
    groups.forEach(group => {
      const player = group.dataset.player;
      const other = player === '1' ? 'p2' : 'p1';
      const buttons = [...group.querySelectorAll('.color-btn')];
      buttons.forEach((btn, i) => {
        btn.disabled = (selected['p'+other] === i);
        btn.classList.toggle('selected', selected['p'+player] === i);
      });
    });
  }

  function colorOf(player){
    const idx = selected[player];
    return idx === null ? '#eaeaea' : COLORS[idx].value;
  }

  // ---------- Jogo ----------
  function dropInColumn(c){
    if (gameOver) return;
    if (selected.p1 === null || selected.p2 === null){
      statusEl.textContent = 'Escolha as cores dos dois jogadores e clique em "Começar".';
      return;
    }
    for (let r = ROWS - 1; r >= 0; r--){
      if (board[r][c] === null){
        board[r][c] = current;
        paintCell(r, c, colorOf(current));
        if (checkWin(r, c)){
          gameOver = true;
          statusEl.textContent = `Vitória do ${current === 'p1' ? 'Jogador 1' : 'Jogador 2'}! 🎉`;
        } else if (isDraw()){
          gameOver = true;
          statusEl.textContent = 'Empate! 🤝';
        } else {
          togglePlayer();
        }
        return;
      }
    }
    statusEl.textContent = 'Coluna cheia. Escolha outra coluna.';
  }

  function paintCell(r, c, color){
    const cell = getCell(r, c);
    const disc = cell.querySelector('.disc');
    disc.style.background = color;
  }

  function getCell(r, c){
    return boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  }

  function togglePlayer(){
    current = (current === 'p1') ? 'p2' : 'p1';
    statusEl.textContent = `Vez do ${current === 'p1' ? 'Jogador 1' : 'Jogador 2'}.`;
  }

  function isDraw(){
    return board.every(row => row.every(x => x !== null));
  }

  function checkWin(r, c){
    const player = board[r][c];
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr, dc] of dirs){
      const cells = [[r,c]];
      let rr=r+dr, cc=c+dc;
      while (inBounds(rr,cc) && board[rr][cc]===player) { cells.push([rr,cc]); rr+=dr; cc+=dc; }
      rr=r-dr; cc=c-dc;
      while (inBounds(rr,cc) && board[rr][cc]===player) { cells.unshift([rr,cc]); rr-=dr; cc-=dc; }
      if (cells.length >= 4){
        cells.slice(0,4).forEach(([r0,c0]) => getCell(r0,c0).classList.add('win'));
        return true;
      }
    }
    return false;
  }

  function inBounds(r,c){ return r>=0 && r<ROWS && c>=0 && c<COLS; }

  // ---------- Botões ----------
  startBtn.addEventListener('click', () => {
    if (selected.p1 === null || selected.p2 === null) {
      statusEl.textContent = 'Escolha as cores dos dois jogadores antes de começar.';
      return;
    }
    if (selected.p1 === selected.p2) {
      statusEl.textContent = 'As cores devem ser diferentes.';
      return;
    }
    gameOver = false;
    current = 'p1';
    statusEl.textContent = 'Jogo iniciado! Vez do Jogador 1.';
    [...document.querySelectorAll('.color-btn')].forEach(b => b.disabled = true);
  });

  function resetGame(){
    for (let r = 0; r < ROWS; r++){
      for (let c = 0; c < COLS; c++){
        board[r][c] = null;
      }
    }
    boardEl.querySelectorAll('.cell').forEach(cell => {
      cell.classList.remove('win');
      const disc = cell.querySelector('.disc');
      if (disc) disc.style.background = '#eaeaea';
    });
    current = 'p1';
    gameOver = false;
    statusEl.textContent = 'Tabuleiro limpo! Clique em "Começar" para uma nova partida.';
  }
  resetBtn.addEventListener('click', resetGame);

  changeColorsBtn.addEventListener('click', () => {
    selected = { p1: null, p2: null };
    buildColorPickers();
    statusEl.textContent = 'Escolha as cores novamente e clique em "Começar".';
    buildBoard();
    gameOver = false;
  });

  // ---------- Inicialização ----------
  buildBoard();
  buildColorPickers();
  statusEl.textContent = 'Cada jogador escolha uma cor diferente e clique em "Começar".';

})();