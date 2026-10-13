import { onSnake, expandSnake } from "./snake.js";
import { randomGridPosition } from "./grid.js";

const getRandomFoodPosition = () => {
    let newFoodPosition = null;
    while (newFoodPosition === null || onSnake(newFoodPosition)) {
        newFoodPosition = randomGridPosition();
    }
    return newFoodPosition;
};

let food = null;
const EXPANSION_RATE = 1;

export function resetFood() {
    food = getRandomFoodPosition();
}

// Returns true if the snake ate the food this move
export function update() {
    if (!onSnake(food)) return false;
    expandSnake(EXPANSION_RATE);
    food = getRandomFoodPosition();
    return true;
}

export function draw(gameBoard) {
    const foodElement = document.createElement("div");
    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;
    foodElement.classList.add("food");
    gameBoard.appendChild(foodElement);
}
