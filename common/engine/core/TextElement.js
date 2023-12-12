
export class TextElement  {

    constructor({
        text = "",
        value = "",
        position,
        color, 
        font = "30px Arial",
        visible = true,

    } = {}) {
        this.position = position;
        this.color = color;
        this.visible = visible;

        this.text = text;
        this.value = value;
        this.font = font;

    }
}