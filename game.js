const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Hard-coded values for testing
const playerColor = 'rgb(22, 249, 234)';
const bulletColor = 'rgb(22, 249, 234)';
const enemyColor = 'rgb(251, 0, 255)';
const crosshairColor = 'white';
const playerRadius = 25;  // Increased size
const bulletRadius = 8;   // Increased size
const enemySize = 40;      // Increased size
const crosshairSize = 20;  // Increased size
const crosshairLineWidth = 4; // Increased line width

// Player object
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: playerRadius,
    color: playerColor,
    speed: 5,
    dashSpeed: 500,  // Increased dash speed for farther movement
    isDashing: false,  // Flag to check if dashing
    dashDuration: 300, // Duration of dash in milliseconds
    dashTime: 0, // Time since dash started
    dx: 0,
    dy: 0,
    health: 100,
};

// Mouse and crosshair
const mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    crosshairSize: crosshairSize,
};

// Arrays for enemies and bullets
const enemies = [];
const bullets = [];
let keys = {};

// Event listeners for movement
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Track mouse position
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function movePlayer() {
    player.dx = 0;
    player.dy = 0;

    // Move player based on key inputs
    if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;

    // Check for dash
    if (keys[' '] && !player.isDashing) {
        player.isDashing = true;
        player.dashTime = 0; // Reset dash timer
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        player.dx += Math.cos(angle) * player.dashSpeed; // Add dash speed to current dx
        player.dy += Math.sin(angle) * player.dashSpeed; // Add dash speed to current dy
    }

    // If dashing, update dash timer and position
    if (player.isDashing) {
        player.dashTime += 16; // Approximate time since last frame (16 ms)
        player.x += player.dx;
        player.y += player.dy;

        // Stop dashing after duration
        if (player.dashTime >= player.dashDuration) {
            player.isDashing = false; // Stop dashing
        }
    } else {
        // Move player normally based on key inputs
        player.x += player.dx;
        player.y += player.dy;
    }

    // Prevent player from going out of bounds
    if (player.x - player.radius < 0) player.x = player.radius;
    if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;
    if (player.y - player.radius < 0) player.y = player.radius;
    if (player.y + player.radius > canvas.height) player.y = canvas.height - player.radius;
}

// Shoot bullets toward the mouse
function shootBullet() {
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    bullets.push({
        x: player.x,
        y: player.y,
        radius: bulletRadius,
        speed: 7,
        color: bulletColor,
        dx: Math.cos(angle) * 7,
        dy: Math.sin(angle) * 7,
    });
}

// Create enemies
function spawnEnemy() {
    const size = enemySize;
    let x, y;

    // Randomly spawn enemy outside the canvas bounds
    if (Math.random() > 0.5) {
        x = Math.random() > 0.5 ? 0 - size : canvas.width + size;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() > 0.5 ? 0 - size : canvas.height + size;
    }

    enemies.push({
        x: x,
        y: y,
        size: size,
        color: enemyColor,
        speed: 2,
        health: 100,
    });
}

// Move bullets
function moveBullets() {
    bullets.forEach((bullet, index) => {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        // Remove bullets that leave the screen
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });
}

// Move enemies toward player
function moveEnemies() {
    enemies.forEach(enemy => {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;
    });
}

// Collision detection between bullets and enemies
function checkCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist - bullet.radius - enemy.size / 2 < 0) {
                // Bullet hits enemy
                enemies.splice(enemyIndex, 1);
                bullets.splice(bulletIndex, 1);
            }
        });
    });
}

// Draw player
function drawPlayer() {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
}

// Draw bullets
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = bullet.color;
        ctx.fill();
        ctx.closePath();
    });
}

// Draw enemies
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y - enemy.size / 2);
        ctx.lineTo(enemy.x - enemy.size / 2, enemy.y + enemy.size / 2);
        ctx.lineTo(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.closePath();
    });
}

// Draw crosshair
function drawCrosshair() {
    ctx.strokeStyle = crosshairColor;
    ctx.lineWidth = crosshairLineWidth;

    // Draw crosshair at mouse position
    ctx.beginPath();
    ctx.moveTo(mouse.x - mouse.crosshairSize, mouse.y);
    ctx.lineTo(mouse.x + mouse.crosshairSize, mouse.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mouse.x, mouse.y - mouse.crosshairSize);
    ctx.lineTo(mouse.x, mouse.y + mouse.crosshairSize);
    ctx.stroke();
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePlayer();
    moveBullets();
    moveEnemies();
    checkCollisions();

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawCrosshair();

    requestAnimationFrame(gameLoop);
}

// Spawn enemies every 2 seconds
setInterval(spawnEnemy, 2000);

// Shoot bullet on mouse click
canvas.addEventListener('click', () => shootBullet());

gameLoop();
