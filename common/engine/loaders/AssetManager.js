import { GLTFLoader } from '../../../common/engine/loaders/GLTFLoader.js';
import { ImageLoader } from '../../../common/engine/loaders/ImageLoader.js';

class AssetType {
    static MODEL_3D = "model_3d";
    static AUDIO = "audio";
    static IMAGE = "image";
    // Add more types as needed
}

class Assets {
    constructor(type, loader, path) {
        this.loader = loader;
        this.loaded = {}
        this.type = type;
        this.assetPath = path;

    }
    async load(assetsConfig) {
        for (const assets of assetsConfig) {
            await this.loadAssets(assets.category, this.assetPath + assets.file)
        }
    }

    async loadAssets(category, url, new_category=false) {
        // Create empty if not exist
        if (!this.loaded[category]) {
            this.loaded[category] = {};
        }

        await this.loader.load(url);
        const newLoadedAssets = this.loader.loadAssets(this.loader.defaultScene);

        // if new_category = true -> reaplce 
        // if new_category = false -> join
        if (new_category) {
            // Repalce category
            this.loaded[category] = newLoadedAssets;
        } else {
            // Join category
            // Merge the newly loaded assets with the existing ones
            //  (...) is used to merge the existing directory with new 
            this.loaded[category] = {
                ...this.loaded[category],
                ...newLoadedAssets,
            };
        }
    }

    unloadAssets(category) {
        // Unload all models of a specific type
        if (this.loaded[category]) {
          delete this.loaded[category];
        }
    }

    getAssetsByCategory(category) {
        // Retrieve Assets of category
        if (this.loaded[category]) {
            return this.loaded[category];
          } else {
            // Handle missing asset category
            return null;
        }
    }
    getAssetByName(category, assetName) {
        // Retrieve a loaded asset from the manager
        if (this.loaded[category] && this.loaded[category][assetName]) {
          return this.loaded[category][assetName];
        } else {
          // Handle missing asset
          return null;
        }
    }
}


export class AssetManager {

    async loadAssets() {
        this.modelAssets = await this.load3D_ModelAssets();
        this.imageAssets = await this.loadAudioAssets();
        this.audioAssets = await this.loadAudioAssets();
    }
    
    async load3D_ModelAssets() {
        const assetsConfig = [
            { category: 'weapons', file: 'weapons/weapons.gltf' },
            { category: 'opponents', file: 'opponents/zombies.gltf' },
            // Add more models as needed
        ];

        const modelAssets = new Assets(AssetType.MODEL_3D, new GLTFLoader(), 
                                        '../../../common/assets/models/');
        await modelAssets.load(assetsConfig)
        return modelAssets;
        
    }
    async loadImageAssets() {
        const assetsConfig = [
            { category: 'textures', path: 'grass.png' },
            // TODO - load all images from directory
            //{ category: 'characters', path: '/../../common/assets/images/background' },
        ];

        const imageAssets = new Assets(AssetType.IMAGE, new ImageLoader(),
                                        '../../../common/assets/images/');
        await imageAssets.load(assetsConfig)
        return imageAssets;
    }
    async loadAudioAssets() {
        // TODO
        //this.audioAssets = new Assets(AssetType.AUDIO, newAudioLoader());
        //await this.audioAssets.load()
        return {};
    }
 
    getAudioAssets() {
        return this.audioAssets;
    }
    get3D_ModelAssets() {
        return this.modelAssets;
    }
    getImageAssets() {
        return this.imageAssets;
    }
}