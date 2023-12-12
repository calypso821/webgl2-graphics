import { Transform } from '../core.js';
import { vec3, vec4, mat4, quat } from '../../../lib/gl-matrix-module.js';


export class Projectile {

    constructor(node, weapon) {
        this.projectile = node;
        this.projectile_speed = weapon.projectileSpeed;
    }
    

    update(t, dt) {
        // Process projectile
        const transform = this.projectile.getComponentOfType(Transform);
        //console.log(this.projectile);
        //console.log(transform.translation);
        const velocity = [0, 0, 0];
        const vForward = [0, 0, -1]; // direction (forward)

        // reference direction * rotation = forward vector
        vec4.transformQuat(vForward, vForward, transform.rotation);

        // Scale forward vector with projectile_speed
 
        vec4.scale(velocity, vForward, this.projectile_speed)
        // constatnt velocity (No acceleration till max) - no need for dt!!
        // CHANGE REFRENCEDIRECTION ----> VELOCITY!!!!
        // dt ?? 
        // consistency between frames 
        // updating position 
        // used for time-dependent values (veloctiy, acceleration, decay)
        // Timed events +=dt
        // Animations
        // Physics simulation


        // Adds forward vector to object transaltion 
        vec3.scaleAndAdd(transform.translation, transform.translation, velocity, dt);
            
        // Check if projectile exceeds max length
        if(vec3.length(transform.translation) > 100) {
            this.projectile.parent.removeChild(this.projectile);
        }  
     
    }

}