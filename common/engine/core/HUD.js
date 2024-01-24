
export class HUD {
    constructor() {
        this.elements = {};

    }

    update(t, dt) {
        // Update all HUD elemets (text, images...)
        for (const id in this.elements) {
            const element = this.elements[id];

            // 1. Update TTL 
            if (element.dt < Infinity) {
                element.dt -= dt;
            }
            // 2. Remove expired elements 
            if (element.dt < 0) {
                this.setVisible(element.id, false);
                if (element.kill) {
                    // Delete
                    this.removeElement(element.id);
                }
                
            }
        }
    }
    setTTL(id, value) {
        this.elements[id].ttl = value;
    }
    setActive(id) {
        const ele = this.elements[id];
        ele.dt = ele.ttl;
        this.setVisible(id, true);
    }
    setVisible(id, status) {
        this.elements[id].visible = status;
    }
    setValue(id, value) {
        this.elements[id].value = value;
    }
    addElement(element) {
        this.elements[element.id] = element;

    }
    removeElement(id) {
        delete this.elements[id];
    }
}

class HUDElement {
    constructor({
        id = null,          // identification name 
        position,           // Element position
        visible = true,     // Visible status
        ttl = Infinity,     // Time to live
        kill = false,       // HUD will be removed after dt reaches 0
    } = {}) {
        this.id = id ?? Math.random().toString(36).substring(2, 10);

        this.position = position;
        this.visible = visible;
        this.ttl = ttl;
        this.dt = ttl;
        this.kill = kill;
    }
}


export class TextElement extends HUDElement  {
    constructor({
        id,                 // identification name 
        position,           // Element position
        visible = true,     // Visible status
        ttl = Infinity,     // Time to live

        // Text element options
        text = "",
        value = "",
        color = 'blue', 
        font = "30px Arial",
    } = {}) {
        super({ id, position, visible, ttl });  

        this.text = text;
        this.value = value;
        this.color = color;
        this.font = font;
    }
}

export class ImageElement extends HUDElement {
    constructor({
        id,                     // identification name 
        position = [0, 0],      // Element position
        visible = true,         // Visible status
        ttl = Infinity,         // Time to live

        imageBitmap,            // imageBitmap format
        fullscreen = false,     // Display image as fullscreen 
        center = false,         // Display image in center of canvas
    } = {}) {
        super({ id, position, visible, ttl });  

        this.imageBitmap = imageBitmap;
        this.fullscreen = fullscreen;
        this.center = center;
    }
}



