function draw() {
    // The canvas *should* be 4:3, 1440x1080
    const canvas = document.getElementById("renderscreen");
    if (!canvas.getContext) { return }
    const ctx = canvas.getContext("2d");
    
    // Red rectangle
    ctx.fillStyle = "red";
    ctx.fillRect(100, 10, 620, 1065);

    // Blue rectangle
    ctx.fillStyle = "#0000FF80";
    ctx.fillRect(50, 340, 1340, 400);
}

window.addEventListener("load", draw);
