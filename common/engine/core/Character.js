import { mat4, vec3 } from '../../../lib/gl-matrix-module.js';
import { Transform, Weapon } from '../core.js';

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
        return this.node.getComponentOfType(Transform).translation;
    }

    update(t, dt) {
        //this.activeWeapon.update(t, dt);
    }

    adjustHealth(value) {
        this.health += value; 
        //console.log("HP adjusted: ", this.health);
        return this.health <= 0;
    }

    switchActiveWeapon(new_weapon) {
        // Cancle reload
        this.activeWeapon.reloadCancle(); 

        // Switch weapons
        this.activeWeapon.node.visible = false;
        new_weapon.node.visible = true; 
        this.activeWeapon = new_weapon;
    }

    fireWeapon() { this.activeWeapon.fire(); }
    reloadWeapon() { this.activeWeapon.reload(); }

    setPrimaryWeapon(weapon) { 
        this.primaryWeapon = weapon;
        if (weapon) { this.node.addChild(weapon.node); }

    }
    setSecondaryWeapon(weapon) { 
        this.secondaryWeapon = weapon; 
        if (weapon) { this.node.addChild(weapon.node); }
    }
    setSpecialWeapon(weapon) { 
        this.specialWeapon = weapon; 
        if (weapon) { this.node.addChild(weapon.node); }
    }

    getPrimaryWeapon() { return this.primaryWeapon; }
    getSecondaryWeapon() { return this.secondaryWeapon; }
    getSpecialWeapon() { return this.specialWeapon; }
}
