export class ResizeSystem {

    constructor({
        canvas_webgl,
        canvas_2d = null,
        resize,
        resolutionFactor = 1,
        minWidth = 1,
        minHeight = 1,
        maxWidth = Infinity,
        maxHeight = Infinity,
    } = {}) {
        this._resize = this._resize.bind(this);

        this.canvas = canvas_webgl;
        this.canvas2D = canvas_2d;
        this.resize = resize;

        this.resolutionFactor = resolutionFactor;
        this.minCanvasSize = {
            width: minWidth,
            height: minHeight,
        };
        this.maxCanvasSize = {
            width: maxWidth,
            height: maxHeight,
        };
        this.lastSize = {
            width: null,
            height: null,
        };
    }

    start() {
        if (this._resizeFrame) {
            return;
        }
        // start _resize loop
        this._resizeFrame = requestAnimationFrame(this._resize);
    }

    stop() {
        if (!this._resizeFrame) {
            return;
        }
        // stop _resize loop
        this._resizeFrame = cancelAnimationFrame(this._resizeFrame);
    }

    _resize() {
        // Request next frame (for resizeing) - same as render system 
        this._resizeFrame = requestAnimationFrame(this._resize);

        const displayRect = this.canvas.getBoundingClientRect();
        if (displayRect.width === this.lastSize.width && displayRect.height === this.lastSize.height) {
            return;
        }

        this.lastSize = {
            width: displayRect.width,
            height: displayRect.height,
        };

        const displaySize = {
            width: displayRect.width * devicePixelRatio,
            height: displayRect.height * devicePixelRatio,
        };

        const unclampedSize = {
            width: Math.round(displaySize.width * this.resolutionFactor),
            height: Math.round(displaySize.height * this.resolutionFactor),
        };

        const canvasSize = {
            width: Math.min(Math.max(unclampedSize.width, this.minCanvasSize.width), this.maxCanvasSize.width),
            height: Math.min(Math.max(unclampedSize.height, this.minCanvasSize.height), this.maxCanvasSize.height),
        };
        // canvas.clientWidth = width on screen 
        // canvas.width = width of actual canvas (needs to be updated)
        
        // new height, width after resize
        if (this.canvas.width !== canvasSize.width || this.canvas.height !== canvasSize.height) {
            this.canvas.width = canvasSize.width;
            this.canvas.height = canvasSize.height;
            if (this.canvas2D) {
                this.canvas2D.width = canvasSize.width;
                this.canvas2D.height = canvasSize.height;
            }
        }
        // Apply new height, width to viewport-canvas
        // user defined (application) resize function
        this.resize?.({ displaySize, canvasSize });
    }

}
