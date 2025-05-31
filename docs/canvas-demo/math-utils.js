function clamp(n, min, max) {
    if (n <= min) {
        return min;
    } else if (n >= max) {
        return max;
    } else {
        return n;
    }
}

/**
 * **L**inearly int**erp**olates between `start` and `end`.
 */
function lerp(t, start, end) {
    return ((end - start) * t) + start;
}
