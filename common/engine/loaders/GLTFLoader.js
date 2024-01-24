import { mat4 } from '../../../lib/gl-matrix-module.js';
import {
    Animation,
    AnimationPlayer,
    animationAsset,
    Accessor,
    Camera,
    Material,
    Mesh,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
    Vertex,
    BVH,
    BVNode,
    Light,
    PointLight,
    SpotLight,
    VFX
} from '../core.js';

// TODO: GLB support
// TODO: accessors with no buffer views (zero-initialized)
// TODO: image from buffer view
// TODO: mipmaps
// TODO: material texcoord sets
// TODO: material alpha, doubleSided

export class GLTFLoader {

    // Loads the GLTF JSON file and all buffers and images that it references.
    // It also creates a cache for all future resource loading.
    async load(url) {
        this.gltfUrl = new URL(url, window.location);
        this.gltf = await this.fetchJson(this.gltfUrl);
        this.defaultScene = this.gltf.scene ?? 0;
        this.cache = new Map();

        await Promise.all(this.gltf.buffers?.map(buffer => this.preloadBuffer(buffer)) ?? []);
        await Promise.all(this.gltf.images?.map(image => this.preloadImage(image)) ?? []);
    }

    // Finds an object in list at the given index, or if the 'name'
    // property matches the given name.
    findByNameOrIndex(list, nameOrIndex) {
        if (typeof nameOrIndex === 'number') {
            return list[nameOrIndex];
        } else {
            return list.find(element => element.name === nameOrIndex);
        }
    }

    fetchJson(url) {
        return fetch(url)
            .then(response => response.json());
    }

    fetchBuffer(url) {
        return fetch(url)
            .then(response => response.arrayBuffer());
    }

    fetchImage(url) {
        return fetch(url)
            .then(response => response.blob())
            .then(blob => createImageBitmap(blob));
    }

    async preloadImage(gltfSpec) {
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        if (gltfSpec.uri) {
            const url = new URL(gltfSpec.uri, this.gltfUrl);
            const image = await this.fetchImage(url);
            this.cache.set(gltfSpec, image);
            return image;
        } else {
            const bufferView = this.gltf.bufferViews[gltfSpec.bufferView];
            const buffer = this.loadBuffer(bufferView.buffer);
            const dataView = new DataView(buffer, bufferView.byteOffset ?? 0, bufferView.byteLength);
            const blob = new Blob([dataView], { type: gltfSpec.mimeType });
            const url = URL.createObjectURL(blob);
            const image = await this.fetchImage(url);
            URL.revokeObjectURL(url);
            this.cache.set(gltfSpec, image);
            return image;
        }
    }

    async preloadBuffer(gltfSpec) {
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const url = new URL(gltfSpec.uri, this.gltfUrl);
        const buffer = await this.fetchBuffer(url);
        this.cache.set(gltfSpec, buffer);
        return buffer;
    }

    loadImage(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.images, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }

        return this.cache.get(gltfSpec);
    }

    loadBuffer(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.buffers, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }

        return this.cache.get(gltfSpec);
    }

    loadSampler(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.samplers, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const minFilter = {
            9728: 'nearest',
            9729: 'linear',
            9984: 'nearest',
            9985: 'linear',
            9986: 'nearest',
            9987: 'linear',
        };

        const magFilter = {
            9728: 'nearest',
            9729: 'linear',
        };

        const mipmapFilter = {
            9728: 'nearest',
            9729: 'linear',
            9984: 'nearest',
            9985: 'nearest',
            9986: 'linear',
            9987: 'linear',
        };

        const addressMode = {
            33071: 'clamp-to-edge',
            33648: 'mirror-repeat',
            10497: 'repeat',
        };

        const sampler = new Sampler({
            minFilter: minFilter[gltfSpec.minFilter ?? 9729],
            magFilter: magFilter[gltfSpec.magFilter ?? 9729],
            mipmapFilter: mipmapFilter[gltfSpec.minFilter ?? 9729],
            addressModeU: addressMode[gltfSpec.wrapS ?? 10497],
            addressModeV: addressMode[gltfSpec.wrapT ?? 10497],
        });

        this.cache.set(gltfSpec, sampler);
        return sampler;
    }

    loadTexture(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.textures, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const options = {};
        if (gltfSpec.source !== undefined) {
            options.image = this.loadImage(gltfSpec.source);
        }
        if (gltfSpec.sampler !== undefined) {
            options.sampler = this.loadSampler(gltfSpec.sampler);
        }

        const texture = new Texture(options);

        this.cache.set(gltfSpec, texture);
        return texture;
    }

    loadMaterial(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.materials, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const options = {};
        const pbr = gltfSpec.pbrMetallicRoughness;
        if (pbr) {
            if (pbr.baseColorTexture) {
                options.baseTexture = this.loadTexture(pbr.baseColorTexture.index);
            }
            if (pbr.metallicRoughnessTexture) {
                options.metalnessTexture = this.loadTexture(pbr.metallicRoughnessTexture.index);
                options.roughnessTexture = this.loadTexture(pbr.metallicRoughnessTexture.index);
            }
            options.baseFactor = pbr.baseColorFactor;
            options.metalnessFactor = pbr.metallicFactor;
            options.roughnessFactor = pbr.roughnessFactor;
        }

        if (gltfSpec.normalTexture) {
            options.normalTexture = this.loadTexture(gltfSpec.normalTexture.index);
            options.normalFactor = gltfSpec.normalTexture.scale;
        }

        if (gltfSpec.emissiveTexture) {
            options.emissionTexture = this.loadTexture(gltfSpec.emissiveTexture.index);
            options.emissionFactor = gltfSpec.emissiveFactor;
        }

        if (gltfSpec.occlusionTexture) {
            options.occlusionTexture = this.loadTexture(gltfSpec.occlusionTexture.index);
            options.occlusionFactor = gltfSpec.occlusionTexture.strength;
        }
        const extensions = gltfSpec.extensions;
        if (extensions && extensions.KHR_materials_specular) {
            // Max value from blender (1) mapped to (2.37)
            const value = extensions.KHR_materials_specular.specularColorFactor;
            options.specularFactor = value.map(component => component / 2.37);
        }
        
        const material = new Material(options);

        this.cache.set(gltfSpec, material);
        return material;
    }

    loadAccessor(nameOrIndex) {
        // Accessor - method for retrieving data as typed arrays from within a buffer view
        const gltfSpec = this.findByNameOrIndex(this.gltf.accessors, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }

        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        if (gltfSpec.bufferView === undefined) {
            console.warn('Accessor does not reference a buffer view');
            return null;
        }

        const bufferView = this.gltf.bufferViews[gltfSpec.bufferView];
        const buffer = this.loadBuffer(bufferView.buffer);

        const componentType = {
            5120: 'int',
            5121: 'int',
            5122: 'int',
            5123: 'int',
            5124: 'int',
            5125: 'int',
            5126: 'float',
        }[gltfSpec.componentType];

        const componentSize = {
            5120: 1,
            5121: 1,
            5122: 2,
            5123: 2,
            5124: 4,
            5125: 4,
            5126: 4,
        }[gltfSpec.componentType];

        const componentSigned = {
            5120: true,
            5121: false,
            5122: true,
            5123: false,
            5124: true,
            5125: false,
            5126: false,
        }[gltfSpec.componentType];

        const componentCount = {
            SCALAR: 1,
            VEC2: 2,
            VEC3: 3,
            VEC4: 4,
            MAT2: 4,
            MAT3: 9,
            MAT4: 16,
        }[gltfSpec.type];

        const componentNormalized = gltfSpec.normalized ?? false;

        const stride = bufferView.byteStride ?? (componentSize * componentCount);
        const offset = gltfSpec.byteOffset ?? 0;
        const viewOffset = bufferView.byteOffset ?? 0;
        const viewLength = bufferView.byteLength;
        const min = gltfSpec.min;
        const max = gltfSpec.max;

        const accessor = new Accessor({
            buffer,
            viewLength,
            viewOffset,
            offset,
            stride,

            componentType,
            componentCount,
            componentSize,
            componentSigned,
            componentNormalized,

            min,
            max,
        });

        this.cache.set(gltfSpec, accessor);
        return accessor;
    }

    createMeshFromPrimitive(spec) {
        if (spec.attributes.POSITION === undefined) {
            console.warn('No position in mesh');
            return new Mesh();
        }

        if (spec.indices === undefined) {
            console.warn('No indices in mesh');
            return new Mesh();
        }

        const accessors = {};
        for (const attribute in spec.attributes) {
            accessors[attribute] = this.loadAccessor(spec.attributes[attribute]);
        }

        const position = accessors.POSITION;
        const texcoords = accessors.TEXCOORD_0;
        const normal = accessors.NORMAL;
        const tangent = accessors.TANGENT;

        const vertexCount = position.count;
        const vertices = [];

        for (let i = 0; i < vertexCount; i++) {
            const options = {};

            if (position) { options.position = position.get(i); }
            if (texcoords) { options.texcoords = texcoords.get(i); }
            if (normal) { options.normal = normal.get(i); }
            if (tangent) { options.tangent = tangent.get(i); }

            vertices.push(new Vertex(options));
        }

        const indices = [];
        const indicesAccessor = this.loadAccessor(spec.indices);
        const indexCount = indicesAccessor.count;

        for (let i = 0; i < indexCount; i++) {
            indices.push(indicesAccessor.get(i));
        }

        return new Mesh({ vertices, indices });
    }

    
    loadMesh(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.meshes, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const primitives = [];
        for (const primitiveSpec of gltfSpec.primitives) {
            if (primitiveSpec.mode !== 4 && primitiveSpec.mode !== undefined) {
                console.warn(`GLTFLoader: skipping primitive with mode ${primitiveSpec.mode}`);
                continue;
            }

            const options = {};
            options.mesh = this.createMeshFromPrimitive(primitiveSpec);

            // TODO - load without material (default texture)
            if (primitiveSpec.material !== undefined) {
                options.material = this.loadMaterial(primitiveSpec.material);
            }

            primitives.push(new Primitive(options));
        }

        const model = new Model({ primitives });

        this.cache.set(gltfSpec, model);
        return model;
    }

    loadCamera(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.cameras, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const options = {};
        if (gltfSpec.type === 'perspective') {
            const { aspectRatio, yfov, znear, zfar } = gltfSpec.perspective;
            Object.assign(options, {
                orthographic: 0,
                aspect: aspectRatio,
                fovy: yfov,
                near: znear,
                far: zfar,
            });
        } else if (gltfSpec.type === 'orthographic') {
            const { xmag, ymag, znear, zfar } = gltfSpec.orthographic;
            Object.assign(options, {
                orthographic: 1,
                aspect: xmag / ymag,
                halfy: ymag,
                near: znear,
                far: zfar,
            });
        }

        const camera = new Camera(options);

        this.cache.set(gltfSpec, camera);
        return camera;
    }
    loadBVMesh(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.meshes, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        const [bvName, type] = gltfSpec.name.split('_');
        const primitive = gltfSpec.primitives[0];
        const mesh = this.loadAccessor(primitive.attributes.POSITION).getMinMax();

        return {
            name: bvName,
            type,
            mesh,
        }
    }

    loadBoundingVolume(nameOrIndex, matrix) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.nodes, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }

        const bvNode = new BVNode();
        const transform = new Transform(gltfSpec);
        matrix = mat4.mul(mat4.create(), matrix, transform.matrix);
        
        const bvMesh = this.loadBVMesh(gltfSpec.mesh);
        bvNode.name = bvMesh.name;
        bvNode.type = bvMesh.type;

        // Create bouding volume (primary, secondary)
        if (bvMesh.type.startsWith("box")) {
            // Bouding volume box 
            //console.log(bvNode.name )
            bvNode.createBVBox(bvMesh.mesh.min, bvMesh.mesh.max, matrix);
        } else if (bvMesh.type.startsWith("sphere")) {
            // Bouding volume sphere
            bvNode.createBVSphere(bvMesh.mesh.min, bvMesh.mesh.max, matrix);
        } else {
            // Most fitting bouding volume of model
            const model = this.loadMesh(gltfSpec.mesh);
            bvNode.createBVModel(model, matrix);
        }

        if (gltfSpec.children) {
            for (const childIndex of gltfSpec.children) {
                bvNode.addChild(this.loadBoundingVolume(childIndex, matrix));
            }
        }
        return bvNode;
    }

    loadBVH(nameOrIndex) {
        const bvh = new BVH();
        const type = this.gltf.nodes[nameOrIndex].name.split('_')[1];
        bvh.type = type ? type : bvh.type;
        bvh.setRoot(this.loadBoundingVolume(nameOrIndex, mat4.create()));
        bvh.static = true;
        return bvh;
    }
    loadLight(nameOrIndex) {
        const lights = this.gltf.extensions.KHR_lights_punctual.lights;
        const gltfSpec = this.findByNameOrIndex(lights, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        const type = gltfSpec.type;
        const main = gltfSpec.extras ? gltfSpec.extras.main : false;
        const color = gltfSpec.color;
        const intensity = gltfSpec.intensity * 0.0008; // Blender units

        if (type == 'directional') {
            return new Light({ color, intensity, type, main });
        }
        if (type == 'point') {
            return new PointLight({ color, intensity, type, main });
        }
        if (type == 'spot') {
            // TODO - direction
            const blendValues = {
                high: gltfSpec.spot.outerConeAngle,
                low: gltfSpec.spot.innerConeAngle
            }
            return new SpotLight({ color, intensity, blendValues, type, main });
        }
    }

    loadNode(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.nodes, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        // Load bouding volume hierarchy (BVH)
        if (gltfSpec.name.split('_')[0] == 'BVH') {
            return this.loadBVH(nameOrIndex);
        }

        // If already loaded, return cached
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const node = new Node();
        node.name = gltfSpec.name;

        // Load Light
        if (gltfSpec.extensions && gltfSpec.extensions.KHR_lights_punctual) {
            const light = this.loadLight(gltfSpec.extensions.KHR_lights_punctual.light);
            if (light) {
                node.addComponent(light);
            }
        }
  
        // Load transform
        const transform = new Transform(gltfSpec);
        node.addComponent(transform);
     
        if (gltfSpec.children) {
            for (const childIndex of gltfSpec.children) {
                const child = this.loadNode(childIndex);
                if (child instanceof Node) {
                    node.addChild(child);
                }
                if (child instanceof BVH) {
                    child.setNode(node);
                    node.addComponent(child);
                }
            }
        }
        // Add VFX 
        if (gltfSpec.name.split('_')[0] == 'VFX') {
            node.addComponent(new VFX());
        }


        // Load camera
        if (gltfSpec.camera !== undefined) {
            node.addComponent(this.loadCamera(gltfSpec.camera));
            if (node.getComponentOfType(BVH)) {
                node.setDynamic();
            }
        }

        // Load Mesh
        if (gltfSpec.mesh !== undefined) {
            node.addComponent(this.loadMesh(gltfSpec.mesh));
        }

        // Load animation data
        if (this.animations && this.animations[nameOrIndex]) {
            const animation_coollection = new Animation();
            for (const animationData of this.animations[nameOrIndex]) {
                animation_coollection.addData(animationData, transform.matrix);
            }  
            node.addComponent(animation_coollection);
        }
        this.cache.set(gltfSpec, node);
        return node;
    }
    loadAnimation(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.animations, nameOrIndex);

        if (!gltfSpec) {
            return null;
        }
        // If already loaded, return cached
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }
        
        // Load smaplers (keyFrames data)
        const samplers = [];
        for (let i = 0; i < gltfSpec.samplers.length; i++) {
            const sampler = gltfSpec.samplers[i];
            const time = this.loadAccessor(sampler.input);
            const keyFrames_data = this.loadAccessor(sampler.output);

            // delta time (time between 2 frames) 24FPS - 0.0416s, 60FPS - 0.0166s
            const dt_keyframe = time.get(keyFrames_data.count - 1) / (keyFrames_data.count - 1);
            // Number of keyframes 
            const frameCount = keyFrames_data.count;
            // Interpolation methode between keyframes
            const interpolation = sampler.interpolation;
            // Keyframes value (transformations - translation, rotation, scale)
            const keyFrames = keyFrames_data.getAll();
            const timeFrames = time.getAll();
            
            samplers[i] = { dt_keyframe, frameCount, keyFrames, timeFrames, interpolation };
            if (interpolation == "STEP") {
                samplers[i].timeFrames = time.getAll();
            }
        }

        // Load channels (trnslation, rotation, scale, weights)
        const channels = {};
        for (const channel of gltfSpec.channels) {
            const target = channel.target;
            
            channels[target.path] = samplers[channel.sampler];
        }

        // Work only for 1 node animations
        const node = gltfSpec.channels[0].target.node;
        
        const animation = new animationAsset({
            name: gltfSpec.name,
            dt_keyframe: channels.translation.dt_keyframe,
            frameCount: channels.translation.frameCount,
            // Keyframes + count + interpolation methode for translation
            translationKf: channels.translation ?? null,
            // Keyframes + count + interpolation methode for rotation
            rotationKf: channels.rotation ?? null,
            // Keyframes + count + interpolation methode for scale
            scaleKf: channels.scale ?? null,
        });

        this.cache.set(gltfSpec, animation);
        return { node, animation };

    }
    loadAllScenes() {
        for (const scene of this.gltf.scenes) {
            this.loadScene(scene);
        }
    }


    loadScene(nameOrIndex) {
        // Default scene
        const gltfSpec = this.findByNameOrIndex(this.gltf.scenes, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        // If already loaded, return cached
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        // Build scene
        const scene = new Node();
        scene.name = 'scene';
        if (gltfSpec.nodes) {
            for (const nodeIndex of gltfSpec.nodes) {
                // Load nodes
                const node = this.loadNode(nodeIndex);
                // Create bounding volume if does not exist
                if (!node.getObjectBVH() && node.name != 'Background') {
                    const model = node.getComponentOfType(Model);
                    if (model) { node.addComponent(new BVH({ model, node })); }
                }
                scene.addChild(node);
            }
        }

        this.cache.set(gltfSpec, scene);
        return scene;
    }

    async loadAssets(url, options) {
        await this.load(url);

        // Load animations
        const animations = {};
        if (this.gltf.animations) {
            for (const animationIndex in this.gltf.animations) {
                const animationAsset = this.loadAnimation(+animationIndex);
                 // If the node property does not exist, create it as an array
                animations[animationAsset.node] = animations[animationAsset.node] || [];
                // Add the new animation to the array for the node
                animations[animationAsset.node].push(animationAsset.animation);
            }
        }
        this.animations = animations;


        // Load default scene
        const gltfSpec = this.findByNameOrIndex(this.gltf.scenes, this.defaultScene);
        if (!gltfSpec) {
            return null;
        }
        
        // If already loaded, return cached
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        // Load nodes
        const nodes = {};
        if (gltfSpec.nodes) {
            for (const nodeIndex of gltfSpec.nodes) {
                const node = this.loadNode(nodeIndex);

                // Create bounding volume if does not exist
                if (options.bvh && !node.getObjectBVH()) {
                    const model = node.getComponentOfType(Model);
                    if (model) { node.addComponent(new BVH({ model, node })); }
                }
                nodes[node.name] = node;
            }
        }


        this.cache.set(gltfSpec, nodes);
        return nodes;
    }

}
