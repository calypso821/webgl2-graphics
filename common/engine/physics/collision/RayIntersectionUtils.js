import { vec3, mat4 } from '../../../../lib/gl-matrix-module.js';

export function rayOBBIntersection(ray, obb, t) {
    // Unit vector (pointing in direction of ray - length 1 - normalized)
    const directionVector = ray.direction;
    
    const x_axis = vec3.fromValues(1, 0, 0);
    const y_axis = vec3.fromValues(0, 1, 0);
    const z_axis = vec3.fromValues(0, 0, 1);

    // Rotate the axis based on the OBB's rotation
    const rotation = mat4.fromQuat(mat4.create(), obb.rotation);
    vec3.transformMat4(x_axis, x_axis, rotation);
    vec3.transformMat4(y_axis, y_axis, rotation);
    vec3.transformMat4(z_axis, z_axis, rotation);

    const p = vec3.sub(vec3.create(), obb.center, ray.origin);
    
    // Project direction of the ray onto each axis of box
    // (D * x_axis, D * y_axis) -> Scale 
    const f = vec3.fromValues(
        vec3.dot(x_axis, directionVector),
        vec3.dot(y_axis, directionVector),
        vec3.dot(z_axis, directionVector)
    );
    // Project p onto every axis of box
    // (p * x, p * y) -> Ex
    const e = vec3.fromValues(
        vec3.dot(x_axis, p),
        vec3.dot(y_axis, p),
        vec3.dot(z_axis, p)
    )
  
    const min = vec3.divide(vec3.create(), vec3.sub(vec3.create(), e, obb.halfExtents), f);
    const max = vec3.divide(vec3.create(), vec3.add(vec3.create(), e, obb.halfExtents), f);

    const t_entry = Math.max(
        Math.min(min[0], max[0]), // X
        Math.min(min[1], max[1]), // Y
        Math.min(min[2], max[2])  // Z
    );
    const t_exit = Math.min(
        Math.max(min[0], max[0]), // X
        Math.max(min[1], max[1]), // Y
        Math.max(min[2], max[2])  // Z
    );

    // negative t_exit (opposite direction)
    if (t_exit < 0 || t_entry > t_exit) {
        return false;
    }
    // Check max distance of ray
    if (t_entry > ray.length) {
        return false;
    }
    // Check If origin in box (t_entry - behind origin - negative)
    const max_entry = Math.max(t_entry, 0)

    t.entry = max_entry;
    t.exit = t_exit;
    return true;
}
export function raySphereIntersection(ray, sphere, t) {
    // Unit vector (pointing in direction of ray - length 1 - normalized)
    const directionVector = ray.direction;

    // Vector pointing from origin to center of sphere
    const e = vec3.sub(vec3.create(), sphere.center, ray.origin);

    const r_squared = sphere.r * sphere.r;
    const e_squared = vec3.length(e) * vec3.length(e);

    // Projection of e onto directionVector
    const a = vec3.dot(e, directionVector);
    const b_squared = e_squared - (a * a);

    // Check if intersection occured
    if (r_squared - b_squared < 0) {
        return false;
    }

    const f = Math.sqrt(r_squared - b_squared);

    // Set to 0 if point inside sphere - OPTIONAL: (e_squared < r_squared)
    const t_entry = Math.max(a - f, 0);
    const t_exit = a + f;

    // Intersection behind origin
    if (t_exit < 0) {
        return false;
    }

    // Check max distance of ray
    if (t_entry > ray.length) {
        return false;
    }
    
    t.entry = t_entry;
    t.exit = t_exit;
    return true;
}

export function rayAABBIntersection(ray, aabb, t) {
    // Check if ray starts or ends in box
    // Problem - no entry, exit point
    /*
    if (pointInAABB(ray.origin, aabb) || pointInAABB(ray.end, aabb)) {
        return true;
    }
    */

    // Unit vector (pointing in direction of ray - length 1 - normalized)
    const directionVector = ray.direction;

    // originMax
    const originMax = vec3.sub(vec3.create(), aabb.max, ray.origin);
    const max = vec3.divide(vec3.create(), originMax, directionVector);
    // originMin
    const originMin = vec3.sub(vec3.create(), aabb.min, ray.origin);
    const min = vec3.divide(vec3.create(), originMin, directionVector);

    const t_entry = Math.max(
        Math.min(min[0], max[0]), // X
        Math.min(min[1], max[1]), // Y
        Math.min(min[2], max[2])  // Z
    );
    const t_exit = Math.min(
        Math.max(min[0], max[0]), // X
        Math.max(min[1], max[1]), // Y
        Math.max(min[2], max[2])  // Z
    );
    
    
    // negative t_exit (opposite direction)
    if (t_exit < 0 || t_entry > t_exit) {
        return false;
    }
    // Check max distance of ray
    if (t_entry > ray.length) {
        return false;
    }
    // Check If origin in box (t_entry - behind origin - negative)
    const max_entry = Math.max(t_entry, 0)
    
    t.entry = max_entry;
    t.exit = t_exit;
    
    return true;
}
function pointInAABB(point, aabb) {
    return intervalIntersectionByDimension(0, aabb, point) &&
            intervalIntersectionByDimension(1, aabb, point) &&
            intervalIntersectionByDimension(2, aabb, point);

}

function intervalIntersectionByDimension(d, a, p) {
    return !(a.min[d] >  p[d] || a.max[d] < p[d]);
}
