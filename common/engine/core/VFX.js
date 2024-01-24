export class VFX {
    constructor({
        node = null,
        blended = true,
        ttl = Infinity,
    } = {}) {
        this.blended = blended;
        this.node = node;
        this.ttl = ttl;
        this.dt = ttl;
    }

    update(t, dt) {

        // 1. Update TTL 
        if (this.dt < Infinity) {
            this.dt -= dt;
        }
        // 2. Remove expired elements 
        if (this.dt < 0) {
            this.node.parent.removeChild(this.node);
        }
    }

}