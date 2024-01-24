import { vec3 } from '../../../../lib/gl-matrix-module.js';
import { BVH, Transform } from '../../core.js';

 import { 
    aabbIntersection, 
    aabbRayIntersectionBVH,
} from '../../physics/collision/AabbUtils.js';
import { 
    obbIntersection, 
    obbRayIntersectionBVH,
} from '../../physics/collision/ObbUtils.js';
import { 
    sphereIntersection, 
    sphereOBBIntersection, 
    sphereAABBIntersection,
    sphereRayIntersectionBVH 
} from '../../physics/collision/SphereUtils.js';

/* ---------------- Utils --------------- */

export function getTransformedBVs(bvNode, node) {
    return {
        primary: bvNode.primary.getTransformed(node),
        secondary: bvNode.secondary ? bvNode.secondary.getTransformed(node) : null,
    };
}

export function getTransformedBVRay(bvNode, node) {
    return {
        primary: bvNode.primary.getTransformed(node),
    };
}

function checkObjectBVHIntersection(aBv, b, bvNode, intersection) {
    const bBv = getTransformedBVs(bvNode, b);
    

    // Check ray intersection
    const colliding = objectBVHIntersection(aBv, bBv, intersection);
    
    if (!colliding) {
        return false;
    }
    if (!bvNode.children || bvNode.children.length === 0) {
        if (intersection) {
            intersection.part = bvNode.name;
        }
        return true;
    }

    // Check children
    for (const bvChild of bvNode.children) {
        const child_collision = checkObjectBVHIntersection(aBv, b, bvChild, intersection);
        
        // Return if any child is colliding
        // Check all children - return array of minDiff (or minDiff + minDiff)
        if (child_collision) {
            return true;
        }
    }
    // No child is colliding
    if (intersection) {
        intersection.minDiff = null;
    }
    return false;
}

export function checkObjectCollision(a, b, intersection=null, test) {
    const aBVH = a.getObjectBVH().root;
    const bBVH = b.getObjectBVH().root;
    //if (b.name == 'Floor') return;

    const aBv = getTransformedBVs(aBVH, a);
    const colliding = checkObjectBVHIntersection(aBv, b, bBVH, intersection, test);

    return colliding;
}

export function objectBVHIntersection(aBv, bBv, intersection=null) {
    // 1. Check Broad-phase collision (OPTIONAL)
    const aBvSec = aBv.secondary;
    const bBvSec = bBv.secondary;

    // Check if a and b are of same bouding volume 
    if (aBvSec && bBvSec && aBvSec.shape === bBvSec.shape) {
        if (!shapeIntersection(aBvSec, bBvSec)) {
            return false;
        }
    }
    // 2. Check Narrow-phase collision
    const aBvPrim = aBv.primary;
    const bBvPrim = bBv.primary;

    // aBVolumeShape == bBoundingVolumeShape
    if (aBvPrim.shape === bBvPrim.shape) {
        return shapeIntersection(aBvPrim, bBvPrim, intersection);
    }
    // aBoundingVolumeShape != bBoundingVolumeShape
    // Sphere vs. OBB - minDiff - TODO
    const [sphere, obb] = aBvPrim.shape === "Sphere" ? [aBvPrim, bBvPrim] : [bBvPrim, aBvPrim];
    return sphereOBBIntersection(sphere, obb, intersection)
    return false;
    // TODO - Sphere vs. AABB
    // TODO - AABB vs. OBB
}

function checkRayBVHIntersection(a, bvNode, tRay, intersection) {
    const aBv = getTransformedBVRay(bvNode, a);

    // Check ray intersection
    const t_entry = rayIntersection(aBv.primary, tRay);
    //console.log(bvNode.name, t_entry);
    //console.log(intersection.t_lowest);

    if (t_entry === false) {
        return Infinity;
    }

    // If bvNode has no children, return t_entry
    if (!bvNode.children || bvNode.children.length === 0) {
        return t_entry;
    }

    let minChildIntersection = Infinity;

    // If colliding, check children
    for (const child of bvNode.children) {
        const t_child = checkRayBVHIntersection(a, child, tRay, intersection);
        //console.log("T entry:", t_child);
        // Update minChildIntersection only if the child's intersection parameter is smaller
        
        if (t_child < minChildIntersection) {
            //console.log("New min", t_child);
            minChildIntersection = t_child;
            intersection.part = child.name;
        }
    }

    return minChildIntersection;
}



export function checkRayVolumeIntersection(a, rayCast, intersection) {
    // Check ray vs. volume (a) intersection of BVH
    const bvRoot = a.getRayBVH().root;
    const tRay = rayCast.getTransformedRay();

    // Reset intersection part
    intersection.part = null;
    // Run Ray vs. BVH intersection traverse
    // Function returns minimal entry value of children intersection
    // If no intersection return Infinity
    const min_entry = checkRayBVHIntersection(a, bvRoot, tRay, intersection);
    
    // Update nearest object
    // t_lowest --> nearest object (intersection)
    if (min_entry < intersection.t_lowest) {
        const entryVector = vec3.scaleAndAdd(vec3.create(), tRay.origin, tRay.direction, min_entry);
        //const exitVector = vec3.scaleAndAdd(vec3.create(), ray.origin, ray.direction, t.exit);
        intersection.vector = entryVector;
        intersection.t_lowest = min_entry;
        intersection.node = a;
        intersection.min_part = intersection.part;
        
    }
}

function shapeIntersection(aBv, bBv, intersection) {
    // a.shape === b.shape
    if (aBv.shape == "AABB") {
        // AABB vs. AABB
        // aabbIntersection(aBv, bBv) - True/False
        // minDiff = aabbMinDiff(a, b) - minimal diffrence
        return aabbIntersection(aBv, bBv, intersection);
    }
    if (aBv.shape == "OBB") {
        // OBB vs. OBB
        // obbIntersection(aBv, bBv) - True/False
        // obbMinIntersection(aBv, bBv) - minimal difference 
        return obbIntersection(aBv, bBv, intersection);
    }
    if (aBv.shape == "Sphere") {
        // Sphere vs. Sphere
        // sphereIntersection(aBv, bBv) - True/False
        // TODO - minDiff
        return sphereIntersection(aBv, bBv, intersection);
    }
    return null;
}

function rayIntersection(aBv, ray) {
    if (aBv.shape == "AABB") {
        // AABB vs. Ray
        return aabbRayIntersectionBVH(aBv, ray);
    }
    if (aBv.shape == "OBB") {
        // OBB vs. Ray
        return obbRayIntersectionBVH(aBv, ray);
    }
    if (aBv.shape == "Sphere") {
        // Sphere vs. Ray
        return sphereRayIntersectionBVH(aBv, ray);
    }
    return null;
}