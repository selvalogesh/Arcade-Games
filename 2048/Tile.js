export default class Tile {
    #tileElement
    #x
    #y
    #value

    constructor(gameBoard, value = Math.random() > 0.5 ? 2 : 4) {
        this.#tileElement = document.createElement("div");
        this.#tileElement.classList.add("tile");
        gameBoard.append(this.#tileElement);
        this.value = value;
    }

    get value() {
        return this.#value;
    }

    set value(v) {
        this.#value = v;
        this.#tileElement.textContent = v;
        const backgroundLightness = 100 - Math.log2(v) * 9;
        this.#tileElement.style.setProperty(
            "--background-lightness",
            `${backgroundLightness}%`
        );
        this.#tileElement.style.setProperty(
            "--text-lightness",
            `${backgroundLightness <= 50 ? 90 : 10}%`
        );
    }

    get x() {
        return this.#x;
    }

    set x(xValue) {
        this.#x = xValue;
        this.#tileElement.style.setProperty("--x", xValue);
    }

    get y(){
        return this.#y;
    }

    set y(yValue) {
        this.#y = yValue;
        this.#tileElement.style.setProperty("--y", yValue);
    }

    removeElement() {
        this.#tileElement.remove();
    }

    waitForTransition(animation = false) {
        return new Promise(resolve => {
            this.#tileElement.addEventListener(
                animation ? "animationend" : "transitionend",
                resolve,
                { once: true },
            );
        });
    }
}