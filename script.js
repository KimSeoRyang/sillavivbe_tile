const message = document.getElementById('message');
const startButton = document.getElementById('startButton');
const nextLevelButton = document.getElementById('nextLevelButton');
const stageDisplay = document.getElementById('stage-display');
const levelDisplay = document.getElementById('level-display');
const scoreList = document.getElementById('score-list');
const tileGrid = document.getElementById('tile-grid');

let tiles = [];
let sequence = [];
let playerSequence = [];
let canClick = false;
let masterLevel = 1; // Renamed from level to avoid confusion
let scores = [];
let currentGridSize = 0;

// --- Audio Setup ---
let audioContext;
const frequencies = [261.63, 293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46, 783.99, 880.00];

function playNote(index) {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const frequency = frequencies[index % frequencies.length];
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Display & Conversion ---
function updateDisplay(level) {
    const stage = Math.floor((level - 1) / 10) + 1;
    const levelInStage = ((level - 1) % 10) + 1;
    stageDisplay.textContent = stage;
    levelDisplay.textContent = levelInStage;
}

function levelToStageString(level) {
    const stage = Math.floor((level - 1) / 10) + 1;
    const levelInStage = ((level - 1) % 10) + 1;
    return `스테이지 ${stage} - ${levelInStage}`;
}

// --- Grid Setup ---
function setupGrid(gridSize) {
    tileGrid.innerHTML = '';
    tileGrid.style.gridTemplateColumns = `repeat(${gridSize}, 80px)`;
    const numTiles = gridSize * gridSize;
    for (let i = 0; i < numTiles; i++) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.index = i;
        tile.addEventListener('click', handleTileClick);
        tileGrid.appendChild(tile);
    }
    tiles = document.querySelectorAll('.tile');
}

// --- Score Functions ---
function loadScores() {
    const storedScores = localStorage.getItem('sillaVibeScores');
    if (storedScores) {
        scores = JSON.parse(storedScores);
    }
    updateScoreboard();
}

function updateScoreboard() {
    scoreList.innerHTML = '';
    const topScores = scores.sort((a, b) => b - a).slice(0, 10);
    topScores.forEach(score => {
        const li = document.createElement('li');
        li.textContent = levelToStageString(score);
        scoreList.appendChild(li);
    });
}

function saveScore(newScore) {
    scores.push(newScore);
    localStorage.setItem('sillaVibeScores', JSON.stringify(scores));
    updateScoreboard();
}

// --- Game Logic Functions ---
function startNewGame() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    masterLevel = 1;
    currentGridSize = 0;
    updateDisplay(masterLevel);
    startButton.textContent = '재시작';
    nextLevelButton.style.display = 'none';
    startLevel();
}

async function startLevel() {
    const gridSize = 2 + Math.floor((masterLevel - 1) / 10);
    if (gridSize !== currentGridSize) {
        setupGrid(gridSize);
        currentGridSize = gridSize;
    }
    message.textContent = '순서를 외우세요...';
    startButton.disabled = true;
    nextLevelButton.style.display = 'none';
    sequence = [];
    playerSequence = [];
    canClick = false;
    const numTiles = gridSize * gridSize;
    const sequenceLength = 4 + (Math.floor((masterLevel - 1) / 10) * 2);
    for (let i = 0; i < sequenceLength; i++) {
        sequence.push(Math.floor(Math.random() * numTiles));
    }
    await playSequence();
}

async function playSequence() {
    const stage = Math.floor((masterLevel - 1) / 10) + 1;
    const levelInStage = ((masterLevel - 1) % 10) + 1;

    const stageSpeed = 450 - (stage - 1) * 80;
    let tierReduction = 0;
    if (levelInStage >= 4 && levelInStage <= 7) {
        tierReduction = 60;
    } else if (levelInStage >= 8) {
        tierReduction = 120;
    }
    
    const currentSpeed = Math.max(100, stageSpeed - tierReduction);

    await sleep(1000);
    for (const index of sequence) {
        if(tiles[index]) {
            playNote(index);
            tiles[index].classList.add('active');
            await sleep(currentSpeed);
            tiles[index].classList.remove('active');
            await sleep(currentSpeed / 2);
        }
    }
    message.textContent = '따라해보세요!';
    canClick = true;
}

async function handleTileClick(event) {
    if (!canClick) return;
    const clickedIndex = parseInt(event.target.dataset.index);
    playNote(clickedIndex);
    playerSequence.push(clickedIndex);
    tiles[clickedIndex].classList.add('active');
    await sleep(250);
    tiles[clickedIndex].classList.remove('active');
    const currentMoveIndex = playerSequence.length - 1;
    if (playerSequence[currentMoveIndex] !== sequence[currentMoveIndex]) {
        endLevel(false);
        return;
    }
    if (playerSequence.length === sequence.length) {
        endLevel(true);
    }
}

function endLevel(success) {
    canClick = false;
    if (success) {
        message.textContent = '성공! 다음 단계로 진행하세요.';
        nextLevelButton.style.display = 'inline-block';
    } else {
        message.textContent = `실패! ${levelToStageString(masterLevel)}에서 게임오버.`;
        saveScore(masterLevel);
        startButton.disabled = false;
    }
}

function goToNextLevel() {
    masterLevel++;
    updateDisplay(masterLevel);
    startLevel();
}

// --- Initial Setup ---
startButton.addEventListener('click', startNewGame);
nextLevelButton.addEventListener('click', goToNextLevel);
document.addEventListener('DOMContentLoaded', () => {
    loadScores();
});
