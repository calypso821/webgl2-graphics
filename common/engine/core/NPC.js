import { mat4, vec3 } from '../../../lib/gl-matrix-module.js';
import { Transform, Character } from '../../../common/engine/core.js';

export class NPC extends Character {

    constructor({
        // Character
        node,
        health = 100,
        armor = 1,
        maxSpeed = 4,
        weapon,

        // NPC
        player,

        // Role
        // 0 - enemy
        // 1 - friendly
        role,

    } = {}) {
        super({
            node,
            health,
            armor,
            maxSpeed,
            weapon,
        });

        this.player = player;
        this.role = role;

    }

    get playerLocation() {
        return this.player.getComponentOfType(Transform).translation;
    }

    update(t, dt) {
        this.directLinePathing(dt);  
    }

    directLinePathing(dt) {
        const direction = new vec3.create();
        vec3.sub(direction, this.playerLocation, this.location);
        vec3.normalize(direction, direction);

        const velocity = vec3.create();
        vec3.scale(velocity, direction, this.maxSpeed)
        //console.log(vec3.length(velocity));
 
        vec3.scaleAndAdd(this.location, this.location, velocity, dt);

        const transform = this.node.getComponentOfType(Transform);
        transform.translation = this.location;
        transform.translation[1] = 0.5;
    }
}
