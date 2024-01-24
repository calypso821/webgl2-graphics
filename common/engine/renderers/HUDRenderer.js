import { TextElement, ImageElement } from '../core.js';


export class HUDRenderer {

    constructor(canvas_2d) {
        this.canvas = canvas_2d;
        this.ctx = canvas_2d.getContext("2d");
    }

    render(hudElements) {
        // Clear the 2D canvas
        this.clearCanvas();

        // HUD collection (all elements in scene)
        for (const hud of hudElements) {
            this.renderHUD(hud);
        }

        // Crosshair
        this.drawCrosshair();  

    }

    renderHUD(hud) {
        // Render all elements of HUD component
        for (const id in hud.elements) {
            this.renderElement(hud.elements[id]);
        }
        
    }

    renderElement(hudElement) {
        if (!hudElement.visible) {
            return;
        }
        // Draw element on canvas

        // Draw text
        if (hudElement instanceof TextElement) {
            this.drawText(hudElement);
        }
        // Draw image 
        if (hudElement instanceof ImageElement) {
            this.drawImage(hudElement);
        }
    }

        
    drawText(textElement) {
        const position = textElement.position;
        this.ctx.fillStyle = textElement.color;
        this.ctx.font = textElement.font;
        // Write on canvas
        this.ctx.fillText(textElement.text + textElement.value, position[0], position[1]);
    }

    drawImage(imageElement) {
        //console.log(imageElement.dt)
        // Draw the image on the canvas
        const imageBitmap = imageElement.imageBitmap;

        if (imageElement.fullscreen) {
            // Display in fullscreen
            this.ctx.drawImage(imageBitmap, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Display in original size
            const pos = imageElement.position;

            // Display in center
            if (imageElement.center) {
                pos[0] = this.canvas.width/2-imageBitmap.width/2;
                pos[1] = this.canvas.height/2-imageBitmap.height/2;
            }      
            this.ctx.drawImage(imageBitmap, pos[0], pos[1], imageBitmap.width, imageBitmap.height);
        }
    }

    clearCanvas() {
        // Clear the entire 2D canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCrosshair() {
        const size = 40;
        const color = "red";

        // Place it in middle of screen
        const x = this.canvas.width / 2; 
        const y = this.canvas.height / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(x - size / 2, y);
        this.ctx.lineTo(x + size / 2, y);
        this.ctx.moveTo(x, y - size / 2);
        this.ctx.lineTo(x, y + size / 2);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}
