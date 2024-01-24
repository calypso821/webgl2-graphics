import { mat4, vec3 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../WebGL.js';

import { BaseRenderer } from './BaseRenderer.js';
import { Light, Character, RayCast, Transform } from '../core.js';


import {
    getSceneComponents,
    getLocalModelMatrix,
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
} from '../core/SceneUtils.js';

const litVertexShader = await fetch(new URL('../shaders/lit.vs', import.meta.url))
    .then(response => response.text());
const litFragmentShader = await fetch(new URL('../shaders/lit.fs', import.meta.url))
    .then(response => response.text());
const unlitVertexShader = await fetch(new URL('../shaders/unlit.vs', import.meta.url))
    .then(response => response.text());
const unlitFragmentShader = await fetch(new URL('../shaders/unlit.fs', import.meta.url))
    .then(response => response.text());

export class LitRenderer extends BaseRenderer {

    constructor(gl) {
        // Super --> calling constructor of BaseRendeer(gl)
        super(gl);

        this.programs = WebGL.buildPrograms(gl, {
            lit: {
                vertex: litVertexShader,
                fragment: litFragmentShader,
            },
            unlit: {
                vertex: unlitVertexShader,
                fragment: unlitFragmentShader,
            },
        });

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
    }
    initializeShaders(camera) {
        // Set uniforms which does not change during scene traverse (view, projection, camera)
        const gl = this.gl;

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        const cameraPos = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera));

        // 1. Setup lit (phong model) uniforms
        const lit = this.programs.lit;
        gl.useProgram(lit.program);

        gl.uniformMatrix4fv(lit.uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(lit.uniforms.uProjectionMatrix, false, projectionMatrix);
        gl.uniform3fv(lit.uniforms.uCameraPosition, cameraPos);

        // 2. Setup unlit uniforms 
        const unlit = this.programs.unlit;
        gl.useProgram(unlit.program);

        gl.uniformMatrix4fv(unlit.uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(unlit.uniforms.uProjectionMatrix, false, projectionMatrix);

    }
    renderUnlitBackground(background) {
        console.log(background)
        const gl = this.gl;
        // Render background node only
        // Unlit shaders + front face: CW
        const modelMatrix = getGlobalModelMatrix(background)
        const unlit = this.programs.unlit;

        gl.uniformMatrix4fv(this.programs.lit.uniforms.uModelMatrix, false, modelMatrix);
        //gl.useProgram(unlit.program); // Render unlit
        gl.uniformMatrix4fv(unlit.uniforms.uModelMatrix, false, modelMatrix);

        
        // Render inside of sphere only
        gl.frontFace(gl.CW); // Clock wise - inside 

        const models = getModels(background);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderUnlitPrimitive(primitive);
            }
        }

        gl.frontFace(gl.CCW); // Counter Clock wise - outside
        gl.useProgram(this.programs.lit.program);
    }

    render(scene, camera) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.initializeShaders(camera);
        gl.useProgram(this.programs.lit.program);

        // Get all components (lights, vfx...) from scene
        const sceneComponents = getSceneComponents(scene);
        const lights = sceneComponents.lights;

        this.renderNode(scene, lights, mat4.create());
    }

    setModelMatrix(node, modelMatrix) {
        const gl = this.gl;
        const { uniforms } = this.programs.lit;

        const localMatrix = getLocalModelMatrix(node);

        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);

        // Use only Node's local transformation (+ view, projection)
        if (node.useLocalTransformationOnly) {
            modelMatrix = mat4.mul(mat4.create(), this.mvpCameraMatrix, localMatrix);
        }
        
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

        return modelMatrix;
    }
    setHighestIntensityLights(node, lights) {
        // Main Lights - lights always present 
        const mainLights = [];
        // Get lights with highest lightIntensity factor to node
        const otherLights = [];

        for (const light_ele of lights) {
            const light = light_ele.light;
            const light_pos = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(light_ele.node));
            const node_pos = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(node));

            // Extrat main lights (always present - sun)
            if (light.main) {
                mainLights.push({ light, position: light_pos });
            } else {
                 // Distance from light source to object origin
                const distance = vec3.dist(node_pos, light_pos);
                const intensity = light.getLightIntensity(distance);

                otherLights.push({ intensity, light, position: light_pos });
            } 
        }

        // Sort lights based on intensity in descending order
        otherLights.sort((a, b) => b.intensity - a.intensity);

        // Must match shader light array length
        const shaderLight_count = 5;
        // 1. Set main lights 
        const mainLightsCount = Math.min(mainLights.length, shaderLight_count);
        //console.log("Main lights", mainLights,  mainLightsCount)
        this.setLights(mainLights,  mainLightsCount, 0);

        // 2. Set other lights
        // Extract (shaderLight_count - count) lights (with highest lightIntenisty ~ closest to object)
        const otherLightsCount = Math.min(otherLights.length, shaderLight_count - mainLightsCount);
        const highestIntenistyLights = otherLights.slice(0, otherLightsCount);
        //console.log("Other lights", highestIntenistyLights,  otherLightsCount)
        this.setLights(highestIntenistyLights,  otherLightsCount, mainLightsCount);

        const gl = this.gl;
        const { uniforms } = this.programs.lit;
        // Set number of light set 
        //console.log("Light count: ", mainLightsCount + otherLightsCount)
        gl.uniform1i(uniforms.uLightCount, mainLightsCount + otherLightsCount);

    }
    setLights(lights, count, shaderOffset) {
        const gl = this.gl;
        const { uniforms } = this.programs.lit;

        // Set shader uniform of input lights
        for (let i = 0; i < count; i++) {
            const lightComponent = lights[i].light;
            //console.log(lights[i])
            gl.uniform3fv(uniforms.uLight.color[i+shaderOffset],
                vec3.scale(vec3.create(), lightComponent.color, lightComponent.intensity));
            gl.uniform3fv(uniforms.uLight.position[i+shaderOffset], lights[i].position);
            gl.uniform3fv(uniforms.uLight.attenuation[i+shaderOffset], lightComponent.attenuation);
            gl.uniform1i(uniforms.uLight.type[i+shaderOffset], lightComponent.type_value);
        }
    }

    renderNode(node, lights, modelMatrix) {
        if (!node.visible) return;

        if (node.name == "Background") {
            this.renderUnlitBackground(node);
            return;
        }

        modelMatrix = this.setModelMatrix(node, modelMatrix);

        // Set lights unifrom (main + other)
        this.setHighestIntensityLights(node, lights);

        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderPrimitive(primitive);
            }
        }

        // Render child nodes
        for (const child of node.children) {
            this.renderNode(child, lights, modelMatrix);
        }
    }
    renderUnlitPrimitive(primitive) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.unlit;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;
        gl.uniform4fv(uniforms.uMaterial.baseFactor, material.baseFactor);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uTexture, 0);

        const glTexture = this.prepareImage(material.baseTexture.image);
        const glSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);

    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const { uniforms } = this.programs.lit;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;

        // TODO - PBR -> diffuse, specular, shininess factor
        gl.uniform1f(uniforms.uMaterial.diffuse, 1);
        gl.uniform1f(uniforms.uMaterial.specular, 0.5);
        gl.uniform1f(uniforms.uMaterial.shininess, 100);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uTexture, 0);

        const glTexture = this.prepareImage(material.baseTexture.image);
        const glSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }

}
