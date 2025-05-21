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

//--------------//
// GLOBAL STATE //
//--------------//

var playerPos = new Vec2(720, 720);

var board = {
    left: 360,
    right: 1080,
    top: 540,
    bottom: 1000,

    width: function() { return this.right-this.left; },
    height: function() { return this.bottom-this.top; },
};

var downPressed = false;
var leftPressed = false;
var upPressed = false;
var rightPressed = false;

//------------------//
// UPDATE FUNCTIONS //
//------------------//

function update() {
    const speedMultiplier = 8;
    
    if  (downPressed) playerPos.y += speedMultiplier;
    if    (upPressed) playerPos.y -= speedMultiplier;
    if  (leftPressed) playerPos.x -= speedMultiplier;
    if (rightPressed) playerPos.x += speedMultiplier;

    playerPos.x = clamp(playerPos.x, board.left+25, board.right-25);
    playerPos.y = clamp(playerPos.y, board.top+25, board.bottom-25);
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

    drawBoard(ctx);
    drawPlayer(ctx);
}

function drawPlayer(ctx) {
    ctx.lineWidth = 1;

    const { x, y } = playerPos;

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

function drawBoard(ctx) {
    ctx.lineWidth = 10;
    ctx.strokeStyle = "white";
    ctx.strokeRect(
        board.left, board.top,
        board.width(), board.height(),
    );
    ctx.lineWidth = 1;
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
