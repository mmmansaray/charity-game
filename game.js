// Purify the Stream - Multi-level, lose a life on every wrong move

const LEVELS = [
  {
    rows: 4,
    cols: 4,
    polluted: [
      [1, 1], [2, 2], [3, 0]
    ],
    start: [0, 0],
    goal: [3, 3]
  },
  {
    rows: 5,
    cols: 5,
    polluted: [
      [1, 2], [2, 1], [2, 3], [3, 2], [4, 0]
    ],
    start: [0, 0],
    goal: [4, 4]
  },
  {
    rows: 6,
    cols: 6,
    polluted: [
      [0, 2], [0, 3], [0, 4],
      [1, 2], [1, 3], [1, 4],
      [2, 2], [2, 3], [2, 4],
      [3, 2], [3, 3], [3, 4],
      [4, 2], [4, 3], [4, 4]
      // The rightmost column and the leftmost two columns are open all the way down.
    ],
    start: [0, 0],
    goal: [5, 5]
  }
];

let levelIndex = 0;
let ROWS, COLS, pollutedCells, startCell, goalCell;
let score = 0;
let dropsLeft = 3;
let timeLeft = 30;
let timerInterval = null;
let dragging = false;
let currentCell = [];
let path = [];
let timerStarted = false;
let gameOver = false;

const maze = document.getElementById('maze');
const scoreSpan = document.getElementById('score');
const dropsSpan = document.getElementById('drops-left');
const timeSpan = document.getElementById('time-left');
const messageDiv = document.getElementById('message');
const resetBtn = document.getElementById('reset-btn');
const submitBtn = document.getElementById('submit-btn');
const replayBtn = document.getElementById('replay-btn');
const endScreen = document.getElementById('end-screen');
const endMessage = document.getElementById('end-message');
const finalScore = document.getElementById('final-score');
const replayBtnFinal = document.getElementById('replay-btn-final');

function loadLevel(idx) {
  const level = LEVELS[idx];
  ROWS = level.rows;
  COLS = level.cols;
  pollutedCells = level.polluted;
  startCell = [...level.start];
  goalCell = [...level.goal];
  currentCell = [...startCell];
  path = [[...startCell]];
  renderMaze();
  setupDragAndDrop();
  highlightPath();
  timerStarted = false;
  clearInterval(timerInterval);
  timeLeft = 30;
  timeSpan.textContent = timeLeft;
  messageDiv.textContent = `Level ${levelIndex + 1} of ${LEVELS.length}`;
  gameOver = false;
}

function cellId(r, c) {
  return `cell-${r}-${c}`;
}

function isPolluted(r, c) {
  return pollutedCells.some(([pr, pc]) => pr === r && pc === c);
}

function renderMaze() {
  maze.innerHTML = '';
  maze.style.gridTemplateRows = `repeat(${ROWS}, 60px)`;
  maze.style.gridTemplateColumns = `repeat(${COLS}, 60px)`;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'maze-cell';
      cell.id = cellId(r, c);
      if (isPolluted(r, c)) cell.classList.add('polluted');
      if (r === goalCell[0] && c === goalCell[1]) {
        cell.classList.add('goal');
        cell.innerHTML = '🏁';
      }
      if (r === startCell[0] && c === startCell[1]) {
        cell.classList.add('start');
      }
      maze.appendChild(cell);
    }
  }
  // Place water drop at start
  placeDrop(startCell[0], startCell[1]);
}

function placeDrop(r, c) {
  document.querySelectorAll('.water-drop').forEach(e => e.remove());
  const cell = document.getElementById(cellId(r, c));
  if (!cell) return;
  const drop = document.createElement('div');
  drop.className = 'water-drop';
  drop.innerHTML = '💧';
  drop.setAttribute('draggable', 'true');
  drop.addEventListener('dragstart', dragStart);
  drop.addEventListener('dragend', dragEnd);
  cell.appendChild(drop);
}

function dragStart(e) {
  if (gameOver) return e.preventDefault();
  dragging = true;
  e.target.classList.add('dragging');
  if (!timerStarted) {
    startTimer();
    timerStarted = true;
  }
}

function dragEnd(e) {
  dragging = false;
  e.target.classList.remove('dragging');
}

function allowDrop(e) {
  e.preventDefault();
}

function handleDrop(e) {
  e.preventDefault();
  if (!dragging || gameOver) return;
  const cell = e.currentTarget;
  const [r, c] = cell.id.split('-').slice(1).map(Number);
  // Only allow moving to adjacent cells and not polluted
  if (isAdjacent(currentCell, [r, c]) && !isPolluted(r, c)) {
    currentCell = [r, c];
    path.push([r, c]);
    placeDrop(r, c);
    highlightPath();
  } else {
    cell.classList.add('invalid');
    setTimeout(() => cell.classList.remove('invalid'), 300);
    dropsLeft--;
    updateStats();
    messageDiv.textContent = "❌ Polluted or invalid move! You lost a life.";
    if (dropsLeft === 0) {
      endGame(false);
    } else {
      resetLevel();
    }
  }
}

function isAdjacent([r1, c1], [r2, c2]) {
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

function setupDragAndDrop() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.getElementById(cellId(r, c));
      cell.addEventListener('dragover', allowDrop);
      cell.addEventListener('drop', handleDrop);
    }
  }
}

function resetLevel() {
  currentCell = [...startCell];
  path = [[...startCell]];
  renderMaze();
  setupDragAndDrop();
  highlightPath();
  timerStarted = false;
  clearInterval(timerInterval);
  timeLeft = 30;
  timeSpan.textContent = timeLeft;
}

function submitPath() {
  if (gameOver) return;
  const [r, c] = currentCell;
  if (r === goalCell[0] && c === goalCell[1]) {
    let polluted = path.some(([pr, pc]) => isPolluted(pr, pc));
    if (polluted) {
      messageDiv.textContent = '❌ Polluted! Try again.';
      dropsLeft--;
      updateStats();
      if (dropsLeft === 0) endGame(false);
      else resetLevel();
    } else {
      messageDiv.textContent = '✅ Success! You purified the stream!';
      score += 10 * (levelIndex + 1);
      updateStats();
      if (levelIndex < LEVELS.length - 1) {
        levelIndex++;
        setTimeout(() => {
          loadLevel(levelIndex);
        }, 1000);
      } else {
        endGame(true);
      }
    }
  } else {
    messageDiv.textContent = '💧 You must reach the goal tile!';
  }
}

function highlightPath() {
  document.querySelectorAll('.maze-cell').forEach(cell => cell.classList.remove('path'));
  path.forEach(([r, c]) => {
    const cell = document.getElementById(cellId(r, c));
    if (cell) cell.classList.add('path');
  });
}

function updateStats() {
  scoreSpan.textContent = score;
  dropsSpan.textContent = dropsLeft;
}

function showEndScreen(success) {
  document.querySelector('.game-container').style.display = 'none';
  endScreen.style.display = 'block';
  if (success) {
    endMessage.textContent = "🎉 You did it! Thanks for helping bring clean water to communities in need!";
  } else {
    endMessage.textContent = "☠️ You ran out of clean water.";
  }
  finalScore.textContent = `Final Score: ${score}`;
}

function hideEndScreen() {
  document.querySelector('.game-container').style.display = 'block';
  endScreen.style.display = 'none';
}

function endGame(success) {
  clearInterval(timerInterval);
  document.querySelectorAll('.water-drop').forEach(e => e.remove());
  gameOver = true;
  showEndScreen(success);
}

// Button events
resetBtn.onclick = () => {
  if (!gameOver) resetLevel();
};
submitBtn.onclick = submitPath;
replayBtn.onclick = () => {
  dropsLeft = 3;
  score = 0;
  levelIndex = 0;
  updateStats();
  loadLevel(levelIndex);
};
replayBtnFinal.onclick = () => {
  dropsLeft = 3;
  score = 0;
  levelIndex = 0;
  updateStats();
  hideEndScreen();
  loadLevel(levelIndex);
};

// Initial setup
loadLevel(levelIndex);
updateStats();