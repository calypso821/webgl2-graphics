export class AudioLoader {
    constructor() {
        this.audioContext = new window.AudioContext();
    }

    async load(url) {
        const response = await fetch(url);
        const data = await response.arrayBuffer();
        const buffer = await this.audioContext.decodeAudioData(data);
        return buffer;
    }

    async loadAssets(url) {
        const filename = url.split('/').pop().split('.');
        const audioBuffer = await this.load(url);
        return { [filename[0]]: audioBuffer };
    }
}
