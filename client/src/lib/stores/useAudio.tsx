import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  explosionSound: HTMLAudioElement | null;
  coinSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setExplosionSound: (sound: HTMLAudioElement) => void;
  setCoinSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playExplosion: () => void;
  playCoin: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  explosionSound: null,
  coinSound: null,
  isMuted: true, // Start muted by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setExplosionSound: (sound) => set({ explosionSound: sound }),
  setCoinSound: (sound) => set({ coinSound: sound }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
    
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
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playExplosion: () => {
    const { explosionSound, isMuted } = get();
    if (explosionSound) {
      if (isMuted) {
        console.log("Explosion sound skipped (muted)");
        return;
      }
      
      try {
        explosionSound.currentTime = 0;
        explosionSound.volume = 0.6;
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
    const { coinSound, isMuted } = get();
    if (coinSound) {
      if (isMuted) {
        console.log("Coin sound skipped (muted)");
        return;
      }
      
      const soundClone = coinSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.8; // Slightly louder for clarity
      soundClone.playbackRate = 1.0; // Normal speed since it's already shortened
      soundClone.currentTime = 0; // Start from beginning
      soundClone.play().catch(error => {
        console.log("Coin sound play prevented:", error);
      });
    }
  }
}));
