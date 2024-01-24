import { GLTFLoader } from '../../../common/engine/loaders/GLTFLoader.js';
import { ImageLoader } from '../../../common/engine/loaders/ImageLoader.js';
import { AudioLoader } from '../../../common/engine/loaders/AudioLoader.js';

class Assets {
    constructor() {
        this.loaded = {};
        this.loader = null;
        this.assetPath = "";
    }

    async load(assetsConfig) {
        for (const assets of assetsConfig) {
            const url = this.assetPath + assets.folder;
            const options = { bvh: assets.bvh };
            for (const file of assets.files) {
                await this.loadAssets(assets.category, url + file, options);
            }
        }
    }

    async loadAssets(category, url, options) {
        // Create empty if not exist
        if (!this.loaded[category]) {
            this.loaded[category] = {};
        }
        if (!this.loader) {
            console.warn("Asset loader not initialized!");
            return;
        }       
        const newLoadedAssets = await this.loader.loadAssets(url, options);
        this.addAssets(newLoadedAssets, category);
    }

    addAssets(newAssets, category, new_category=false) {
        // if new_category = true -> reaplce 
        // if new_category = false -> join
        if (new_category) {
            // Repalce category
            this.loaded[category] = newAssets;
        } else {
            // Join category
            // Merge the newly loaded assets with the existing ones
            //  (...) is used to merge the existing directory with new 
            this.loaded[category] = {
                ...this.loaded[category],
                ...newAssets,
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

export class modelAssets extends Assets {
    constructor() {
        super();
        this.assetPath = '../../../common/assets/models/';
        this.loader = new GLTFLoader();
    }
    async init() {
        const assetsConfig = [
            { category: 'weapons', folder: 'weapons/', files: ['weapons.gltf'] },
            { category: 'opponents', folder: 'opponents/', files: ['opponents.gltf'], bvh: true },
            { category: 'opponents', folder: 'opponents/', files: ['eye.gltf'], bvh: true },
            //{ category: 'volumes', folder: 'volumes/', files: ['box.gltf'] },
            //{ category: 'volumes', folder: 'volumes/', files: ['simple_cube.gltf'], bvh: true },
            //{ category: 'volumes', folder: 'volumes/', files: ['bv_box.gltf'], bvh: true },
            //{ category: 'animals', folder: 'animals/', files: ['animals.gltf'], bvh: true },
            { category: 'opponents', folder: 'monsters/', files: ['dragons.gltf'], bvh: true },
            { category: 'structures', folder: 'structures/', files: ['portal.gltf'], bvh: true },
            // Add more models as needed
        ];

        await this.load(assetsConfig);  
    }
}

export class vfxAssets extends Assets {
    constructor() {
        super();
        this.assetPath = '../../../common/assets/vfx/';
        this.loader = new GLTFLoader();
    }
    async init() {
        const assetsConfig = [
                { category: 'laser', folder: 'laser/', files: ['laser.gltf'] },
                //{ category: 'fire', folder: 'fire/', files: ['fire.gltf'] },
                { category: 'explosion', folder: 'explosion/', files: ['explosion.gltf'] },
                // Add more models as needed
        ];

        await this.load(assetsConfig);  
    }
}

export class imageAssets extends Assets {
    constructor() {
        super();
        this.assetPath = '../../../common/assets/images/';
        this.loader = new ImageLoader();
    }
    async init() {
        const assetsConfig = [
                { category: 'weapons', folder: 'weapons/', files: [
                    'sniper_scope_zoom1.png', 
                    //'sniper_scope_zoom2.png',
                    'head_hit.png',
                    'normal_hit.png',
                    ]},
                { category: 'other', folder: 'other/', files: [
                    'crate-diffuse.png',
                    'grass.png',
                    'grayscale.png'
                    ]},
                // Add more models as needed
        ];
        await this.load(assetsConfig);  
    }
}

export class audioAssets extends Assets {
    constructor() {
        super();
        this.assetPath = '../../../common/assets/audio/';
        this.loader = new AudioLoader();
    }
    async init() {
        const assetsConfig = [
                { category: 'weapons', folder: 'weapons/', files: [
                    'ak_47_gunshot.mp3', 
                    'ak_47_gunshot2.mp3',
                    'sniper_gunshot.mp3',
                    'sniper_gunshot2.wav',
                    'sniper_gunshot3.mp3',
                    'rpg_gunshot.mp3',
                    'rocket_hit.mp3',
                    'ak47_reload.mp3',  
                    'sniper_reload.mp3',
                    'rpg_reload.mp3',
                    ]},
                { category: 'opponents', folder: 'opponents/', files: [
                    'punch1.mp3', 
                    'punch2.mp3',
                    ]},
                { category: 'soundtrack', folder: 'soundtrack/', files: [
                    'soundtrack1.mp3', 
                    ]},
        ];
        await this.load(assetsConfig);  
    }
}

