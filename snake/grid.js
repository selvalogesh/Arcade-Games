const GRID_SIZE = 21;

export function randomGridPosition() {
    return {
        x: Math.floor(Math.random() * GRID_SIZE) + 1,
        y: Math.floor(Math.random() * GRID_SIZE) + 1,
    };
}

// Leaving one edge of the board brings you back in on the opposite edge
export function wrapPosition(position) {
    const wrap = (value) => ((value - 1 + GRID_SIZE) % GRID_SIZE) + 1;
    return { x: wrap(position.x), y: wrap(position.y) };
}
