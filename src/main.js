import { WeaponSystem } from '../common/engine/systems/WeaponSystem.js';
import { AudioSystem } from '../common/engine/systems/AudioSystem.js';
import { HUDSystem } from '../common/engine/systems/HUDSystem.js';
import { SceneSystem } from '../common/engine/systems/SceneSystem.js';
import { GameSystem } from '../common/engine/systems/GameSystem.js';

import { UpdateSystem } from '../common/engine/systems/UpdateSystem.js';
import { ResizeSystem } from '../common/engine/systems/ResizeSystem.js';

import { AssetManager } from '../common/engine/loaders/AssetManager.js';
import { GLTFLoader } from '../common/engine/loaders/GLTFLoader.js';

import { DynamicRenderer } from '../common/engine/renderers/DynamicRenderer.js';
import { UnlitRenderer } from '../common/engine/renderers/UnlitRenderer.js';
import { LitRenderer } from '../common/engine/renderers/LitRenderer.js';
import { HUDRenderer } from '../common/engine/renderers/HUDRenderer.js';


const canvas_webgl = document.getElementById('webgl-canvas');
const canvas_2d = document.getElementById('2d-canvas');

const gl = canvas_webgl.getContext('webgl2');

/* ---------------------------------------------- */
/* ----------------- RENDERERS ------------------ */
/* ---------------------------------------------- */

const hud_renderer = new HUDRenderer(canvas_2d);
const hud_system = new HUDSystem(canvas_2d);
const dynamic_renderer = new DynamicRenderer(gl);
const unlit_renderer = new UnlitRenderer(gl);
const lit_renderer = new LitRenderer(gl);

/* ---------------------------------------------- */
/* ------------------- ASSETS ------------------- */
/* ---------------------------------------------- */

const assetManager = new AssetManager();
await assetManager.initAssets();
console.log(assetManager)

/* ---------------------------------------------- */
/* ------------------- SCENE -------------------- */
/* ---------------------------------------------- */

const gltfLoader = new GLTFLoader();
const scenePath = '../common/assets/scenes/';
const scenes = {
    //scene1: 'scene/scene.gltf',
    scene2: 'scene2/scene2.gltf',
    scene1: 'scene1/scene1.gltf',
    //scene_night: 'night/scene_night.gltf',
}

for (const name in scenes) {
    await gltfLoader.load(scenePath + scenes[name]);
    gltfLoader.loadAllScenes();
}

/* ---------------------------------------------- */
/* ------------------- SYSTEMS ------------------ */
/* ---------------------------------------------- */

const audio_system = new AudioSystem(assetManager.getAudioAssets());
const weapon_system = new WeaponSystem(assetManager, hud_system);
const game_system = new GameSystem(scenes);

 // Initialized new instances of resize and update (new scene)
const resize_system = new ResizeSystem({ canvas_webgl, canvas_2d });
const update_system = new UpdateSystem();

const scene_system = new SceneSystem({
    // Canvas
    canvas_webgl,
    canvas_2d,

    // Renderers
    hud_renderer,
    dynamic_renderer,
    unlit_renderer,
    lit_renderer,

    // Systems
    hud_system,
    audio_system,
    weapon_system,
    game_system,
    update_system,
    resize_system,

    // Loaders
    gltfLoader,
    assetManager,

    // Scenes (url)
    scenes,
});
game_system.scene_system = scene_system;

await game_system.start();
document.querySelector('.loader-container').remove();





