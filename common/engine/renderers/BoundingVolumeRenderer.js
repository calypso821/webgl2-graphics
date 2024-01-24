import { mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../WebGL.js';

import { BaseRenderer } from './BaseRenderer.js';
import { Laser } from '../core.js';


import {
    getLocalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
} from '../core/SceneUtils.js';

const unlitVertexShader = await fetch(new URL('../shaders/unlit.vs', import.meta.url))
    .then(response => response.text());

const unlitFragmentShader = await fetch(new URL('../shaders/unlit.fs', import.meta.url))
    .then(response => response.text());

// TODO - Bouding volume (BVH) renderer (draw LINES)
export class BoundingVolumeRenderer extends BaseRenderer {

    constructor(gl) {
        // Super --> calling constructor of BaseRendeer(gl)
        super(gl);

        this.programs = WebGL.buildPrograms(gl, {
            unlit: {
                vertex: unlitVertexShader,
                fragment: unlitFragmentShader,
            },
        });
    }

    render(scene, camera) {
        
    }
}
