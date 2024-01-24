import { BVH } from "../core.js";
export class Node {

    constructor() {
        this.name = null;
        this.children = [];
        this.parent = null;
        this.components = [];
     
        this.useLocalTransformationOnly = false;
        this.visible = true;
    }

    addChild(node) {
        node.parent?.removeChild(node);
        this.children.push(node);
        node.parent = this;
    }
    replaceChild(old_node, new_node) {
        this.removeChild(old_node);
        this.addChild(new_node);
    }

    removeChild(node) {
        const index = this.children.indexOf(node);
        if (index >= 0) {
            this.children.splice(index, 1);
            node.parent = null;
        }
    }

    traverse(before, after) {
        before?.(this);
        for (const child of this.children) {
            child.traverse(before, after);
        }
        after?.(this);
    }

    linearize() {
        const array = [];
        this.traverse(node => array.push(node));
        return array;
    }

    filter(predicate) {
        return this.linearize().filter(predicate);
    }

    find(predicate) {
        return this.linearize().find(predicate);
    }

    map(transform) {
        return this.linearize().map(transform);
    }

    addComponent(component) {
        this.components.push(component);
    }

    removeComponent(component) {
        this.components = this.components.filter(c => c !== component);
    }

    removeComponentsOfType(type) {
        this.components = this.components.filter(component => !(component instanceof type));
    }

    getComponentOfType(type) {
        return this.components.find(component => component instanceof type);
    }

    getComponentsOfType(type) {
        return this.components.filter(component => component instanceof type);
    }
    isStatic() {
        const bvh = this.getObjectBVH();
        return bvh ? bvh.static : null;
    }
    isDynamic() {
        const bvh = this.getObjectBVH();
        return bvh ? bvh.dynamic : null;
    }
    setStatic() {
        this.getObjectBVH().static = true;
    }
    setDynamic() {
        this.getObjectBVH().dynamic = true;
    }
    setUnactive() {
        this.getObjectBVH().setUnactive();
        this.getRayBVH().setUnactive();
    }
    getObjectBVH() {
        const bvhs = this.getComponentsOfType(BVH);
        for (const bvh of bvhs) {
            if (bvh.type == 'OBJECT') { return bvh; }
        }
        return null;
    }
    getRayBVH() {
        const bvhs = this.getComponentsOfType(BVH);
        for (const bvh of bvhs) {
            if (bvh.type == 'RAY') { return bvh; }
        }
        return this.getObjectBVH();
    }

}