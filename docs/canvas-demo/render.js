"use strict";

class Vec2 {
    x = 0;
    y = 0;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

//--------------//
// GLOBAL STATE //
//--------------//

var playerPos = new Vec2(1440/2, 1080/2);

var downPressed = false;
var leftPressed = false;
var upPressed = false;
var rightPressed = false;

//------------------//
// UPDATE FUNCTIONS //
//------------------//

function update() {
    const speedMultiplier = 5;
    
    if  (downPressed) playerPos.y += speedMultiplier;
    if    (upPressed) playerPos.y -= speedMultiplier;
    if  (leftPressed) playerPos.x -= speedMultiplier;
    if (rightPressed) playerPos.x += speedMultiplier;
}

function draw() {
    // The canvas *should* be 4:3, 1440x1080
    const canvas = document.getElementById("renderscreen");
    const ctx = canvas.getContext("2d");

    // Reset the canvas
    ctx.clearRect(0, 0, 1440, 1080);

    // Draw player
    ctx.beginPath();
    ctx.arc(playerPos.x, playerPos.y, 30, 0, Math.PI * 2);
    // ctx.closePath();
    ctx.fillStyle = "#F00F";
    ctx.fill();
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
