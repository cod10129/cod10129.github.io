/**
 * A helper class for (VERTICALLY) selecting options in a GUI.
 *
 * This class fulfills the `gameObject` interface.
 */
class GuiSelectionTool {
    /**
     * The available options to select from, listed from top to bottom.
     *
     * This should be an array of objects.
     * The objects should have the following accessible methods:
     * - `function draw(ctx, highlighted: Boolean): void`
     * - `function select(): void`
     *   Called when the button is selected. This may and possibly should despawn the
     *   `GuiSelectionTool` object.
     */
    options = [];
    /** Is GUI movement enabled? */
    movementEnabled = true;
    /** The index of the currently highlighted option. */
    highlightIndex = null;
    /** A function called when the highlighted option changes. */
    highlightChange = function(idx) {};

    constructor(
        options, initialHighlightIndex, movementEnabled = true,
        highlightChange = (() => {}),
    ) {
        this.options = options;
        this.highlightIndex = initialHighlightIndex;
        this.movementEnabled = movementEnabled;
        this.highlightChange = highlightChange;
    }

    draw(ctx) {
        for (const [i, obj] of this.options.entries()) {
            obj.draw(ctx, i === this.highlightIndex);
        }
    }

    update() {
        // GUI movement
        if (this.movementEnabled) {
            if (upJustPressed) {
                this.highlightIndex -= 1;
                if (this.highlightIndex === -1) {
                    this.highlightIndex = this.options.length - 1;
                }
            }
            if (downJustPressed) {
                this.highlightIndex += 1;
                if (this.highlightIndex === this.options.length) {
                    this.highlightIndex = 0;
                }
            }
            if (upJustPressed || downJustPressed) {
                this.highlightChange(this.highlightIndex);
            }
        }
        if (zJustPressed) {
            this.options[this.highlightIndex].select();
        }
    }
}
