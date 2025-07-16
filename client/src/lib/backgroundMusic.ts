// Background music generator using Web Audio API
export class BackgroundMusicGenerator {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private gainNode: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  
  constructor() {
    this.initializeAudio();
  }
  
  private initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create master gain node for volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.15; // Low volume for background music
      
      console.log('Background music system initialized');
    } catch (error) {
      console.log('Web Audio API not supported:', error);
    }
  }
  
  public async start() {
    if (!this.audioContext || this.isPlaying) return;
    
    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.isPlaying = true;
      this.playAmbientMusic();
      console.log('Background music started');
    } catch (error) {
      console.log('Failed to start background music:', error);
    }
  }
  
  public stop() {
    if (!this.audioContext || !this.isPlaying) return;
    
    this.isPlaying = false;
    console.log('Background music stopped');
  }
  
  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.15;
    }
  }
  
  private playAmbientMusic() {
    if (!this.audioContext || !this.isPlaying || !this.masterGain) return;
    
    // Create a simple ambient chord progression
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [293.66, 369.99, 440.00], // D minor
      [329.63, 415.30, 493.88], // E minor
      [349.23, 440.00, 523.25], // F major
    ];
    
    let chordIndex = 0;
    
    const playChord = () => {
      if (!this.isPlaying || !this.audioContext || !this.masterGain) return;
      
      const chord = chords[chordIndex];
      const chordGain = this.audioContext.createGain();
      chordGain.connect(this.masterGain);
      chordGain.gain.value = 0;
      
      // Create oscillators for each note in the chord
      const oscillators = chord.map(frequency => {
        const oscillator = this.audioContext!.createOscillator();
        const noteGain = this.audioContext!.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        noteGain.gain.value = 0.3;
        
        oscillator.connect(noteGain);
        noteGain.connect(chordGain);
        
        return { oscillator, noteGain };
      });
      
      // Fade in
      chordGain.gain.setTargetAtTime(0.8, this.audioContext.currentTime, 0.5);
      
      // Start all oscillators
      oscillators.forEach(({ oscillator }) => {
        oscillator.start();
      });
      
      // Fade out and stop after 3 seconds
      setTimeout(() => {
        if (chordGain && this.audioContext) {
          chordGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.5);
          
          setTimeout(() => {
            oscillators.forEach(({ oscillator }) => {
              try {
                oscillator.stop();
              } catch (error) {
                // Oscillator might already be stopped
              }
            });
          }, 1000);
        }
      }, 3000);
      
      // Move to next chord
      chordIndex = (chordIndex + 1) % chords.length;
      
      // Schedule next chord
      if (this.isPlaying) {
        setTimeout(() => playChord(), 4000);
      }
    };
    
    // Start the music
    playChord();
  }
  
  // Add some percussion elements
  private createPercussion() {
    if (!this.audioContext || !this.masterGain) return;
    
    const playBeat = () => {
      if (!this.isPlaying || !this.audioContext || !this.masterGain) return;
      
      // Create a subtle kick drum sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 60; // Low frequency for kick
      
      gainNode.gain.value = 0.2;
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.1);
      
      // Schedule next beat
      if (this.isPlaying) {
        setTimeout(() => playBeat(), 1000); // Every second
      }
    };
    
    // Start percussion after a delay
    setTimeout(() => playBeat(), 2000);
  }
}

// Create a singleton instance
export const backgroundMusic = new BackgroundMusicGenerator();