import { Line, Character } from '../../../common/engine/core.js';

export class Weapon {

    constructor({
        // code - TODO
        name,
        node,
        type, 
        // Type
        // 0 - line (hitscan)
        // 1 - projectile 
        projectileSpeed = 15,
        // maxTravelDistance
        // lineDropOffDamge

        // Stats
        damage,
        // Shoots per minute!
        fireRate,

        // Reload
        magazineCapacity,
        reloadTime,

        // Model
        weaponModel,
        projectileModel = null,

        // Sounds
        fire_sfx,
        hit_sfx = null,
    
    } = {}) {
        this.name = name;
        this.node = node;
        this.type = type;

        if (this.type === 0) {
            this.node.addComponent(new Line());
        }

        this.projectileSpeed = projectileSpeed,
        this.damage = damage;
        this.fireRate = fireRate;

        this.magazineCapacity = magazineCapacity;
        this.magazineSize = magazineCapacity;
        this.reloadTime = reloadTime;

        this.reloading = false;
        this.fireDown = false;

        this.weaponModel = weaponModel;
        this.projectileModel = projectileModel;

        this.fire_sfx = fire_sfx;
        this.hit_sfx = hit_sfx;
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
            this.node.parent.getComponentOfType(Character).audio_system.playSound("sfx_reload");
            this.reload_dt = 0;
            this.reloading = true;
        } 
    }
    reloadCancle() {
        if (this.reloading) {
            this.reloading = false;
        }
    }
    reloadComplete() {
        this.reloading = false;
        this.fireDown = false;
        this.magazineSize = this.magazineCapacity;
    }
    fire() {
        this.node.parent.getComponentOfType(Character).audio_system.playSound(this.fire_sfx);
        this.fireDown = true; 
        this.fire_dt = 0;
        if (this.reloading) {
            // If reloading - cancle reloading
           this.reloading = false;
        }
        this.magazineSize--; 
        // Auto reload at 0 
        if (this.magazineSize === 0) {
            this.reload();
        }
    }
}
