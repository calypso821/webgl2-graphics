import { GUI } from '../../../lib/dat.gui.module.js';
import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const settings = {
	// Create a default color in the RGBA format.
    // The values range from 0 to 255.
    color: [ 255, 155, 55, 255 ],
};

// user defined render (application function)
function render() {
    gl.clearColor(...settings.color.map(c => c / 255)); // map values between 0-1
    gl.clear(gl.COLOR_BUFFER_BIT);
    // gl.clearColor, gl.clear => canvas context methodes 
}

// resize system
new ResizeSystem({ canvas }).start();
// start, stop, update, render system
new UpdateSystem({ render }).start();

// Create the GUI manager.
const gui = new GUI();
// This color picker widget modifies the variable app.color.
gui.addColor(settings, 'color');
