import { vec3 } from '../../../../lib/gl-matrix-module.js';
import { getGlobalModelMatrix } from '../../core/SceneUtils.js';

export class AABB {
    constructor(aabb) {       
        this.shape = "AABB";
        this.min = aabb.min;     // Min vector
        this.max = aabb.max;     // Max vector
    }

    getTransformed(node) {
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const { min, max } = this;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, matrix));
        // v = vector 
        // transform vector with node's global matrix
        // vertices -> transformed vertices

        // Find new min and max by component.
        const xs = vertices.map(v => v[0]); // x - values of vertices
        const ys = vertices.map(v => v[1]); // y - vals`of vertices
        const zs = vertices.map(v => v[2]); // z - values of vertices
        // Extract min, max 
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { 
            shape: this.shape,
            min: newmin, 
            max: newmax
        };
    }
}
