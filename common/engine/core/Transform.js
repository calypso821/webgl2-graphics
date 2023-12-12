import { mat4 } from '../../../lib/gl-matrix-module.js';

export class Transform {

    constructor({
        // quat
        rotation = [0, 0, 0, 1],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
        matrix,
    } = {}) {
        this.rotation = rotation;
        this.translation = translation;
        this.scale = scale;
        if (matrix) {
            this.matrix = matrix;
        }
    }
    // return matrix (rotation + translation + scale)
    get matrix() {
        return mat4.fromRotationTranslationScale(mat4.create(),
            this.rotation, this.translation, this.scale);
    }

    // set (rotation + translation + scale) <-- matrix
    set matrix(matrix) {
        mat4.getRotation(this.rotation, matrix);
        mat4.getTranslation(this.translation, matrix);
        mat4.getScaling(this.scale, matrix);
    }

}
