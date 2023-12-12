export class AudioSystem {
    constructor() {
      this.audioContext = new (window.AudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.sounds = {};
      this.loadSound("sfx_gunshot", '../../../common/assets/audio/weapon/gun_shot.mp3');
      this.loadSound("sfx_gunshot1", '../../../common/assets/audio/weapon/gun_shot2.mp3');
      this.loadSound("sfx_snipershot", '../../../common/assets/audio/weapon/sniper_shot.mp3');
      this.loadSound("sfx_snipershot1", '../../../common/assets/audio/weapon/sniper_shot2.wav');
      this.loadSound("sfx_rocketshot", '../../../common/assets/audio/weapon/rocket_shot.mp3');
      this.loadSound("sfx_explosion", '../../../common/assets/audio/weapon/explosion.mp3');
      this.loadSound("sfx_reload", '../../../common/assets/audio/weapon/reload.mp3');
    }
  
    async loadSound(name, url) {
      return fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => this.audioContext.decodeAudioData(data))
        .then(buffer => {
          this.sounds[name] = buffer;
        })
        .catch(error => console.error(`Error loading sound "${name}":`, error));
    }
  
    playSound(name) {
      if (this.sounds[name]) {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
  
        // Set volume
        gainNode.gain.value = 0.1;
  
        source.buffer = this.sounds[name];
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
      } else {
        console.error(`Sound "${name}" not found`);
      }
    }
  }