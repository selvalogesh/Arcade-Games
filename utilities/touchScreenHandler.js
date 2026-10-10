let xDown = null;
let yDown = null;

// Minimum finger travel in px before a touch counts as a swipe
const SWIPE_THRESHOLD = 10;

function getTouches(evt) {
  return (
    evt.touches || // browser API
    evt.originalEvent.touches // jQuery
  );
}

export function handleTouchStart(evt) {
  const firstTouch = getTouches(evt)[0];
  xDown = firstTouch.clientX;
  yDown = firstTouch.clientY;
}

export function handleTouchMove(evt) {
  if (xDown === null || yDown === null) {
    return;
  }

  const xUp = evt.touches[0].clientX;
  const yUp = evt.touches[0].clientY;

  const xDiff = xDown - xUp;
  const yDiff = yDown - yUp;

  if (Math.max(Math.abs(xDiff), Math.abs(yDiff)) < SWIPE_THRESHOLD) {
    return;
  }

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    /*most significant*/
    if (xDiff > 0) {
      /* right swipe */
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowLeft",
        })
      );
    } else {
      /* left swipe */
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowRight",
        })
      );
    }
  } else {
    if (yDiff > 0) {
      /* down swipe */
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowUp",
        })
      );
    } else {
      /* up swipe */
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "ArrowDown",
        })
      );
    }
  }
  /* reset values */
  xDown = null;
  yDown = null;
}
