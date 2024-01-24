import { 
    Transform, 
    Node, 
    NPC, 
    Animation, 
    Model, 
    Audio, 
    Weapon, 
    BVH, 
    HUD, 
    TextElement, 
    ImageElement, 
    Character,
} from '../core.js';

import { CharacterActionController } from '../controllers/CharacterActionController.js';


export class NPCSystem {

    constructor(scene, camera, assetManager, weapon_system, hud_system, game_system) {
        this.scene = scene
        this.player = camera;
        this.assetManager = assetManager;
        this.weapon_system = weapon_system;
        this.game_system = game_system;
        this.hud_system = hud_system;

        this.initializeObjectives();
        this.initAssets();
        this.initGameHUD();

    }
    initializeObjectives() {
        const objectives = this.game_system.getCurrentObjectives();

        this.objectivesStatus = {
            kills: false,
            boss: objectives.boss ? false : true,
        };

        this.portalCrossed = false;
        this.opponentTypes = objectives.opponents;
        this.next_level = objectives.next_level;

        this.delay = 0;
        this.kills = 0;
        this.activeOpponent_count = 0;
        this.targetKills = objectives.kills;
        this.boss_name = objectives.boss;
        this.spawnRate = objectives.spawnRate;
        this.boss = null;
        this.bossActive = false;
        this.level = objectives.name;
        this.end = false;
    }
    objectivesComplete() {
        return this.objectivesStatus.kills && this.objectivesStatus.boss;
    }
    initAssets() {
        this.opponentAssets = this.assetManager.getModelAssets().getAssetsByCategory('opponents');
        this.imageAssets = this.assetManager.getImageAssets().getAssetsByCategory('weapons');
        this.NPCSpecs = this.getNPCSpecs();
    }
    getNPCSpecs() {
        return {
            zombie: {
                health: 250,
                role: 'enemy',
                maxSpeed: 4.5,
                attackDamage: 2,
                attackSpeed: 3,
                enemyType: 'minor',
                attackType: 'meele',
                dead_animation: 'zombie_dead',
                model_asset: 'zombie',
            },
            terrorist: {
                health: 250,
                role: 'enemy',
                maxSpeed: 4,
                enemyType: 'minor',
                attackType: 'ranged',
                dead_animation: 'terrorist_dead',
                model_asset: 'terrorist',
            },
            redDragon: {
                health: 400,
                role: 'enemy',
                maxSpeed: 3.5,
                attackDamage: 5,
                attackSpeed: 5,
                enemyType: 'minor',
                attackType: 'meele',
                dead_animation: 'redDragon_dead',
                model_asset: 'redDragon',
            },
            purpleDragon: {
                health: 400,
                role: 'enemy',
                attackDamage: 5,
                attackSpeed: 5,
                maxSpeed: 3.5,
                enemyType: 'minor',
                attackType: 'meele',
                dead_animation: 'purpleDragon_dead',
                model_asset: 'purpleDragon',
            },
            bigDragon: {
                health: 700,
                role: 'enemy',
                attackDamage: 10,
                attackSpeed: 6,
                maxSpeed: 3,
                enemyType: 'major',
                attackType: 'meele',
                dead_animation: 'bigDragon_dead',
                model_asset: 'bigDragon',
            },
            bossDragon: {
                health: 3000,
                role: 'enemy',
                attackDamage: 30,
                attackSpeed: 10,
                maxSpeed: 2.5,
                enemyType: 'boss',
                attackType: 'meele',
                dead_animation: 'bossDragon_dead',
                model_asset: 'bossDragon',
            },
            eye: {
                health: 2500,
                role: 'enemy',
                enemyType: 'boss',
                attackType: 'stationary',
                dead_animation: 'eye_dead',
                model_asset: 'eye',
                additional_asset: 'eye_holder',
            },
            
        };
    }
    initGameHUD() {
        const hud = new HUD(this.node);
        // 1. Kills 
        hud.addElement(new TextElement({
            id: 'kills',
            text: "Objective kills: ",
            position: [50, 100], 
        }));
        // 2. Objectives complete
        hud.addElement(new TextElement({
            id: 'objectivesComplete',
            text: "Enter dark portal!",
            color: 'yellow',
            position: [600, 100],
            visible: false 
        })); 
        // 3. Active level 
        hud.addElement(new TextElement({
            id: 'activeLevel',
            text: this.level,
            position: [50, 50]
        })); 
        // 3. Boss HP level 
        hud.addElement(new TextElement({
            id: 'bossHp',
            text: 'Boss: ',
            color: 'red',
            visible: false,
            position: [600, 50]
        })); 
        // 4. Victory
        hud.addElement(new TextElement({
            id: 'victory',
            text: "Victory! Game completed!",
            color: 'red',
            position: [550, 150],
            visible: false 
        })); 
        // 5. Dead
        hud.addElement(new TextElement({
            id: 'dead',
            text: "YOU DIED!",
            color: 'red',
            position: [600, 400],
            visible: false 
        })); 
   
        hud.addElement(new ImageElement({
            id: 'head_hit_effect',
            visible: false,
            imageBitmap: this.imageAssets['head_hit'],
            ttl: 0.4,
            center: true,
        }));
        hud.addElement(new ImageElement({
            id: 'normal_hit_effect',
            visible: false,
            imageBitmap: this.imageAssets['normal_hit'],
            ttl: 0.4,
            center: true,
        }));

        this.hud = hud;
        this.hud_system.addElement(hud);
    }

    createDamgeNumberHUD(damage, color) {
        this.hud.addElement(new TextElement({
            text: Math.round(damage),
            position: this.hud_system.getRandomPositionCircle(), 
            ttl: 1,
            color: color,
            kill: true,
        }));
    }


    update(t, dt) {
        // Check if player is dead 
        const char = this.player.getComponentOfType(Character);
        if (char.isDead() && !this.end) {
            this.hud.setVisible('dead', true);
            this.game_system.restart();
            this.end = true;
        }
        // Process HUD elements (values)
        // Update kills 
        this.hud.update(t, dt);
        if (this.objectivesComplete() && this.portalCrossed && !this.end) {
            console.log("switch scene");
            this.game_system.switchScene(this.next_level);
            this.end = true;
        }
        this.portalCrossed = false;
        
        if (this.objectivesComplete()) {
            return;
        }
        
        // delta time in seconds
        this.delay += dt;
        if (this.delay > this.spawnRate && this.activeOpponent_count < 15) {
            this.delay = 0;
            this.spawnOpponent();
        }

        // GameLogicSystem !!!!
        // enemy spawning (waves)
        this.hud.setValue('kills', this.kills + '/' + this.targetKills);

        if (this.kills >= this.targetKills && !this.objectivesStatus.kills) {
            console.log("Kill objective complete");
            // Write text - objectives complete
            // cross dark portal for next level  
            this.objectivesStatus.kills = true;

            // Update victory status
            
        }
        if (this.objectivesStatus.kills && this.boss_name && !this.boss) {
            console.log("Boss spawned");
            // Spwan boss
            this.spawnBoss(this.boss_name);
            this.hud.setVisible('bossHp', true);
        }
        if (this.boss) {
            // Update boss hp
            this.hud.setValue('bossHp', this.boss.health > 0 ? this.boss.health : "dead");
        }
        //console.log(this.boss)
        if (this.boss && this.boss.isDead()) {
            console.log("Boss dead")
            // Check if boss is dead
            // if boss dead 
            this.objectivesStatus.boss = true;

            if (!this.next_level) {
                this.hud.setVisible('victory', true);
            }
            
        }
        
        if (this.objectivesComplete() && this.next_level) {
            this.hud.setVisible('objectivesComplete', this.objectivesComplete());
        }
    }
    spawnBoss(name) {
        // this.boss_name = asset
        const spawn_location = [0, 0, -25];
        const boss = this.createNPC(name, spawn_location);
        this.boss = boss;
    }

    processProjectileCollision(projectile, target, f, part) {
        // f = distance from radius (normalized)
        const factor = 1 - f;
        this.processTargetHit(projectile.parent, target, factor, part);
    }
    processLineCollision(source, target, part) {
        let factor;
        if (part == 'head') { factor = 2.5; }
        if (part == 'upper') { factor = 1; }
        if (part == 'lower') { factor = 0.3; }
        this.processTargetHit(source, target, factor, part);
    }

    processTargetHit(source, target, factor=1, part) {
        const weapon = source.getComponentOfType(Weapon);
        const damage = -weapon.damage * factor;
        // Audio (object hit)
        weapon.node.parent.getComponentOfType(Audio).playAudio('weapons', weapon.hit_sfx);

        const npc = target.getComponentOfType(NPC);
        if (!npc || npc.isDead()) { 
            return; 
        }
        // NPC (hit)

        // 1. HUD update 
        let color;
        if (part == 'head') {
            this.hud.setActive('head_hit_effect'); 
            color = 'red';
        } else if (part == 'explosion') {
            this.hud.setActive('normal_hit_effect');
            color = 'blue';
        } else {
            this.hud.setActive('normal_hit_effect');
            color = 'yellow';
        }
        this.createDamgeNumberHUD(damage, color);
        
       
        // 2. Adjust health
        npc.adjustHealth(damage);
        if (npc.isDead()) {
            target.removeComponent(npc);
            target.setUnactive();
            target.getComponentOfType(Animation).get(npc.dead_animation).play(true);
            
            this.kills += 1;
            this.activeOpponent_count--;
            //target.parent.removeChild(target);
        }

    }

    spawnOpponent(location=null) {
        this.activeOpponent_count++;

        const spawnLocations = [
            // Top Left
            [-50, 0, -50],
            // Top Right
            [50, 0, -50],
            // Bot Left
            [-50, 0,50],
            // Bot Right
            [50, 0, 50],   
        ];

        // Set random spawn location
        const rnd_spawn = Math.floor(Math.random() * spawnLocations.length);
        const spawn_location = location ? location : spawnLocations[rnd_spawn];

        // Set random enemy type 
        const rnd_type = Math.floor(Math.random() * this.opponentTypes.length);
        const opponent_name = this.opponentTypes[rnd_type];
        
        const npc = this.createNPC(opponent_name, spawn_location);
    }

    createNPC(name, location) {
        const npc_spec = this.NPCSpecs[name];
        const asset = this.opponentAssets[npc_spec.model_asset];

        // 1. Node
        const npc_node = new Node();
        npc_node.name = "npc_" + name;

        // 2. Transfromation
        const y = asset.getComponentOfType(Transform).translation[1];
        const npc_location = [location[0], y, location[2]];
        npc_node.addComponent(new Transform({ translation: npc_location }));
        
        // 3. Model
        const model = asset.getComponentOfType(Model);
        npc_node.addComponent(model);

        // 4. Models of children
        for (const child of asset.children) {
            const child_model = child.getComponentOfType(Model);
            if(child_model) {
                const child_node = new Node();
                child_node.addComponent(child_model)
                const transfrom = new Transform(child.getComponentOfType(Transform));
                child_node.addComponent(transfrom)
                npc_node.addChild(child_node);
            }
        }

        // 4. Define bouding volume hierarchy
        for (const bvh of asset.getComponentsOfType(BVH)) {
            npc_node.addComponent(bvh.createNewBVH(bvh, npc_node));
        }
        npc_node.setDynamic();
        
        // 5. NPC component
        const npc_component = new NPC({ 
            ...npc_spec, 
            node: npc_node, 
            player: this.player 
        });
        npc_node.addComponent(npc_component);

        // 6. Animations 
        const animationComp = asset.getComponentOfType(Animation);
        const new_animationComp = new Animation();
        for (const name in animationComp.animationData) {
            new_animationComp.createAP(npc_node, name, false, animationComp.animationData);
        }
        npc_node.addComponent(new_animationComp);

        // 6. Adittional assets 
        if (npc_spec.additional_asset) {
            const additionl_node = new Node();
            const addi_asset = this.opponentAssets[npc_spec.additional_asset];
            const y1 = addi_asset.getComponentOfType(Transform).translation[1];
            const addi_location = [location[0], y1, location[2]];
            additionl_node.addComponent(new Transform({ translation: addi_location }));
            const addi_model = addi_asset.getComponentOfType(Model);
            additionl_node.addComponent(addi_model);
            this.scene.addChild(additionl_node);

        }
        
        this.scene.addChild(npc_node);

        return npc_component;
    }
}