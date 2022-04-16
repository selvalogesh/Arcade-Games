import { pauseGameToggle, getGameState } from "./main.js";

let inputDirection = { x: 0, y: 0, move: false };
let previousDirection = null;

window.addEventListener("keydown", (e) => {
    const isGamePaused = getGameState();
    switch (e.key) {
        case "ArrowUp":
            if (previousDirection === "ArrowDown" || isGamePaused) return;
            inputDirection = { x: 0, y: -1, move: true };
            previousDirection = e.key;
            break;
        case "ArrowDown":
            if (previousDirection === "ArrowUp" || isGamePaused) return;
            inputDirection = { x: 0, y: 1, move: true };
            previousDirection = e.key;
            break;
        case "ArrowRight":
            if (previousDirection === "ArrowLeft" || isGamePaused) return;
            inputDirection = { x: 1, y: 0, move: true };
            previousDirection = e.key;
            break;
        case "ArrowLeft":
            if (previousDirection === "ArrowRight" || isGamePaused) return;
            inputDirection = { x: -1, y: 0, move: true };
            previousDirection = e.key;
            break;
        case " ":
            pauseGameToggle();
            break;
    }
});

export function getInputDirection() {
    return inputDirection;
}
