import Grid from "./Grid.js";
import Tile from "./Tile.js";
import {
  handleTouchStart,
  handleTouchMove,
} from "../utilities/touchScreenHandler.js";

const SAVE_KEY = "2048-game";
// Score is the highest tile on the board
const BEST_KEY = "2048-best-tile";
const WIN_VALUE = 2048;

window.addEventListener("touchstart", handleTouchStart, false);
window.addEventListener("touchmove", handleTouchMove, false);

const gameBoard = document.getElementById("game-board");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const overlay = document.getElementById("overlay");
const overlayMessage = document.getElementById("overlay-message");
const keepPlayingButton = document.getElementById("keep-playing");

const grid = new Grid(gameBoard);
let score = 0;
let bestScore = Number(readStorage(BEST_KEY)) || 0;
let hasWon = false;
// Bumped on every new game so moves still animating from a previous game are dropped
let gameId = 0;

document.getElementById("new-game").addEventListener("click", newGame);
document.getElementById("try-again").addEventListener("click", newGame);
keepPlayingButton.addEventListener("click", () => {
  hideOverlay();
  setUpInput();
});

if (!restoreGame()) newGame();

window.onload = () => {
  // Inside the Android app (Capacitor) assets are bundled, so no service worker is needed
  if (window.Capacitor) return;
  document.documentElement.requestFullscreen?.().catch(() => {});
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("../serviceWorker.js", { scope: "/", updateViaCache: "none" })
      .then(() => console.log("Service Worker: Registered"))
      .catch(() => {});
  }
};

function newGame() {
  gameId += 1;
  window.removeEventListener("keydown", handleInput);
  hideOverlay();
  grid.reset();
  hasWon = false;
  grid.randomEmptyCell().tile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = new Tile(gameBoard);
  setScore(grid.maxScore());
  saveGame();
  setUpInput();
}

function setUpInput() {
  window.addEventListener("keydown", handleInput, { once: true });
}

async function handleInput(e) {
  const currentGame = gameId;
  switch (e.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setUpInput();
        return;
      }
      await moveUp();
      break;
    case "ArrowDown":
      if (!canMoveDown()) {
        setUpInput();
        return;
      }
      await moveDown();
      break;
    case "ArrowLeft":
      if (!canMoveLeft()) {
        setUpInput();
        return;
      }
      await moveLeft();
      break;
    case "ArrowRight":
      if (!canMoveRight()) {
        setUpInput();
        return;
      }
      await moveRight();
      break;
    default:
      setUpInput();
      return;
  }
  if (currentGame !== gameId) return;
  grid.mergeTiles();
  const newTile = new Tile(gameBoard);
  grid.randomEmptyCell().tile = newTile;
  setScore(grid.maxScore());
  saveGame();
  await newTile.waitForTransition(true);
  if (currentGame !== gameId) return;

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    removeStorage(SAVE_KEY);
    showOverlay(`Game over!<br>Score ${score}`, false);
    return;
  }
  if (!hasWon && grid.maxScore() >= WIN_VALUE) {
    hasWon = true;
    saveGame();
    showOverlay(`You made ${WIN_VALUE}!`, true);
    return;
  }
  setUpInput();
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

function showOverlay(message, canKeepPlaying) {
  overlayMessage.innerHTML = message;
  keepPlayingButton.hidden = !canKeepPlaying;
  overlay.hidden = false;
}

function hideOverlay() {
  overlay.hidden = true;
}

function saveGame() {
  const tiles = grid.cellsByRow.flat().map((cell) => cell.tile?.value ?? 0);
  writeStorage(SAVE_KEY, JSON.stringify({ tiles, hasWon }));
}

function restoreGame() {
  try {
    const { tiles, hasWon: savedHasWon } = JSON.parse(
      readStorage(SAVE_KEY)
    );
    const cells = grid.cellsByRow.flat();
    if (tiles.length !== cells.length || !tiles.some((value) => value > 0)) {
      return false;
    }
    tiles.forEach((value, index) => {
      if (value > 0) cells[index].tile = new Tile(gameBoard, value);
    });
    hasWon = savedHasWon;
    setScore(grid.maxScore());
    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
      return false;
    }
    setUpInput();
    return true;
  } catch {
    grid.reset();
    return false;
  }
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

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore, see writeStorage
  }
}

function moveUp() {
  return slideTiles(grid.cellsByColumn);
}

function moveDown() {
  return slideTiles(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function moveLeft() {
  return slideTiles(grid.cellsByRow);
}

function moveRight() {
  return slideTiles(grid.cellsByRow.map((row) => [...row].reverse()));
}

function slideTiles(cells) {
  return Promise.all(
    cells.flatMap((group) => {
      const promises = [];
      for (let i = 1; i < group.length; i += 1) {
        const cell = group[i];
        if (cell.tile === null) continue;
        let lastValidCell = null;

        for (let j = i - 1; j >= 0; j -= 1) {
          const moveToCell = group[j];
          if (!moveToCell.canAccept(cell.tile)) break;
          lastValidCell = moveToCell;
        }

        if (lastValidCell !== null) {
          promises.push(cell.tile.waitForTransition());
          if (lastValidCell.tile !== null) {
            lastValidCell.mergeTile = cell.tile;
          } else {
            lastValidCell.tile = cell.tile;
          }
          cell.tile = null;
        }
      }
      return promises;
    })
  );
}

function canMoveUp() {
  return canMove(grid.cellsByColumn);
}

function canMoveDown() {
  return canMove(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function canMoveLeft() {
  return canMove(grid.cellsByRow);
}

function canMoveRight() {
  return canMove(grid.cellsByRow.map((row) => [...row].reverse()));
}

function canMove(cells) {
  return cells.some((group) => {
    return group.some((cell, index) => {
      if (index === 0) return false;
      if (cell.tile === null) return false;
      const moveToCell = group[index - 1];
      return moveToCell.canAccept(cell.tile);
    });
  });
}
