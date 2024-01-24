import { OBB, AABB, Sphere } from '../../core.js';
import { vec3, mat4 } from '../../../../lib/gl-matrix-module.js';
import { Node } from '../../core.js';
import { 
    calculateAABB, 
    mergeAABB, 
    calculateBoundingSphere
 } from '../../../../common/engine/core/MeshUtils.js';

export class BVNode extends Node {
    constructor() {
        super();
        this.primary = null;
        this.secondary = null;

    }

    getRoot(node) {
        node.parent?.getRoot(node.parent);
        return node;
    }
    setPrimaryBoudingVolume(boudingVolume) {
        this.primary = boudingVolume;
    }
    setSecondaryBoundingVolume(boudingVolume) {
        this.secondary = boudingVolume;
    }
    createBVBox(min, max, matrix=null) {
        
        // Transform min, max
        if (matrix) {
            vec3.transformMat4(min, min, matrix);
            vec3.transformMat4(max, max, matrix);
        }
        //console.log("Min", min)
        //console.log("Max", max)
        // Create bouding volumes
        const primaryVolume = new OBB({ min, max });
        const secondaryVolume = new AABB({ min, max });

        // Set bouding volumes
        this.setPrimaryBoudingVolume(primaryVolume);
        this.setSecondaryBoundingVolume(secondaryVolume);
    }
    createBVSphere(min, max, matrix=null) {
        const center = vec3.create();
        // Transform min, max
        if (matrix) {
            vec3.transformMat4(min, min, matrix);
            vec3.transformMat4(max, max, matrix);
            vec3.transformMat4(center, center, matrix);
        }

        // Create bouding volumes
        const radius = Math.max(max[0], max[1], max[2]);
        const primaryVolume = new Sphere(center, radius);
        const secondaryVolume = new AABB({ min, max });

        // Set bouding volumes
        this.setPrimaryBoudingVolume(primaryVolume);
        this.setSecondaryBoundingVolume(secondaryVolume);
    }
    createBVModel(model, matrix=null) {
        // Function calculate most fitting bounding volume (box vs sphere)
        // 1. Caluclate model box 
        const boxes = model.primitives.map(primitive => calculateAABB(primitive.mesh));
        const aabb = mergeAABB(boxes);
        if (matrix) {
            vec3.transformMat4(aabb.min, aabb.min, matrix);
            vec3.transformMat4(aabb.max, aabb.max, matrix);
        }

        // 2. Claculate model sphere
        const bs = calculateBoundingSphere(model.primitives[0].mesh);
        const scale = vec3.fromValues(1, 1, 1);
        if (matrix) {
            vec3.transformMat4(bs.center, bs.center, matrix);
            vec3.transformMat4(aabb.max, aabb.max, matrix);
            mat4.getScaling(scale, matrix);
        }
        bs.radius = bs.radius * Math.max(scale[0], scale[1], scale[2]);
 
        // 2. Sphere vs. Box volume 
        // Calculate Box volume 
        const dimensions = vec3.sub(vec3.create(), aabb.max, aabb.min);
        const boxVolume = dimensions[0] * dimensions[1] * dimensions[2];
        // Calculate Sphere volume
        const sphereVolume = (4 / 3) * Math.PI * Math.pow(bs.radius, 3);

        // Define primary bounding volume (narrow check)
        let primaryVolume;
        if (sphereVolume < boxVolume) {
            primaryVolume = new Sphere(bs.center, bs.radius);
        } else {
            primaryVolume = new OBB(aabb);
        }

        // Define secondary bounding volume (broad check)
        const secondaryVolume = new AABB(aabb);

        // Set BoudingVolume node
        this.setPrimaryBoudingVolume(primaryVolume);
        this.setSecondaryBoundingVolume(secondaryVolume);
    }
}


export class BVH {
    constructor(object=null) {    
        // Node reference (for transformation)
        this.node = null;  
        // Type of BVH (OBJECT / RAY) 
        this.type = 'OBJECT';  
        // Root bouding volume
        this.root = null;
        
        this.static = null;
        this.dynamic = null;

        if (object) {
            this.initRoot(object);
        }
    }
    setUnactive() {
        this.static = null;
        this.dynamic = null;
    }

    setRoot(bvNode) {
        this.root = bvNode;
    }
    setNode(node) {
        this.node = node;
        this.name = node.name;
    }
    initRoot(object) {  
        const bvNode = new BVNode();
        if (object.model) {
            // Create BVH from model (calcualte min, max)
            const boxes = object.model.primitives.map(primitive => calculateAABB(primitive.mesh));
            const aabb = mergeAABB(boxes);
            // Crate BVH box 
            //bvNode.createBVBox(aabb.min, aabb.max);
            // Create most fitting volume (box or sphere)
            bvNode.createBVModel(object.model)
        } else {
            // Create BVH from min, max input parameters
            bvNode.createBVBox(object.min, object.max);
        }
        
        this.root = bvNode; 
        this.setNode(object.node);
        this.static = true;
    }
    createNewBVH(bvh_input, node) {
        const bvh = new BVH();
        bvh.type = bvh_input.type;
        bvh.root = bvh_input.root;
        bvh.setNode(node);
        return bvh;
    }
}