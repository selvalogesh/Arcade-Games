const GRID_SIZE = 4;
const CELL_SIZE = 20;
const CELL_GAP = 2;

class Cell {
    #tile
    #mergeTile

    constructor(cellElement, x, y) {
        this.cellElement = cellElement;
        this.x = x;
        this.y = y;
        this.#tile = null;
        this.#mergeTile = null;
    }

    get tile() {
        return this.#tile;
    }

    set tile(tileObj) {
        this.#tile = tileObj;
        if(!tileObj) return;
        this.#tile.x = this.x;
        this.#tile.y = this.y;
    }

    get mergeTile() {
        return this.#mergeTile;
    }

    set mergeTile(tileObj) {
        this.#mergeTile = tileObj;
        if(!tileObj) return;
        this.#mergeTile.x = this.x;
        this.#mergeTile.y = this.y;
    }

    canAccept(tileObj) {
        return (
            this.tile === null ||
            (this.mergeTile === null && this.tile.value === tileObj.value)
        )
    }

    removeMergeTile() {
        if(this.tile === null || this.mergeTile === null) return;
        this.tile.value += this.mergeTile.value;
        this.mergeTile.removeElement();
        this.mergeTile = null;
    }
}

export default class Grid {
    #cells

    /* Private functions */
    #createCellElements(gridElement) {
        const cells = [];
        for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
            const cell = document.createElement('div');
            cell.classList.add("cell");
            cells.push(cell);
            gridElement.append(cell);
        }
        return cells;
    }

    get #emptyCells() {
        return this.#cells.filter(cell => cell.tile === null);
    }

    /* Public functions */
    constructor(gridElement) {
        gridElement.style.setProperty("--grid-size", GRID_SIZE);
        gridElement.style.setProperty("--cell-size", `${CELL_SIZE}vmin`);
        gridElement.style.setProperty("--cell-gap", `${CELL_GAP}vmin`);
        this.#cells = this.#createCellElements(gridElement).map((cellElement, index) => {
            return new Cell(cellElement, index%GRID_SIZE, Math.floor(index/GRID_SIZE) );
        });
    }

    randomEmptyCell() {
        const randomIndex = Math.floor(Math.random() * this.#emptyCells.length);
        return this.#emptyCells[randomIndex];
    }

    mergeTiles() {
        this.#cells.forEach(cell => cell.removeMergeTile());
    }

    maxScore() {
        return Math.max(...this.#cells.map(cell => cell.tile ? cell.tile.value : 0));
    }

    get cellsByColumn() {
        return this.#cells.reduce((cellGrid, cell) => {
            cellGrid[cell.x] = cellGrid[cell.x] || [];
            cellGrid[cell.x][cell.y] = cell;
            return cellGrid;
        }, []);
    }

    get cellsByRow() {
        return this.#cells.reduce((cellGrid, cell) => {
            cellGrid[cell.y] = cellGrid[cell.y] || [];
            cellGrid[cell.y][cell.x] = cell;
            return cellGrid;
        }, []);
    }
}