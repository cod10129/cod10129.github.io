// Demo enemy bullet spawner

gameObjects['obj_enemy_demo1'] = {
    // Loops through [0, 20), forever
    frameCounter: 0,
    update: function() {
        this.frameCounter += 1;
        if (this.frameCounter >= 20) {
            this.frameCounter = 0;
        }
        // Move 3px downward
        bulletList
            .filter((bullet) => bullet.creator == "obj_enemy_demo1")
            .forEach((bullet) => {
                bullet.pos.y += 4;
            });

        const exitedBulletIndex = bulletList.findIndex((b) => b.pos.y > board.bottom);
        if (exitedBulletIndex != -1) {
            bulletList.splice(exitedBulletIndex, 1);
        }
        if (this.frameCounter === 0) {
            let bullet = new CircularBullet(
                new Vec2(415, board.top),
                10,
                new CommonBulletData(2),
            );
            bullet.creator = "obj_enemy_demo1";
            bulletList.push(bullet);
        }
    }
};
