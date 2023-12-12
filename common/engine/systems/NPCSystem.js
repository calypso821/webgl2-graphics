import { vec3, vec4, mat4, quat } from '../../../lib/gl-matrix-module.js';
import { Transform, Node, NPC, Character, Model } from '../core.js';

import { ModelLoader } from '../loaders/ModelLoader.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from '../core/MeshUtils.js';


export class NPCSystem {

    constructor(scene, camera, audio_system, assetManager) {
        this.scene = scene
        this.player = camera;
        this.audio_system = audio_system;
        this.assetManager = assetManager;
        this.initOpponents();
        
        this.delay = 0;
        this.spawnOpponent();
        this.kills = 0;
        this.targetKills = 50;
        this.end = false;

    }
    initOpponents() {
        this.opponentAssets = this.assetManager.get3D_ModelAssets().getAssetsByCategory('opponents');
    }


    update(t, dt) {
        // delta time in seconds
        this.delay += dt;
        if (!this.end && this.delay > 2) {
            this.delay = 0;
            this.spawnOpponent()
        }

        // GameLogicSystem !!!!
        // enemy spawning (waves)
        
    }
    processProjectileCollision(projectile, target) {
        const weapon = projectile.parent.getComponentOfType(Character).activeWeapon;
        // Remove projectile 
        projectile.parent.removeChild(projectile);
        this.processTargetHit(weapon, target);
        this.audio_system.playSound(weapon.hit_sfx);

    }
    processLineCollision(source, target) {
        const weapon = source.getComponentOfType(Character).activeWeapon;
        this.processTargetHit(weapon, target);
    }

    processTargetHit(weapon, target) {
        const npc = target.getComponentOfType(NPC);
        if (npc) {
            const dead = npc.adjustHealth(-weapon.damage);
            if (dead) {
                this.kills += 1;
                if (this.kills == this.targetKills) {
                    this.end = true
                    console.log("END");
                }
                this.scene.removeChild(target);
            }
        }
    }

    spawnOpponent() {
        const positions = [
            [-8, 1, -7],
            [8, 1, -7],
            [-25, 1, -25],
            [-25, 1, 25],
            [25, 1, 25],
            [25, 1, -25],

        ]
        const randomIndex = Math.floor(Math.random() * positions.length);
        const scale = [0.5, 0.5, 0.5];
        const role = 0; // enemy
        this.createNPC(role, positions[randomIndex], scale);
    }

    async createNPC(role, position, scale) {
        const npc = new Node();
        npc.isDynamic = true;

        
        
        npc.addComponent(new Transform({ translation: position }));

        const model = this.opponentAssets['zombie1'].getComponentOfType(Model);
        npc.addComponent(model);

        // 4. Define aabb
        const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
        npc.aabb = mergeAxisAlignedBoundingBoxes(boxes);
        
        npc.addComponent(new NPC({ node: npc, role: role, player: this.player }));



        // is Dynamic 
        // define aabbb collision

        this.scene.addChild(npc);
        //console.log("NPC created");
    }

    async createNPCModel() {
        const meshUrl = '../../../common/assets/models/cube.json';
        const imageUrl = '../../../common/assets/images/grass.png';
        const loader = new ModelLoader();
        const model = await loader.loadModel(meshUrl, imageUrl);
        //this.baseModel = model;
        return model;
    }
}