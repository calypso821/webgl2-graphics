import { mat4, vec3, vec2, quat } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../WebGL.js';

import { BaseRenderer } from './BaseRenderer.js';
import { Light, Character, RayCast, Transform, VFX, Animation } from '../core.js';


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

export class DynamicRenderer extends BaseRenderer {

    constructor(gl) {
        // Super --> calling constructor of BaseRendeer(gl)
        super(gl);

        this.shaders = WebGL.buildPrograms(gl, {
            lit: {
                vertex: litVertexShader,
                fragment: litFragmentShader,
                type: 'lit',
            },
            unlit: {
                vertex: unlitVertexShader,
                fragment: unlitFragmentShader,
                type: 'unlit',
            },
        });

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.frontFace(gl.CCW);

        // Blend functions 
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    initializeShaders(camera) {
        // Set uniforms which does not change during scene traverse (view, projection, camera)
        const gl = this.gl;

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        const cameraPos = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera));

        // 1. Setup lit (phong model) uniforms
        const lit = this.shaders.lit;
        gl.useProgram(lit.program);

        gl.uniformMatrix4fv(lit.uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(lit.uniforms.uProjectionMatrix, false, projectionMatrix);
        gl.uniform3fv(lit.uniforms.uCameraPosition, cameraPos);

        // 2. Setup unlit uniforms 
        const unlit = this.shaders.unlit;
        gl.useProgram(unlit.program);

        gl.uniformMatrix4fv(unlit.uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(unlit.uniforms.uProjectionMatrix, false, projectionMatrix);

    }

    renderBackground(background, modelMatrix) {
        const gl = this.gl;
        // Set unlit shader
        const shader = this.shaders.unlit;
        // Activate shader 
        gl.useProgram(shader.program);

        // Set uModelMatrix uniform (vertex shader)
        this.setModelMatrix(background, modelMatrix, shader);

        // Render inside of sphere only
        gl.frontFace(gl.CW); // Clock wise - inside 

        const models = getModels(background);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderPrimitive(primitive, shader);
            }
        }

        gl.frontFace(gl.CCW); // Counter Clock wise - outside
    }

    render(scene, camera) {
        const gl = this.gl;
        const overlayElements = [];

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        this.initializeShaders(camera);
        gl.useProgram(this.shaders.lit.program);

        // Get all components (lights, vfx...) from scene
        const sceneComponents = getSceneComponents(scene);
        this.lights = sceneComponents.lights;
        overlayElements.push(...sceneComponents.vfx);

        // Render scene
        this.renderNode(scene, mat4.create());

        // Render overlay elements (laser, weapon...) on top of scene
        this.activeWeapon = camera.getComponentOfType(Character).activeWeapon;
        this.renderOverlayElements(overlayElements);
    }

    
    setHighestIntensityLights(node, shader) {
        if (shader.type != 'lit' || !this.lights) {
            return;
        }
        // Main Lights - lights always present 
        const mainLights = [];
        // Get lights with highest lightIntensity factor to node
        const otherLights = [];
        const node_posistion = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(node));

        for (const light_ele of this.lights) {
            const light = light_ele.light;
            // Extract light position, rotation from model Matrix
            const modelMatrix = getGlobalModelMatrix(light_ele.node);
            const light_position = mat4.getTranslation(vec3.create(), modelMatrix);
            const light_rotation = mat4.getRotation(quat.create(), modelMatrix);

            // L vector (surface -> light)
            const L = vec3.sub(vec3.create(), light_position, node_posistion);
            vec3.normalize(L, L);
            // D vector (light direction)
            const D = vec3.transformQuat(vec3.create(), [0, 0, -1], light_rotation);
            vec3.normalize(D, D);

            // Extrat main lights (always present - sun)
            if (light.main) {
                mainLights.push({ light, position: light_position, direction: D });
            } else {
                 // Distance from light source to object origin
                const distance = vec3.dist(node_posistion, light_position);
                const intensity = light.getLightIntensity(distance, D, L, node);

                otherLights.push({ intensity, light, position: light_position, direction: D });
            } 
        }

        // Sort lights based on intensity in descending order
        otherLights.sort((a, b) => b.intensity - a.intensity);
        
        // Must match shader light array length
        const shaderLight_count = 15;
        // 1. Set main lights 
        const mainLightsCount = Math.min(mainLights.length, shaderLight_count);
        //console.log("Main lights", mainLights,  mainLightsCount)
        this.setLights(mainLights,  mainLightsCount, 0, shader);

        // 2. Set other lights
        // Extract (shaderLight_count - count) lights (with highest lightIntenisty ~ closest to object)
        const otherLightsCount = Math.min(otherLights.length, shaderLight_count - mainLightsCount);
        const highestIntenistyLights = otherLights.slice(0, otherLightsCount);
        //console.log("Other lights", highestIntenistyLights,  otherLightsCount)
        this.setLights(highestIntenistyLights,  otherLightsCount, mainLightsCount, shader);

        // Set number of light set 
        //console.log("Light count: ", mainLightsCount + otherLightsCount)
        this.gl.uniform1i(shader.uniforms.uLightCount, mainLightsCount + otherLightsCount);

    }
    setLights(lights, count, shaderOffset, shader) {
        const gl = this.gl;
        const uniforms = shader.uniforms;

        // Set shader uniform of input lights
        for (let i = 0; i < count; i++) {
            const lightComponent = lights[i].light;
            // Set Position (light global translation)
            gl.uniform3fv(uniforms.uLight.position[i+shaderOffset], lights[i].position);
            // Set direction (D)
            gl.uniform3fv(uniforms.uLight.direction[i+shaderOffset], lights[i].direction);

            // Set Color
            gl.uniform3fv(uniforms.uLight.color[i+shaderOffset],
                vec3.scale(vec3.create(), lightComponent.color, lightComponent.intensity));
            // Set type of light (directional, spot, point)
            gl.uniform1i(uniforms.uLight.type[i+shaderOffset], lightComponent.type_value);

            // Set distanceFactor (point, spot)
            const distanceFactor = lightComponent.distanceFactor ? lightComponent.distanceFactor : vec3.create();
            gl.uniform3fv(uniforms.uLight.distanceFactor[i+shaderOffset], distanceFactor);
   
            // Set direction (spot)
            const blendValues = lightComponent.blendValues ? lightComponent.getBlendValues() : vec2.create();
            gl.uniform2fv(uniforms.uLight.blendValues[i+shaderOffset], blendValues);
        }
    }
    processAnimationMatrix(node, localMatrix) {
        // Process animation
        // If node have animation active (playing)
        // Add animation transfromation matrix to local model matrix
        const animationComp = node.getComponentOfType(Animation);
        if (animationComp) {
            const animations = animationComp.getAll();
            for (const name in animations) {
                const aPlayer = animationComp.get(name);
                if (aPlayer.transformMatrix) {
                    mat4.mul(localMatrix, localMatrix, aPlayer.transformMatrix)
                }
            }
        }
    }

    setModelMatrix(node, modelMatrix, shader) {
        // modelMatrix = parent global transformation
        if (!modelMatrix) {
            // If null -> create one
            modelMatrix = getGlobalModelMatrix(node.parent);
        }
        const localMatrix = getLocalModelMatrix(node);

        // Process animation
        this.processAnimationMatrix(node, localMatrix)

        // Set global model matrix
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);

        // Use only Node's local transformation (+ view, projection)
        if (node.useLocalTransformationOnly) {
            modelMatrix = localMatrix;
        }
        
        this.gl.uniformMatrix4fv(shader.uniforms.uModelMatrix, false, modelMatrix);

        return modelMatrix;
    }

    renderNode(node, modelMatrix) {
        if (!node.visible) return;
      
        if (node.name == "Background") {
            this.renderBackground(node, modelMatrix);
            return;
        }
        const vfx = node.getComponentOfType(VFX);
        if (vfx) { return; }
        
        const shader = this.shaders.lit;
        // Activate shader 
        this.gl.useProgram(shader.program);
        // Set uModelMatrix uniform (vertex shader)
        modelMatrix = this.setModelMatrix(node, modelMatrix, shader);

        // Set lights unifrom (main + other)
        this.setHighestIntensityLights(node, shader);

        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                if (vfx) {
                    // Blended render (vfx)
                    this.renderBlendedPrimitive(primitive, shader);
                } else {
                    // Normal render
                    this.renderPrimitive(primitive, shader);
                }
            }
        }

        // Render child nodes
        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }
    renderOverlayNode(node, modelMatrix) {
        if (!node.visible) return;

        let shader = this.shaders.lit;
        const vfx = node.getComponentOfType(VFX);
        if (vfx) {
            shader = this.shaders.unlit;
        }
        
        // Activate shader 
        this.gl.useProgram(shader.program);
        // Set uModelMatrix uniform (vertex shader)
        modelMatrix = this.setModelMatrix(node, modelMatrix, shader);

        // Set lights unifrom (main + other)
        //this.setHighestIntensityLights(node, shader);

        
        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                if (vfx) {
                    // Blended render (vfx)
                    this.renderBlendedPrimitive(primitive, shader);
                } else {
                    // Normal render
                    this.renderPrimitive(primitive, shader);
                }
                
            }
        }

        // Render child nodes
        for (const child of node.children) {
            this.renderOverlayNode(child, modelMatrix);
        }
    }
    
    renderOverlayElements(overlayElements) {
        // Render overlay elements (vfx laser)
        for (const element of overlayElements) {
            this.renderOverlayNode(element, null);
        }
        // Render active weapon
        this.renderActiveWeapon();
    }

    renderActiveWeapon() {
        const weapon = this.activeWeapon;
        if (!weapon.node.visible) return;

        const modelMatrix = getGlobalModelMatrix(weapon.node.parent);
        const gl = this.gl;

        // Set depth function to always 
        // Depth test always passes (depth test disabled)
        gl.depthFunc(gl.ALWAYS); 

        // Render weapons
        this.renderNode(weapon.node, modelMatrix);

        // Reset depth function
        // Depth test pass if new depth test value is LESS (closer) then existing one 
        gl.depthFunc(gl.LESS);

        // Render weapons again, but this time they will only be drawn where the stencil value is 1
        this.renderNode(weapon.node, modelMatrix);
    }

    setMaterial(material, shader) {
        const gl = this.gl;
        const uniforms = shader.uniforms;
        gl.uniform4fv(uniforms.uMaterial.baseFactor, material.baseFactor);
        gl.uniform3fv(uniforms.uMaterial.specularFactor, material.specularFactor);
        gl.uniform1f(uniforms.uMaterial.roughnessFactor, material.roughnessFactor);
    }
    renderBlendedPrimitive(primitive, shader) {
        const gl = this.gl;

        //gl.depthFunc(gl.ALWAYS); 
        gl.disable(gl.CULL_FACE);
        gl.blendFunc(gl.ONE, gl.ONE); 

        this.renderPrimitive(primitive, shader);

        //gl.depthFunc(gl.LESS);
        gl.enable(gl.CULL_FACE);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
    }

    renderPrimitive(primitive, shader) {
        const gl = this.gl;

        const uniforms = shader.uniforms;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;
        this.setMaterial(material, shader);

        // Load image texture
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uTexture, 0);

        const glTexture = this.prepareImage(material.baseTexture.image);
        const glSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        gl.uniform1i(uniforms.uNormalMap, 0);

        // Load normal texture
        if (material.normalTexture) {
            gl.uniform1i(uniforms.uNormalMap, 1);
            gl.uniform1f(uniforms.uNormal.factor, material.normalFactor);
            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(uniforms.uNormal.texture, 1);

            const glTextureNormal = this.prepareImage(material.normalTexture.image);
            const glSamplerNormal = this.prepareSampler(material.normalTexture.sampler);

            gl.bindTexture(gl.TEXTURE_2D, glTextureNormal);
            gl.bindSampler(1, glSamplerNormal);
        }

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }

}
