class Vec2 {
    x = 0;
    y = 0;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    length() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }
    normalized() {
        const lengthRecip = 1 / this.length();
        return new Vec2(
            this.x * lengthRecip,
            this.y * lengthRecip,
        );
    }
    /** The given `angle` should be in radians. */
    rotate(angle) {
        const length = this.length();
        const normalized = this.normalized();
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        return new Vec2(
            length * ((cos * this.x) - (sin * this.y)),
            length * (sin * this.x) + (cos * this.y),
        );
    }

    /** Returns a new `Vec2` from `this + other` */
    add(other) {
        return new Vec2(
            this.x + other.x,
            this.y + other.y,
        );
    }

    /** Returns a new `Vec2` from `this - other` */
    sub(other) {
        return new Vec2(
            this.x - other.x,
            this.y - other.y,
        );
    }

    /** Returns `this` scaled by the given scale. */
    scalarMul(scale) {
        return new Vec2(
            this.x * scale,
            this.y * scale,
        );
    }
}
