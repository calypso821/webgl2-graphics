import { RayCast, Audio, Animation, HUD, Camera } from '../../../common/engine/core.js';
import { CharacterMovementController } from '../controllers/CharacterMovementController.js'

export class Weapon {

    constructor({
        // code - TODO
        name,
        node,
        type, 
        // Type
        // 0 - ray (hitscan)
        // 1 - projectile 
        projectileSpeed = 15,
        projectileExplosion = false,
        explosionRadius = 2, 
        // maxTravelDistance
        // lineDropOffDamge

        // Stats
        damage,
        // Shoots per minute!
        fireRate,

        // Scope (zoom)
        scope = false,
        scope_image = null,

        laser = false,

        // Reload
        magazineCapacity,
        reloadTime,

        // Model
        weaponModel,
        projectileModel = null,

        // Sounds
        fire_sfx = null,
        hit_sfx = null,
        reload_sfx = null,
        reload_animation = null,
    
    } = {}) {
        this.name = name;
        this.node = node;
        this.type = type;

        if (this.type === 0) {
            this.node.addComponent(new RayCast(node));
        }

        this.projectileSpeed = projectileSpeed;
        this.projectileExplosion = projectileExplosion;
        this.explosionRadius = explosionRadius;
        this.damage = damage;
        this.fireRate = fireRate;

        this.magazineCapacity = magazineCapacity;
        this.magazineSize = magazineCapacity;
        this.reloadTime = reloadTime;

        this.reloading = false;
        this.fireDown = false;

        this.scope = scope;
        this.scope_image = scope_image;
        this.laser = laser;

        this.weaponModel = weaponModel;
        this.projectileModel = projectileModel;

        this.fire_sfx = fire_sfx;
        this.hit_sfx = hit_sfx;
        this.reload_sfx = reload_sfx;
        this.reload_animation = reload_animation;

        this.activeLaser = { 
            status: false,
            node: null
        }
    }

    update(t, dt) {
        // RELOAD
        if (this.reloading) {
            this.reload_dt += dt;
            if (this.reload_dt >= this.reloadTime) {
                this.reloadComplete();
            }
        }
        // FIRE DOWN TIME 
        if (this.fireDown) {
            this.fire_dt += dt;
            // Shoots per minute
            const fireRate_min = this.fireRate;
            // Shoots per seconde
            const fireRate_sec = fireRate_min / 60;

            if (this.fire_dt >= 1/fireRate_sec) {
                this.fireDown = false;
            }
        }
    }
    reload() {
        const fullAmmo = this.magazineSize == this.magazineCapacity;
        if (!this.reloading && !fullAmmo) {
            this.node.getComponentOfType(Animation).get(this.reload_animation).playAll();
            this.node.parent.getComponentOfType(Audio).playAudio('weapons', this.reload_sfx);
            this.reload_dt = 0;
            this.reloading = true;
        } 
    }
    reloadCancle() {
        if (this.reloading) {
            this.node.parent.getComponentOfType(Audio).stopAudio();
            // TODO - stop sfx
            this.node.getComponentOfType(Animation).get(this.reload_animation).stopAll();
            this.reloading = false;
        }
    }
    reloadComplete() {
        this.reloading = false;
        this.fireDown = false;
        this.magazineSize = this.magazineCapacity;
    }
    fire() {
        this.node.parent.getComponentOfType(Audio).playAudio('weapons', this.fire_sfx);
        this.fireDown = true; 
        this.fire_dt = 0;

        if (this.reloading) {
            // If reloading - cancle reloading
           this.reloadCancle();
        }
        
        this.magazineSize--; 
        // Auto reload at 0 
        if (this.magazineSize === 0) {
            this.reload();
        }
    }
    toggleScope(node) {
        if (this.scope) {
            const hud = this.node.getComponentOfType(HUD);
            const camera = node.getComponentOfType(Camera);
            const cont = node.getComponentOfType(CharacterMovementController);
            if (!this.scoped) {
                // Scope
                hud.setVisible('scope', true);
                camera.fovy = 0.4;
                this.scoped = true;
                cont.pointerSensitivity *= 0.5;
                this.node.visible = false;
            } else {
                // Unscope
                hud.setVisible('scope', false);
                camera.fovy = 1;
                this.scoped = false;
                cont.pointerSensitivity /= 0.5;
                this.node.visible = true;
            }
        }
    }
    toggleLaser(laser) {
        if (this.laser) {
            if (!this.activeLaser.status) {
                // Add laser
                laser.getComponentOfType(RayCast).transformNode = this.node;
                this.node.addChild(laser);
                this.activeLaser = { status: true, node: laser };
            } else {
                // Remove laser
                this.node.removeChild(this.activeLaser.node); 
                this.activeLaser = { status: false, node: null };
            }
        }
    }
}
