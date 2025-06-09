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

//-------------//
// GUI BUTTONS //
//-------------//

/**
 * Designed to be inserted into `gameObjects['obj_gui_main']`, a `GuiSelectionTool`.
 */
class MainGuiButton {
    /** A `Path2D[]`. */
    paths = [];
    baseYPosition;
    detatchedObjId;

    constructor(paths, baseYPosition, name) {
        this.paths = paths;
        this.baseYPosition = baseYPosition;
        this.detatchedObjId = name;
    }

    draw(ctx, highlighted) {
        const color = highlighted ? "yellow" : "orange";
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 4;

        const prevTransform = ctx.getTransform();
        ctx.translate(30, this.baseYPosition);
        ctx.strokeRect(0, 0, 240, 100);
        for (const path of this.paths) {
            ctx.fill(path);
        }
        ctx.setTransform(prevTransform);
    }

    select() {
        gameObjects[this.detatchedObjId] = {
            paths: this.paths,
            baseYPosition: this.baseYPosition,
            draw(ctx) { MainGuiButton.prototype.draw.call(this, ctx, true) }
        };
        postUpdateThunks.push(() => { delete gameObjects['obj_gui_main'] });
        gameObjects['obj_button_smooth_select'] = new SmoothTransitionHelper(
            this.baseYPosition, 30,
            3,
            (y) => { gameObjects[this.detatchedObjId].baseYPosition = y },
        );
        if (this.detatchedObjId === 'obj_gui_item') { initItemSelection() }
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

/**
 * The player's items.
 * Each has, at least, a `name` field.
 */
var inventory = [
    { name: "ButsDont" },
    { name: "TstItem2" },
];

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

var upJustPressed = false;
var downJustPressed = false;
var zJustPressed = false;

/**
 * An array of `f(): void`, to run after all `gameObjects` are updated.
 * These will only run once, at the end of the current `update()`.
 */
var postUpdateThunks = [];

//------------------//
// UPDATE FUNCTIONS //
//------------------//

function update() {
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

    for (const thunk of postUpdateThunks) {
        thunk();
    }
    postUpdateThunks.length = 0;

    upJustPressed = false;
    downJustPressed = false;
    zJustPressed = false;
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

function playerTurnTransition() {
    gamePhase = "player_turn";
    player.doBoardClamping = false;
    gameObjects['obj_slide_player'] = new SmoothTransitionHelper(
        player.pos, new Vec2(60, 80),
        5,
        (pos) => { player.pos = pos },
        (t, start, end) => Vec2.lerp(t, start, end),
    );
    gameObjects['obj_gui_main'].movementEnabled = true;
    gameObjects['obj_gui_main'].highlightIndex = 0;
}

function initItemSelection() {
    const choices = inventory.map((item, idx) => new Object({
        index: idx,
        name: item.name,
        draw(ctx) {
            ctx.font = "50px '8-Bit Operator JVE', monospace";
            ctx.fillStyle = "white";
            const yPos = 190 + (55 * this.index);
            ctx.fillText(`*  ${this.name}`, 50, yPos);
        },
    }));
    gameObjects['obj_gui_itemselector'] = new GuiSelectionTool(
        choices, 0, true,
        () => {},
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
        case "z":
            if (isHeld) { zJustPressed = true }
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
    // Main GUI (Fight, Act, Item, Spare)
    gameObjects['obj_gui_main'] = new GuiSelectionTool(
        [
            new MainGuiButton(fightPaths, 30, 'obj_gui_fight'),
            new MainGuiButton(actPaths, 150, 'obj_gui_act'),
            new MainGuiButton(itemPaths, 270, 'obj_gui_item'),
            new MainGuiButton(sparePaths, 390, 'obj_gui_spare'),
        ],
        null,
        false,
        (idx) => { player.pos.y = 80 + (idx * 120) },
    );
}

init();
