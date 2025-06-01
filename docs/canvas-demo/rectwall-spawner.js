/** 
 * Spawns a sequence of rectangular bullets at the right side of the screen, with
 * a single hole for the player to fit through.
 * The bullet waves rush to the left and then despawn.
 */

gameObjects['obj_enemy_walldemo'] = {
    // Counts up from 0 to 320
    frameCounter: -1,
    update: function() {
        if (gamePhase !== "enemy_turn") { return }
        if (this.frameCounter >= 320) {
            playerTurnTransition();
            bulletList = bulletList.filter(b => b.creator !== "obj_enemy_walldemo");
            return;
        }
        this.frameCounter += 1;
        // Make sure these are correctly set
        board.y = 510;
        board.height = 490;

        let myBullets = bulletList.filter(b => b.creator === "obj_enemy_walldemo");
        myBullets.forEach(bullet => bullet.shape.x -= 10);

        bulletList = bulletList.filter(bullet =>
            (bullet.creator !== "obj_enemy_walldemo") || (bullet.shape.x > 0)
        );

        if ((this.frameCounter % 60) !== 0) {
            return;
        }
        // Otherwise:
        let currentBullets = [];
        for (let y = 520; y <= 930; y += 80) {
            let bullet = new RectangularBullet(
                new Rect(1440, y, 40, 70),
                new CommonBulletData(4),
            );
            bullet.creator = "obj_enemy_walldemo";
            currentBullets.push(bullet);
        }
        // Remove a random element
        currentBullets.splice(Math.floor(Math.random() * currentBullets.length), 1);
        bulletList.push(...currentBullets);
    }
};
