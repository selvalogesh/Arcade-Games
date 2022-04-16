import {
    update as updateSnake,
    draw as drawSnake,
    SNAKE_SPEED,
    getSnakeHead,
    snakeIntersection,
} from "./snake.js";
import { update as updateFood, draw as drawFood } from "./food.js";
import { outsideGrid } from "./grid.js";

let lastRenderTime = 0;
let pauseGame = false;
let gameOver = false;
const gameBoard = document.getElementById("game-board");

const checkDeath = () => {
    gameOver = outsideGrid(getSnakeHead()) || snakeIntersection();
};

const update = () => {
    updateSnake();
    updateFood();
    checkDeath();
};

const draw = () => {
    gameBoard.innerHTML = "";
    drawSnake(gameBoard);
    drawFood(gameBoard);
};

export function pauseGameToggle() {
    pauseGame = !pauseGame;
}

export function getGameState() {
    return pauseGame;
}

function main(currentTime) {
    if (gameOver) {
        return alert("LOST!");
    }
    window.requestAnimationFrame(main);
    const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / SNAKE_SPEED) return;
    lastRenderTime = currentTime;

    if (pauseGame) {
        return;
    }

    update();
    draw();
}

window.requestAnimationFrame(main);
