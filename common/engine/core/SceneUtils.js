import { mat4 } from '../../../lib/gl-matrix-module.js';
import { Camera, Model, Transform, Light, VFX } from '../core.js'

export function getLocalModelMatrix(node) {
    const matrix = mat4.create();
    for (const transform of node.getComponentsOfType(Transform)) {
        mat4.mul(matrix, matrix, transform.matrix);
    }
    return matrix;
}

export function getGlobalModelMatrix(node) {
    if (node.parent && !node.useLocalTransformationOnly) {
        const parentMatrix = getGlobalModelMatrix(node.parent);
        const modelMatrix = getLocalModelMatrix(node);
        return mat4.multiply(parentMatrix, parentMatrix, modelMatrix);
    } else {
        return getLocalModelMatrix(node);
    }
}

export function getLocalViewMatrix(node) {
    const matrix = getLocalModelMatrix(node);
    return mat4.invert(matrix, matrix);
}

export function getGlobalViewMatrix(node) {
    const matrix = getGlobalModelMatrix(node);
    return mat4.invert(matrix, matrix);
}

export function getProjectionMatrix(node) {
    const camera = node.getComponentOfType(Camera);
    return camera ? camera.projectionMatrix : mat4.create();
}
export function getMvpMatrix(mvpCameraMatrix, node) {
    const globalModelMatrix = getGlobalModelMatrix(node);
    return mat4.mul(mat4.create(), mvpCameraMatrix, globalModelMatrix);
}

export function getModels(node) {
    return node.getComponentsOfType(Model);
}

export function getSceneComponents(scene) {
    // Format { light, node }
    const scene_lights = [];
    const scene_vfx = [];
    scene.traverse(node => {
        // Get lights 
        const node_lights = node.getComponentsOfType(Light);
        if (node_lights && node_lights.length > 0) {
            for (const light of node_lights) {
                scene_lights.push({ light, node });
            }
        }

        // Get VFX
        const vfx = node.getComponentOfType(VFX);
        if (vfx) {
            scene_vfx.push(node);
        }
    });
    return {
        lights: scene_lights,
        vfx: scene_vfx,
    };
}
