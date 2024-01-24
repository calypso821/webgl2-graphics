import { vec3, quat } from '../../../lib/gl-matrix-module.js';
import { 
    Transform, 
    Projectile, 
    RayCast, 
    Node, 
    BVH, 
    NPC, 
    Weapon, 
    BVNode, 
    Camera, 
    Animation } from '../core.js';
import { 
    checkObjectCollision,
    checkRayVolumeIntersection
} from '../physics/collision/CollisionUtils.js';

export class CollisionSystem {

    constructor(scene, npc_system, weapon_system) {
        this.scene = scene;
        this.npc_system = npc_system;
        this.weapon_system = weapon_system;
    }

    update(t, dt) {
        
        this.scene.traverse(node => {
            // Projectile collision
            const projectile = node.getComponentOfType(Projectile);
            if (projectile) {
                this.scene.traverse(other => {
                    if (node !== other && (other.isStatic() || other.isDynamic())) {
                        this.resolveProjectileCollision(node, other);
                    }
                });
                
            }

            // Object collision
            if (node.isDynamic()) {
                this.scene.traverse(other => {
                    if (node !== other && (other.isStatic() || other.isDynamic())) {
                        this.resolveObjectCollision(node, other);
                    }
                });
            }
            
            // Ray collision
            const rayCast = node.getComponentOfType(RayCast);
            if (rayCast && rayCast.newRay) {
                this.resolveRayCollision(node.parent, rayCast);
            }
        });    
    }

    /* ---------------- OBEJCT COLLISION --------------- */

    resolveObjectCollision(a, b) {
        // Check AABB and OBB collision.
        const intersection = {
            minDiff: null
        }
        if (!checkObjectCollision(a, b, intersection)) {
            return;
        } 
        // Check if player did cross portal
        //console.log(intersection.part)
        if (a.getComponentOfType(Camera) && intersection.part == 'bvPortal') {
            this.npc_system.portalCrossed = true;
        }

        const transform = a.getComponentOfType(Transform);
        if (transform && intersection.minDiff) {
            //const minDirection = aabbMinDiff(aBVs.secondary, bBVs.secondary);
            vec3.add(transform.translation, transform.translation, intersection.minDiff);
        }
    }

    /* ------------- PROJECTILE COLLISION ----------- */

    resolveProjectileCollision(projectile, b) {
        if(!projectile.parent)
            return; 

        // Check AABB and OBB collision.
        if (!checkObjectCollision(projectile, b)) {
            return;
        } 

        // Process collision
        console.log("Projectile collision", b);
        const location = projectile.getComponentOfType(Transform).translation;
        const weapon = projectile.parent.getComponentOfType(Weapon);

        // Direct hit (f = 0) distance from center 
        this.npc_system.processProjectileCollision(projectile, b, 0, 'head'); 

        // Explosion hit
        
        if (weapon.projectileExplosion) {
            const expl_vfx = this.weapon_system.createExplosionVFX(location);
            console.log(expl_vfx)
            expl_vfx.getComponentOfType(Animation).get('explosion_scale').play(true);
            projectile.parent.addChild(expl_vfx);
        
            const explosion = new Node();
            explosion.addComponent(new Transform({ translation: location }));
            explosion.addComponent(this.createExplosionBVH(weapon.explosionRadius, explosion));
            
            this.scene.traverse(other => {
                const npc = other.getComponentOfType(NPC);
                // other != b (direct hit already processed)
                if (npc && other != b) {
                    const intersection = { 
                        closest: null
                    }

                    if (other.isDynamic() && checkObjectCollision(explosion, other, intersection, true)) {
                        // Normalize distance value [0, 1]
                        const f = intersection.closest / weapon.explosionRadius;
                        //console.log("Hit", other.name, f);
                        // Process npc (adjust health)
    
                        this.npc_system.processProjectileCollision(projectile, other, f, 'explosion');  
                    }
                }
            });
        }


        // Remove projectile 
        projectile.parent.removeChild(projectile);
    }
    createExplosionBVH(radius, node) {
        const explBvh = new BVH();
        const bvNode = new BVNode();
        bvNode.createBVSphere([-radius, -radius, -radius], [radius, radius, radius]);
        explBvh.setRoot(bvNode);
        explBvh.setNode(node);
        return explBvh;
    }

    /* ---------------- Ray COLLISION --------------- */

    resolveRayCollision(a, rayCast){
        // t_lowest --> nearest object (intersection)
        // vIntersection --> Collision point
        const intersection = {
            t_lowest: Infinity, 
            vector: null,
            node: null,
        };

        const source = rayCast.transformNode; // camera (player)

        this.scene.traverse(other => {
            if (other !== source && (other.isStatic() || other.isDynamic())) {
                checkRayVolumeIntersection(other, rayCast, intersection);
            }
        });

        // Ray processed
        rayCast.newRay = false;

        if (intersection.t_lowest == Infinity) { // No intersection
            return;
        }

        // Process ray intersection

        if (rayCast.isLaser()) {
            // adjust laser ray length
            rayCast.ray.length = intersection.t_lowest;
            //console.log(rayCast.ray.length)
        }
        if (rayCast.isBullet()) {
            this.npc_system.processLineCollision(rayCast.node, intersection.node, intersection.min_part);
            
            // ----- BULLET HOLE --------- 
            const position = this.nodeIntersectionVector(intersection);

            const box = new Node();
            box.addComponent(new Transform({
                translation: position,
                scale: [1.2, 1.2, 1.2]
                
            }));
            const model = this.weapon_system.getBulletModel();
            box.addComponent(model);
            intersection.node.addChild(box);
        }
    }
    nodeIntersectionVector(intersection) {
        // TODO - use globalTransformation
        const transform = intersection.node.getComponentOfType(Transform);
    
        const rotation_inverse = quat.create();
        quat.conjugate(rotation_inverse, transform.rotation);
    
        // 1. subtract, apply inverse translation 
        const translation = vec3.clone(intersection.vector); // Clone to avoid modifying the original vector
        vec3.subtract(translation, translation, transform.translation);
    
        // 2. apply inverse rotation 
        vec3.transformQuat(translation, translation, rotation_inverse);
    
        // 3. apply inverse scale
        const scale_inverse = vec3.create();
        vec3.inverse(scale_inverse, transform.scale);
        vec3.multiply(translation, translation, scale_inverse);
    
        return translation;
    }
    
}
