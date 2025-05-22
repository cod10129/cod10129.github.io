"use strict";

class Vec2 {
    x = 0;
    y = 0;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function clamp(n, min, max) {
    if (n <= min) {
        return min;
    } else if (n >= max) {
        return max;
    } else {
        return n;
    }
}

//----------------//
// BULLET CLASSES //
//----------------//

class CircularBullet {
    pos = new Vec2();
    radius = 1;
    attack = 1;
    constructor(pos, radius, attack) {
        this.pos = pos;
        this.radius = radius;
        this.attack = attack;
    }

    intersects(rect) {
        return rect.intersectCircle(this.pos, this.radius);
    }
    draw(ctx) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

//--------------//
// GLOBAL STATE //
//--------------//

var player = {
    pos: new Vec2(720, 770),
    health: 50,
    defense: 0,

    hurtbox() {
        return new Rect(
            this.pos.x - 15, this.pos.y - 15,
            30, 20,
        );
    },
    damage(attackDamage) {
        this.health -= Math.max(0, attackDamage - this.defense);
        this.health = Math.max(0, this.health);
    },
};

var board = new Rect(
    360, 540,
    720, 460,
);

var bulletList = [
    new CircularBullet(new Vec2(500, 800), 20, 1),
];

var downPressed = false;
var leftPressed = false;
var upPressed = false;
var rightPressed = false;

//------------------//
// UPDATE FUNCTIONS //
//------------------//

function update() {
    const speedMultiplier = 8;
    
    if  (downPressed) player.pos.y += speedMultiplier;
    if    (upPressed) player.pos.y -= speedMultiplier;
    if  (leftPressed) player.pos.x -= speedMultiplier;
    if (rightPressed) player.pos.x += speedMultiplier;

    player.pos.x = clamp(player.pos.x, board.left+25, board.right-25);
    player.pos.y = clamp(player.pos.y, board.top+25, board.bottom-25);

    const bulletHit = playerCollisionCheck(bulletList);
    if (bulletHit != null) {
        player.damage(bulletList[bulletHit].attack);
    }
}

function draw() {
    // The canvas *should* be 4:3, 1440x1080
    const canvas = document.getElementById("renderscreen");
    const ctx = canvas.getContext("2d");

    // Reset the canvas
    ctx.clearRect(0, 0, 1440, 1080);

    // Debugging markers for the screen edges
    ctx.fillStyle = "orange";
    ctx.fillRect(10, 1075, 1430, 5);
    ctx.fillStyle = "lime";
    ctx.fillRect(1435, 10, 5, 1065);

    drawHealthBar(ctx);
    drawBoard(ctx);
    for (const bullet of bulletList) {
        bullet.draw(ctx);
    }
    drawPlayer(ctx);
}

function drawPlayer(ctx) {
    ctx.lineWidth = 1;

    const { x, y } = player.pos;

    const path = new Path2D();
    path.moveTo(x+2, y+20);
    path.lineTo(x+20, y);
    path.lineTo(x+20, y-10);
    path.arc(x+10, y-10, 10, 0, Math.PI, true);
    path.arc(x-10, y-10, 10, 0, Math.PI, true);
    path.lineTo(x-20, y);
    path.lineTo(x-2, y+20);
    path.closePath();

    ctx.fillStyle = "red";
    ctx.fill(path);
}

// Health maximum: 50
function drawHealthBar(ctx) {
    ctx.lineWidth = 1;

    ctx.fillStyle = "red";
    ctx.fillRect(620, 1020, 200, 40);
    ctx.fillStyle = "yellow";
    ctx.fillRect(620, 1020, player.health * 4, 40);

    // Textual indicator
    ctx.font = "48px 'Trouble Beneath The Dome', monospace";
    ctx.fillStyle = "white";
    const padded = String(player.health).padStart(2, '0');
    ctx.fillText(`${padded} / 50`, 850, 1055);
}

function drawBoard(ctx) {
    ctx.lineWidth = 10;
    ctx.strokeStyle = "white";
    ctx.strokeRect(
        board.left, board.top,
        board.width, board.height,
    );
    ctx.lineWidth = 1;
}

/**
 * Checks whether the player is colliding with any of the given bullets.
 * 
 * `bullets` should be an `Array` of objects with a `intersects(Rect)` method that
 * returns a `boolean`.
 * 
 * Returns the index of whatever bullet the player collided with, if any (otherwise,
 * returns `null`)
*/
function playerCollisionCheck(bullets) {
    const playerHurtbox = player.hurtbox();
    for (const [idx, bullet] of bullets.entries()) {
        if (bullet.intersects(playerHurtbox)) {
            return idx;
        }
    }
    return null;
}

// Should be called every 25ms (40 fps)
function frame() {
    update();
    draw();
}

function arrowKeyHoldSetter(key, isHeld) {
    switch (key) {
        case "ArrowDown":
            downPressed = isHeld;
            break;
        case "ArrowUp":
            upPressed = isHeld;
            break;
        case "ArrowLeft":
            leftPressed = isHeld;
            break;
        case "ArrowRight":
            rightPressed = isHeld;
            break;
    }
}

function init() {
    // Loop frame() at 40 fps forever
    window.addEventListener(
        "load",
        () => { setInterval(frame, 25) },
    );
    // Key event handlers
    window.addEventListener(
        "keydown",
        (event) => {
            if (!event.defaultPrevented) {
                arrowKeyHoldSetter(event.key, true);
                event.preventDefault();
            }
        },
        true,
    );
    window.addEventListener(
        "keyup",
        (event) => {
            if (!event.defaultPrevented) {
                arrowKeyHoldSetter(event.key, false);
                event.preventDefault();
            }
        },
        true,
    );
}

init();
