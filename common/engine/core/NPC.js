import { mat4, vec3, quat } from '../../../lib/gl-matrix-module.js';
import { Transform, Character, Audio } from '../../../common/engine/core.js';

export class NPC extends Character {

    constructor({
        // Character
        node,
        health = 100,
        armor = 1,
        maxSpeed = 4,
        attackDamage = 1,
        attackSpeed = 3, // Attack every 3 seconds

        // NPC
        player,

        // Role
        // 0 - enemy
        // 1 - friendly
        role,
        // Minor, major, boss
        enemyType,
        // Meele, ranged 
        attackType,
        dead_animation,

    } = {}) {
        super({
            node,
            health,
            armor,
            maxSpeed
        });

        this.attackDamage = attackDamage;
        this.attackSpeed = attackSpeed;

        this.player = player;
        this.role = role;
        this.attackType = attackType;
        this.enemyType = enemyType;
        this.dead_animation = dead_animation;
    }

    get playerLocation() {
        // TODO - GlobalPlayerLocation
        return this.player.getComponentOfType(Character).location;
    }

    update(t, dt) {
        this.directLinePathing(dt);  

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
    }
    proocessMeeleAttack() {
        if (this.attackCooldown > 0) {
            // Not able to attack yet
            return;
        }
        this.player.getComponentOfType(Character).adjustHealth(-this.attackDamage);
        // Play sound effect
        this.player.getComponentOfType(Audio).playAudio('opponents', 'punch1');
        
        this.attackCooldown = this.attackSpeed;
    }

    directLinePathing(dt) {
        const direction = new vec3.create();
        vec3.sub(direction, this.playerLocation, this.location);
        // Check if NPC is too close to player
        if (this.attackType == 'meele') {
            let distance;
            if (this.enemyType == 'minor') { distance = 2.5; }
            if (this.enemyType == 'major') { distance = 3; }
            if (this.enemyType == 'boss') { distance = 7; } 

            if (vec3.len(direction) < distance) {
                // NPC in meele range
                this.proocessMeeleAttack();
                return;
            }
        }
        if (this.attackType == 'ranged' && vec3.len(direction) < 7) {
            // Terrorist (ranged range)
            // process ranged attack
            return;
        }

        const transform = this.node.getComponentOfType(Transform);
        vec3.normalize(direction, direction);

        // Calculate rotation based on the direction vector
        const angle = Math.atan2(direction[0], direction[2]) + Math.PI;
        const rotationY = quat.fromEuler(quat.create(), 0, angle * (180 / Math.PI), 0);
        transform.rotation = rotationY;

        if (this.attackType == 'stationary') {
            // Eye - only rotation
            return;
        }

        // Velocity (trnslation)
        const velocity = vec3.create();
        vec3.scale(velocity, direction, this.maxSpeed)
        velocity[1] = 0;

        vec3.scaleAndAdd(transform.translation, transform.translation, velocity, dt);
        

    }
}
