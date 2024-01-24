import { vec3, mat4, quat } from '../../../../lib/gl-matrix-module.js';
import { getGlobalModelMatrix } from '../../core/SceneUtils.js';

export class OBB {
    constructor(aabb) {         
        this.shape = "OBB";
        this.rotation = [0, 0, 0, 1];     // Rotation (quat)
        this.center = [0, 0, 0];          // Center of the OBB
        this.halfExtents = [0, 0, 0];     // Half extents along each axis

        // Initialize the OBB based on the provided model
        this.initOBB(aabb);
    }
    initOBB(aabb) {
        const delta = vec3.sub(vec3.create(), aabb.max, aabb.min);
        this.halfExtents = vec3.scale(vec3.create(), delta, 0.5);
        this.center = vec3.add(vec3.create(), this.halfExtents, aabb.min);
    }

    getTransformed1(node) {
        // Global (center, rotation, extents - scale)
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const globalScale = mat4.getScaling(vec3.create(), matrix);
        const globalTranslation = mat4.getTranslation(vec3.create(), matrix);
        const globalRotation = mat4.getRotation(quat.create(), matrix);
        const new_obb = {
            shape: this.shape,
            center: vec3.add(vec3.create(), this.center, globalTranslation),
            halfExtents: vec3.mul(vec3.create(), this.halfExtents, globalScale),
            rotation: quat.mul(quat.create(), this.rotation, globalRotation)
        }
        return new_obb;
    }
    getTransformed(node) {
        // Global (center, rotation, extents - scale)
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const globalScale = mat4.getScaling(vec3.create(), matrix);
        const globalTranslation = mat4.getTranslation(vec3.create(), matrix);
        const globalRotation = mat4.getRotation(quat.create(), matrix);

        // Get global center of OBB
        const globalCenter = vec3.add(vec3.create(), this.center, globalTranslation);
        // Translate the center of the OBB to the origin of the node
        const relativeCenter = vec3.subtract(vec3.create(), globalCenter, globalTranslation);
        
        // Rotate the translated center using the rotation
        const rotatedRelativeCenter = vec3.transformQuat(vec3.create(), relativeCenter, globalRotation);
        // Scale new center by scale vector
        const scaledRelativeCenter = vec3.mul(vec3.create(), rotatedRelativeCenter, globalScale);

        // Translate the rotated center back to the original position
        const newCenter = vec3.add(vec3.create(), scaledRelativeCenter, globalTranslation);

        const new_obb = {
            shape: this.shape,
            center: newCenter,
            halfExtents: vec3.mul(vec3.create(), this.halfExtents, globalScale),
            rotation: quat.mul(quat.create(), this.rotation, globalRotation)
        };

        return new_obb;

    }
}
