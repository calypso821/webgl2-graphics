import { vec3, vec2 } from '../../../lib/gl-matrix-module.js';

export class Light {

    constructor({
        color = [1, 1, 1],
        intensity = 1,
        type = 'directional',
        main = false, // Light always preset (sun)
    } = {}) {
    
        this.color = color;
        this.intensity = intensity;
        this.type = type;
        this.main = main;

        const type_value = {
            'directional': 0, // Directional (sun)
            'point': 1,       // Point (light bulb)
            'spot': 2,        // Reflector (pocket light)
        }[type];
        this.type_value = type_value;
    }
    getLightIntensity() {
       return this.intensity;
    }
}

export class PointLight extends Light {
    constructor({
        color = [1, 1, 1],
        intensity = 1,
        distanceFactor = [0.001, 0, 0.3],
        type = 'point',
        main = false, // Light always preset (sun)
    } = {}) {
        super({ color, intensity, type, main });
        this.distanceFactor = distanceFactor;
    }
    getLightIntensity(d) {
        // Distance = distance from light source to object origin
         const distanceFactor  = 1.0 / vec3.dot(this.distanceFactor, vec3.fromValues(1, d, d * d));
         const lightIntensity = distanceFactor * this.intensity;
         return lightIntensity;
     }
}

export class SpotLight extends PointLight {
    constructor({
        color = [1, 1, 1],
        intensity = 1,
        // 1. Smoothe step values calculated from (blendFactor, halfAngle)
        blendFactor = 0.3,
        halfAngle = Math.PI / 4,
        // 2. Smooth step values exported from Blender 
        blendValues = null,
        distanceFactor = [0.001, 0, 0.3],
        type = 'spot',
        main = false, // Light always preset (sun)
    } = {}) {
        super({ color, intensity, distanceFactor, type, main });
        this.blendValues = blendValues;

        // If blend values not exported, calculate defalut value
        if (!blendValues) {
            this.blendValues = {
                low: halfAngle - blendFactor,
                high: halfAngle + blendFactor
            }
        }
    }
    getBlendValues() {
        return [this.blendValues.low, this.blendValues.high];
    }
    getLightIntensity(d, D, L, node) {
        // Distance = distance from light source to object origin
        const Ad  = 1.0 / vec3.dot(this.distanceFactor, vec3.fromValues(1, d, d * d));
        // Angle aligment factor 
        const dotProduct = vec3.dot(D, vec3.negate(vec3.create(), L));
        const angle = Math.acos(Math.max(0.0, dotProduct));
        const thresholdAngle = (this.blendValues.low + this.blendValues.high) / 2;
        // TODO - smooth step function 
        const Af = (angle < thresholdAngle) ? 1.0 : 0.0;

        const lightIntensity = this.intensity * Af * Ad;
        return lightIntensity;
     }
}
