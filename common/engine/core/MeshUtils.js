import { vec3 } from '../../../lib/gl-matrix-module.js';

export function calculateAABB(mesh) {
    const initial = {
        min: vec3.clone(mesh.vertices[0].position),
        max: vec3.clone(mesh.vertices[0].position),
    };

    return {
        min: mesh.vertices.reduce((a, b) => vec3.min(a, a, b.position), initial.min),
        max: mesh.vertices.reduce((a, b) => vec3.max(a, a, b.position), initial.max),
    };
}

export function mergeAABB(boxes) {
    const initial = {
        min: vec3.clone(boxes[0].min),
        max: vec3.clone(boxes[0].max),
    };

    return {
        min: boxes.reduce(({ min: amin }, { min: bmin }) => vec3.min(amin, amin, bmin), initial),
        max: boxes.reduce(({ max: amax }, { max: bmax }) => vec3.max(amax, amax, bmax), initial),
    };
}

export function calculateBoundingSphere(mesh) {
    // center = 0,0,0
    const center = vec3.create();

    // Calculate the center as the average of all vertex positions
    /*
    for (const vertex of mesh.vertices) {
        vec3.add(center, center, vertex.position);
    }
    vec3.scale(center, center, 1 / mesh.vertices.length);
    */

    // Calculate the radius as the maximum distance from the center
    let radius = 0;
    for (const vertex of mesh.vertices) {
        const distance = vec3.distance(center, vertex.position);
        radius = Math.max(radius, distance);
    }

    return {
        center: center,
        radius: radius,
    };
}

