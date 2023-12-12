import { Primitive, Material, Texture, Sampler, Model } from '../../../common/engine/core.js';
import { JSONLoader } from '../../../common/engine/loaders/JSONLoader.js';
import { ImageLoader } from '../../../common/engine/loaders/ImageLoader.js';


export class ModelLoader {

    async loadModel(meshUrl, imageUrl){
        const mesh = await new JSONLoader().loadMesh(meshUrl);
        const image = await new ImageLoader().load(imageUrl);
        const sampler = new Sampler({
            minFilter: 'nearest',
            magFilter: 'nearest',
        });
        const texture = new Texture({ image, sampler});
        const material = new Material({ baseTexture: texture});
        const primitive = new Primitive({ mesh, material});
        const model = new Model({ primitives: [primitive]});
        return model;
    }    
}