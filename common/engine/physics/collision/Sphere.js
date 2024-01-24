import { vec3, mat4 } from '../../../../lib/gl-matrix-module.js';
import { getGlobalModelMatrix } from '../../core/SceneUtils.js';

export class Sphere {
    constructor(center, radius) {       
        this.shape = "Sphere";
        this.center = center;   // Center
        this.r = radius;        // Radius
    }

    getTransformed(node) {
        // Transform center, r of the Sphere from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const globalScale = mat4.getScaling(vec3.create(), matrix);
        const maxDimScale = Math.max(globalScale[0], globalScale[1], globalScale[2]);
        const globalTranslation = mat4.getTranslation(vec3.create(), matrix);
        // Rotation does not matter
        const new_sphere = {
            shape: this.shape,
            center: vec3.add(vec3.create(), this.center, globalTranslation),
            r: this.r * maxDimScale
        }
        return new_sphere;
    }
}
