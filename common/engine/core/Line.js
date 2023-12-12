
export class Line {

    constructor() {
        this.updateTraceLine = false;
    }

    update(t, dt) {
        // process line
    }

    setLine(origin, end, updateStatus) {
        this.origin = origin;
        this.end = end;
        this.updateTraceLine = updateStatus;
    }
}