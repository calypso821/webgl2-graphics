import { vec3, mat4 } from '../../../../lib/gl-matrix-module.js';
import { rayOBBIntersection } from './RayIntersectionUtils.js'

export function obbIntersection(obb1, obb2, intersection) {
    const obb1_v = getTransformedOBBVertices(obb1);
    const obb2_v = getTransformedOBBVertices(obb2);
    if (intersection) {
        // intersection: True/False
        // + closest point, min difference
        return SatOBBMinOverlap(obb1_v, obb2_v, intersection);
    }
    return separatingAxisTheoremOBB(obb1_v, obb2_v);
}
export function obbMinIntersection(obb1, obb2) {
    const obb1_v = getTransformedOBBVertices(obb1);
    const obb2_v = getTransformedOBBVertices(obb2);
    return SatOBBMinOverlap(obb1_v, obb2_v);
}

function separatingAxisTheoremOBB(obb1, obb2) {
    const axes = [...obb1.normals, ...obb2.normals];

    for (const axis of axes) {
        const projection1 = project(obb1.vertices, axis);
        const projection2 = project(obb2.vertices, axis);
        if (!overlap(projection1, projection2)) {
            return false; // Separating Axis found, no collision
        }
    }
    return true; // No Separating Axis found, collision detected
}
function SatOBBMinOverlap(obb1, obb2, intersection) {
    const axes = [...obb1.normals, ...obb2.normals];

    let minOverlap = Infinity;
    let minAxis = null;

    for (const axis of axes) {
        const projection1 = project(obb1.vertices, axis);
        const projection2 = project(obb2.vertices, axis);
        const new_overlapValue = overlapValue(projection1, projection2);
        if (new_overlapValue < 0) {
            return false; // Separating Axis found, no collision
        }

        // Check if this is the smallest overlap (minOverlap - overlap function)
        if (Math.abs(new_overlapValue) < Math.abs(minOverlap)) {
            minOverlap = new_overlapValue;
            minAxis = axis;
        }
    }
    // No Separating Axis found, collision detected
    // Calculate the minimum translation vector
    const minDiff = vec3.scale(vec3.create(), minAxis, minOverlap);

    // Determine the direction of the minDiff using the dot product
    const directionVector = vec3.subtract(vec3.create(), obb2.center, obb1.center);
    const dotProduct = vec3.dot(minDiff, directionVector);

    // If the dot product is positive (minDiff, obb1 facing same direction)
    // reverse the direction of the minDiff

    if (dotProduct > 0) {
        vec3.negate(minDiff, minDiff);
    }
    // Translate only in x and z
    //minDiff[1] = 0;
    intersection.minDiff = minDiff;
    // TODO - closest point
    return true;
}

function project(vertices, axis) {
    let min = Infinity;
    let max = -Infinity;

    for (const vertex of vertices) {
        // Projection of point on axis 
        const proj = vec3.dot(vertex, axis) / vec3.length(axis);
        min = Math.min(min, proj); // find min point
        max = Math.max(max, proj); // find max point
    }

    return { min, max };
}

function overlap(projection1, projection2) {
    return !(projection1.min > projection2.max || projection2.min > projection1.max);
}

function overlapValue(projection1, projection2) {
    // Check for overlap along the axis
    // if overlap > 0 --> overlap 
    // if overlap < 0 --> No overlap
    const overlapVal = Math.min(projection1.max - projection2.min, projection2.max - projection1.min);
    return overlapVal;
}

export function obbRayIntersectionMin(node, obb, ray, intersection) {
    // OBB  vs. Ray (line)
    // Calculate t.entry and t.exit (entry, exit aabb intersection)
    const t = {
        entry: Infinity,
        exit: 0,
    };
    // 2. Check intersection
    if (!rayOBBIntersection(ray, obb, t)) {
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
export function obbRayIntersectionBVH(obb, ray) {
    // OBB  vs. Ray (line) - BVH edition
    // Calculate t.entry and t.exit (entry, exit aabb intersection)
    const t = {
        entry: Infinity,
        exit: 0,
    };
    // 2. Check intersection
    if (!rayOBBIntersection(ray, obb, t)) {
        return false;
    }
    // t_lowest set in BVH traverse function
    return t.entry;
}


export function getTransformedOBBVertices(obb) { 
    // 1. Create vertices (halfExtents)
    const vertices = createOBBVertices(obb);

    // 2. Transform all vertices of the AABB from local to global space
    // Rotation + translation (halfExtents = scale)
    const matrix = mat4.fromRotationTranslation(mat4.create(), obb.rotation, obb.center);
    vertices.map(vertex => vec3.transformMat4(vertex, vertex, matrix));
    return {
        vertices: vertices,
        normals: getNormals(obb),
        center: obb.center,
    }
}

function getNormals(obb) {
    const normals = [];
    const x_axis = vec3.fromValues(1, 0, 0);
    const y_axis = vec3.fromValues(0, 1, 0);
    const z_axis = vec3.fromValues(0, 0, 1);

    // Normals 
    const rotation = mat4.fromQuat(mat4.create(), obb.rotation);

    // Rotate the axis based on the OBB's rotation
    normals.push(vec3.transformMat4(vec3.create(), x_axis, rotation));
    normals.push(vec3.transformMat4(vec3.create(), y_axis, rotation));
    normals.push(vec3.transformMat4(vec3.create(), z_axis, rotation));

    // Opposite edge normal - negate(normal)!!
    // Only direction of normal matters, not sign (negative, posiitve)
    //const neg_normal_x = vec2.negate(vec2.create(), vec2.clone(normal_x));
    //const neg_normal_y = vec2.negate(vec2.create(), vec2.clone(normal_y));

    return normals;
}

function createOBBVertices(obb) {
    // Define local coordinates of the corner points in the OBB
    return [
        vec3.fromValues(-obb.halfExtents[0], -obb.halfExtents[1], -obb.halfExtents[2]),
        vec3.fromValues(obb.halfExtents[0], -obb.halfExtents[1], -obb.halfExtents[2]),
        vec3.fromValues(obb.halfExtents[0], obb.halfExtents[1], -obb.halfExtents[2]),
        vec3.fromValues(-obb.halfExtents[0], obb.halfExtents[1], -obb.halfExtents[2]),
        vec3.fromValues(-obb.halfExtents[0], -obb.halfExtents[1], obb.halfExtents[2]),
        vec3.fromValues(obb.halfExtents[0], -obb.halfExtents[1], obb.halfExtents[2]),
        vec3.fromValues(obb.halfExtents[0], obb.halfExtents[1], obb.halfExtents[2]),
        vec3.fromValues(-obb.halfExtents[0], obb.halfExtents[1], obb.halfExtents[2]),
    ];
}



