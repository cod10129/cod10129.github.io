class Rect {
    x;
    y;
    width;
    height;

    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    get left() { return this.x }
    get right() { return this.x + this.width }
    get top() { return this.y }
    get bottom() { return this.y + this.height }
    center() {
        return new Vec2(
            this.x + this.width / 2,
            this.y + this.height / 2,
        )
    }

    /**
     * Does this `Rect` intersect, at all, the `other` one?
     */
    intersectRect(other) {
        return (this.left <= other.right)
            && (this.right >= other.left)
            && (this.top <= other.bottom)
            && (this.bottom >= other.top);
    }

    /**
     * Does this `Rect` intersect the circle given by `pos` and `radius`?
     */
    intersectCircle(pos, radius) {
        // https://stackoverflow.com/a/402010/21760104
        const center = this.center();
        const circleDistanceX = Math.abs(pos.x - center.x);
        const circleDistanceY = Math.abs(pos.y - center.y);

        if (circleDistanceX > (this.width /2 + radius)) { return false }
        if (circleDistanceY > (this.height/2 + radius)) { return false }

        if (circleDistanceX <= (this.width  / 2)) { return true }
        if (circleDistanceY <= (this.height / 2)) { return true }

        const cornerDistanceSquared =
            (circleDistanceX - (this.width  / 2))^2 +
            (circleDistanceY - (this.height / 2))^2;
        return (cornerDistanceSquared <= (radius^2));
    }
}
