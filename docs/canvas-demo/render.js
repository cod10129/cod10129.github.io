"use strict";

/**
 * A generic helper class for performing smooth transitions between one value to another
 * over the course of multiple frames via linear interpolation.
 */
class SmoothTransitionHelper {
    initialValue;
    endingValue;
    animationTime;
    framesElapsed;
    /**
     * The function used for interpolating between `start` and `end`.
     * It is expected to be callable as `lerpFunction(t, initialValue, endingValue)`
     * where `t: float`. If not specified, it will use `math-utils.js`'s `lerp()`.
     */
    lerpFunction;
    /** A function of (`the_current_position`) => void */
    outputSetter;
    constructor(start, end, animationTime, setter, lerpFunc = null) {
        this.initialValue = start;
        this.endingValue = end;
        this.animationTime = animationTime;
        this.framesElapsed = 0;
        this.outputSetter = setter;
        if (!lerpFunc) {
            this.lerpFunction = lerp;
        } else {
            this.lerpFunction = lerpFunc;
        }
    }

    update(objKey) {
        this.framesElapsed += 1;
        const completedFraction = this.framesElapsed / this.animationTime;
        this.outputSetter(
            this.lerpFunction(completedFraction, this.initialValue, this.endingValue)
        );
        if (this.framesElapsed >= this.animationTime) {
            delete gameObjects[objKey];
        }
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
    doBoardClamping: true,

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
 * - an `update(object_key_in_gameObjects)` (Since JS, update() can just ignore it)
 * - a `draw(ctx)`.
 *
 * The keys are the object ID.
 */
var gameObjects = Object.create(null);

/**
 * The phases are:
 * - `"player_turn"` (it's the player's turn to select an action)
 * - `"enemy_turn"` (enemy's attacking)
 */
var gamePhase = "enemy_turn";

var downPressed = false;
var leftPressed = false;
var upPressed = false;
var rightPressed = false;
var xPressed = false;

var downJustPressed = false;
var upJustPressed = false;

//------------------//
// UPDATE FUNCTIONS //
//------------------//

function update() {
    if (gamePhase === "player_turn") {
        if (downJustPressed || upJustPressed) {
            guiMove(upJustPressed);
        }
    }

    // Only allow free player movement if it's enemy attacking time
    if (gamePhase === "enemy_turn") {
        const speedMultiplier = getPlayerSpeed();
        if  (downPressed) player.pos.y += speedMultiplier;
        if    (upPressed) player.pos.y -= speedMultiplier;
        if  (leftPressed) player.pos.x -= speedMultiplier;
        if (rightPressed) player.pos.x += speedMultiplier;
    }

    if (player.doBoardClamping) {
        player.pos.x = clamp(player.pos.x, board.left+25, board.right-25);
        player.pos.y = clamp(player.pos.y, board.top+25, board.bottom-25);
    }

    const bulletHit = playerCollisionCheck(bulletList);
    if (bulletHit != null) {
        player.damage(bulletList[bulletHit].common.attack);
    }
    player.invincibleTime = Math.max(0, player.invincibleTime - 1);

    for (const [key, obj] of Object.entries(gameObjects)) {
        if (typeof obj.update === "function") {
            obj.update(key);
        }
    }

    if (downJustPressed) { downJustPressed = false }
    if   (upJustPressed) { upJustPressed = false }
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

//----------------------//
// GUI UPDATE FUNCTIONS //
//----------------------//

/** If given `true`, moves UP. If given `false`, moves DOWN. */
function guiMove(dirUp) {
    // The order of the GUI buttons from top to bottom, with wraparound entries.
    const lookupTable = [
        'obj_gui_spare',
        'obj_gui_fight', 'obj_gui_act', 'obj_gui_item', 'obj_gui_spare',
        'obj_gui_fight',
    ];
    // Find the button that's currently selected (and unselect it)
    let currentSelectionIndex;
    for (const [idx, buttonId] of lookupTable.entries()) {
        // Make sure to not attempt to move back from the *first* 'obj_gui_spare'
        if (idx === 0) { continue }
        if (gameObjects[buttonId].highlighted) {
            gameObjects[buttonId].highlighted = false;
            currentSelectionIndex = idx;
        }
    }
    // If there is no selected button, just ignore the movement entirely
    if (currentSelectionIndex === undefined) { return }
    if (dirUp) {
        const newSelection = lookupTable[currentSelectionIndex - 1];
        gameObjects[newSelection].highlighted = true;
        // Move the player up
        if (currentSelectionIndex === 1) { player.pos.y += 360 }
        else { player.pos.y -= 120 }
    } else {
        const newSelection = lookupTable[currentSelectionIndex + 1];
        gameObjects[newSelection].highlighted = true;
        // Move the player down
        if (currentSelectionIndex === 4) { player.pos.y -= 360 }
        else { player.pos.y += 120 }
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
        if (typeof obj.draw === "function" && obj.visible !== false) {
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

function drawUiButton(ctx, obj) {
    let color;
    if (obj.highlighted) { color = "yellow" }
    else { color = "orange" }
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    ctx.lineWidth = 4;
    const prevTransform = ctx.getTransform();
    ctx.translate(30, obj.baseYPosition);
    ctx.strokeRect(0, 0, 240, 100);
    for (const path of obj.letterPaths) {
        ctx.fill(path);
    }
    ctx.setTransform(prevTransform);
}

function playerTurnTransition() {
    gamePhase = "player_turn";
    player.doBoardClamping = false;
    gameObjects['obj_slide_player'] = new SmoothTransitionHelper(
        player.pos, new Vec2(60, 80),
        10,
        (pos) => { player.pos = pos },
        (t, start, end) => Vec2.lerp(t, start, end),
    );
    scheduleTask(
        () => { gameObjects['obj_gui_fight'].highlighted = true },
        10,
    );
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

var nextTaskId = 1n;
/** Schedules a specified `task` to be run in a given number of frames. */
function scheduleTask(task, frames) {
    gameObjects[`obj_scheduledtask_${nextTaskId++}`] = {
        remainingTime: frames,
        task: task,
        update: function(name) {
            if (this.remainingTime-- === 0) {
                this.task();
                delete gameObjects[name];
            }
        },
    };
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
            if (isHeld) { downJustPressed = true }
            break;
        case "ArrowUp":
            upPressed = isHeld;
            if (isHeld) { upJustPressed = true }
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
    gameObjects['obj_gui_fight'] = {
        highlighted: false,
        baseYPosition: 30,
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
        draw: function(ctx) { drawUiButton(ctx, this) },
    };
    gameObjects['obj_gui_act'] = {
        highlighted: false,
        baseYPosition: 150,
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
        draw: function(ctx) { drawUiButton(ctx, this) },
    };
    gameObjects['obj_gui_item'] = {
        highlighted: false,
        baseYPosition: 270,
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
        draw: function(ctx) { drawUiButton(ctx, this) },
    };
    gameObjects['obj_gui_spare'] = {
        highlighted: false,
        baseYPosition: 390,
        letterPaths: [
            // S
            new Path2D(
                "M 93 5 v8 h-19 l -2 2 v28 l 2 2 h17 l 2 2 v46 l -2 2 h-27 v-8 h19" +
                "l 2 -2 v-30 l -2 -2 h-17 l -2 -2 v-44 l 2 -2 Z"
            ),
            // P (top)
            new Path2D(
                "M 128 41 h-11 l 3 -3 v-22 l -3 -3 h-7 l -3 3 v22 l 3 3 h-11 v-34" +
                "l 2 -2 h25 l 2 2 Z"
            ),
            // P (bottom)
            new Path2D("M 99 41 h29 v6 l -2 2 h-19 V93 l 2 2 h-10 Z"),
            // A (top)
            new Path2D(
                "M 162 41 h-11 l 3 -3 v-22 l -3 -3 h-7 l -3 3 v22 l 3 3 h-11 v-34" +
                "l 2 -2 h25 l 2 2 Z"
            ),
            // A (bottom)
            new Path2D("M 133 41 h29 v54 h-10 l 2 -2 v-44 h-13 v44 l 2 2 h-10 Z"),
            // R (top)
            new Path2D(
                "M 169 5 h25 l 2 2 v30 h-10 l 2 -2 v-20 l -2 -2 h-9 l -2 2 v20 l 2 2" +
                "H 167 V 7 l 2 -2"
            ),
            // R (bottom)
            new Path2D(
                "M 167 37 h29 v7 l -2 2 h-9 l 11 11 v38 h-8 v-32 l -13 -13 V95 h-8 Z"
            ),
            // E
            new Path2D(
                "M 201 5 h29 v11 l -3 -3 h-18 v33 h19 v8 h-19 v33 h18 l 3 -3 v11 h-29 Z"
            ),
        ],
        draw: function(ctx) { drawUiButton(ctx, this) },
    };
}

init();
