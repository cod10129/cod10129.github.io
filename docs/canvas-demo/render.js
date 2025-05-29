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

function drawUiButton(y, ctx, paths) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = "orange";
    ctx.fillStyle = "orange";
    const prevTransform = ctx.getTransform();
    ctx.translate(30, y);
    ctx.strokeRect(0, 0, 240, 100);
    for (const path of paths) {
        ctx.fill(path);
    }
    ctx.setTransform(prevTransform);
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
                "M 93 5 v11 l -3 -3 h-17 v32 h18 v10 h-18 v37 l 3 3 h-11 l -1 -1" +
                "v-87 l 2 -2 Z"
            ),
            // I
            new Path2D(
                "M 99 5 h29 v11 l -3 -3 h-7 v74 h7 l 3 -3 v11 h-29 v-11" +
                "l 3 3 h7 v-74 h-7 l -3 3 Z"
            ),
            // G
            new Path2D(
                "M 161 40 h-9 v-27 h-11 v72 h11 v-27 h-5 v-1 h-1 v-6 h1 v-1 h12 l 2 2" +
                "v41 l -2 2 h-25 l -2 -2 v-86 l 2 -2 h25 l 2 2 Z"
            ),
            // H
            new Path2D(
                "M 167 5 h7 l 2 2 v38 h11 v-38 l 2 -2 h7 v90 h-7 l -2 -2 v-37 h-11" +
                "v37 l -2 2 h-7 Z"
            ),
            // T
            new Path2D(
                "M 201 5 h29 v11 l -3 -3 h-7 v78 l 4 4 h-17 l 4 -4 v-78 h-7 l -3 3 Z"
            ),
        ],
        draw: function(ctx) { drawUiButton(30, ctx, this.letterPaths) },
    };
    gameObjects['obj_gui_act'] = {
        currentlySelected: false,
        letterPaths: [
            // These absolute values are a hack.
            // But I LoVe hacks. (/s)
            // A (top half)
            new Path2D(
                "M 113 5 l 2 2 v38 h-15 v-23 l -3 -3 h-15 l -3 3 v23 H65 v-38 l 2 -2 Z"
            ),
            // A (bottom)
            new Path2D(
                "M 65 45 H115 v50 h-18 l 3 -3 v-35 h-21 v35 l 3 3 H65 v-50 Z"
            ),
            // C
            new Path2D(
                "M 158 49 h15 v44 l -2 2 h-46 l -2 -2 v-86 l 2 -2 h47 l 2 2 v27 h-15" +
                "v-12 l -3 -3 h-15 l -3 3 v54 l 3 3 h15 l 3 -3 Z"
            ),
            // T
            new Path2D(
                "M 229 5 v18 l -3 -3 h-14 v70 l 5 5 h-25 l 5 -5 v-70 h-15 l -3 3 v-18 Z"
            )
        ],
        draw: function(ctx) { drawUiButton(150, ctx, this.letterPaths) },
    };
    gameObjects['obj_gui_item'] = {
        currentlySelected: false,
        letterPaths: [
            // I
            new Path2D(
                "M 101 5 v13 l -3 -3 h-11 v70 h11 l 3 -3 v13 h-38 v-13 l 3 3 h11 v-70" +
                "h-11 l -3 3 v-13 Z"
            ),
            // T
            new Path2D(
                "M 107 5 h38 v13 l -3 -3 h-11 v75 l 5 5 h-20 l 5 -5 v-75 h-11 l -3 3 Z"
            ),
            // E
            // I'm aware this doesn't exactly match item-button-ref.png, and I don't care
            new Path2D(
                "M 150 5 h35 v13 l -3 -3 h-22 v30 h22 v10 h-22 v30 h22 l 3 -3 v13 h-35 Z"
            ),
            // M
            new Path2D(
                "M 190 5 h10 l 10 30 l 10 -30 h10 v90 h-10 v-65 l -10 30 l -10 -30 v65 h-10 Z"
            ),
        ],
        draw: function(ctx) { drawUiButton(270, ctx, this.letterPaths) },
    };
}

init();
