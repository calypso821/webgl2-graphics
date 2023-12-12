import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import { Transform } from '../../../common/engine/core/Transform.js';

export class FirstPersonController {

    constructor(node, domElement) {
        // The node that this controller controls. -> CAMERA
        this.node = node;

        // The activation DOM element.
        this.domElement = domElement;

        // This map is going to hold the pressed state for every key.
        this.keys = {};

        // We are going to use Euler angles for rotation.
        this.pitch = 0;
        this.yaw = 0;

        // This is going to be a simple decay-based model, where
        // the user input is used as acceleration. The acceleration
        // is used to update velocity, which is in turn used to update
        // translation. If there is no user input, speed will decay.
        this.velocity = [0, 0, 0];

        // Force downwards Y axis
        this.gravity = -8;
        // Force upwards Y axis (when pressed space)
        this.jump_force = 4;

        // Node is on the ground (false - in air)
        this.ground = true;

        // The model needs some limits and parameters.

        // Acceleration in meters per second squared.
        this.acceleration = 40;

        // Maximum speed in meters per second.
        this.maxSpeed = 3;

        // Decay as 1 - log percent max speed loss per second.
        this.decay = 0.9;

        // Pointer sensitivity in radians per pixel.
        this.pointerSensitivity = 0.002;

        this.initHandlers();
    }

    initHandlers() {
        // this = instance of FirstPersonController
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        // Canvas
        const element = this.domElement;
        // DOM object
        const doc = element.ownerDocument;

        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);

        // pointer lock
        // ta event mora sporziti uporabnik (click)!!
        element.addEventListener('click', e => element.requestPointerLock());

        doc.addEventListener('pointerlockchange', e => {
            // elemnt = canvas
            if (doc.pointerLockElement === element) {
                // doc.pointerLockElement = canvas
                // pointer locked
                doc.addEventListener('pointermove', this.pointermoveHandler);
            } else {
                // doc.pointerLockElement == NULL
                // pointer NOT locked
                doc.removeEventListener('pointermove', this.pointermoveHandler);
            }
        });
    }

    update(t, dt) {
        // We are essentially solving the system of differential equations
        //
        //   a = dv/dt
        //   v = dx/dt
        //
        // where a is acceleration, v is speed and x is translation.
        // The system can be sufficiently solved with Euler's method:
        //
        //   v(t + dt) = v(t) + a(t) * dt
        //   x(t + dt) = x(t) + v(t) * dt
        //
        // which can be implemented as
        //
        //   v += a * dt
        //   x += v * dt
        //
        // Needless to say, better methods exist. Specifically, second order
        // methods accurately compute the solution to our second order system,
        // whereas there is always going to be some error related to the
        // exponential decay.

        // Calculate forward and right vectors from the y-orientation.
        const cos = Math.cos(this.yaw);
        const sin = Math.sin(this.yaw);
        const forward = [-sin, 0, -cos];
        const right = [cos, 0, -sin];

        // Map user input to the acceleration vector.
        const acc = vec3.create();
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
        }
        if (this.keys['KeyD']) {
            vec3.add(acc, acc, right);
        }
        if (this.keys['KeyA']) {
            vec3.sub(acc, acc, right);
        }

        

        
        if(this.ground) {
            // Update velocity based on acceleration (first line of Euler's method).
            vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);
        } 
        else {
            // ground = false -> apply gravity
            vec3.scaleAndAdd(this.velocity, this.velocity, [0, 1, 0], dt * this.gravity);
            // Update velocity based on acceleration (first line of Euler's method).
            vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * 0.2);
        }

        // Apply jump force (Y) to velocity vector (space + on ground)
        if (this.keys['Space'] & this.ground) {
            this.ground = false;
            vec3.scaleAndAdd(this.velocity, this.velocity, [0, 1, 0], this.jump_force);
        }
        //console.log(this.velocity[1]);

        // Trenje
        // If there is no user input, apply decay.
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA'])
        {
            const decay = Math.exp(dt * Math.log(1 - this.decay));
            vec3.scale(this.velocity, this.velocity, decay);
        }

        // Limit speed to prevent accelerating to infinity and beyond.
        const speed = vec3.length(this.velocity);
        if (this.ground & speed > this.maxSpeed) {
            vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
        }
        

        const transform = this.node.getComponentOfType(Transform);
        if (transform) {
            // Update translation based on velocity (second line of Euler's method).
            vec3.scaleAndAdd(transform.translation, transform.translation, this.velocity, dt);

            // Check if y < 0 -> set y = 0, ground
            if(transform.translation[1] < 1) {
                transform.translation[1] = 1;
                this.ground = true;
            }
            console.log(transform.translation[1]);

            // Update rotation based on the Euler angles.
            // x,y,z in deg
            // quat.fromEuler(out, x, y, z)
            const rotation = quat.create();
            quat.rotateY(rotation, rotation, this.yaw);
            quat.rotateX(rotation, rotation, this.pitch);
            transform.rotation = rotation;
        }
    }

    pointermoveHandler(e) {
        // Rotation can be updated through the pointermove handler.
        // Given that pointermove is only called under pointer lock,
        // movementX/Y will be available.

        // Horizontal pointer movement causes camera panning (y-rotation),
        // vertical pointer movement causes camera tilting (x-rotation).
        const dx = e.movementX;
        const dy = e.movementY;

        this.pitch -= dy * this.pointerSensitivity;
        this.yaw   -= dx * this.pointerSensitivity;

        const twopi = Math.PI * 2;
        const halfpi = Math.PI / 2;

        // pitch = rotation on X axis
        // Limit pitch so that the camera does not invert on itself.
        this.pitch = Math.min(Math.max(this.pitch, -halfpi), halfpi);

        // yaw = rotation on Y axis
        // Constrain yaw to the range [0, pi * 2]
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

}
