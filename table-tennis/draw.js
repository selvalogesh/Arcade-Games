import {
  WIDTH,
  HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PLAYER_Y,
  CPU_Y,
  BALL_RADIUS,
} from "./table.js";

const LINE = "rgba(255, 255, 255, 0.15)";
const PLAYER = "hsl(200, 100%, 50%)";
const CPU = "hsl(0, 75%, 60%)";
const BALL = "hsl(50, 100%, 50%)";
const BALL_TRAIL = "50, 100%, 50%";
// Glow size in table units (canvas shadows ignore the scale transform, so it's scaled by hand)
const GLOW = 6;
// How long each ghost ball in the trail lingers, in milliseconds
const TRAIL_MS = 350;
// A new ghost is left each time the ball has moved this far, so they sit apart
const GHOST_SPACING = BALL_RADIUS * 2.6;

// Ghost balls behind the ball, oldest first
let trail = [];

// Draws the table, both paddles and the ball. `scale` is canvas pixels per table unit.
export function drawTable(ctx, match, scale, time) {
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawLines(ctx);
  drawBallTrail(ctx, match, time, scale);
  drawPaddle(ctx, match.cpu.x, CPU_Y, CPU, scale);
  drawPaddle(ctx, match.player.x, PLAYER_Y, PLAYER, scale);
  drawBall(ctx, match.ball, scale);
}

function drawLines(ctx) {
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 1.5;
  // Centre line along the table
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
  // Dashed net across the middle
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT / 2);
  ctx.lineTo(WIDTH, HEIGHT / 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddle(ctx, x, y, color, scale) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = GLOW * scale;
  // A pill shape: round ends joined by straight sides (no roundRect, which older WebViews lack)
  const radius = PADDLE_HEIGHT / 2;
  const left = x - PADDLE_WIDTH / 2 + radius;
  const right = x + PADDLE_WIDTH / 2 - radius;
  ctx.beginPath();
  ctx.arc(left, y, radius, Math.PI / 2, (Math.PI * 3) / 2);
  ctx.arc(right, y, radius, (Math.PI * 3) / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Ghost balls left along the ball's path, fading out like the snake's trail
function drawBallTrail(ctx, match, time, scale) {
  // While waiting to serve, the ball has just jumped back to the middle: no ghosts
  if (match.serveTimer > 0) {
    trail = [];
    return;
  }
  const { ball } = match;
  const last = trail[trail.length - 1];
  if (!last || Math.hypot(ball.x - last.x, ball.y - last.y) >= GHOST_SPACING) {
    trail.push({ x: ball.x, y: ball.y, time });
  }
  trail = trail.filter((ghost) => time - ghost.time < TRAIL_MS);
  ctx.save();
  ctx.shadowColor = BALL;
  ctx.shadowBlur = (GLOW / 2) * scale;
  trail.forEach((ghost) => {
    const fade = 1 - (time - ghost.time) / TRAIL_MS;
    ctx.fillStyle = `hsla(${BALL_TRAIL}, ${0.45 * fade})`;
    ctx.beginPath();
    ctx.arc(ghost.x, ghost.y, BALL_RADIUS * (0.6 + 0.4 * fade), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawBall(ctx, ball, scale) {
  ctx.save();
  ctx.fillStyle = BALL;
  ctx.shadowColor = BALL;
  ctx.shadowBlur = GLOW * scale;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
