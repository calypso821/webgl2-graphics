import { Transform } from '../core.js';
import { vec4, vec3, quat, mat4 } from '../../../lib/gl-matrix-module.js';


export class Animation {
    constructor() {
        // ANimation players 
        this.animations = {};
        // Animation data (keyframes)
        this.animationData = {};
    }
    add(animationPlayer) {
        this.animations[animationPlayer.animation.name] = animationPlayer;
    }
    get(name) {
        return this.animations[name];
    }
    createAP(node, name, backToStart=false, animationData=null) {
        if (!animationData) {
            animationData = this.animationData;
        }
        if (!animationData[name]) {
            return;
        }
        this.add(new AnimationPlayer(node, animationData[name], { backToStart }));
        for (const child of node.children) {
            const animation = child.getComponentOfType(Animation);
            if(animation) {
                animation.createAP(child, name + '_child', backToStart);
            }
        }
    }
    addData(data, matrix=null) {
        if (matrix) {
            // Bldener exports animation in global space
            // Transfrom animation data back to local space
            // Matrix created in gltfLoader (model transform)
            this.transfromAnimationData(data, matrix);
        }
        this.animationData[data.name] = data;
    }
    getAll() {
        return this.animations;
    }
   
    update(t, dt) {
        for (const animation in this.animations) {
            this.animations[animation].update(t, dt);
        }
    }

    transfromAnimationData(data, matrix) {
        // Transfrom animation data back to local space
        const inverse = mat4.invert(mat4.create(), matrix);
        const transform = {
            translation: mat4.getTranslation(vec3.create(), inverse),
            rotation: mat4.getRotation(quat.create(), inverse),
            scale: mat4.getScaling(vec3.create(), inverse),
        };

        if (data.translationKf) {
            for (const frame of data.translationKf.keyFrames) {
                vec3.add(frame, frame, transform.translation);
            }
        }
        if (data.scaleKf) {
            for (const frame of data.scaleKf.keyFrames) {
                vec3.mul(frame, frame, transform.scale);
            }
        }
        if (data.rotationKf) {
            for (const frame of data.rotationKf.keyFrames) {
                quat.mul(frame, frame, transform.rotation);
            }
        }
    }

}

export class AnimationPlayer {

    constructor(node, animationAsset, {
        startTime = 0,
        loop = false,
        backToStart = false,
    } = {}) {
        this.node = node;
        this.animation = animationAsset;

        this.startTime = startTime;
        // duration = frameCount * dt (delat time between 2 frames)
        this.duration = (animationAsset.frameCount - 1) *  animationAsset.dt_keyframe;
        this.loop = loop;

        this.playing = false;
        this.time = 0;
        // If backToStart is ENABLED - object transformation
        // will be set to transformation at start of animation
        // If backToStart is DISABLED - object transformation
        // will be set to transformation at end of animation
        this.backToStart = backToStart;
    }
    setLoop() {
        this.loop = true;
    }

    play(kill=false) {
        // If this option is true, model will be removed (deleted) after end of animation
        this.kill = kill;
        this.original_transformMatrix = this.node.getComponentOfType(Transform).matrix;
        this.playing = true;
    }
    playAll() {
        this.node.traverse(child => {
            if (child == this.node) {
                this.play();
                return;
            }
            const new_name = this.animation.name + "_child";
            const animation = child.getComponentOfType(Animation);
            if (animation && animation.get(new_name)) {
                animation.get(new_name).play();
            }
            
        });
    }
    stopAll() {
        this.node.traverse(child => {
            if (child == this.node) {
                this.stop();
                return;
            }
            const new_name = this.animation.name + "_child";
            const animation = child.getComponentOfType(Animation);
            if (animation.get(new_name)) {
                animation.get(new_name).stop();
            } 
            
        });
    }

    pause() {
        this.playing = false;
    }
    stop() {
        console.log("stop");
        this.setTransformationMatrix(); 
        this.playing = false;
        this.time = 0;
    }

    setTransformationMatrix() {
        // Function extecuted at end or stop of animation
        // Function sets new tranfromation matrix for object
        const new_matrix = mat4.create();
         
        if (this.backToStart) {
        // If backToStart is enabled 
        // originalTransformation (start of animation) matrix is set 
            mat4.mul(new_matrix, new_matrix, this.original_transformMatrix);
        } else {
        // If backToStart is disabled 
        // originalTransformation (end /stop of animation) matrix is set 
            mat4.mul(new_matrix, this.node.getComponentOfType(Transform).matrix, this.transformMatrix);
        }
        this.node.getComponentOfType(Transform).matrix = new_matrix;
        this.transformMatrix = null;
    }

    update(t, dt) {
        if (!this.playing) {
            return;
        }
        this.time += dt;
        if (this.time >= this.duration) {
            // End of animation
            this.setTransformationMatrix();
            // Remove node if kill is true
            if (this.kill) {
                this.node.parent.removeChild(this.node);
            }
            this.playing = this.loop;
            this.time = 0;
            return;
        }
        // Calculate new transformation (translation, rotation, scale)
        const new_transformation = this.claculateTransformationMatrix(this.animation);
        // Update node
        this.updateNode(new_transformation);
    }

    claculateTransformationMatrix(animation) {
        const i_translation = this.interpolate(animation.translationKf) ?? vec3.create();
        const i_rotation = this.interpolate(animation.rotationKf) ?? quat.create();
        const i_scale = this.interpolate(animation.scaleKf) ?? vec3.fromValues(1, 1, 1);
        return mat4.fromRotationTranslationScale(mat4.create(),
                    i_rotation, i_translation, i_scale);

    }

    calculateInterpolationSection(channel) {
        const frame_num = this.time / channel.dt_keyframe;

        const frame1 = Math.floor(frame_num);
        const frame2 = frame1 + 1;

        // dt_frame - dt value between frame 1 and frame 2
        const dt_frame = this.time - (frame1 * channel.dt_keyframe);
        // normalized dt_frame (mapped between 0 - 1)
        const dt_frame_normalzied = dt_frame / channel.dt_keyframe;

        return { frame1, frame2, dt_frame_normalzied }
    }
    

    interpolate(channel, last=false) {
        if (!channel) {
            return;
        }
        const methode = channel.interpolation;
        const interpolationSection = this.calculateInterpolationSection(channel);
        const f1 = interpolationSection.frame1;
        const f2 = interpolationSection.frame2;
        const value = interpolationSection.dt_frame_normalzied;
        const keyFrames = channel.keyFrames;

        // Return last value (last keyframe)
        if (last) {
            return keyFrames[f1];
        }

        // Linear interpolation between frames
        if (methode == "LINEAR" && f2 < keyFrames.length) {
            if (keyFrames[0].length == 3) {
                // Trnslation, scale
                return vec3.lerp(vec3.create(), keyFrames[f1], keyFrames[f2], value);
            } else {
                // Rotation
                return vec4.lerp(vec4.create(), keyFrames[f1], keyFrames[f2], value);
            }
        }
        // Animated value remain constant unitl next keyframe
        if (methode == "STEP") {
            return null;
            //return keyFrames[f1];
        }
        
        return null;
    }

    updateNode(transformation) {
        const transform = this.node.getComponentOfType(Transform);
        if (transform) {
            // Transformation update (model matrix + animation matrix)
            // Happneds in renderer
            this.transformMatrix = transformation;
        } 
    }
}

export class animationAsset {
    constructor({
        name,               // Animation name
        dt_keyframe,        // delta time (time between 2 frames) 24FPS - 0.0416s, 60FPS - 0.0166s
        frameCount,         // Number of keyframes 
        translationKf,      // Translation keyframes
        rotationKf,         // Rotation keyframes
        scaleKf,            // Scale keyframes
    }) {
        this.name = name;

        this.dt_keyframe = dt_keyframe;
        this.frameCount = frameCount

        this.translationKf = translationKf;
        this.rotationKf = rotationKf;
        this.scaleKf = scaleKf;
    }
}