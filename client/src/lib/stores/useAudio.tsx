import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  explosionSound: HTMLAudioElement | null;
  coinSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Volume settings
  backgroundMusicVolume: number;
  soundEffectsVolume: number;
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setExplosionSound: (sound: HTMLAudioElement) => void;
  setCoinSound: (sound: HTMLAudioElement) => void;
  
  // Volume control functions
  setBackgroundMusicVolume: (volume: number) => void;
  setSoundEffectsVolume: (volume: number) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playExplosion: () => void;
  playCoin: () => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  explosionSound: null,
  coinSound: null,
  isMuted: true, // Start muted by default
  
  // Volume settings
  backgroundMusicVolume: 30,
  soundEffectsVolume: 60,
  musicEnabled: true,
  soundEffectsEnabled: true,
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setExplosionSound: (sound) => set({ explosionSound: sound }),
  setCoinSound: (sound) => set({ coinSound: sound }),
  
  // Volume control functions
  setBackgroundMusicVolume: (volume) => {
    set({ backgroundMusicVolume: volume });
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      backgroundMusic.volume = volume / 100;
    }
  },
  
  setSoundEffectsVolume: (volume) => {
    set({ soundEffectsVolume: volume });
    const { hitSound, successSound, explosionSound, coinSound } = get();
    const baseVolume = volume / 100;
    
    if (hitSound) hitSound.volume = baseVolume * 0.3;
    if (successSound) successSound.volume = baseVolume * 0.5;
    if (explosionSound) explosionSound.volume = baseVolume * 0.6;
    if (coinSound) coinSound.volume = baseVolume * 0.8;
  },
  
  setMusicEnabled: (enabled) => {
    set({ musicEnabled: enabled });
    const { backgroundMusic, isMuted } = get();
    if (backgroundMusic) {
      if (enabled && !isMuted) {
        backgroundMusic.play().catch(console.log);
      } else {
        backgroundMusic.pause();
      }
    }
  },
  
  setSoundEffectsEnabled: (enabled) => set({ soundEffectsEnabled: enabled }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
    
    // Handle background music based on mute state
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      if (newMutedState) {
        backgroundMusic.pause();
      } else {
        backgroundMusic.play().catch(error => {
          console.log("Background music play failed:", error);
        });
      }
    }
    
    // Test explosion sound when unmuting
    if (!newMutedState) {
      setTimeout(() => {
        const { explosionSound } = get();
        if (explosionSound) {
          console.log("Testing explosion sound...");
          explosionSound.currentTime = 0;
          explosionSound.play().catch(error => {
            console.log("Explosion test failed:", error);
          });
        }
      }, 500);
    }
  },
  
  playHit: () => {
    const { hitSound, isMuted, soundEffectsEnabled } = get();
    if (hitSound && !isMuted && soundEffectsEnabled) {
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = hitSound.volume;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted, soundEffectsEnabled } = get();
    if (successSound && !isMuted && soundEffectsEnabled) {
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playExplosion: () => {
    const { explosionSound, isMuted, soundEffectsEnabled } = get();
    if (explosionSound && !isMuted && soundEffectsEnabled) {
      try {
        explosionSound.currentTime = 0;
        explosionSound.playbackRate = 1.0;
        
        const playPromise = explosionSound.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Explosion sound play prevented:", error);
            // Try to play without cloning as fallback
            setTimeout(() => {
              explosionSound.play().catch(() => {
                console.log("Explosion sound fallback failed");
              });
            }, 100);
          });
        }
      } catch (error) {
        console.log("Explosion sound error:", error);
      }
    }
  },
  
  playCoin: () => {
    const { coinSound, isMuted, soundEffectsEnabled } = get();
    if (coinSound && !isMuted && soundEffectsEnabled) {
      const soundClone = coinSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = coinSound.volume;
      soundClone.playbackRate = 1.0; // Normal speed since it's already shortened
      soundClone.currentTime = 0; // Start from beginning
      soundClone.play().catch(error => {
        console.log("Coin sound play prevented:", error);
      });
    }
  },
  
  startBackgroundMusic: () => {
    const { backgroundMusic, isMuted, musicEnabled } = get();
    if (backgroundMusic && !isMuted && musicEnabled) {
      backgroundMusic.loop = true;
      backgroundMusic.play().catch(error => {
        console.log("Background music play failed:", error);
      });
    }
  },
  
  stopBackgroundMusic: () => {
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
  },
}));
