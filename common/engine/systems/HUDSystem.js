import { vec3, vec4, mat4, quat } from '../../../lib/gl-matrix-module.js';
import { Transform, Node, NPC, Character, TextElement } from '../core.js';

import { ModelLoader } from '../loaders/ModelLoader.js';
// TODO - HUD component 
// update() - this.hud.update(this.magazine), this.hud.render(this.magazine)

export class HUDSystem {

    constructor(canvas_2d) {
        this.canvas = canvas_2d;
        //this.ctx = canvas_2d.getContext("2d");

        this.hudElements = [];
    }
    addElement(hud) {
        this.hudElements.push(hud);
    }
    getElements() {
        return this.hudElements;
    }
    clearElements() {
        this.hudElements = [];
    }
    getRandomPositionCircle() {
        // Get the center coordinates of the canvas
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const offsetX = 100;
        const offsetY = -100;

        // Define the range of radius where you want to generate random coordinates
        const minRadius = 0;
        const maxRadius = 60;

        // Generate a random angle in radians
        const randomAngle = Math.random() * 2 * Math.PI;

        // Generate a random radius within the specified range
        const randomRadius = Math.random() * (maxRadius - minRadius) + minRadius;

        // Calculate the Cartesian coordinates
        const randomX = centerX + offsetX + randomRadius * Math.cos(randomAngle);
        const randomY = centerY + offsetY + randomRadius * Math.sin(randomAngle);

        return [randomX, randomY]
    }
}