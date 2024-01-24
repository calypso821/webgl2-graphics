import { vec3 } from '../../../../lib/gl-matrix-module.js';
import { rayAABBIntersection } from './RayIntersectionUtils.js'

export function aabbIntersection(aabb1, aabb2, intersection) {
    for (let i=0; i<3; i++) {
        if (!intervalIntersection(aabb1.min[i], aabb1.max[i], aabb2.min[i], aabb2.max[i])) {
            return false;
        }
    }
    if (intersection) {
        intersection.minDiff = aabbMinDiff(aabb1, aabb2);
        intersection.closest = aabbClosestPointDist(aabb1, aabb2);
    }
    return true;
}

function intervalIntersection(min1, max1, min2, max2) {
    // return true if colliding
    // min1 > max2 - TRUE -> no intersection 
    // min2 > max1 - TRUE -> no intersection
    return !(min1 > max2 || min2 > max1);
}

export function aabbRayIntersectionMin(node, aabb, ray, intersection) {
    // AABB  vs. Ray (line)
    // Calculate t.entry and t.exit (entry, exit aabb intersection)
    const t = {
        entry: Infinity,
        exit: 0,
    };
    // 2. Check intersection 
    if (!rayAABBIntersection(ray, aabb, t)) {
        return false;
    }

    // t_lowest --> nearest object (intersection)
    if (t.entry < intersection.t_lowest) {
        const entryVector = vec3.scaleAndAdd(vec3.create(), ray.origin, ray.direction, t.entry);
        //const exitVector = vec3.scaleAndAdd(vec3.create(), ray.origin, ray.direction, t.exit);
        intersection.vector = entryVector;
        intersection.t_lowest = t.entry;
        intersection.node = node;
    }
    return true;
}
export function aabbRayIntersectionBVH(aabb, ray) {
    // AABB  vs. Ray (line) - BVH edition
    // Calculate t.entry and t.exit (entry, exit aabb intersection)
    const t = {
        entry: Infinity,
        exit: 0,
    };
    // 2. Check intersection 
    if (!rayAABBIntersection(ray, aabb, t)) {
        return false;
    }
    // t_lowest set in BVH traverse function
    return t.entry;
}

export function aabbMinDiff(aBox, bBox) {
    // Move node A minimally to avoid collision.
    const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
    const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);

    let minDiff = Infinity;
    let minDirection = [0, 0, 0];

    // diff a (x, y, z)
    for (let i=0; i<3; i++) {
        if (diffa[i] < minDiff) {
            minDiff = diffa[i];
            minDirection = [0, 0, 0];
            minDirection[i] = minDiff;
        }
    }
    // diff b (x, y, z)
    for (let i=0; i<3; i++) {
        if (diffb[i] < minDiff) {
            minDiff = diffb[i];
            minDirection = [0, 0, 0];
            minDirection[i] = -minDiff;
        }
    }

    return minDirection;
}
function aabbClosestPointDist(aabb1, aabb2) {
    // Calculate center of aabb1
    const center1 = vec3.add(vec3.create(), aabb1.min, aabb1.max);
    vec3.scale(center1, center1, 0.5);

    // Clamp center to aabb2 (get closest point)
    const closest = getClosestPointBox(center1, aabb2);
    // Return distance
    return vec3.dist(center1, closest);
}
export function getClosestPointBox(center, rect) {
    // Get closest point from center to box
    return [
        getClosestByDimension(0, center, rect), 
        getClosestByDimension(1, center, rect),
        getClosestByDimension(2, center, rect)
    ];
}
function getClosestByDimension(d, center, rect) {
    // Return closest point to box (by dimension)
    if (center[d] < rect.min[d]) {
        return rect.min[d];
    }
    if (center[d] > rect.max[d]) {
        return rect.max[d];
    }
    return center[d];
}


