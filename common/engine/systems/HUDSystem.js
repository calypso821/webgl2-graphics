import { vec3, vec4, mat4, quat } from '../../../lib/gl-matrix-module.js';
import { Transform, Node, NPC, Character, TextElement } from '../core.js';

import { ModelLoader } from '../loaders/ModelLoader.js';

export class HUDSystem {

    constructor(camera, npc_system) {
        this.elements = new Set();
        this.camera = camera;
        this.npc_system = npc_system;

    }

    initHUDElements() {
        this.character = this.camera.getComponentOfType(Character);
        // CHARACTER 
        // 1. Health 
        this.hud_health = new TextElement({ 
            text: "Health: ",
            value: this.character.health, 
            position: [50, 50], 
            color: "blue" 
        });
        // 2. Weapon
        this.hud_weapon = new TextElement({ 
            text: "Weapon: ",
            value: this.character.activeWeapon.name, 
            position: [50, 100], 
            color: "blue" 
        }); 
        // 3. Magazine capacity/size
        this.hud_magazine = new TextElement({ 
            text: "Magazine: ",
            value: this.character.activeWeapon.magazineSize + '/' +
                   this.character.activeWeapon.magazineCapacity, 
            position: [50, 150], 
            color: "blue" 
        }); 
        // 4. Reloading
        this.hud_reload = new TextElement({ 
            value: "Reloading...",
            position: [50, 200], 
            color: "blue",
            visible: false
        }); 

        // NPC
        // 1. Kills
        this.hud_npcKills = new TextElement({ 
            text: "Kills: ",
            value: this.npc_system.kills + '/' +
                   this.npc_system.targetKills, 
            position: [300, 50], 
            color: "red" 
        }); 

        // GAME 
        // 1. End
        this.hud_end = new TextElement({ 
            text: "Vicotry!",
            position: [300, 100], 
            color: "red" ,
            visible: false
        }); 

        // Add elemnts to list 
        this.elements.add(this.hud_health);
        this.elements.add(this.hud_weapon);
        this.elements.add(this.hud_magazine);
        this.elements.add(this.hud_reload);
        this.elements.add(this.hud_npcKills);
        this.elements.add(this.hud_end);
    }
    updateHUDElements() {
        // Character
        this.hud_health.value = this.character.health;
        this.hud_weapon.value = this.character.activeWeapon.name;
        this.hud_magazine.value = this.character.activeWeapon.magazineSize + '/' +
                                  this.character.activeWeapon.magazineCapacity;
        this.hud_reload.visible = this.character.activeWeapon.reloading;

        // NPC kills
        this.hud_npcKills.value = this.npc_system.kills + '/' +
                                  this.npc_system.targetKills;
        
        // Game
        this.hud_end.visible = this.npc_system.end;

    }

    update(t, dt) {
        this.updateHUDElements();
    }
  
}