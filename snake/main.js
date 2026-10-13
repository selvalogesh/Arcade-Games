import {
    update as updateSnake,
    draw as drawSnake,
    resetSnake,
    snakeIntersection,
} from "./snake.js";
import { update as updateFood, draw as drawFood, resetFood } from "./food.js";
import { queueDirection, resetInput } from "./input.js";

const BEST_KEY = "snake-best-score";
// Moves per second: starts slow and speeds up with every food eaten
const START_SPEED = 4;
const SPEED_STEP = 0.25;
const MAX_SPEED = 12;

const gameBoard = document.getElementById("game-board");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const pauseButton = document.getElementById("pause");
const overlay = document.getElementById("overlay");
const overlayMessage = document.getElementById("overlay-message");
const resumeButton = document.getElementById("resume");
const newGameButton = document.getElementById("new-game");

// "ready" (waiting for the first swipe), "playing", "paused" or "over"
let state = "ready";
let score = 0;
let bestScore = Number(readStorage(BEST_KEY)) || 0;
let lastRenderTime = 0;

window.addEventListener("keydown", handleKey);
onClick(pauseButton, togglePause);
onClick(resumeButton, resume);
onClick(newGameButton, newGame);
// Pause when the app is sent to the background or the window loses focus
document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
});
window.addEventListener("blur", pause);

newGame();
window.requestAnimationFrame(main);

function main(currentTime) {
    window.requestAnimationFrame(main);
    if (state !== "playing") {
        // So the first move after starting or resuming waits a full step
        lastRenderTime = currentTime;
        return;
    }
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / getSpeed()) return;
    lastRenderTime = currentTime;
    update();
}

function update() {
    updateSnake();
    if (snakeIntersection()) {
        draw();
        gameOver();
        return;
    }
    if (updateFood()) setScore(score + 1);
    draw();
}

function draw() {
    gameBoard.innerHTML = "";
    drawSnake(gameBoard);
    drawFood(gameBoard);
}

function getSpeed() {
    return Math.min(MAX_SPEED, START_SPEED + score * SPEED_STEP);
}

function handleKey(e) {
    if (e.key === " " || e.key === "Escape") {
        e.preventDefault();
        togglePause();
        return;
    }
    if (state === "ready") {
        if (queueDirection(e.key)) start();
    } else if (state === "playing") {
        queueDirection(e.key);
    }
}

function newGame() {
    resetSnake();
    resetFood();
    resetInput();
    setScore(0);
    gameBoard.classList.remove("dead");
    draw();
    state = "ready";
    showOverlay("Swipe to start", { ready: true });
}

function start() {
    state = "playing";
    hideOverlay();
}

function togglePause() {
    if (state === "paused") resume();
    else pause();
}

function pause() {
    if (state !== "playing") return;
    state = "paused";
    showOverlay("Paused", { canResume: true });
}

function resume() {
    if (state !== "paused") return;
    state = "playing";
    hideOverlay();
}

function gameOver() {
    state = "over";
    gameBoard.classList.add("dead");
    showOverlay(`Game over!<br>Score ${score}`);
}

function setScore(value) {
    score = value;
    scoreElement.textContent = score;
    if (score > bestScore) {
        bestScore = score;
        writeStorage(BEST_KEY, bestScore);
    }
    bestScoreElement.textContent = bestScore;
}

function showOverlay(message, { ready = false, canResume = false } = {}) {
    overlayMessage.innerHTML = message;
    overlay.classList.toggle("ready", ready);
    resumeButton.hidden = !canResume;
    newGameButton.hidden = ready;
    overlay.hidden = false;
}

function hideOverlay() {
    overlay.hidden = true;
}

// Buttons lose focus after a click, so Space only toggles pause via handleKey
function onClick(button, handler) {
    button.addEventListener("click", () => {
        button.blur();
        handler();
    });
}

function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Storage unavailable (e.g. private mode); the game still works without saving
    }
}
