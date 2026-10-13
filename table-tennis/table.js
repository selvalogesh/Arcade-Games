// Table tennis rules and physics, independent of the page so matches can be simulated.
// The table is WIDTH x HEIGHT units: the computer plays at the top, the player at the bottom.

export const WIDTH = 300;
export const HEIGHT = 400;
export const PADDLE_WIDTH = 64;
export const PADDLE_HEIGHT = 8;
// Distance from the table's end to the centre of each paddle
const PADDLE_INSET = 20;
export const PLAYER_Y = HEIGHT - PADDLE_INSET;
export const CPU_Y = PADDLE_INSET;
export const BALL_RADIUS = 6;
export const WINNING_SCORE = 7;

// Ball speed in units per second: every paddle hit makes it a bit faster
const SERVE_SPEED = 230;
const SPEED_UP = 1.07;
const MAX_SPEED = 560;
// Hitting the ball off-centre sends it at up to this angle from straight ahead
const MAX_BOUNCE_ANGLE = (60 * Math.PI) / 180;
const MAX_SERVE_ANGLE = (25 * Math.PI) / 180;
const SERVE_DELAY = 1;

// speed: how fast the computer paddle moves (units/second)
// reaction: seconds before it starts moving after the ball is sent its way
// error: how far it may misjudge where the ball lands, re-rolled every shot;
//   it grows with the ball's speed, so fast rallies end in misses
// predict: whether it works out side bounces, or just follows the ball
export const LEVELS = {
  easy: { speed: 170, reaction: 0.25, error: 24, predict: false },
  medium: { speed: 190, reaction: 0.24, error: 24, predict: true },
  hard: { speed: 250, reaction: 0.15, error: 16, predict: true },
};

export function createMatch(level) {
  const match = {
    level,
    score: { player: 0, cpu: 0 },
    player: { x: WIDTH / 2 },
    cpu: { x: WIDTH / 2, error: 0, reactTimer: 0 },
    ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0, speed: 0 },
    serveTimer: 0,
  };
  serve(match, "player");
  return match;
}

export function isOver(match) {
  return match.score.player >= WINNING_SCORE || match.score.cpu >= WINNING_SCORE;
}

export function movePlayer(match, x) {
  match.player.x = clampPaddle(x);
}

// Advances the match by dt seconds. Returns "hit", "player-point", "cpu-point" or null.
export function step(match, dt) {
  moveCpu(match, dt);
  const { ball } = match;
  if (match.serveTimer > 0) {
    match.serveTimer -= dt;
    if (match.serveTimer <= 0) launch(match);
    return null;
  }

  const previous = { x: ball.x, y: ball.y };
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  bounceOffSides(ball);

  if (ball.vy > 0 && hitsPaddle(previous, ball, match.player.x, PLAYER_Y, -1)) {
    returnBall(match, match.player.x, -1);
    aimCpu(match);
    return "hit";
  }
  if (ball.vy < 0 && hitsPaddle(previous, ball, match.cpu.x, CPU_Y, 1)) {
    returnBall(match, match.cpu.x, 1);
    return "hit";
  }

  if (ball.y - BALL_RADIUS > HEIGHT) {
    match.score.cpu += 1;
    serve(match, "player");
    return "cpu-point";
  }
  if (ball.y + BALL_RADIUS < 0) {
    match.score.player += 1;
    serve(match, "cpu");
    return "player-point";
  }
  return null;
}

// Puts the ball in the middle; after a short pause it goes toward whoever lost the point
function serve(match, toward) {
  Object.assign(match.ball, { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0, speed: SERVE_SPEED });
  match.serveToward = toward;
  match.serveTimer = SERVE_DELAY;
}

function launch(match) {
  const { ball } = match;
  const angle = (Math.random() * 2 - 1) * MAX_SERVE_ANGLE;
  const direction = match.serveToward === "player" ? 1 : -1;
  ball.vx = ball.speed * Math.sin(angle);
  ball.vy = ball.speed * Math.cos(angle) * direction;
  if (direction < 0) aimCpu(match);
}

// The ball is now heading for the computer: it hesitates, then misjudges by a random amount
function aimCpu(match) {
  const level = LEVELS[match.level];
  match.cpu.reactTimer = level.reaction;
  match.cpu.error = (Math.random() * 2 - 1) * level.error * (match.ball.speed / SERVE_SPEED);
}

function bounceOffSides(ball) {
  if (ball.x - BALL_RADIUS < 0) {
    ball.x = BALL_RADIUS;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + BALL_RADIUS > WIDTH) {
    ball.x = WIDTH - BALL_RADIUS;
    ball.vx = -Math.abs(ball.vx);
  }
}

// Whether the ball hit the paddle at (paddleX, paddleY), whose front faces `facing` (-1 = up, 1 = down).
// Usually it meets the front; a ball that got past the end of the paddle and came back
// off the side wall can also touch the paddle's end, so that counts too.
function hitsPaddle(previous, ball, paddleX, paddleY, facing) {
  const edge = paddleY + facing * (PADDLE_HEIGHT / 2 + BALL_RADIUS);
  if (crossesPaddle(previous, ball, edge, paddleX)) return true;
  if (!touchesPaddle(ball, paddleX, paddleY)) return false;
  // Put the ball back in front of the paddle so it doesn't fly out from inside it
  ball.y = facing < 0 ? Math.min(ball.y, edge) : Math.max(ball.y, edge);
  return true;
}

// Whether the ball overlaps the paddle's rectangle
function touchesPaddle(ball, paddleX, paddleY) {
  const dx = Math.max(Math.abs(ball.x - paddleX) - PADDLE_WIDTH / 2, 0);
  const dy = Math.max(Math.abs(ball.y - paddleY) - PADDLE_HEIGHT / 2, 0);
  return dx * dx + dy * dy <= BALL_RADIUS * BALL_RADIUS;
}

// Whether the ball crossed the paddle's front edge (at y = edge) this step within the paddle's width.
// Checked along the ball's path so a fast ball can't skip through the paddle between frames.
function crossesPaddle(previous, ball, edge, paddleX) {
  const before = previous.y - edge;
  const after = ball.y - edge;
  if (Math.sign(before) === Math.sign(after) && after !== 0) return false;
  const t = before / (before - after);
  const crossingX = previous.x + (ball.x - previous.x) * t;
  if (Math.abs(crossingX - paddleX) > PADDLE_WIDTH / 2 + BALL_RADIUS) return false;
  ball.x = crossingX;
  ball.y = edge;
  return true;
}

// Sends the ball back (direction -1 = up, 1 = down), angled by where it hit the paddle
function returnBall(match, paddleX, direction) {
  const { ball } = match;
  const offset = Math.max(-1, Math.min(1, (ball.x - paddleX) / (PADDLE_WIDTH / 2)));
  const angle = offset * MAX_BOUNCE_ANGLE;
  ball.speed = Math.min(MAX_SPEED, ball.speed * SPEED_UP);
  ball.vx = ball.speed * Math.sin(angle);
  ball.vy = ball.speed * Math.cos(angle) * direction;
}

function moveCpu(match, dt) {
  const level = LEVELS[match.level];
  const { ball, cpu } = match;
  let target = WIDTH / 2;
  if (ball.vy < 0) {
    if (cpu.reactTimer > 0) {
      cpu.reactTimer -= dt;
      return;
    }
    target = (level.predict ? predictLandingX(ball, CPU_Y) : ball.x) + cpu.error;
  }
  const maxMove = level.speed * dt;
  cpu.x = clampPaddle(cpu.x + Math.max(-maxMove, Math.min(maxMove, target - cpu.x)));
}

// Where the ball will be when it reaches height y, following its bounces off the sides
function predictLandingX(ball, y) {
  const time = (y - ball.y) / ball.vy;
  const span = WIDTH - 2 * BALL_RADIUS;
  // Unfold the bounces: the ball moves freely on a line of length 2 * span, then fold back
  let x = (ball.x - BALL_RADIUS + ball.vx * time) % (2 * span);
  if (x < 0) x += 2 * span;
  return BALL_RADIUS + (x > span ? 2 * span - x : x);
}

function clampPaddle(x) {
  return Math.max(PADDLE_WIDTH / 2, Math.min(WIDTH - PADDLE_WIDTH / 2, x));
}
