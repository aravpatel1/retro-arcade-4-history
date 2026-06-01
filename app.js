const canvas = document.querySelector("#screen");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const keys = new Set();

const games = [
  {
    id: "pong",
    title: "Pong",
    blurb: "A paddle-and-ball game inspired by Atari's 1972 arcade hit.",
    controls: "W/S or Up/Down move your paddle. First to 7 wins.",
    create: () => new PongGame()
  },
  {
    id: "space",
    title: "Space Invaders",
    blurb: "Defend Earth from rows of descending alien invaders.",
    controls: "Left/Right move. Space shoots. Clear the formation.",
    create: () => new SpaceInvadersGame()
  },
  {
    id: "asteroids",
    title: "Asteroids",
    blurb: "Pilot a ship through a field of drifting rocks and split them apart.",
    controls: "Left/Right turn. Up thrusts. Space shoots.",
    create: () => new AsteroidsGame()
  },
  {
    id: "galaxian",
    title: "Galaxian",
    blurb: "A space shooter inspired by late-1970s diving enemy formations.",
    controls: "Left/Right move. Space shoots. Watch for diving enemies.",
    create: () => new GalaxianGame()
  },
  {
    id: "breakout",
    title: "Breakout",
    blurb: "Break the wall one brick at a time with a paddle and bouncing ball.",
    controls: "Left/Right move. Space launches the ball.",
    create: () => new BreakoutGame()
  }
];

let selectedIndex = 0;
let selected = games[0];
let currentGame = null;
let lastTime = performance.now();
let gameBanner = "";
let gameBannerTimer = 0;

function isDown(...names) {
  return names.some((name) => keys.has(name));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function circleRectHit(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function rectHit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawText(text, x, y, size = 24, color = "#f5b642", align = "left") {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px Georgia, serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function clearScreen() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255, 240, 194, 0.04)";
  for (let y = 0; y < H; y += 8) {
    ctx.fillRect(0, y, W, 2);
  }
}

function setHud(label, value) {
  drawText(`${label}: ${value}`, W - 24, 34, 22, "#fff0c2", "right");
}

function selectGame(index) {
  selectedIndex = ((index % games.length) + games.length) % games.length;
  const game = games[selectedIndex];
  selected = game;
  currentGame = selected.create();
  gameBanner = selected.title;
  gameBannerTimer = 1.35;
  keys.clear();
  canvas.focus();
}

function restartGame() {
  currentGame = selected.create();
  gameBanner = selected.title;
  gameBannerTimer = 0.9;
  keys.clear();
  canvas.focus();
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyL"].includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === "KeyL") {
    if (!event.repeat) {
      selectGame(selectedIndex + 1);
    }
    return;
  }

  if (event.code === "KeyR" && !event.repeat) {
    restartGame();
    return;
  }

  keys.add(event.code);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

class PongGame {
  constructor() {
    this.left = { x: 34, y: H / 2 - 55, w: 16, h: 110 };
    this.right = { x: W - 50, y: H / 2 - 55, w: 16, h: 110 };
    this.ball = { x: W / 2, y: H / 2, r: 10, vx: 330, vy: 170 };
    this.player = 0;
    this.cpu = 0;
    this.message = "Keep the ball away from your side";
  }

  resetBall(direction) {
    this.ball.x = W / 2;
    this.ball.y = H / 2;
    this.ball.vx = direction * 330;
    this.ball.vy = (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 90);
  }

  update(dt) {
    const speed = 470;
    if (isDown("KeyW", "ArrowUp")) this.left.y -= speed * dt;
    if (isDown("KeyS", "ArrowDown")) this.left.y += speed * dt;
    this.left.y = clamp(this.left.y, 12, H - this.left.h - 12);

    const target = this.ball.y - this.right.h / 2;
    this.right.y += clamp(target - this.right.y, -320 * dt, 320 * dt);
    this.right.y = clamp(this.right.y, 12, H - this.right.h - 12);

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    if (this.ball.y < this.ball.r || this.ball.y > H - this.ball.r) {
      this.ball.vy *= -1;
      this.ball.y = clamp(this.ball.y, this.ball.r, H - this.ball.r);
    }

    [this.left, this.right].forEach((paddle) => {
      if (circleRectHit(this.ball, paddle)) {
        const hit = (this.ball.y - (paddle.y + paddle.h / 2)) / (paddle.h / 2);
        this.ball.vx = Math.sign(this.ball.vx) * -1 * Math.min(620, Math.abs(this.ball.vx) + 28);
        this.ball.vy = hit * 310;
        this.ball.x += Math.sign(this.ball.vx) * 12;
      }
    });

    if (this.ball.x < -30) {
      this.cpu++;
      this.resetBall(1);
    }
    if (this.ball.x > W + 30) {
      this.player++;
      this.resetBall(-1);
    }

    if (this.player >= 7 || this.cpu >= 7) {
      this.message = this.player > this.cpu ? "You win. Press R to play again." : "CPU wins. Press R to retry.";
      this.ball.vx = 0;
      this.ball.vy = 0;
    }
  }

  draw() {
    clearScreen();
    ctx.strokeStyle = "rgba(255, 240, 194, 0.3)";
    ctx.setLineDash([12, 14]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#f5b642";
    ctx.fillRect(this.left.x, this.left.y, this.left.w, this.left.h);
    ctx.fillStyle = "#96bd52";
    ctx.fillRect(this.right.x, this.right.y, this.right.w, this.right.h);

    ctx.fillStyle = "#fff0c2";
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.fill();

    drawText(`${this.player}   ${this.cpu}`, W / 2, 58, 42, "#fff0c2", "center");
    drawText(this.message, W / 2, H - 28, 20, "#f5b642", "center");
    setHud("Player / CPU", `${this.player} / ${this.cpu}`);
  }
}

class SpaceInvadersGame {
  constructor() {
    this.player = { x: W / 2 - 20, y: H - 54, w: 40, h: 24 };
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.dir = 1;
    this.dropTimer = 0;
    this.shotCooldown = 0;
    this.enemyShotTimer = 1.1;
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        this.enemies.push({ x: 170 + col * 56, y: 70 + row * 42, w: 32, h: 24, alive: true });
      }
    }
  }

  shoot() {
    if (this.shotCooldown <= 0 && !this.gameOver) {
      this.bullets.push({ x: this.player.x + this.player.w / 2 - 3, y: this.player.y - 12, w: 6, h: 14, vy: -520 });
      this.shotCooldown = 0.28;
    }
  }

  update(dt) {
    if (this.gameOver) return;

    if (isDown("KeyA", "ArrowLeft")) this.player.x -= 420 * dt;
    if (isDown("KeyD", "ArrowRight")) this.player.x += 420 * dt;
    this.player.x = clamp(this.player.x, 18, W - this.player.w - 18);
    if (isDown("Space")) this.shoot();

    this.shotCooldown -= dt;
    this.enemyShotTimer -= dt;

    let hitEdge = false;
    const liveEnemies = this.enemies.filter((enemy) => enemy.alive);
    liveEnemies.forEach((enemy) => {
      enemy.x += this.dir * 70 * dt;
      if (enemy.x < 20 || enemy.x + enemy.w > W - 20) hitEdge = true;
    });

    if (hitEdge) {
      this.dir *= -1;
      liveEnemies.forEach((enemy) => {
        enemy.y += 18;
      });
    }

    if (this.enemyShotTimer <= 0 && liveEnemies.length > 0) {
      const shooter = liveEnemies[Math.floor(Math.random() * liveEnemies.length)];
      this.enemyBullets.push({ x: shooter.x + shooter.w / 2 - 3, y: shooter.y + shooter.h, w: 6, h: 14, vy: 260 });
      this.enemyShotTimer = 0.7 + Math.random() * 0.9;
    }

    this.bullets.forEach((bullet) => {
      bullet.y += bullet.vy * dt;
    });
    this.enemyBullets.forEach((bullet) => {
      bullet.y += bullet.vy * dt;
    });

    this.bullets = this.bullets.filter((bullet) => bullet.y > -20);
    this.enemyBullets = this.enemyBullets.filter((bullet) => bullet.y < H + 20);

    this.bullets.forEach((bullet) => {
      liveEnemies.forEach((enemy) => {
        if (enemy.alive && rectHit(bullet, enemy)) {
          enemy.alive = false;
          bullet.y = -100;
          this.score += 10;
        }
      });
    });

    this.enemyBullets.forEach((bullet) => {
      if (rectHit(bullet, this.player)) {
        bullet.y = H + 100;
        this.lives--;
        if (this.lives <= 0) this.gameOver = true;
      }
    });

    if (liveEnemies.some((enemy) => enemy.y + enemy.h >= this.player.y)) {
      this.gameOver = true;
    }

    if (this.enemies.every((enemy) => !enemy.alive)) {
      this.gameOver = true;
    }
  }

  draw() {
    clearScreen();
    drawStars();

    ctx.fillStyle = "#96bd52";
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.fillRect(this.player.x + 15, this.player.y - 10, 10, 10);

    ctx.fillStyle = "#fff0c2";
    this.bullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h));

    ctx.fillStyle = "#e45b2d";
    this.enemyBullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h));

    this.enemies.forEach((enemy, index) => {
      if (!enemy.alive) return;
      ctx.fillStyle = index % 2 === 0 ? "#f5b642" : "#1e7972";
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
      ctx.fillRect(enemy.x - 5, enemy.y + 8, 5, 8);
      ctx.fillRect(enemy.x + enemy.w, enemy.y + 8, 5, 8);
    });

    const alive = this.enemies.filter((enemy) => enemy.alive).length;
    drawText(`Lives ${this.lives}`, 24, 92, 22);
    if (this.gameOver) {
      drawText(alive === 0 ? "Formation cleared. Press R." : "Game over. Press R.", W / 2, H / 2, 34, "#fff0c2", "center");
    }
    setHud("Score", this.score);
  }
}

class AsteroidsGame {
  constructor() {
    this.ship = { x: W / 2, y: H / 2, a: -Math.PI / 2, vx: 0, vy: 0, r: 14 };
    this.bullets = [];
    this.rocks = [];
    this.cooldown = 0;
    this.score = 0;
    this.lives = 3;
    this.invincible = 2;
    this.gameOver = false;

    for (let i = 0; i < 7; i++) {
      this.spawnRock(3);
    }
  }

  spawnRock(size, x = Math.random() * W, y = Math.random() * H) {
    if (Math.hypot(x - this.ship.x, y - this.ship.y) < 130) {
      x += 180;
      y += 100;
    }

    this.rocks.push({
      x: (x + W) % W,
      y: (y + H) % H,
      size,
      r: size * 16,
      vx: (Math.random() - 0.5) * 130,
      vy: (Math.random() - 0.5) * 130,
      spin: Math.random() * Math.PI,
      points: makeRockPoints(size * 16)
    });
  }

  shoot() {
    if (this.cooldown <= 0 && !this.gameOver) {
      this.bullets.push({
        x: this.ship.x + Math.cos(this.ship.a) * 18,
        y: this.ship.y + Math.sin(this.ship.a) * 18,
        vx: Math.cos(this.ship.a) * 560 + this.ship.vx,
        vy: Math.sin(this.ship.a) * 560 + this.ship.vy,
        life: 0.8
      });
      this.cooldown = 0.22;
    }
  }

  resetShip() {
    this.ship.x = W / 2;
    this.ship.y = H / 2;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.ship.a = -Math.PI / 2;
    this.invincible = 2;
  }

  update(dt) {
    if (this.gameOver) return;

    if (isDown("KeyA", "ArrowLeft")) this.ship.a -= 4.4 * dt;
    if (isDown("KeyD", "ArrowRight")) this.ship.a += 4.4 * dt;
    if (isDown("KeyW", "ArrowUp")) {
      this.ship.vx += Math.cos(this.ship.a) * 260 * dt;
      this.ship.vy += Math.sin(this.ship.a) * 260 * dt;
    }
    if (isDown("Space")) this.shoot();

    this.cooldown -= dt;
    this.invincible -= dt;
    this.ship.x = (this.ship.x + this.ship.vx * dt + W) % W;
    this.ship.y = (this.ship.y + this.ship.vy * dt + H) % H;
    this.ship.vx *= 0.992;
    this.ship.vy *= 0.992;

    this.bullets.forEach((bullet) => {
      bullet.x = (bullet.x + bullet.vx * dt + W) % W;
      bullet.y = (bullet.y + bullet.vy * dt + H) % H;
      bullet.life -= dt;
    });
    this.bullets = this.bullets.filter((bullet) => bullet.life > 0);

    this.rocks.forEach((rock) => {
      rock.x = (rock.x + rock.vx * dt + W) % W;
      rock.y = (rock.y + rock.vy * dt + H) % H;
      rock.spin += dt;
    });

    this.bullets.forEach((bullet) => {
      this.rocks.forEach((rock) => {
        if (bullet.life > 0 && Math.hypot(bullet.x - rock.x, bullet.y - rock.y) < rock.r) {
          bullet.life = 0;
          rock.hit = true;
          this.score += (4 - rock.size) * 20;
        }
      });
    });

    const destroyed = this.rocks.filter((rock) => rock.hit);
    this.rocks = this.rocks.filter((rock) => !rock.hit);
    destroyed.forEach((rock) => {
      if (rock.size > 1) {
        this.spawnRock(rock.size - 1, rock.x + 8, rock.y);
        this.spawnRock(rock.size - 1, rock.x - 8, rock.y);
      }
    });

    if (this.invincible <= 0) {
      const crash = this.rocks.some((rock) => Math.hypot(this.ship.x - rock.x, this.ship.y - rock.y) < rock.r + this.ship.r);
      if (crash) {
        this.lives--;
        if (this.lives <= 0) {
          this.gameOver = true;
        } else {
          this.resetShip();
        }
      }
    }

    if (this.rocks.length === 0) {
      for (let i = 0; i < 8; i++) this.spawnRock(3);
    }
  }

  draw() {
    clearScreen();
    drawStars();

    this.rocks.forEach((rock) => {
      ctx.save();
      ctx.translate(rock.x, rock.y);
      ctx.rotate(rock.spin);
      ctx.strokeStyle = "#f5b642";
      ctx.lineWidth = 3;
      ctx.beginPath();
      rock.points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });

    ctx.strokeStyle = this.invincible > 0 ? "#96bd52" : "#fff0c2";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.ship.x + Math.cos(this.ship.a) * 19, this.ship.y + Math.sin(this.ship.a) * 19);
    ctx.lineTo(this.ship.x + Math.cos(this.ship.a + 2.4) * 16, this.ship.y + Math.sin(this.ship.a + 2.4) * 16);
    ctx.lineTo(this.ship.x + Math.cos(this.ship.a - 2.4) * 16, this.ship.y + Math.sin(this.ship.a - 2.4) * 16);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = "#fff0c2";
    this.bullets.forEach((bullet) => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    drawText(`Lives ${this.lives}`, 24, 92, 22);
    if (this.gameOver) drawText("Ship destroyed. Press R.", W / 2, H / 2, 34, "#fff0c2", "center");
    setHud("Score", this.score);
  }
}

class GalaxianGame {
  constructor() {
    this.player = { x: W / 2 - 22, y: H - 56, w: 44, h: 26 };
    this.bullets = [];
    this.enemies = [];
    this.cooldown = 0;
    this.diveTimer = 1.5;
    this.score = 0;
    this.lives = 3;
    this.time = 0;
    this.gameOver = false;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 9; col++) {
        const homeX = 210 + col * 58;
        const homeY = 72 + row * 42;
        this.enemies.push({ x: homeX, y: homeY, homeX, homeY, w: 30, h: 24, alive: true, diving: false, t: 0 });
      }
    }
  }

  update(dt) {
    if (this.gameOver) return;
    this.time += dt;

    if (isDown("KeyA", "ArrowLeft")) this.player.x -= 450 * dt;
    if (isDown("KeyD", "ArrowRight")) this.player.x += 450 * dt;
    this.player.x = clamp(this.player.x, 20, W - this.player.w - 20);

    this.cooldown -= dt;
    if (isDown("Space") && this.cooldown <= 0) {
      this.bullets.push({ x: this.player.x + this.player.w / 2 - 3, y: this.player.y - 12, w: 6, h: 15, vy: -560 });
      this.cooldown = 0.24;
    }

    this.diveTimer -= dt;
    const formation = this.enemies.filter((enemy) => enemy.alive && !enemy.diving);
    if (this.diveTimer <= 0 && formation.length > 0) {
      const enemy = formation[Math.floor(Math.random() * formation.length)];
      enemy.diving = true;
      enemy.t = 0;
      this.diveTimer = 0.65 + Math.random() * 0.8;
    }

    this.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      if (enemy.diving) {
        enemy.t += dt;
        enemy.y += 180 * dt;
        enemy.x += Math.sin(enemy.t * 7) * 190 * dt;
        if (enemy.y > H + 30) {
          enemy.diving = false;
          enemy.x = enemy.homeX;
          enemy.y = enemy.homeY;
        }
      } else {
        enemy.x = enemy.homeX + Math.sin(this.time * 2 + enemy.homeY) * 18;
        enemy.y = enemy.homeY + Math.cos(this.time * 1.6 + enemy.homeX) * 7;
      }
    });

    this.bullets.forEach((bullet) => {
      bullet.y += bullet.vy * dt;
    });
    this.bullets = this.bullets.filter((bullet) => bullet.y > -30);

    this.bullets.forEach((bullet) => {
      this.enemies.forEach((enemy) => {
        if (enemy.alive && rectHit(bullet, enemy)) {
          enemy.alive = false;
          bullet.y = -100;
          this.score += enemy.diving ? 40 : 15;
        }
      });
    });

    this.enemies.forEach((enemy) => {
      if (enemy.alive && enemy.diving && rectHit(enemy, this.player)) {
        enemy.alive = false;
        this.lives--;
        if (this.lives <= 0) this.gameOver = true;
      }
    });

    if (this.enemies.every((enemy) => !enemy.alive)) {
      this.gameOver = true;
    }
  }

  draw() {
    clearScreen();
    drawStars();

    ctx.fillStyle = "#96bd52";
    ctx.fillRect(this.player.x, this.player.y, this.player.w, this.player.h);
    ctx.fillRect(this.player.x + 17, this.player.y - 10, 10, 10);

    ctx.fillStyle = "#fff0c2";
    this.bullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h));

    this.enemies.forEach((enemy, index) => {
      if (!enemy.alive) return;
      ctx.fillStyle = enemy.diving ? "#e45b2d" : (index % 3 === 0 ? "#f5b642" : "#1e7972");
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
      ctx.fillRect(enemy.x + 6, enemy.y - 7, 6, 7);
      ctx.fillRect(enemy.x + 18, enemy.y - 7, 6, 7);
    });

    drawText(`Lives ${this.lives}`, 24, 92, 22);
    if (this.gameOver) {
      const won = this.enemies.every((enemy) => !enemy.alive);
      drawText(won ? "Galaxian wave cleared. Press R." : "Fleet wins. Press R.", W / 2, H / 2, 32, "#fff0c2", "center");
    }
    setHud("Score", this.score);
  }
}

class BreakoutGame {
  constructor() {
    this.paddle = { x: W / 2 - 58, y: H - 48, w: 116, h: 18 };
    this.ball = { x: W / 2, y: H - 70, r: 9, vx: 260, vy: -310, stuck: true };
    this.bricks = [];
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;

    const colors = ["#f5b642", "#e45b2d", "#96bd52", "#1e7972", "#fff0c2"];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 11; col++) {
        this.bricks.push({
          x: 82 + col * 72,
          y: 64 + row * 30,
          w: 62,
          h: 20,
          color: colors[row],
          alive: true
        });
      }
    }
  }

  resetBall() {
    this.ball.x = this.paddle.x + this.paddle.w / 2;
    this.ball.y = this.paddle.y - 14;
    this.ball.vx = 240 * (Math.random() > 0.5 ? 1 : -1);
    this.ball.vy = -310;
    this.ball.stuck = true;
  }

  update(dt) {
    if (this.gameOver) return;

    if (isDown("KeyA", "ArrowLeft")) this.paddle.x -= 520 * dt;
    if (isDown("KeyD", "ArrowRight")) this.paddle.x += 520 * dt;
    this.paddle.x = clamp(this.paddle.x, 18, W - this.paddle.w - 18);

    if (this.ball.stuck) {
      this.ball.x = this.paddle.x + this.paddle.w / 2;
      this.ball.y = this.paddle.y - 14;
      if (isDown("Space")) this.ball.stuck = false;
      return;
    }

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    if (this.ball.x < this.ball.r || this.ball.x > W - this.ball.r) {
      this.ball.vx *= -1;
      this.ball.x = clamp(this.ball.x, this.ball.r, W - this.ball.r);
    }
    if (this.ball.y < this.ball.r) {
      this.ball.vy *= -1;
      this.ball.y = this.ball.r;
    }

    if (circleRectHit(this.ball, this.paddle) && this.ball.vy > 0) {
      const hit = (this.ball.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
      this.ball.vx = hit * 430;
      this.ball.vy *= -1;
      this.ball.y = this.paddle.y - this.ball.r - 1;
    }

    this.bricks.forEach((brick) => {
      if (brick.alive && circleRectHit(this.ball, brick)) {
        brick.alive = false;
        this.ball.vy *= -1;
        this.score += 5;
      }
    });

    if (this.ball.y > H + 30) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameOver = true;
      } else {
        this.resetBall();
      }
    }

    if (this.bricks.every((brick) => !brick.alive)) {
      this.gameOver = true;
    }
  }

  draw() {
    clearScreen();

    this.bricks.forEach((brick) => {
      if (!brick.alive) return;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    });

    ctx.fillStyle = "#fff0c2";
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.fill();

    drawText(`Lives ${this.lives}`, 24, 92, 22);
    if (this.ball.stuck && !this.gameOver) drawText("Press Space to launch", W / 2, H / 2, 30, "#f5b642", "center");
    if (this.gameOver) {
      const won = this.bricks.every((brick) => !brick.alive);
      drawText(won ? "Wall cleared. Press R." : "Out of balls. Press R.", W / 2, H / 2, 32, "#fff0c2", "center");
    }
    setHud("Score", this.score);
  }
}

function drawStars() {
  ctx.fillStyle = "rgba(255, 240, 194, 0.75)";
  for (let i = 0; i < 70; i++) {
    const x = (i * 137) % W;
    const y = (i * 83) % H;
    ctx.fillRect(x, y, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
  }
}

function makeRockPoints(radius) {
  const points = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const distance = radius * (0.72 + Math.random() * 0.34);
    points.push({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
  }
  return points;
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  if (currentGame) {
    currentGame.update(dt);
    currentGame.draw();
  }

  if (gameBannerTimer > 0) {
    gameBannerTimer -= dt;
    drawText(gameBanner, W / 2, H / 2, 42, "#fff0c2", "center");
  }

  requestAnimationFrame(loop);
}

selectGame(0);
requestAnimationFrame(loop);
