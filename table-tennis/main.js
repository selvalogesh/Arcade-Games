let canva;
let canvaContent;
let ballR = 10;
let ballX = 50;
let ballY = 50;
let ballSpeedX = 10;
let ballSpeedY = 4;
let framesPerSecond = 30;

const WINNING_SCORE = 3;
let showEndScreen = false;
let Player1Score = 0;
let Player2Score = 0;

let padddle1Y = 250;
let padddle2Y = 250;

const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;

let frames = 0;

function calculateMousePos(evt) {
  let rect = canva.getBoundingClientRect();
  let root = document.documentElement;
  let mouseX = evt.clientX - rect.left - root.scrollLeft;
  let mouseY = evt.clientY - rect.top - root.scrollTop;
  return {
    X: mouseX,
    Y: mouseY,
  };
}

window.onload = () => {
  canva = document.getElementById("canva");
  canvaContent = canva.getContext("2d");
  let start = () => {
    frames = setInterval(() => {
      moveEverything();
      drawEverything();
    }, 1000 / framesPerSecond);
  };

  canva.addEventListener("mousemove", (evt) => {
    let mousePos = calculateMousePos(evt);
    padddle2Y = mousePos.Y - PADDLE_HEIGHT / 2;
  });
  window.addEventListener("keyup", (evt) => {
    if (evt.key == " " || evt.code == "Space") {
      if (frames) {
        clearInterval(frames);
        frames = 0;
      } else {
        start();
      }
    } else if (evt.key == "\n" || evt.code == "Enter") {
      if (!frames) {
        showEndScreen = false;
        Player1Score = 0;
        Player2Score = 0;
        start();
      }
    }
  });
  start();
};

function ballRest() {
  if (Player1Score >= WINNING_SCORE || Player2Score >= WINNING_SCORE) {
    showEndScreen = true;
    clearInterval(frames);
    frames = 0;
  }
  ballX = canva.width / 2;
  ballY = canva.height / 2;
}

function computerMovement() {
  let padddle1YCenter = padddle1Y + PADDLE_HEIGHT / 2;
  if (padddle1YCenter < ballY - 35) {
    padddle1Y += 6;
  } else if (padddle1YCenter > ballY + 35) {
    padddle1Y -= 6;
  }
}

function moveEverything() {
  computerMovement();
  ballX += ballSpeedX;
  ballY += ballSpeedY;
  if (
    (ballX - ballR - PADDLE_WIDTH < 0 &&
      ballY > padddle1Y &&
      ballY < padddle1Y + PADDLE_HEIGHT) ||
    (ballX + ballR + PADDLE_WIDTH > canva.width &&
      ballY > padddle2Y &&
      ballY < padddle2Y + PADDLE_HEIGHT)
  ) {
    let ballPaddleY;
    if (ballX < canva.width / 2) {
      ballPaddleY = padddle1Y;
    } else {
      ballPaddleY = padddle2Y;
    }
    let deltaY = ballY - (ballPaddleY + PADDLE_HEIGHT / 2);
    ballSpeedY = deltaY * 0.35;
    ballSpeedX *= -1;
  } else if (ballX + ballR < 0 || ballX - ballR > canva.width) {
    if (ballX + ballR < 0) {
      Player2Score += 1;
    } else {
      Player1Score += 1;
    }
    ballRest();
    ballSpeedX *= -1;
  }
  if (ballY - ballR < 0 || ballY + ballR > canva.height) {
    ballSpeedY *= -1;
  }
}

function drawNet() {
  for (let i = 0; i < canva.height; i += 40) {
    colorRect(canva.width / 2 - 1, i, 2, 20, "white");
  }
}

function drawEverything() {
  colorRect(0, 0, canva.width, canva.height, "black");
  if (showEndScreen) {
    canvaContent.fillStyle = "white";
    let wonPlayer;
    if (Player1Score >= WINNING_SCORE) {
      wonPlayer = "Left";
    } else if (Player2Score >= WINNING_SCORE) {
      wonPlayer = "Right";
    }
    canvaContent.fillText(`${wonPlayer} Player Won!`, 350, 200);
    canvaContent.fillText("Press Enter to continue", 350, 500);
    return;
  }

  drawNet();

  colorRect(0, padddle1Y, PADDLE_WIDTH, 100, "white");
  colorRect(canva.width - PADDLE_WIDTH, padddle2Y, PADDLE_WIDTH, 100, "white");
  colorCircle(ballX, ballY, ballR, "white");

  let text = `Player 1 Score: ${Player1Score}`;
  canvaContent.fillText(
    text,
    canva.width / 2 - canva.width / 4 - text.length,
    100
  );
  canvaContent.fillText(
    `Player 2 Score: ${Player2Score}`,
    canva.width / 2 + canva.width / 4,
    100
  );
}

function colorCircle(centerX, centerY, radius, drawColor) {
  canvaContent.fillStyle = drawColor;
  canvaContent.beginPath();
  canvaContent.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
  canvaContent.fill();
}

function colorRect(leftX, topY, width, height, drawColor) {
  canvaContent.fillStyle = drawColor;
  canvaContent.fillRect(leftX, topY, width, height);
}
