
import { Audio } from '../core.js';

export class AudioSystem {
  constructor(audioAssets) {
    this.audioContext = new (window.AudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.audioAssets = audioAssets;

    this.soundtrackAudio = new Audio(this);
    this.setVolume(0.1);
    //this.setVolume(0);
  }
  setVolume(value) {
    this.gainNode.gain.value = value;
  }
  startSoundtrackAudio() {
    this.soundtrackAudio.stopAudio();
    this.soundtrackAudio.playAudio('soundtrack', 'soundtrack1')
  }
}

