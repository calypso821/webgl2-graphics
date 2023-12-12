import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { GLTFLoader } from '../../../common/engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from '../../../common/engine/renderers/UnlitRenderer.js';

import { Camera } from '../../../common/engine/core.js';

const canvas_webgl = document.querySelector('canvas');
const gl = canvas_webgl.getContext('webgl2');

const loader = new GLTFLoader();
// new cache
// defaultScene = 0
// load .gltf - scene description, materials, meshes...
// load .bin - geometry (binary)
// load .png - textures
await loader.load('../../../common/models/icosphere/icosphere.gltf');
//await loader.load('../../../common/models/rocks/rocks.gltf');

// build scene (load Nodes (add Camera, Transform, Mesh)
const scene = loader.loadScene(loader.defaultScene);
if (!scene) {
    throw new Error('A default scene is required to run this example');
}

// Find node of type camera
const camera = scene.find(node => node.getComponentOfType(Camera));
if (!camera) {
    throw new Error('A camera in the scene is require to run this example');
}

const renderer = new UnlitRenderer(gl);

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas_webgl, resize }).start();
new UpdateSystem({ render }).start();

document.querySelector('.loader-container').remove();
