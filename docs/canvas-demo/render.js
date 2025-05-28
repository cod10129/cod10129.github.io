"use strict";

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

/** A class defining data that is common to all types of bullets */
class CommonBulletData {
    attack = 1;
    constructor(attack) {
        this.attack = attack;
    }
}

class CircularBullet {
    pos = new Vec2();
    radius = 1;
    common = new CommonBulletData();
    constructor(pos, radius, common) {
        this.pos = pos;
        this.radius = radius;
        this.common = common;
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

class RectangularBullet {
    shape = new Rect();
    common = new CommonBulletData();
    constructor(shape, common) {
        this.shape = shape;
        this.common = common;
    }

    intersects(rect) {
        return rect.intersectRect(this.shape);
    }
    draw(ctx) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.fillRect(this.shape.x, this.shape.y, this.shape.width, this.shape.height);
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
    invincibleTime: 0,
    doBoardClamping: false,

    hurtbox() {
        return new Rect(
            this.pos.x - 15, this.pos.y - 15,
            30, 20,
        );
    },
    damage(attackDamage) {
        if (this.invincibleTime > 0) { return }
        this.health -= Math.max(0, attackDamage - this.defense);
        this.health = Math.max(0, this.health);
        this.invincibleTime = 40;
    },
};

var board = new Rect(
    360, 540,
    720, 460,
);

var bulletList = [];

/** These should have:
 * an `update()` and
 * a `draw(ctx)`.
 *
 * The keys are the object ID.
 */
var gameObjects = Object.create(null);

var downPressed = false;
var leftPressed = false;
var upPressed = false;
var rightPressed = false;
var xPressed = false;

//------------------//
// UPDATE FUNCTIONS //
//------------------//

function update() {
    const speedMultiplier = getPlayerSpeed();
    
    if  (downPressed) player.pos.y += speedMultiplier;
    if    (upPressed) player.pos.y -= speedMultiplier;
    if  (leftPressed) player.pos.x -= speedMultiplier;
    if (rightPressed) player.pos.x += speedMultiplier;

    if (player.doBoardClamping) {
        player.pos.x = clamp(player.pos.x, board.left+25, board.right-25);
        player.pos.y = clamp(player.pos.y, board.top+25, board.bottom-25);
    }

    const bulletHit = playerCollisionCheck(bulletList);
    if (bulletHit != null) {
        player.damage(bulletList[bulletHit].common.attack);
    }
    player.invincibleTime = Math.max(0, player.invincibleTime - 1);

    for (const obj of Object.values(gameObjects)) {
        if (typeof obj.update === "function") {
            obj.update();
        }
    }
}

/**
 * Returns the speed of the player in pixels/frame.
 */
function getPlayerSpeed() {
    if (xPressed) {
        return 4;
    } else {
        return 8;
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

    for (const obj of Object.values(gameObjects)) {
        if (typeof obj.draw === "function") {
            obj.draw(ctx);
        }
    }
    for (const bullet of bulletList) {
        bullet.draw(ctx);
    }
    drawPlayer(ctx);
}

function drawPlayer(ctx) {
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

    ctx.lineWidth = 1;
    ctx.fillStyle = "red";
    if (player.invincibleTime % 4 == 1) {
        ctx.fillStyle = "#FF000020";
    }
    ctx.fill(path);
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

function keyHoldStateSetter(key, isHeld) {
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
        case "x":
            xPressed = isHeld;
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
                keyHoldStateSetter(event.key, true);
                event.preventDefault();
            }
        },
        true,
    );
    window.addEventListener(
        "keyup",
        (event) => {
            if (!event.defaultPrevented) {
                keyHoldStateSetter(event.key, false);
                event.preventDefault();
            }
        },
        true,
    );
    // Initialize TLOs (Top-Level Objects)
    gameObjects['spr_enemy'] = {
        // These sprites are drawn starting from (360, 0)
        // They can be any width/height that fits in the space
        draw: function(ctx) {
            const image = document.getElementById("enemy");
            ctx.drawImage(image, 360, 0);
        }
    };
    // Health bar
    gameObjects['obj_health_bar'] = {
        draw: function(ctx) {
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
    };
    // "Board"
    gameObjects['obj_bullet_board'] = {
        draw: function(ctx) {
            ctx.lineWidth = 10;
            ctx.strokeStyle = "white";
            ctx.strokeRect(
                board.left, board.top,
                board.width, board.height,
            );
            ctx.lineWidth = 1;
        }
    };
    // FIGHT button
    gameObjects['obj_gui_fight'] = {
        currentlySelected: false,
        letterPaths: [
            // F
            new Path2D(
                "M 61 9 v4 l 3 3 v68 l -2 2 v6 h15 v-6 l -2 -2 v-32" +
                "h7 v2 h1 v4 h1 v1 h3 v-21 h-3 v1 h-1 v4 h-1 v3 h-7 v-33" +
                "h9 v1 h1 v1 h1 v2 h1 v3 h1 v5 h1 v2 h4 v-19 h-32"
            ),
            // I
            new Path2D(
                "M 98 9 v4 l 3 3 v68 l -3 3 v5 h16 v-5 l -3 -3 v-68 l 3 -3 v-5 h-16"
            ),
            // G
            new Path2D(
                "M 137 58 h16 v4 h-1 v2 h-1 v2 h-1 v23 h-1 v1 h-1 v1 h-2 v1 h-16" +
                "v-1 h-2 v-1 h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-2 h-1 v-1 h-1 v-2 h-1" +
                "v-2 h-1 v-3 h-1 v-3 h-1 v-7 h-1 v-26 h1 v-7 h1 v-4 h1 v-3 h1 v-4" +
                "h1 v-1 h1 v-4 h1 v-1 h1 v-2 h1 v-1 h1 v-1 h1 v-1 h1 v-1 h1 v-1 h1 v-1" +
                "h11 v1 h3 v1 h1 v1 h1 v3 h1 v4 h1 v2 h1 v12 h-4 v-4 h-1 v-3 h-1" +
                "v-3 h-1 v-4 h-1 v-2 h-2 v-1 h-1 v-1 h-6 v1 h-1 v2 h-1 v2 h-1 v6 h-1" +
                "v10 h-1 v28 h1 v10 h1 v6 h1 v3 h1 v2 h1 v1 h1 v2 h5 v-2 h1 v-2 h1 v-18" +
                "h-1 v-1 h-1 v-1 h-1 v-1 h-1 v-5" 
            ),
            // H
            new Path2D(
                "M 157 9 v6 l 2 2 v67 l -2 2 v6 h16 v-6 l -2 -2 v-33 h10 v33 l -2 2 v6" +
                "h16 v-6 l -2 -2 v-67 l 2 -2 v-6 h-16 v6 l 2 2 v27 h-10 v-27 l 2 -2 v-6"
            ),
            // T
            new Path2D(
                "M 198 9 v17 h3 v-4 h1 v-4 h1 v-2 h1 v-1 h6 v69 l -2 2 v6 h17 v-6" +
                "l -2 -2 v-69 h6 v1 h1 v2 h1 v4 h1 v4 h3 v-17 Z"
            ),
        ],
        draw: function(ctx) {
            ctx.lineWidth = 4;
            ctx.strokeStyle = "orange";
            ctx.fillStyle = "orange";
            ctx.strokeRect(30, 50, 240, 100);
            const prevTransform = ctx.getTransform();
            ctx.translate(30, 50);
            for (const path of this.letterPaths) {
                ctx.fill(path);
            }
            ctx.setTransform(prevTransform);
        }
    };
}

init();
