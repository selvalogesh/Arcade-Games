import { getInputDirection } from "./input.js";
import { wrapPosition } from "./grid.js";

// Head first: the snake starts 3 long, facing up with its body below the head
const START_BODY = [{ x: 11, y: 11 }, { x: 11, y: 12 }, { x: 11, y: 13 }];
let snakeBody = [];
let newSegments = 0;
// Which way the head faces (its eyes point this way)
let headDirection = "up";
// Cells the tail just left keep a glow that fades out over TRAIL_MS
const TRAIL_MS = 1000;
let trail = [];

export function resetSnake() {
    snakeBody = START_BODY.map((segment) => ({ ...segment }));
    newSegments = 0;
    headDirection = "up";
    trail = [];
}

export function expandSnake(amount) {
    newSegments += amount;
}

export function onSnake(position, { ignoreHead = false } = {}) {
    return snakeBody.some((segment, index) => {
        if (ignoreHead && index === 0) return false;
        return position.x === segment.x && position.y === segment.y;
    });
}

export function snakeIntersection() {
    return onSnake(snakeBody[0], { ignoreHead: true });
}

export function update() {
    const inputDirection = getInputDirection();
    const head = snakeBody[0];
    snakeBody.unshift(wrapPosition({ x: head.x + inputDirection.x, y: head.y + inputDirection.y }));
    headDirection = directionName(inputDirection) ?? headDirection;
    // The tail stays put while the snake still has segments to grow
    if (newSegments > 0) {
        newSegments -= 1;
    } else {
        trail.push({ ...snakeBody.pop(), time: performance.now() });
    }
}

export function draw(gameBoard) {
    drawTrail(gameBoard);
    snakeBody.forEach((segment, index) => {
        const snakeElement = document.createElement("div");
        snakeElement.style.gridRowStart = segment.y;
        snakeElement.style.gridColumnStart = segment.x;
        snakeElement.classList.add("snake");
        if (index === 0) {
            snakeElement.classList.add("head");
            snakeElement.dataset.direction = headDirection;
        }
        gameBoard.appendChild(snakeElement);
    });
}

// The board is redrawn every move, so each glow's fade animation is started
// part-way through (negative delay) to keep fading smoothly from where it was
function drawTrail(gameBoard) {
    const now = performance.now();
    trail = trail.filter((cell) => now - cell.time < TRAIL_MS);
    trail.forEach((cell) => {
        const trailElement = document.createElement("div");
        trailElement.style.gridRowStart = cell.y;
        trailElement.style.gridColumnStart = cell.x;
        trailElement.style.animationDuration = `${TRAIL_MS}ms`;
        trailElement.style.animationDelay = `${cell.time - now}ms`;
        trailElement.classList.add("trail");
        gameBoard.appendChild(trailElement);
    });
}

function directionName({ x, y }) {
    if (x === 1) return "right";
    if (x === -1) return "left";
    if (y === 1) return "down";
    if (y === -1) return "up";
    return null;
}
