import { vec2, vec3 } from '../../../../lib/gl-matrix-module.js';


export function separatingAxisTheorem(shape1, shape2) {
    const axes = getAxes2D(shape1, shape2);

    for (const axis of axes) {
        const projection1 = project(shape1, axis);
        const projection2 = project(shape2, axis);
        if (!overlap(projection1, projection2)) {
            return false; // Separating Axis found, no collision
        }
    }

    return true; // No Separating Axis found, collision detected
}
function getAxes3D(shape1, shape2) {
    // axes = normals = faces (3 points)!!
    const normals = [];

    // Add normals of edges for shape1
    for (let i = 0; i < shape1.length; i++) {
        const p1 = shape1[i];
        const p2 = shape1[(i + 1) % shape1.length];
        const p3 = shape1[(i + 2) % shape1.length];
        const edge1 = vec3.sub(vec3.create(), p2, p1); 
        const edge2 = vec3.sub(vec3.create(), p3, p1); 
        const normal = vec3.cross(vec3.create(), edge1, edge2); //
        axes.push(normal); 
    }

    // Add normals of edges for shape2
    for (let i = 0; i < shape2.length; i++) {
        const p1 = shape2[i];
        const p2 = shape2[(i + 1) % shape2.length];
        const p3 = shape2[(i + 2) % shape2.length];
        const edge1 = vec3.sub(vec3.create(), p2, p1); 
        const edge2 = vec3.sub(vec3.create(), p3, p1); 
        const normal = vec3.cross(vec3.create(), edge1, edge2); //
        axes.push(normal); 
    }

    return normals;
}
function getAxes2D(shape1, shape2) {
    // axes = normals = edges (2 points) !!
    const axes = [];

    // Add normals of edges for shape1
    for (let i = 0; i < shape1.length; i++) {
        const p1 = shape1[i];
        const p2 = shape1[(i + 1) % shape1.length];
        const edge = vec2.sub(vec2.create(), p2, p1); 
        const axis = vec2.fromValues(edge[1], -edge[0]); // Perpendicular axis
        axes.push(axis); 
    }

    // Add normals of edges for shape2
    for (let i = 0; i < shape2.length; i++) {
        const p1 = shape2[i];
        const p2 = shape2[(i + 1) % shape2.length];
        const edge = vec2.sub(vec2.create(), p2, p1); 
        const axis = vec2.fromValues(edge[1], -edge[0]); // Perpendicular axis
        axes.push(axis); 
    }

    return axes;
}

function project(shape, axis) {
    let min = Infinity;
    let max = -Infinity;

    for (const point of shape) {
        // Projection of point on axis 
        const proj = vec2.dot(point, axis) / vec2.length(axis);
        min = Math.min(min, proj); // find min point
        max = Math.max(max, proj); // find max point
    }

    return { min, max };
}

function overlap(projection1, projection2) {
    return !(projection1.min > projection2.max || projection2.min > projection1.max);
}

// Example usage:
const shape1 = [[0, 0], [0, 2], [2, 2], [2, 0]];
const shape2 = [[1, 1], [1, 5], [3, 5], [3, 1]];

const collision = separatingAxisTheorem(shape1, shape2);
//console.log("Collision:", collision);
