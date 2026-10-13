import { getInputDirection } from "./input.js";

const START_POSITION = { x: 11, y: 11 };
let snakeBody = [];
let newSegments = 0;

export function resetSnake() {
    snakeBody = [{ ...START_POSITION }];
    newSegments = 0;
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

export function getSnakeHead() {
    return snakeBody[0];
}

export function snakeIntersection() {
    return onSnake(snakeBody[0], { ignoreHead: true });
}

export function update() {
    const inputDirection = getInputDirection();
    const head = snakeBody[0];
    snakeBody.unshift({ x: head.x + inputDirection.x, y: head.y + inputDirection.y });
    // The tail stays put while the snake still has segments to grow
    if (newSegments > 0) {
        newSegments -= 1;
    } else {
        snakeBody.pop();
    }
}

export function draw(gameBoard) {
    snakeBody.forEach((segment, index) => {
        const snakeElement = document.createElement("div");
        snakeElement.style.gridRowStart = segment.y;
        snakeElement.style.gridColumnStart = segment.x;
        snakeElement.classList.add("snake");
        if (index === 0) snakeElement.classList.add("head");
        gameBoard.appendChild(snakeElement);
    });
}
