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
    
    // Playful treasure hunt melody sequence
    const melodyNotes = [
      { freq: 523.25, duration: 0.3 }, // C5
      { freq: 587.33, duration: 0.3 }, // D5
      { freq: 659.25, duration: 0.6 }, // E5
      { freq: 587.33, duration: 0.3 }, // D5
      { freq: 523.25, duration: 0.3 }, // C5
      { freq: 440.00, duration: 0.6 }, // A4
      { freq: 493.88, duration: 0.3 }, // B4
      { freq: 523.25, duration: 0.9 }, // C5
    ];
    
    // Background harmony chords for coin collection theme
    const harmonyChords = [
      [261.63, 329.63, 392.00], // C major - adventure start
      [349.23, 440.00, 523.25], // F major - treasure discovery
      [392.00, 493.88, 587.33], // G major - success feeling
      [261.63, 329.63, 392.00], // C major - return home
    ];
    
    let melodyIndex = 0;
    let harmonyIndex = 0;
    
    const playMelodyNote = () => {
      if (!this.isPlaying || !this.audioContext || !this.masterGain) return;
      
      const note = melodyNotes[melodyIndex];
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      // Use triangle wave for a more playful, game-like sound
      oscillator.type = 'triangle';
      oscillator.frequency.value = note.freq;
      
      gainNode.gain.value = 0;
      gainNode.gain.setTargetAtTime(0.4, this.audioContext.currentTime, 0.05);
      gainNode.gain.setTargetAtTime(0, this.audioContext.currentTime + note.duration - 0.1, 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + note.duration);
      
      melodyIndex = (melodyIndex + 1) % melodyNotes.length;
      
      // Schedule next note
      if (this.isPlaying) {
        setTimeout(() => playMelodyNote(), note.duration * 1000);
      }
    };
    
    const playHarmonyChord = () => {
      if (!this.isPlaying || !this.audioContext || !this.masterGain) return;
      
      const chord = harmonyChords[harmonyIndex];
      const chordGain = this.audioContext.createGain();
      chordGain.connect(this.masterGain);
      chordGain.gain.value = 0;
      
      // Create soft harmony background
      const oscillators = chord.map(frequency => {
        const oscillator = this.audioContext!.createOscillator();
        const noteGain = this.audioContext!.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency * 0.5; // Lower octave for background
        noteGain.gain.value = 0.15; // Softer background
        
        oscillator.connect(noteGain);
        noteGain.connect(chordGain);
        
        return { oscillator, noteGain };
      });
      
      // Gentle fade in
      chordGain.gain.setTargetAtTime(0.6, this.audioContext.currentTime, 0.3);
      
      oscillators.forEach(({ oscillator }) => {
        oscillator.start();
      });
      
      // Fade out after 2.5 seconds
      setTimeout(() => {
        if (chordGain && this.audioContext) {
          chordGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.3);
          
          setTimeout(() => {
            oscillators.forEach(({ oscillator }) => {
              try {
                oscillator.stop();
              } catch (error) {
                // Oscillator might already be stopped
              }
            });
          }, 800);
        }
      }, 2500);
      
      harmonyIndex = (harmonyIndex + 1) % harmonyChords.length;
      
      // Schedule next chord
      if (this.isPlaying) {
        setTimeout(() => playHarmonyChord(), 3000);
      }
    };
    
    // Start melody and harmony
    playMelodyNote();
    setTimeout(() => playHarmonyChord(), 500); // Start harmony slightly after melody
    
    // Add coin collection sound effect periodically
    this.addCoinSparkles();
  }
  
  // Add magical coin sparkle effects
  private addCoinSparkles() {
    if (!this.audioContext || !this.masterGain) return;
    
    const playSparkle = () => {
      if (!this.isPlaying || !this.audioContext || !this.masterGain) return;
      
      // Create a magical sparkle sound like coin collection
      const frequencies = [1318.51, 1567.98, 1975.53]; // High notes for sparkle
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = this.audioContext!.createOscillator();
          const gainNode = this.audioContext!.createGain();
          
          oscillator.type = 'sine';
          oscillator.frequency.value = freq;
          
          gainNode.gain.value = 0.1;
          gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + 0.2);
          
          oscillator.connect(gainNode);
          gainNode.connect(this.masterGain);
          
          oscillator.start();
          oscillator.stop(this.audioContext!.currentTime + 0.2);
        }, index * 50); // Cascade the sparkle notes
      });
      
      // Random sparkles every 8-12 seconds
      if (this.isPlaying) {
        const nextSparkle = 8000 + Math.random() * 4000;
        setTimeout(() => playSparkle(), nextSparkle);
      }
    };
    
    // Start sparkles after initial delay
    setTimeout(() => playSparkle(), 3000);
  }
}

// Create a singleton instance
export const backgroundMusic = new BackgroundMusicGenerator();