import { mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../WebGL.js';


export class HUDRenderer {

    constructor(canvas_2d) {
        this.canvas = canvas_2d;
        this.hud = canvas_2d.getContext("2d");

        this.initCrosshair();
    }
    initCrosshair() {
        this.crosshair = {
            size: 40,
            color: "red",
            visible: true
        }
    }

    render(hud_elements) {
        // Clear the 2D canvas
        this.clearCanvas();

        // Text elements
        for (const element of hud_elements) {
            this.renderTextElement(element);
        }

        // Crosshair
        if (this.crosshair.visible) {
            this.renderCrosshair([this.canvas.width / 2, this.canvas.height / 2], this.crosshair.size, this.crosshair.color);  
        }
    }

        
    renderTextElement(element) {
        if (!element.visible) {
            return;
        }
        const position = element.position;
        this.hud.fillStyle = element.color;
        this.hud.font = element.font;
        // Write on canvas
        this.hud.fillText(element.text + element.value, position[0], position[1]);
    }

    renderCrosshair(position, size, color) {
        const x = position[0];
        const y = position[1];

        this.hud.beginPath();
        this.hud.moveTo(x - size / 2, y);
        this.hud.lineTo(x + size / 2, y);
        this.hud.moveTo(x, y - size / 2);
        this.hud.lineTo(x, y + size / 2);

        this.hud.strokeStyle = color;
        this.hud.lineWidth = 2;
        this.hud.stroke();
    }
    
    clearCanvas() {
        // Clear the entire 2D canvas
        this.hud.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
