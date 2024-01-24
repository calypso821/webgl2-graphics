export class Audio {
  // Audio component
  constructor(audioSystem) {
    this.audioSystem = audioSystem;
    this.audioContext = audioSystem.audioContext;
    this.audioAssets = audioSystem.audioAssets;
    this.currentSource = null; // Keep track of the current audio source
  }
  
  playAudio(category, name) {
    if (!name) {
      return;
    }
    const audioBuffer = this.getAudio(category, name);
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioSystem.gainNode;
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);

    // Keep a reference to the current source for stopping later
    this.currentSource = source;
  }

  stopAudio() {
    if (this.currentSource) {
      this.currentSource.stop();
    }
  }

  getAudio(category, name) {
    return this.audioAssets.getAssetsByCategory(category)[name];
  }
}
