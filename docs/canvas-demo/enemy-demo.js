// Demo enemy bullet spawner

// Loops through [0, 20), forever
var frameCounter = 0;

function enemyUpdate() {
    frameCounter += 1;
    if (frameCounter >= 20) {
        frameCounter = 0;
    }
    // Move 3px downward
    bulletList
        .filter((bullet) => bullet.creator == "demo_enemy")
        .forEach((bullet) => {
            bullet.pos.y += 4;
        });
    
    const exitedBulletIndex = bulletList.findIndex((b) => b.pos.y > board.bottom);
    if (exitedBulletIndex != -1) {
        bulletList.splice(exitedBulletIndex, 1);
    }
    if (frameCounter === 0) {
        let bullet = new CircularBullet(
            new Vec2(415, board.top),
            10,
            2,
        );
        bullet.creator = "demo_enemy";
        bulletList.push(bullet);
    }
}
