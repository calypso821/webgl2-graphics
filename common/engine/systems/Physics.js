import { vec3, mat4, quat } from '../../../lib/gl-matrix-module.js';
import { getGlobalModelMatrix } from '../core/SceneUtils.js';
import { Transform, Projectile, Line, Node } from '../core.js';
import { ModelLoader } from '../../../common/engine/loaders/ModelLoader.js';


export class Physics {

    constructor(scene, npc_system) {
        this.scene = scene;
        this.npc_system = npc_system;
        this.createModel(); // test model
    }

    update(t, dt) {
        
        this.scene.traverse(node => {
            // Object collision
            if (node.isDynamic) {
                this.scene.traverse(other => {
                    if (node !== other && other.isStatic) {
                        this.resolveCollision(node, other);
                    }
                });
            }
       
            // Projectile collision
            const projectile = node.getComponentOfType(Projectile);
            if (projectile) {
                this.scene.traverse(other => {
                    if (other.isStatic || other.isDynamic) {
                        this.resolveProjectileCollision(node, other);
                    }
                });
                
            }
            
            // Line collision
            const line = node.getComponentOfType(Line);
            if (line && line.updateTraceLine) {
                this.resolveLineCollision(node.parent, line);
                line.updateTraceLine = false;
            }
        });    

    }

    /* ---------------------------------------------- */
    /* ---------------- BOX COLLISION --------------- */
    /* ---------------------------------------------- */

    resolveCollision(a, b) {
        // Get global space AABBs.
        const aBox = this.getTransformedAABB(a);
        const bBox = this.getTransformedAABB(b);

        // Check if there is collision.
        const isColliding = this.aabbIntersection(aBox, bBox);
        if (!isColliding) {
            return;
        }

        // Move node A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
        const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);

        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] >= 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] >= 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] >= 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] >= 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] >= 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] >= 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }

        const transform = a.getComponentOfType(Transform);
        if (!transform) {
            return;
        }

        vec3.add(transform.translation, transform.translation, minDirection);
    }

    aabbIntersection(aabb1, aabb2) {
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }

    intervalIntersection(min1, max1, min2, max2) {
        // return true if colliding
        // min1 > max2 - TRUE -> no intersection 
        // min2 > max1 - TRUE -> no intersection
        return !(min1 > max2 || min2 > max1);
    }

    /* ---------------------------------------------- */
    /* ------------- PROJECTILE COLLISION ----------- */
    /* ---------------------------------------------- */

    resolveProjectileCollision(projectile, b) {
        if(!projectile.parent)
            return;
        // Get global space AABBs.
        const projBox = this.getTransformedAABB(projectile);
        const bBox = this.getTransformedAABB(b);
    
        // Check if there is collision.
        const isColliding = this.aabbIntersection(projBox, bBox);
        if (!isColliding) {
            return;
        }
        
        // Process collision
        this.npc_system.processProjectileCollision(projectile, b); 
        
        

        
        // ----- BULLET HOLE --------- TODO
        const transform_p = projectile.getComponentOfType(Transform);
        const transform_b = b.getComponentOfType(Transform);

        const b_rotation_inverse = quat.create();
        quat.conjugate(b_rotation_inverse, transform_b.rotation)

        // 1. subtract, apply inverse roation 
        vec3.subtract(transform_p.translation, transform_p.translation, transform_b.translation);
        vec3.transformQuat(transform_p.translation, transform_p.translation, b_rotation_inverse);

        // 1. apply inverse roation, subtract - NOT WORKING
        //const rotated_vector = vec3.create();
        //vec3.transformQuat(rotated_vector, transform_b.translation, b_rotation_inverse);
        //vec3.subtract(transform_p.translation, transform_p.translation, rotated_vector);

        // apply inverse(rotation) on subtracted vector

        // WHY? 1. transformation = b trnslation + b rotation 
        // inverse of b rotation = back to base rotation
        // 1. subtract 
        // 2. apply inverse rotation 
        // TODO

        //b.addChild(projectile);

    }


    /* ---------------------------------------------- */
    /* --------------- LINE COLLISION --------------- */
    /* ---------------------------------------------- */

    resolveLineCollision(a, line){
        // LINE = NEW NODE 
        // node.accChild(LINE)
        let intersect_cnt = 0;

        //this.proj_system.createTestBox(origin, line.rotation, this.scene);
        //this.proj_system.createTestBox(end, line.rotation, this.scene);

        // f_lowest --> nearest object (intersection)
        // vIntersection --> Collision point
        const intersection = {
            f_lowest: 1, 
            vector: line.end,
        };

        this.scene.traverse(other => {
            if (other.isStatic || other.isDynamic) {
                if (this.aabbLineIntersection(other, line.origin, line.end, intersection)) {
                    intersect_cnt++;
                }
            }
        });

        if (intersection.f_lowest == 1) { // No intersection
            return;
        }
        // LINE = node

        // Process collision
        this.npc_system.processLineCollision(a, intersection.node); 

        // ----- BULLET HOLE --------- TODO       
        const transform_i = intersection.node.getComponentOfType(Transform);

        const i_rotation_inverse = quat.create();
        quat.conjugate(i_rotation_inverse, transform_i.rotation)

        // 1. subtract, apply inverse roation 
        const translation = new vec3.create();
        vec3.subtract(translation, intersection.vector, transform_i.translation);
        vec3.transformQuat(translation, translation, i_rotation_inverse);

        
        const box = new Node();
        // 1. intersection.vector - intersection.node.translation
        box.addComponent(new Transform({
            translation: translation,
            scale: [0.05, 0.05, 0.05]
            
        }));

    
        box.addComponent(this.baseModel);
        intersection.node.addChild(box);
    }

    aabbLineIntersection(b, origin, end, intersection) {
        const aabbBox = this.getTransformedAABB(b);
        // For every dimension x, y, z
        // calculate f_low, f_high
        // set new f_low, f_high 
        // If return true - intersection (hit)

        const f = {
            low: 0,
            high: 1,
        };

        // Clip line x - dimension
        if(!this.clipLine(0, aabbBox, origin, end, f))
            return false;
        // Clip line y - dimension
        if(!this.clipLine(1, aabbBox, origin, end, f))
            return false;
        // Clip line z - dimension
        if(!this.clipLine(2, aabbBox, origin, end, f))
            return false;

        // All 3 dimension clipLine = True --> Intersetion
        // create intersection vector 
        // Vector b = end - origin 
        // I = origin + b * f_low
        const vB = vec3.create();
        vec3.subtract(vB, end, origin);
        const vIntersection = vec3.create();
        vec3.scaleAndAdd(vIntersection, origin, vB, f.low); // OUTPUT 
       
        // f_lowest --> nearest object (intersection)
        if (f.low < intersection.f_lowest) {
            intersection.vector = vIntersection;
            intersection.f_lowest = f.low;
            intersection.node = b;
        }
        
        return true;
    }
    clipLine(d, aabb, origin, end, f) {
        // d = dimension (x, y, z)
        let f_dim_low = (aabb.min[d] - origin[d]) / (end[d] - origin[d]);
        let f_dim_high = (aabb.max[d] - origin[d]) / (end[d] - origin[d]);

        // Swap if needed
        if (f_dim_high < f_dim_low) {
            [f_dim_low, f_dim_high] = [f_dim_high, f_dim_low];
        }

        // Check line intersection
        if (f.low > f_dim_high) // Check LEFT
            return false;
        
        if (f_dim_low > f.high) // Check RIGHT
            return false;

        f.low = Math.max(f.low, f_dim_low);
        f.high = Math.min(f.high, f_dim_high);

        if (f.low > f.high) { 
            // Should not happen!
            // Not valid interval (overlapping)
            return false;
        }

        return true;
    }

    /* ---------------------------------------------- */
    /* ---------------- TRANSFORM BOX --------------- */
    /* ---------------------------------------------- */

    getTransformedAABB(node) {
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const { min, max } = node.aabb;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, matrix));
        // v = vector 
        // transform vector with node's global matrix
        // vertices -> transformed vertices

        // Find new min and max by component.
        const xs = vertices.map(v => v[0]); // x - values of vertices
        const ys = vertices.map(v => v[1]); // y - vals`of vertices
        const zs = vertices.map(v => v[2]); // z - values of vertices
        // Extract min, max 
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newmin, max: newmax };
    }
    // TEST MODEL
    async createModel() {
        const meshUrl = '../../../common/assets/models/cube.json';
        const imageUrl = '../../../common/assets/images/grayscale.png';
        const loader = new ModelLoader();
        const model = await loader.loadModel(meshUrl, imageUrl);
        this.baseModel = model;
    }
}
