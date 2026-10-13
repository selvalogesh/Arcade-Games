import {
  handleTouchStart,
  handleTouchMove,
} from "../utilities/touchScreenHandler.js";

document.addEventListener("touchstart", handleTouchStart, false);
document.addEventListener("touchmove", handleTouchMove, false);

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};
// Turns typed faster than the snake moves are queued, so two quick turns
// (e.g. up then left while going right) can't reverse the snake into itself
const MAX_QUEUED_TURNS = 2;

let currentDirection = { x: 0, y: 0 };
const queuedDirections = [];

// Returns true if the key was accepted as a new direction
export function queueDirection(key) {
  const direction = DIRECTIONS[key];
  if (!direction || queuedDirections.length >= MAX_QUEUED_TURNS) return false;
  const previous = queuedDirections.at(-1) ?? currentDirection;
  const sameAxis =
    (direction.x !== 0 && previous.x !== 0) ||
    (direction.y !== 0 && previous.y !== 0);
  if (sameAxis) return false;
  queuedDirections.push(direction);
  return true;
}

// Called once per snake move
export function getInputDirection() {
  if (queuedDirections.length > 0) currentDirection = queuedDirections.shift();
  return currentDirection;
}

export function resetInput() {
  currentDirection = { x: 0, y: 0 };
  queuedDirections.length = 0;
}
