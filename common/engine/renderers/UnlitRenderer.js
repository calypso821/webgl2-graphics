import { mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../WebGL.js';

import { BaseRenderer } from './BaseRenderer.js';
import { Character, RayCast, Transform } from '../core.js';


import {
    getLocalModelMatrix,
    getMvpMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
    getGlobalModelMatrix,
} from '../core/SceneUtils.js';

const unlitVertexShader = await fetch(new URL('../shaders/unlit.vs', import.meta.url))
    .then(response => response.text());

const unlitFragmentShader = await fetch(new URL('../shaders/unlit.fs', import.meta.url))
    .then(response => response.text());

export class UnlitRenderer extends BaseRenderer {

    constructor(gl) {
        // Super --> calling constructor of BaseRendeer(gl)
        super(gl);

        this.programs = WebGL.buildPrograms(gl, {
            unlit: {
                vertex: unlitVertexShader,
                fragment: unlitFragmentShader,
            },
        });

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.drawBoudingVolumes = true;
    }

    render(scene, camera) {
        const gl = this.gl;
        this.overlayElements = [];

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.unlit;
        gl.useProgram(program);

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        const modelMatrix = mat4.create();

        this.renderNode(scene, modelMatrix);
        
        // Render weapons on top of scene
        const activeWeapon = camera.getComponentOfType(Character).activeWeapon;
        this.renderOverlayElements(activeWeapon);
    }

    setModelMatrix(node, modelMatrix) {
        const gl = this.gl;
        const { program, uniforms } = this.programs.unlit;

        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);

        // Use only Node's local transformation (+ view, projection)
        if (node.useLocalTransformationOnly) {
            modelMatrix = localMatrix;
        }
        
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

        return modelMatrix;
    }

    renderNode(node, modelMatrix) {
        if (!node.visible) return;

        const rayCast = node.getComponentOfType(RayCast);

        if (rayCast && rayCast.isLaser() && !this.overlayElements.some(item => item.obj === node)) {
            this.overlayElements.push({ obj: node, modelMatrix });
            return;
        }

        modelMatrix = this.setModelMatrix(node, modelMatrix);
        //if (node.name == 'box') console.log(node.getComponentOfType(Transform).rotation)


        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                if (rayCast && rayCast.isLaser()) {
                    // Blended render
                    this.renderBlendedPrimitive(primitive);
                } else if (node.name == "Background") {
                    this.renderBackground(primitive);
                } else {
                    // Normal render
                    this.renderPrimitive(primitive);
                }  
            }
        }

        // Render child nodes
        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }
    renderBackground(primitive) {
        const gl = this.gl;
        gl.frontFace(gl.CW);
        this.renderPrimitive(primitive);
        gl.frontFace(gl.CCW);
    }

    renderBlendedPrimitive(primitive) {
        const gl = this.gl;

        //gl.depthFunc(gl.ALWAYS); 
        gl.disable(gl.CULL_FACE);
        gl.blendFunc(gl.ONE, gl.ONE); 

        this.renderPrimitive(primitive);

        //gl.depthFunc(gl.LESS);
        gl.enable(gl.CULL_FACE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
    }
    renderOverlayElements(activeWeapon) {
        for (const element of this.overlayElements) {
            this.renderNode(element.obj, element.modelMatrix);
        }
        this.renderActiveWeapon(activeWeapon);
    }

    renderActiveWeapon(weapon) {
        if (!weapon.node.visible) return;

        const modelMatrix = getGlobalModelMatrix(weapon.node.parent);
        const gl = this.gl;

        // Enable the stencil test
        gl.enable(gl.STENCIL_TEST);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF);

        // Update stencil buffer based on scene geometry
        // ...

        // Enable depth testing with a modified depth function for rendering weapons
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.ALWAYS); // Render weapon regardless of depth value

        // Render weapons
        this.renderNode(weapon.node, modelMatrix);

        // Reset depth function
        gl.depthFunc(gl.LESS);

        // Enable depth testing again
        gl.enable(gl.DEPTH_TEST);
        
        gl.stencilFunc(gl.EQUAL, 1, 0xFF); // Pass only if stencil value is equal to reference value
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP); // Keep stencil value

        // Render weapons again, but this time they will only be drawn where the stencil value is 1
        this.renderNode(weapon.node, modelMatrix);

        // Disable stencil test
        gl.disable(gl.STENCIL_TEST);
    }


    renderPrimitive(primitive) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.unlit;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;
        gl.uniform4fv(uniforms.uMaterial.baseFactor, material.baseFactor);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);

        const glTexture = this.prepareImage(material.baseTexture.image);
        const glSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }

}
