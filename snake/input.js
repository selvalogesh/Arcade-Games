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

// The snake starts facing up, with its body below the head
const START_DIRECTION = DIRECTIONS.ArrowUp;

let currentDirection = START_DIRECTION;
const queuedDirections = [];

// Returns true if the key is a direction the snake can go (straight on or a turn),
// false for unknown keys and for reversing into itself
export function queueDirection(key) {
  const direction = DIRECTIONS[key];
  if (!direction) return false;
  const previous = queuedDirections.at(-1) ?? currentDirection;
  if (direction.x === -previous.x && direction.y === -previous.y) return false;
  if (direction === previous) return true;
  if (queuedDirections.length >= MAX_QUEUED_TURNS) return false;
  queuedDirections.push(direction);
  return true;
}

// Called once per snake move
export function getInputDirection() {
  if (queuedDirections.length > 0) currentDirection = queuedDirections.shift();
  return currentDirection;
}

export function resetInput() {
  currentDirection = START_DIRECTION;
  queuedDirections.length = 0;
}
