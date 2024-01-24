import { Transform, RayCast, HUD } from '../core.js';

export class Character {

    constructor({
        node,

        // Stats
        health = 200,
        armor = 1,
        maxSpeed = 5,

    } = {}) {
        this.node = node;

        this.health = health;
        this.armor = armor;
        this.maxSpeed = maxSpeed;

        this.activeWeapon = null;
        this.primaryWeapon = null;
        this.secondaryWeapon = null;
        this.specialWeapon = null;

        this.audio_system = null;
    }

    set location(location) {
        this.node.getComponentOfType(Transform).translation = location;
    }
    get location() {
        // GlobalLocation - TODO
        return this.node.getComponentOfType(Transform).translation;
    }

    update(t, dt) {
        // Process HUD elements (values)
        const hud = this.node.getComponentOfType(HUD)
        if (hud) {
            // Update health 
            hud.setValue('health', this.health);
            // Update flashLight staus 
            hud.setValue('flash_light', this.flashLight.intensity === 0 ? 'OFF' : 'ON');

            // Update weapon properties 
            const weapon = this.activeWeapon;
            if (weapon) {
                // Update active weapon
                hud.setValue('weapon', weapon.name);
                // Update magazine/cpacity
                hud.setValue('magazine', weapon.magazineSize + '/' + weapon. magazineCapacity);
                // Update reload status 
                hud.setVisible('reload', weapon.reloading);
                // Update laser status 
                hud.setValue('laser_status', weapon.activeLaser.status ? 'ON' : 'OFF');
                
            }  
        }
    }
    isDead() {
        return this.health <= 0;
    }

    adjustHealth(value) {
        this.health += value; 
        //console.log(this.node.name, "HP adjusted by: ", value);
        //console.log(this.health)
        //return this.health <= 0;
    }

    switchActiveWeapon(new_weapon) {
        if(this.activeWeapon.reloading) {
            return;
        }
        // Cancle reload
        //this.activeWeapon.reloadCancle(); 
        if (this.activeWeapon.activeLaser.status) {
            this.toggleLaser();
        }

        // Switch weapons
        this.activeWeapon.node.visible = false;
        this.setActiveWeapon(new_weapon);
    }
    setActiveWeapon(new_weapon) {
        this.activeWeapon = new_weapon;
        this.activeWeapon.node.visible = true;
    }

    fireWeapon() { this.activeWeapon.fire(); }
    reloadWeapon() { this.activeWeapon.reload(); }
    toggleLaser(laser) { this.activeWeapon.toggleLaser(laser); }
    toggleScope(node) { this.activeWeapon.toggleScope(node); }


    toggleflashLight() { 
        if (this.flashLight.intensity == 0) {
            // Turn ON 
            this.flashLight.intensity = 3;
        } else { 
            // Turn OFF
            this.flashLight.intensity = 0;
        }
    }

    setPrimaryWeapon(weapon) { 
        this.primaryWeapon = weapon;
        this.setWeapon(weapon);
    }
    setSecondaryWeapon(weapon) { 
        this.secondaryWeapon = weapon; 
        this.setWeapon(weapon);
    }
    setSpecialWeapon(weapon) { 
        this.specialWeapon = weapon; 
        this.setWeapon(weapon);
    }
    setWeapon(weapon) {
        if (weapon) { 
            this.node.addChild(weapon.node); 
            if (weapon.type === 0) {
                const rayCast = weapon.node.getComponentOfType(RayCast);
                rayCast.transformNode = weapon.node.parent;
            }
        }
    }

    getPrimaryWeapon() { return this.primaryWeapon; }
    getSecondaryWeapon() { return this.secondaryWeapon; }
    getSpecialWeapon() { return this.specialWeapon; }
}
