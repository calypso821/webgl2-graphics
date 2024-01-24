import { Transform } from "../core.js";
import { getGlobalModelMatrix } from "../core/SceneUtils.js";
import { vec3, mat4, quat } from "../../../lib/gl-matrix-module.js";

export class RayCast {
    constructor(node, transformNode=null) {
        this.node = node;
        this.transformNode = transformNode;
        this.newRay = false;
    }

    setRay(ray) {
        this.ray = ray;
        this.newRay = true;
    }
    isLaser() {
        return this.ray instanceof LaserRay;
    }
    isBullet() {
        return this.ray instanceof BulletRay;
    }
    getTransformedRay() {
        const node = this.transformNode ? this.transformNode : this.node;
        //console.log(node);
        return this.ray.transformedRay(node);
    }
    getLocalRayMatrix() {
        return this.ray.getLocalMatrix();
    }
    
    update(t, dt) {
        if (this.isLaser()) {
            this.node.getComponentOfType(Transform).scale[2] = this.ray.length;
            this.newRay = true;
            this.ray.length = 300;
        }
    }
}

export class Ray {
    constructor(origin, direction, length=Infinity) {
        // Local space
        this.origin = origin;
        this.direction = direction;
        this.length = length;
    }
    
    transformedRay(node) {
        const matrix = getGlobalModelMatrix(node);
        //const globalScale = mat4.getScaling(vec3.create(), matrix);
        const globalTranslation = mat4.getTranslation(vec3.create(), matrix);
        const globalRotation = mat4.getRotation(quat.create(), matrix);
        return {
            origin: vec3.add(vec3.create(), this.origin, globalTranslation),
            direction: vec3.transformQuat(vec3.create(), this.direction, globalRotation),
            length: this.length,
        }
    }

    getLocalMatrix() {
        // targetTo - matrix that represents a transformation to 
        // align the view direction with a specified target point

        // eye - representing the position of the eye or camera (origin)
        // center - representing the point the camera is looking at
        // up - representing the up direction

        const direction = vec3.add(vec3.create(), this.origin, this.direction);
        const matrix = mat4.targetTo(mat4.create(), this.origin, direction, [0, 1, 0]);
        const scaleMat = mat4.fromScaling(mat4.create(), [1, 1, this.length]);

        // Create local matrix from ray properties (origin, direction, length)
        mat4.mul(matrix, matrix, scaleMat)  
        return matrix;
    }
}

export class LaserRay extends Ray {
    constructor(origin, direction, length=Infinity) {
        super(origin, direction, length);
        this.color = 'red';
    }
}

export class BulletRay extends Ray {
    constructor(origin, direction, length=Infinity) {
        super(origin, direction, length);
    }
    getGlobalMatrix(node) {
        return getGlobalModelMatrix(node.parent);
    }
}
