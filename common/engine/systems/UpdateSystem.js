export class UpdateSystem {

    constructor(application) {
        this._update = this._update.bind(this);
        this._render = this._render.bind(this);

        this.application = application;
        this.running = false;
    }

    start() {
        if (this.running) {
            return;
        }
        this.running = true;

        // call start function if application has one
        this.application.start?.();
        
        // Save current time in ms/1000 = seconds
        this._time = performance.now() / 1000;
	    // -------------------------------------------------
        //console.log(Date.now() - t1)
        // 3 ms
        //console.log(performance.now() - t2)
        // 2.9000000059604645 ms

        // performance.now() - current time in ms
        // Time elapsed since creation of context (relative to origin)
        // floation point - micro second resolution

        // Date.now() - ms elapsed ince (1970-01-01)
        // Time elpased since (1970-01-01) dependent on system clock
        // One milisecond resolution
        // -------------------------------------------------

        // The update loop should run as fast as possible.
        // start _update loop
        // branje DOM (user inputs, animation)
        // posodobitev vsake 3-5ms
        this._updateFrame = setInterval(this._update, 0); // delay = 0
        
        // The render loop should be synchronized with the screen.
        // start _render loop
         // posodobitev DOM (zaslona)
        this._renderFrame = requestAnimationFrame(this._render);
        
    }

    stop() {
        if (!this.running) {
            return;
        }
        console.log("Stopeed")

        this.application.stop?.();

        // stop _update loop
        this._updateFrame = clearInterval(this._updateFrame);
        // stop _render loop
        this._renderFrame = cancelAnimationFrame(this._render);
    }
	
    _update() {
	    // branje DOM - user inputs
	    
        // Measure the absolute time and time elapsed from the last
        // update frame. These are going to be useful for animations.
        const time = performance.now() / 1000;
        const dt = time - this._time;
        this._time = time;

        // call update function if application has one
        this.application.update?.(time, dt);
    }

    _render() {
	    // pisanje v DOM - render geomerty
	    
        // Request next render frame. (loopback)
        // update every 6.9-7ms (refresh rate 144Hz)
        this._renderFrame = requestAnimationFrame(this._render);

        // Call the user-defined render method. (if app has one)
        this.application.render?.(); // izris na zaslon
    }

}