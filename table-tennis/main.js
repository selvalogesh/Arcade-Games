import { WIDTH, createMatch, step, isOver, movePlayer } from "./table.js";
import { drawTable } from "./draw.js";

const RECORD_KEY = "table-tennis-record";
// Paddle speed with the arrow keys, in table units per second
const KEY_SPEED = 350;
// Longest step simulated at once, so a stalled frame can't teleport the ball
const MAX_STEP = 0.05;

const canvas = document.getElementById("table");
const ctx = canvas.getContext("2d");
const cpuScoreElement = document.getElementById("cpu-score");
const playerScoreElement = document.getElementById("player-score");
const pauseButton = document.getElementById("pause");
const overlay = document.getElementById("overlay");
const overlayMessage = document.getElementById("overlay-message");
const levelsElement = document.getElementById("levels");
const resumeButton = document.getElementById("resume");
const playAgainButton = document.getElementById("play-again");
const changeLevelButton = document.getElementById("change-level");

// "menu" (choosing a level), "playing", "paused" or "over"
let state = "menu";
let match = createMatch("medium");
let record = readRecord();
let scale = 1;
let lastTime = null;
const keysDown = new Set();

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointerdown", followPointer);
window.addEventListener("pointermove", followPointer);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", (e) => keysDown.delete(e.key));
onClick(pauseButton, togglePause);
onClick(resumeButton, resume);
onClick(playAgainButton, () => startMatch(match.level));
onClick(changeLevelButton, showMenu);
levelsElement.querySelectorAll("button").forEach((button) => {
  onClick(button, () => startMatch(button.dataset.level));
});
// Pause when the app is sent to the background or the window loses focus
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause();
});
window.addEventListener("blur", pause);

resizeCanvas();
showMenu();
window.requestAnimationFrame(main);

function main(currentTime) {
  window.requestAnimationFrame(main);
  const dt = lastTime === null ? 0 : Math.min(MAX_STEP, (currentTime - lastTime) / 1000);
  lastTime = currentTime;
  if (state === "playing") update(dt);
  drawTable(ctx, match, scale, currentTime);
}

function update(dt) {
  const direction = (keysDown.has("ArrowRight") ? 1 : 0) - (keysDown.has("ArrowLeft") ? 1 : 0);
  if (direction !== 0) movePlayer(match, match.player.x + direction * KEY_SPEED * dt);
  const event = step(match, dt);
  if (event === "player-point" || event === "cpu-point") {
    showScores();
    if (isOver(match)) finishMatch();
  }
}

// Your paddle follows your finger (or mouse) across the table, wherever you touch
function followPointer(e) {
  if (state !== "playing") return;
  const rect = canvas.getBoundingClientRect();
  movePlayer(match, ((e.clientX - rect.left) / rect.width) * WIDTH);
}

function handleKeyDown(e) {
  if (e.key === " " || e.key === "Escape") {
    e.preventDefault();
    togglePause();
    return;
  }
  keysDown.add(e.key);
}

function startMatch(level) {
  match = createMatch(level);
  showScores();
  state = "playing";
  hideOverlay();
}

function showMenu() {
  state = "menu";
  levelsElement.querySelectorAll("button").forEach((button) => {
    const { won, lost } = record[button.dataset.level];
    button.querySelector(".record").textContent =
      won + lost === 0 ? "Not played yet" : `${won} won · ${lost} lost`;
  });
  showOverlay("Choose a level", { levels: true });
}

function togglePause() {
  if (state === "paused") resume();
  else pause();
}

function pause() {
  if (state !== "playing") return;
  state = "paused";
  showOverlay("Paused", { resume: true, changeLevel: true });
}

function resume() {
  if (state !== "paused") return;
  state = "playing";
  hideOverlay();
}

function finishMatch() {
  state = "over";
  const { player, cpu } = match.score;
  const won = player > cpu;
  record[match.level][won ? "won" : "lost"] += 1;
  writeRecord();
  // Winner's score first
  const result = won ? `You win!<br>${player} – ${cpu}` : `CPU wins<br>${cpu} – ${player}`;
  showOverlay(result, { playAgain: true, changeLevel: true });
}

function showScores() {
  cpuScoreElement.textContent = match.score.cpu;
  playerScoreElement.textContent = match.score.player;
}

function showOverlay(message, { levels = false, resume = false, playAgain = false, changeLevel = false } = {}) {
  overlayMessage.innerHTML = message;
  levelsElement.hidden = !levels;
  resumeButton.hidden = !resume;
  playAgainButton.hidden = !playAgain;
  changeLevelButton.hidden = !changeLevel;
  overlay.hidden = false;
}

function hideOverlay() {
  overlay.hidden = true;
}

// Sharp on high-density screens: the canvas has one pixel per device pixel
function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * ratio);
  canvas.height = Math.round(canvas.clientHeight * ratio);
  scale = canvas.width / WIDTH;
}

// Buttons lose focus after a click, so Space only toggles pause via handleKeyDown
function onClick(button, handler) {
  button.addEventListener("click", () => {
    button.blur();
    handler();
  });
}

function readRecord() {
  const empty = { easy: { won: 0, lost: 0 }, medium: { won: 0, lost: 0 }, hard: { won: 0, lost: 0 } };
  try {
    const saved = JSON.parse(localStorage.getItem(RECORD_KEY));
    for (const level in empty) Object.assign(empty[level], saved?.[level]);
  } catch {
    // No saved record or storage unavailable
  }
  return empty;
}

function writeRecord() {
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(record));
  } catch {
    // Storage unavailable (e.g. private mode); the game still works without saving
  }
}
