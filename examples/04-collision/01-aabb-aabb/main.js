import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { WeaponSystem } from '../../../common/engine/systems/WeaponSystem.js';
import { NPCSystem } from '../../../common/engine/systems/NPCSystem.js';
import { HUDSystem } from '../../../common/engine/systems/HUDSystem.js';
import { AudioSystem } from '../../../common/engine/systems/AudioSystem.js';
import { Physics } from '../../../common/engine/systems/Physics.js';

import { AssetManager } from '../../../common/engine/loaders/AssetManager.js';
import { GLTFLoader } from '../../../common/engine/loaders/GLTFLoader.js';

import { UnlitRenderer } from '../../../common/engine/renderers/UnlitRenderer.js';
import { HUDRenderer } from '../../../common/engine/renderers/HUDRenderer.js';

import { CharacterMovementController } from '../../../common/engine/controllers/CharacterMovementController.js';
import { CharacterActionController } from '../../../common/engine/controllers/CharacterActionController.js';

import { Camera, Model, Character } from '../../../common/engine/core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from '../../../common/engine/core/MeshUtils.js';

const canvas_webgl = document.getElementById('webgl-canvas');
const canvas_2d = document.getElementById('2d-canvas');

const gl = canvas_webgl.getContext('webgl2');

const hud_renderer = new HUDRenderer(canvas_2d);
const gl_renderer = new UnlitRenderer(gl);

/* ---------------------------------------------- */
/* ------------------- ASSETS ------------------- */
/* ---------------------------------------------- */

const assetManager = new AssetManager();
await assetManager.loadAssets();

/* ---------------------------------------------- */
/* ------------------- SCENE -------------------- */
/* ---------------------------------------------- */

const loader = new GLTFLoader();
await loader.load('scene2/scene2.gltf');
const scene = loader.loadScene(loader.defaultScene);
const camera = loader.loadNode('Camera');
camera.getComponentOfType(Camera).far = 200;

// TODO resource manager (mashes)
loader.loadNode('Barrel0').isStatic = true;
loader.loadNode('Barrel1').isStatic = true;
loader.loadNode('Barrel2').isStatic = true;
loader.loadNode('Barrel3').isStatic = true;
loader.loadNode('Barrel4').isStatic = true;
loader.loadNode('Baker_house0').isStatic = true;
loader.loadNode('Baker_house1').isStatic = true;
loader.loadNode('Baker_house2').isStatic = true;
loader.loadNode('Baker_house3').isStatic = true;
loader.loadNode('Box.000').isStatic = true;
loader.loadNode('Box.002').isStatic = true;
loader.loadNode('Box.003').isStatic = true;
loader.loadNode('Wall.000').isStatic = true;
loader.loadNode('Wall.001').isStatic = true;
loader.loadNode('Wall.002').isStatic = true;
loader.loadNode('Wall.003').isStatic = true;

/* ---------------------------------------------- */
/* ------------------- SYSTEMS ------------------ */
/* ---------------------------------------------- */

const audio_system = new AudioSystem();
const npc_system = new NPCSystem(scene, camera, audio_system, assetManager);
const weapon_system = new WeaponSystem(assetManager);
const hud_system = new HUDSystem(camera, npc_system);

/* ---------------------------------------------- */
/* -------------------- CAMERA ------------------ */
/* ---------------------------------------------- */

camera.addComponent(new CharacterMovementController(camera, canvas_webgl));
camera.addComponent(new CharacterActionController(camera, canvas_webgl, weapon_system));
camera.isDynamic = true;
camera.aabb = {
    min: [-0.2, -0.2, -0.2],
    max: [0.2, 0.2, 0.2],
};

// Init HUD elemnts (player, npcSystem)
hud_system.initHUDElements();
camera.getComponentOfType(Character).audio_system = audio_system;

/* ---------------------------------------------- */
/* ------------------- PHYSICS ------------------ */
/* ---------------------------------------------- */

const physics = new Physics(scene, npc_system);
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
        return;
    }

    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
});

/* ---------------------------------------------- */
/* -------------------- UPDATE ------------------ */
/* ---------------------------------------------- */

function update(time, dt) {
    //dt = dt/2;
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    physics.update(time, dt);
    npc_system.update(time, dt);
    hud_system.update(time, dt);
}

/* ---------------------------------------------- */
/* ------------------- RENDER ------------------- */
/* ---------------------------------------------- */

function render() {
    gl_renderer.render(scene, camera);
    hud_renderer.render(hud_system.elements);
}

/* ---------------------------------------------- */
/* ------------------- RESIZE ------------------- */
/* ---------------------------------------------- */

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas_webgl, canvas_2d, resize }).start();
new UpdateSystem({ update, render }).start();

document.querySelector('.loader-container').remove();
