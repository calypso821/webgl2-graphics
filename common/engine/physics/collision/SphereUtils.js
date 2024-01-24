import { raySphereIntersection } from './RayIntersectionUtils.js';
import { vec3, mat4 } from '../../../../lib/gl-matrix-module.js';
import { getClosestPointBox } from './AabbUtils.js';

// Sphere vs. AABB (Accurate check)
export function sphereAABBIntersection(sphere, rect) {
    // Get closes point to box
    const closestPoint = getClosestPointBox(sphere.center, rect);
    const squaredDistance = vec3.sqrDist(sphere.center, closestPoint);
    return squaredDistance < (sphere.r * sphere.r);
}

export function sphereAABBMinIntersection(sphere, rect, intersection) {
    // Get closes point to box
    const closestPoint = getClosestPointBox(sphere.center, rect);

    const distance = vec3.dist(sphere.center, closestPoint);
    // Calculate minimal diffrence from center to closes point of box
    if (distance < sphere.r) {
        // Value
        const minValue = sphere.r-distance;
        // Box direction
        const boxCenter = vec3.add(vec3.create(), rect.min, rect.max);
        vec3.scale(boxCenter, boxCenter, 0.5);
        const boxDirection = vec3.sub(vec3.create(), sphere.center, boxCenter);
        // Min diff direction
        const directionV = vec3.sub(vec3.create(), closestPoint, sphere.center);
        vec3.normalize(directionV, directionV);
        // Min diff
        const minDiff = vec3.scale(vec3.create(), directionV, minValue);
        //minDiff[1] = 0;
        const dotProduct = vec3.dot(minDiff, boxDirection);

        // If the dot product is positive (minDiff, obb1 facing same direction)
        // reverse the direction of the minDiff

        if (dotProduct > 0) {
            vec3.negate(minDiff, minDiff);
        }
        intersection.minDiff = minDiff;
        intersection.closest = vec3.dist(sphere.center, closestPoint);
        return true;
    }
    return false;
}

export function sphereOBBIntersection(sphere, obb, intersection) {
    // 1. Obb to local space
    const newMin = vec3.create();
    const newMax = vec3.scale(vec3.create(), obb.halfExtents, 2);

    // 2. Sphere in box's local space
    const boxToSphere = vec3.sub(vec3.create(), sphere.center, obb.center);
    const rotation = mat4.fromQuat(mat4.create(), obb.rotation);
    const invertedRotation = mat4.invert(mat4.create(), rotation);
    const rotatedBoxToSphere = vec3.transformMat4(vec3.create(), boxToSphere, invertedRotation);
    const localSphereCenter = vec3.add(vec3.create(), rotatedBoxToSphere, obb.halfExtents);

    const new_box = { min: newMin, max: newMax };
    const new_sphere = { center: localSphereCenter, r: sphere.r };
    // 3. Check AABB
    if (intersection) {
        if (sphereAABBMinIntersection(new_sphere, new_box, intersection)) {
            // Transform the minimal difference back to world space
            vec3.transformQuat(intersection.minDiff, intersection.minDiff, obb.rotation);
            return true;
        }
        return false;
    }
    // If no intersection (no minDiff needed) - return true/false
    return sphereAABBIntersection(new_sphere, new_box);
}


export function sphereIntersection(sphere1, sphere2, intersection) {
    const squaredDistance = vec3.sqrDist(sphere1.center, sphere2.center);
    const squaredSumR = Math.pow(sphere1.r + sphere2.r, 2);
    if (intersection) {
        intersection.closest = vec3.dist(sphere1.center, sphere2.center) - sphere2.r
    }
    return squaredDistance < squaredSumR;                               
}
export function spherePointIntersection(point, sphere) {
    const squaredDistance = vec3.sqrDist(sphere.center, point);
    const squaredR = sphere.r * sphere.r;
    return squaredDistance < squaredR;                               
}

export function sphereRayIntersectionMin(node, sphere, ray, intersection) {
    // Sphere  vs. Ray (line)
    // Calculate t.entry and t.exit (entry, exit aabb intersection)
    const t = {
        entry: 0,
        exit: 1,
    };
    // 2. Check intersection
    if (!raySphereIntersection(ray, sphere, t)) {
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
export function sphereRayIntersectionBVH(sphere, ray) {
    // Sphere  vs. Ray (line) - BVH edition
    // Calculate t.entry and t.exit (entry, exit aabb intersection)
    const t = {
        entry: Infinity,
        exit: 0,
    };
    // 2. Check intersection
    if (!raySphereIntersection(ray, sphere, t)) {
        return false;
    }
    // t_lowest set in BVH traverse function
    return t.entry;
}