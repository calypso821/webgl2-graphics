import { vec3, vec4, mat4, quat } from '../../../lib/gl-matrix-module.js';
import { Transform, Node, Character, Animation, Projectile, Weapon, Model, Light, LaserRay, VFX, BVH, BulletRay, RayCast, ImageElement, HUD } from '../core.js';

import { ModelLoader } from '../loaders/ModelLoader.js';

export class WeaponSystem {

    constructor(assetManager, hud_system) {
        this.assetManager = assetManager;
        this.hud_system = hud_system;

        this.initWeapons();
        this.initLaser();

    }

    update(t, dt) {

    }

    initWeapons() {
        this.weaponModelAssets = this.assetManager.getModelAssets().getAssetsByCategory('weapons');
        this.weaponImageAssets = this.assetManager.getImageAssets().getAssetsByCategory('weapons');
  
        this.weaponSpecs = this.getWeaponSpecs();
    }
    initLaser() {
        this.vfxAssets = this.assetManager.getVFXAssets();
    }

    getWeapon(weapon_name) {
        if (this.weaponSpecs[weapon_name] && this.weaponModelAssets[weapon_name]) {
            return this.createWeapon(weapon_name);
        } else {
            console.warn(`Warning: Weapon data or assets not found for ${weapon_name}`);
            return null;
        }
    }

    createWeapon(weapon_name) {
        const weapon_spec = this.weaponSpecs[weapon_name];
        const weapon_model = this.weaponModelAssets[weapon_spec.weaponModel]; // Node\

        const weapon_node = new Node();
        weapon_node.name = weapon_model.name;
        for (const child of weapon_model.children) {
            weapon_node.children.push(child);
        }
        weapon_node.visible = false;

        // Animation
        if (weapon_model.getComponentOfType(Animation)) {
            const animation = weapon_model.getComponentOfType(Animation);
            animation.createAP(weapon_node, weapon_spec.reload_animation, true);
            weapon_node.addComponent(animation);
        }
        // Add scope HUD 
        if (weapon_spec.scope) {
            const hud = new HUD();
            const image = new ImageElement({
                id: 'scope',
                visible: false,
                imageBitmap: this.weaponImageAssets[weapon_spec.scope_image],
                fullscreen: true,
            });
            hud.addElement(image);
            weapon_node.addComponent(hud);
            this.hud_system.addElement(hud)
        }
        
        const transfrom = new Transform();
        weapon_node.addComponent(transfrom);
        weapon_node.addComponent(weapon_model.getComponentOfType(Model));
        vec3.add(transfrom.translation, transfrom.translation, [0.17, -0.12, -0.42]);

        const weapon_component = new Weapon({ ...weapon_spec, node: weapon_node });
        weapon_node.addComponent(weapon_component);
        return weapon_component;
        
    }
    
    getWeaponSpecs() {
    // TODO - weaponSpec class !!!
    // name, type, damage, fireRate, mgazineCapacity, reloadTime, weaponModel
    // ActualWeapon (+ magzie size, realod = true, ...)
        return {
            ak47_rifle: {
                name: "ak47",
                type: 0,
                damage: 35,
                fireRate: 500,
                magazineCapacity: 30,
                reloadTime: 2,
                laser: true,
                weaponModel: 'ak47_rifle',
                fire_sfx: 'ak_47_gunshot2',
                reload_animation: 'ak47_reload',
                reload_sfx: 'ak47_reload',
            },
            sniper_rifle: {
                name: "sniper",
                type: 0,
                damage: 100,
                fireRate: 40,
                magazineCapacity: 5,
                reloadTime: 2.5,    
                scope: true,
                scope_image: 'sniper_scope_zoom1',
                weaponModel: 'sniper_rifle',
                fire_sfx: 'sniper_gunshot3',
                reload_animation: 'sniper_reload',
                reload_sfx: 'sniper_reload',
            },
            rpg: {
                name: "rpg",
                type: 1,
                projectileSpeed: 30,
                projectileExplosion: true,
                explosionRadius: 2.5,
                damage: 200,
                fireRate: 30,
                magazineCapacity: 1,
                reloadTime: 2.2,
                weaponModel: 'rpg',
                projectileModel: 'rpg_rocket',
                fire_sfx: 'rpg_gunshot',
                hit_sfx: 'rocket_hit',
                reload_animation: 'rpg_reload',
                reload_sfx: 'rpg_reload',
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
            // Shoot --> create ray
            // new Line();
            this.createBulletRay(source, weapon, holdTime);
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
    getBulletModel() {
        return this.weaponModelAssets['bullet'].getComponentOfType(Model);
    }

    createBulletRay(source, weapon, holdTime){
        const transform = source.getComponentOfType(Transform);

        // vForward = forward vector
        // vForward = camera rotation * [0, 0, -1]
        const vForward = vec3.fromValues(0, 0, -1);

        // 0. recoil/spred = vForward * rotation 
        // Vertical recoil (x - axis)
        const min = Math.PI/64 * holdTime;
        const max = Math.PI/32 * holdTime;
        // Random = rnd(0, 1) * range(max - min) + min
        const rndX = Math.random() * (max - min) + min;
        vec3.rotateX(vForward, vForward, [0, 0, 0], rndX);

        // Horizontal recoil (y - axis)
        const left = Math.PI/160 * holdTime;
        const right = Math.PI/160 * holdTime * -1;
        // Random = rnd(0, 1) * range(L - R) + R
        const rndY = Math.random() * (left - right) + right;
        vec3.rotateY(vForward, vForward, [0, 0, 0], rndY);

        // Rotate by camera (player) rotation
        //vec3.transformQuat(vForward, vForward, transform.rotation);

        // Shoot --> create ray
        // 1. Origin = camera position (offset + translation)
        // TODO - get global camera position (getGlobalModelMatrix - extract translation)
        const origin = vec3.add(vec3.create(), transform.translation, vForward);

        // 2. Direction vector (normalized)
        const directionVector = vForward;
        //console.log(directionVector)
 
        // 3. Ray length (shoot distance)
        const ray = new BulletRay([0, 0, 0], vForward, 300);

        // set new ray --> newRay = true (Physics collision)
        weapon.node.getComponentOfType(RayCast).setRay(ray);
    }

    createProjectile(source, weapon) {
        const projectile = new Node();
        projectile.name = weapon.name + "_projectile";

        // 1. Projectile
        projectile.addComponent(new Projectile(projectile, weapon));
     
        // 2. Model
        const projectileAsset = this.weaponModelAssets[weapon.projectileModel];
        const model = projectileAsset.getComponentOfType(Model);
        projectile.addComponent(model);

        // 3. Transform
        const transform = source.getComponentOfType(Transform);
        const matrix = mat4.create();

        mat4.fromRotationTranslation(matrix, transform.rotation, transform.translation);
        mat4.translate(matrix, matrix, [0, 0, -0.4]); // [0, 0, -1] - vForward
        mat4.scale(matrix, matrix, [1, 1, 1]);

        projectile.addComponent(new Transform({ matrix }));

        // 4. Define aabb

        const bvh = new BVH({
            min: [-0.1, -0.1, -0.1],
            max: [0.1, 0.1, 0.1],
            node: projectile
        });
        projectile.addComponent(bvh);


        // 5. Ignore global parent transformation
        // TODO - add to Tranform component
        projectile.useLocalTransformationOnly = true;
        
        weapon.node.addChild(projectile);  
    }
    createExplosionVFX(location) {
        const expl_asset = this.vfxAssets.getAssetByName('explosion', 'Explosion'); // Node

        const expl_node = new Node();
        expl_node.name = 'explosion';

        const animationComp = expl_asset.getComponentOfType(Animation);
        const new_animationComp = new Animation();
        for (const name in animationComp.animationData) {
            new_animationComp.createAP(expl_node, name, false, animationComp.animationData);
        }
        expl_node.addComponent(new_animationComp);

        expl_node.addComponent(new VFX({ node: expl_node, ttl: 2.5 }));
        location[1] +=1;
        vec3.add(location, location, expl_asset.getComponentOfType(Transform).translation);
        const transfrom = new Transform({ translation: location });
        expl_node.addComponent(transfrom);
        const light = new Node();
        const asset_light = expl_asset.children[0];
        light.addComponent(asset_light.getComponentOfType(Light));
        light.addComponent(new Transform({ translation: asset_light.getComponentOfType(Transform).translation }));
        expl_node.addComponent(expl_asset.getComponentOfType(Model));
        expl_node.addChild(light);
        expl_node.useLocalTransformationOnly = true;
        return expl_node;
    }
    createLaserRay() {
        const laser_asset = this.vfxAssets.getAssetByName('laser', 'Laser'); // Node

        const laser_node = new Node();
        laser_node.name = 'laser';

        laser_node.addComponent(new VFX());

        const scale = [0.3, 0.3, 1];
        const translation = [0, -0.02, 0];


        const transfrom = new Transform({ translation, scale });
        laser_node.addComponent(transfrom);
        laser_node.addComponent(laser_asset.getComponentOfType(Model));


        //vec3.mul(transfrom.scale, transfrom.scale, [1, 1, 10])
        //vec3.add(transfrom.translation, transfrom.translation, [0, -1, 0])
        
        // TODO rotateY insted Z
        //quat.rotateY(transfrom.rotation, transfrom.rotation, Math.PI/45)
        //quat.rotateX(transfrom.rotation, transfrom.rotation, Math.PI/80)
        //quat.rotateX(transfrom.rotation, transfrom.rotation, Math.PI/2)

        // 3. Ray length (shoot distance)
        const laser = new LaserRay([0, 0, 0], [0, 0, -1], 300);

        // 4. Ray cast component
        const rayCast = new RayCast(laser_node);
        rayCast.setRay(laser)
        
        // set new ray --> newRay = true (Physics collision)
        laser_node.addComponent(rayCast);

        return laser_node;
    }
}