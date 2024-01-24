
import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { NPCSystem } from '../../../common/engine/systems/NPCSystem.js';
import { CollisionSystem } from '../../../common/engine/systems/CollisionSystem.js';

import { CharacterMovementController } from '../../../common/engine/controllers/CharacterMovementController.js';
import { CharacterActionController } from '../../../common/engine/controllers/CharacterActionController.js';

import { Camera, Audio, Transform, SpotLight, Node } from '../../../common/engine/core.js';

export class SceneSystem {
    constructor({
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
        assetManager
    }) {
        this.canvas_webgl = canvas_webgl;
        this.canvas_2d = canvas_2d;

        this.renderers = {
            hud_renderer,
            dynamic_renderer,
            unlit_renderer,
            lit_renderer
        };

        this.systems = {
            hud_system,
            audio_system,
            weapon_system,
            game_system,
            update_system,
            resize_system,
        };

        this.gltfLoader = gltfLoader;
        this.assetManager = assetManager;
    }


    async initializeScene(sceneUrl) {
        const scenePath = '../../../common/assets/scenes/';
        const gltfLoader = this.gltfLoader;
        const canvas_webgl = this.canvas_webgl;
        const canvas_2d = this.canvas_2d;
        const renderers = this.renderers;
        const systems = this.systems;
        systems.hud_system.clearElements();

        // Load scene
        await gltfLoader.load(scenePath + sceneUrl);
        
        const scene = gltfLoader.loadScene(gltfLoader.defaultScene);
        console.log(scene)
        const camera = gltfLoader.loadNode('Camera');
        camera.getComponentOfType(Camera).far = 200;
        camera.setDynamic();
        camera.addComponent(new Audio(systems.audio_system)); 

        systems.audio_system.startSoundtrackAudio();

        // Initialize systems
        const npc_system = new NPCSystem(
            scene, 
            camera, 
            this.assetManager, 
            systems.weapon_system, 
            systems.hud_system,
            systems.game_system,
        );

        const collision_system = new CollisionSystem(
            scene, 
            npc_system, 
            systems.weapon_system
        );

        // Initlize controllers (+ camera)

        const movementController = new CharacterMovementController(
            camera, 
            canvas_webgl
        );
        const actionController = new CharacterActionController(
            camera, 
            canvas_webgl, 
            systems.weapon_system, 
            systems.hud_system,
        );

        // TESTING 
        const portal = this.assetManager.getModelAssets().getAssetByName('structures', 'portal');
        scene.addChild(portal)

        camera.addComponent(movementController);
        camera.addComponent(actionController)   

        // Update function
        function update(time, dt) {
            /*
            if (speedManager.slowmotion) {
                dt = dt/2;
            }
            */
            scene.traverse(node => {
                for (const component of node.components) {
                    component.update?.(time, dt);
                }
            });

            collision_system.update(time, dt);
            npc_system.update(time, dt);
        }

        
        // Render function
        function render() {
            renderers.dynamic_renderer.render(scene, camera);
            //renderers.lit_renderer.render(scene, camera);
            //renderers.unlit_renderer.render(scene, camera);
            renderers.hud_renderer.render(systems.hud_system.getElements());
        }

        // Resize function
        function resize({ displaySize: { width, height }}) {
            camera.getComponentOfType(Camera).aspect = width / height;
        }

        const update_system =  this.systems.update_system;
        const resize_system =  this.systems.resize_system;

        update_system.application = { update, render };
        update_system.start();

        resize_system.resize = resize;
        resize_system.start();
        
    }
}