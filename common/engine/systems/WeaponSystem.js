import { vec3, vec4, mat4, quat } from '../../../lib/gl-matrix-module.js';
import { Transform, Node, Character, Line, Projectile, Weapon, Model } from '../core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from '../core/MeshUtils.js';

import { ModelLoader } from '../loaders/ModelLoader.js';

export class WeaponSystem {

    constructor(assetManager) {
        this.assetManager = assetManager;

        this.initModel();
        this.initWeapons();

    }

    update(t, dt) {

    }

    initWeapons() {
        this.weaponAssets = this.assetManager.get3D_ModelAssets().getAssetsByCategory('weapons');
        this.weaponSpecs = this.getWeaponSpecs();
    }

    getWeapon(weapon_name) {
        if (this.weaponSpecs[weapon_name] && this.weaponAssets[weapon_name]) {
            return this.createWeapon(weapon_name);
        } else {
            console.warn(`Warning: Weapon data or assets not found for ${weapon_name}`);
            return null;
        }
    }

    createWeapon(weapon_name) {
        const weapon_spec = this.weaponSpecs[weapon_name];
        const weapon_asset = this.weaponAssets[weapon_spec.weaponModel]; // Node

        const weapon_node = new Node();
        weapon_node.name = weapon_asset.name;
        weapon_node.children = weapon_asset.children;
        weapon_node.visible = false;

        const transfrom = new Transform();
        weapon_node.addComponent(transfrom);
        weapon_node.addComponent(weapon_asset.getComponentOfType(Model));

        vec3.add(transfrom.translation, transfrom.translation, [0.85, -0.5, -2.4])
        // TODO rotateY insted Z
        quat.rotateY(transfrom.rotation, transfrom.rotation, -Math.PI/64)
        //quat.rotateX(transfrom.rotation, transfrom.rotation, Math.PI/55)

        const weapon_component = new Weapon({ ...weapon_spec, node: weapon_node });
        weapon_node.addComponent(weapon_component);
        return weapon_component;
        
    }

   getWeaponSpecs() {
        return {
            ak47_rifle: {
                name: "ak47",
                type: 0,
                damage: 35,
                fireRate: 500,
                magazineCapacity: 30,
                reloadTime: 2,
                weaponModel: "ak47_rifle",
                fire_sfx: "sfx_gunshot1",
            },
            sniper_rifle: {
                name: "sniper",
                type: 0,
                damage: 100,
                fireRate: 40,
                magazineCapacity: 5,
                reloadTime: 3,
                weaponModel: "sniper_rifle",
                fire_sfx: "sfx_snipershot",
            },
            rpg: {
                name: "rpg",
                type: 1,
                projectileSpeed: 15,
                damage: 100,
                fireRate: 30,
                magazineCapacity: 1,
                reloadTime: 2,
                weaponModel: "rpg",
                projectileModel: "rpg_rocket",
                fire_sfx: "sfx_rocketshot",
                hit_sfx: "sfx_explosion",
            },
        };
    }

    processFireAction(source, holdTime) {
        const character = source.getComponentOfType(Character);
        const weapon = character.activeWeapon;

        if (weapon.fireDown) {
            return;
        }
        if (weapon.magazineSize === 0) {
            weapon.reload();
            return;
        }
        // Process fire action 
        if (weapon.type === 0) {
            // Shoot --> create line
            // new Line();
            this.createLine(source, weapon, holdTime);
        } else if (weapon.type === 1) {
            // new Projectile();
            // Shoot --> create projectile
            this.createProjectile(source, weapon);
        } else {
            // Handle unexpected weapon type or provide a default action
            console.warn("Unexpected weapon type:", weapon.type);
            // Provide a default action or throw an error as needed
        }
        character.fireWeapon();
        
    }

    createLine(source, weapon, holdTime){
        const transform = source.getComponentOfType(Transform);

        // vForward = forward vector
        // vForward = camera rotation * [0, 0, -1]
        const vForward = vec3.fromValues(0, 0, -1);

        // 0. recoil/spred = vForward * rotation 
        const min = Math.PI/64 * holdTime;
        const max = Math.PI/32 * holdTime;
        // Random = rnd(0, 1) * range(max - min) + min
        const rndX = Math.random() * (max - min) + min;
        vec3.rotateX(vForward, vForward, [0, 0, 0], rndX);

        const left = Math.PI/160 * holdTime;
        const right = Math.PI/160 * holdTime * -1;
        // Random = rnd(0, 1) * range(L - R) + R
        const rndY = Math.random() * (left - right) + right;
        vec3.rotateY(vForward, vForward, [0, 0, 0], rndY);

        // Rotate by camera (player) rotation
        vec3.transformQuat(vForward, vForward, transform.rotation);

        // Shoot --> create line 
        // 1. Origin = camera position (offset + translation)
        const origin = vec3.create();
        vec3.add(origin, vForward, transform.translation);

        // 2. End = Origin + vForward * 100
        const end = vec3.create();
        vec3.scaleAndAdd(end, origin, vForward, 200);

        // Set properities of Line component
        // true = updateTraceLine (Physics collision)
        weapon.node.getComponentOfType(Line).setLine(origin, end, true);
    }

    createProjectile(source, weapon) {
        const projectile = new Node();

        // 1. Projectile
        projectile.addComponent(new Projectile(projectile, weapon));
     
        // 2. Model
        const model = this.weaponAssets[weapon.projectileModel].getComponentOfType(Model);
        
        projectile.addComponent(model);

        // 3. Transform
        const transform = source.getComponentOfType(Transform);
        const matrix = mat4.create();

        mat4.fromRotationTranslation(matrix, transform.rotation, transform.translation);
        mat4.translate(matrix, matrix, [0, 0, -1]); // [0, 0, -1] - vForward
        mat4.scale(matrix, matrix, [0.35, 0.35, 0.35]);

        projectile.addComponent(new Transform({ matrix }));

        // 4. Define aabb
        const boxes = this.baseModel.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
        projectile.aabb = mergeAxisAlignedBoundingBoxes(boxes);

        // 5. Ignore global parent transformation
        projectile.useLocalTransformationOnly = true;

        source.addChild(projectile);  
    }

    async createTestBox(position, rotation, scale) {
        
        const box = new Node();
        box.addComponent(new Transform({
            translation: position,
            rotation: rotation,
            scale: scale
            
        }));
        box.addComponent(await this.createModel());
        return box;
    }
    async initModel() {
        this.baseModel = await this.createModel();
    }
    async createModel() {
        const meshUrl = '../../../common/assets/models/cube.json';
        const imageUrl = '../../../common/assets/images/grayscale.png';
        const loader = new ModelLoader();
        const model = await loader.loadModel(meshUrl, imageUrl);
        return model;
        
    }

}