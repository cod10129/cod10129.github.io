/**
 * A file for the SVG paths for the main GUI buttons,
 * because I don't want to keep them all in `render.js`.
 */

const fightPaths = [
    // F
    "M 93 5 v11 l -3 -3 h-17 v32 h18 v10 h-18 v37 l 3 3 h-11 l -1 -1 v-87 l 2 -2 Z",
    // I
    "M 99 5 h29 v11 l -3 -3 h-7 v74 h7 l 3 -3 v11 h-29 v-11 l 3 3 h7 v-74 h-7 l -3 3 Z",
    // G
    "M 161 40 h-9 v-27 h-11 v72 h11 v-27 h-5 v-1 h-1 v-6 h1 v-1 h12 l 2 2" +
        "v41 l -2 2 h-25 l -2 -2 v-86 l 2 -2 h25 l 2 2 Z",
    // H
    "M 167 5 h7 l 2 2 v38 h11 v-38 l 2 -2 h7 v90 h-7 l -2 -2 v-37 h-11 v37 l -2 2 h-7 Z",
    // T
    "M 201 5 h29 v11 l -3 -3 h-7 v78 l 4 4 h-17 l 4 -4 v-78 h-7 l -3 3 Z",
].map(p => new Path2D(p));

const actPaths = [
    // These absolute values are a hack.
    // But I LoVe hacks. (/s)
    // A (top half)
    "M 113 5 l 2 2 v38 h-15 v-23 l -3 -3 h-15 l -3 3 v23 H65 v-38 l 2 -2 Z",
    // A (bottom)
    "M 65 45 H115 v50 h-18 l 3 -3 v-35 h-21 v35 l 3 3 H65 v-50 Z",
    // C
    "M 158 49 h15 v44 l -2 2 h-46 l -2 -2 v-86 l 2 -2 h47 l 2 2 v27 h-15" +
        "v-12 l -3 -3 h-15 l -3 3 v54 l 3 3 h15 l 3 -3 Z",
    // T
    "M 229 5 v18 l -3 -3 h-14 v70 l 5 5 h-25 l 5 -5 v-70 h-15 l -3 3 v-18 Z",
].map(p => new Path2D(p));

const itemPaths = [
    // I
    "M 101 5 v13 l -3 -3 h-11 v70 h11 l 3 -3 v13 h-38 v-13 l 3 3 h11 v-70" +
        "h-11 l -3 3 v-13 Z",
    // T
    "M 107 5 h38 v13 l -3 -3 h-11 v75 l 5 5 h-20 l 5 -5 v-75 h-11 l -3 3 Z",
    // E
    // I'm aware this doesn't exactly match item-button-ref.png, and I don't care
    "M 150 5 h35 v13 l -3 -3 h-22 v30 h22 v10 h-22 v30 h22 l 3 -3 v13 h-35 Z",
    // M
    "M 190 5 h10 l 10 30 l 10 -30 h10 v90 h-10 v-65 l -10 30 l -10 -30 v65 h-10 Z",
].map(p => new Path2D(p));

const sparePaths = [
    // S
    "M 93 5 v8 h-19 l -2 2 v28 l 2 2 h17 l 2 2 v46 l -2 2 h-27 v-8 h19" +
        "l 2 -2 v-30 l -2 -2 h-17 l -2 -2 v-44 l 2 -2 Z",
    // P (top)
    "M 128 41 h-11 l 3 -3 v-22 l -3 -3 h-7 l -3 3 v22 l 3 3 h-11 v-34 l 2 -2 h25 l 2 2 Z",
    // P (bottom)
    "M 99 41 h29 v6 l -2 2 h-19 V93 l 2 2 h-10 Z",
    // A (top)
    "M 162 41 h-11 l 3 -3 v-22 l -3 -3 h-7 l -3 3 v22 l 3 3 h-11 v-34 l 2 -2 h25 l 2 2 Z",
    // A (bottom)
    "M 133 41 h29 v54 h-10 l 2 -2 v-44 h-13 v44 l 2 2 h-10 Z",
    // R (top)
    "M 169 5 h25 l 2 2 v30 h-10 l 2 -2 v-20 l -2 -2 h-9 l -2 2 v20 l 2 2 H 167 V 7 l 2 -2",
    // R (bottom)
    "M 167 37 h29 v7 l -2 2 h-9 l 11 11 v38 h-8 v-32 l -13 -13 V95 h-8 Z",
    // E
    "M 201 5 h29 v11 l -3 -3 h-18 v33 h19 v8 h-19 v33 h18 l 3 -3 v11 h-29 Z",
].map(p => new Path2D(p));
