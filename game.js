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
const enemySize = 40;     // Increased size
const crosshairSize = 20; // Increased size
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
    trail: [], // Trail array for player
    trailSize: 40, // Set trail size (bigger than player radius)
    lastDirection: '', // Last movement direction
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
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Track mouse position
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
// Move player
function movePlayer() {
    player.dx = 0;
    player.dy = 0;

    // Move player based on key inputs
    if (keys['ArrowUp'] || keys['w']) {
        player.dy = -player.speed;
        player.lastDirection = 'up';
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.dy = player.speed;
        player.lastDirection = 'down';
    }
    if (keys['ArrowLeft'] || keys['a']) {
        player.dx = -player.speed;
        player.lastDirection = 'left';
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.dx = player.speed;
        player.lastDirection = 'right';
    }

    // Check for dash
    if (keys[' '] && !player.isDashing) {
        player.isDashing = true;
        player.dashTime = 0; // Reset dash timer

        // Calculate the angle to the mouse position
        const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        player.dx = Math.cos(angle) * player.dashSpeed; // Dash towards mouse x
        player.dy = Math.sin(angle) * player.dashSpeed; // Dash towards mouse y
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

    // Add position to trail with momentum and spread
    if (Math.random() < 0.2) { // Change the probability to control how often trails are added
        const angle = Math.atan2(player.dy, player.dx);
        const spreadDistance = 15; // Spread distance for the trail
        const spreadX = Math.cos(angle) * spreadDistance; // Spread on X-axis
        const spreadY = Math.sin(angle) * spreadDistance; // Spread on Y-axis
        player.trail.push({ x: player.x + spreadX, y: player.y + spreadY, angle: angle });
    }

    // Update trail positions based on movement direction
    player.trail.forEach((trailPoint, index) => {
        const momentumFactor = 0.5; // Factor to control how much the trail points move
        trailPoint.x += Math.cos(trailPoint.angle) * momentumFactor;
        trailPoint.y += Math.sin(trailPoint.angle) * momentumFactor;

        // Limit the trail length (shorter time for trails)
        if (player.trail.length > 15) { // Shorten trail length to 15
            player.trail.shift(); // Remove the oldest trail point
        }
    });

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

    const enemy = {
        x: x,
        y: y,
        size: size,
        color: enemyColor,
        speed: 2,
        health: 100,
        trail: [] // Trail array for enemies
    };
    enemies.push(enemy);
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

        // Add position to trail with momentum and spread
        if (Math.random() < 0.1) { // Change the probability to control how often enemy trails are added
            const spreadDistance = 15; // Spread distance for the trail
            const spreadX = Math.cos(angle) * spreadDistance; // Spread on X-axis
            const spreadY = Math.sin(angle) * spreadDistance; // Spread on Y-axis
            enemy.trail.push({ x: enemy.x + spreadX, y: enemy.y + spreadY, angle: angle });
        }

        // Update trail positions based on movement direction
        enemy.trail.forEach((trailPoint, index) => {
            const momentumFactor = 0.2; // Factor to control how much the trail points move
            trailPoint.x += Math.cos(trailPoint.angle) * momentumFactor;
            trailPoint.y += Math.sin(trailPoint.angle) * momentumFactor;

            // Limit the trail length (shorter time for trails)
            if (enemy.trail.length > 10) { // Shorten enemy trail length to 10
                enemy.trail.shift(); // Remove the oldest trail point
            }
        });
    });
}

// Check collisions (player with enemies and bullets with enemies)
function checkCollisions() {
    enemies.forEach((enemy, enemyIndex) => {
        // Check player collision with enemies
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.radius + enemy.size) {
            player.health -= 1; // Decrease player health on collision
            enemies.splice(enemyIndex, 1); // Remove enemy on collision
        }

        // Check bullet collision with enemies
        bullets.forEach((bullet, bulletIndex) => {
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < bullet.radius + enemy.size) {
                enemies.splice(enemyIndex, 1); // Remove enemy on collision
                bullets.splice(bulletIndex, 1); // Remove bullet on collision
            }
        });
    });
}

// Draw player with trails
function drawPlayer() {
    // Draw the trail
    ctx.globalAlpha = 0.1; // Set trail transparency
    player.trail.forEach((trailPoint) => {
        ctx.fillStyle = player.color;
        ctx.fillRect(trailPoint.x - player.trailSize / 2, trailPoint.y - player.trailSize / 2, player.trailSize, player.trailSize); // Draw square with trail size
    });
    ctx.globalAlpha = 1.0; // Reset transparency

    // Draw the player
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

// Draw enemies with trails
function drawEnemies() {
    enemies.forEach(enemy => {
        // Draw the trail
        ctx.globalAlpha = 0.05; // Set trail transparency (dimmer)
        enemy.trail.forEach((trailPoint) => {
            ctx.fillStyle = enemy.color;
            ctx.fillRect(trailPoint.x - enemy.size / 2, trailPoint.y - enemy.size / 2, enemy.size, enemy.size); // Draw square with enemy size
        });
        ctx.globalAlpha = 1.0; // Reset transparency

        // Draw the enemy
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
// Draw player health on the canvas
function drawHealth() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Health: ${player.health}`, 10, 30); // Display health at the top-left corner
}

// Modify game loop to include drawHealth
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
    drawHealth(); // Draw player health

    requestAnimationFrame(gameLoop);
}

if (player.health <= 0) {
    alert("Game Over! Your score: " + score); // or use a more elegant UI approach
    document.location.reload(); // Reload the game
}

// Spawn enemies every 2 seconds
setInterval(spawnEnemy, 2000);

// Shoot bullet on mouse click
canvas.addEventListener('click', () => shootBullet());

gameLoop();
