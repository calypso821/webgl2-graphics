import { modelAssets, vfxAssets, imageAssets, audioAssets } from '../../../common/engine/loaders/Assets.js';

export class AssetManager {

    async initAssets() {
        this.modelAssets = new modelAssets();
        this.vfxAssets = new vfxAssets();
        this.imageAssets = new imageAssets();
        this.audioAssets = new audioAssets();
        await this.modelAssets.init();
        await this.vfxAssets.init();
        await this.imageAssets.init();
        await this.audioAssets.init();
    }
 
    getAudioAssets() {
        return this.audioAssets;
    }
    getImageAssets() {
        return this.imageAssets;
    }
    getModelAssets() {
        return this.modelAssets;
    }
    getVFXAssets() {
        return this.vfxAssets;
    }
    
}