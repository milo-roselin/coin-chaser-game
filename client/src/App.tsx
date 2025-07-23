import { Suspense, useEffect, useState } from "react";
import { useCoinGame } from "./lib/stores/useCoinGame";
import { useAudio } from "./lib/stores/useAudio";
import { useDevicePreference } from "./lib/stores/useDevicePreference";
import { initializeMobileFullscreen } from "./lib/utils/mobileFullscreen";
import StartScreen from "./components/Game/StartScreen";
import GameScreen from "./components/Game/GameScreen";
import GameOverScreen from "./components/Game/GameOverScreen";
import VictoryScreen from "./components/Game/VictoryScreen";
import LeaderboardScreen from "./components/Game/LeaderboardScreen";
import NextLevelScreen from "./components/Game/NextLevelScreen.tsx";
import "@fontsource/inter";

function App() {
  const { gameState } = useCoinGame();
  const { setBackgroundMusic, setHitSound, setSuccessSound, setExplosionSound, setCoinSound } = useAudio();
  const { selectedDevice, getScreenDimensions } = useDevicePreference();
  const [screenDimensions, setScreenDimensions] = useState({ width: '100vw', height: '100vh' });

  // Initialize mobile fullscreen
  useEffect(() => {
    initializeMobileFullscreen();
  }, []);

  // Update screen dimensions based on device selection
  useEffect(() => {
    const updateDimensions = () => {
      if (selectedDevice === 'auto') {
        setScreenDimensions({ width: '100vw', height: '100vh' });
      } else {
        const dimensions = getScreenDimensions();
        setScreenDimensions({ 
          width: `${dimensions.width}px`, 
          height: `${dimensions.height}px` 
        });
      }
    };
    
    updateDimensions();
    
    // Listen for window resize events
    const handleResize = () => {
      if (selectedDevice === 'auto') {
        setScreenDimensions({ width: '100vw', height: '100vh' });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedDevice, getScreenDimensions]);

  // Initialize audio on component mount
  useEffect(() => {
    const initializeAudio = () => {
      try {
        // Create audio objects with proper error handling
        const backgroundMusic = new Audio("/sounds/background.mp3");
        const hitSound = new Audio("/sounds/hit.mp3");
        const successSound = new Audio("/sounds/success.mp3");
        const explosionSound = new Audio("/sounds/custom_explosion.mp3");
        const coinSound = new Audio("/sounds/coin.mp3");

        // Set basic properties
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.3;
        backgroundMusic.preload = "none";
        
        hitSound.preload = "auto";
        hitSound.volume = 0.3;
        
        successSound.preload = "auto";
        successSound.volume = 0.5;
        
        explosionSound.preload = "auto";
        explosionSound.volume = 0.6;
        
        coinSound.preload = "auto";
        coinSound.volume = 0.7;

        // Add error handlers
        const audioElements = [backgroundMusic, hitSound, successSound, explosionSound, coinSound];
        audioElements.forEach(audio => {
          audio.addEventListener('error', (e) => {
            console.log(`Audio error for ${audio.src}:`, e);
          });
        });

        setBackgroundMusic(backgroundMusic);
        setHitSound(hitSound);
        setSuccessSound(successSound);
        setExplosionSound(explosionSound);
        setCoinSound(coinSound);
        
        console.log("Audio system initialized");
      } catch (error) {
        console.log("Audio initialization error:", error);
      }
    };

    initializeAudio();
  }, [setBackgroundMusic, setHitSound, setSuccessSound, setExplosionSound, setCoinSound]);

  const renderScreen = () => {
    switch (gameState) {
      case "start":
        return <StartScreen />;
      case "playing":
        return <GameScreen />;
      case "gameOver":
        return <GameOverScreen />;
      case "victory":
        return <VictoryScreen />;
      case "leaderboard":
        return <LeaderboardScreen />;
      case "nextLevel":
        return <NextLevelScreen />;
      default:
        return <StartScreen />;
    }
  };

  return (
    <div 
      className="w-full h-screen flex items-center justify-center"
      style={{ 
        background: selectedDevice !== 'auto' ? '#f3f4f6' : 'transparent',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <div 
        className={selectedDevice !== 'auto' ? 'border-2 border-gray-400 shadow-2xl' : ''}
        style={{ 
          width: screenDimensions.width, 
          height: screenDimensions.height, 
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #87CEEB 0%, #98FB98 100%)',
          ...(selectedDevice !== 'auto' && {
            borderRadius: '8px'
          })
        }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-2xl font-bold text-blue-600">Loading...</div>
          </div>
        }>
          {renderScreen()}
        </Suspense>
      </div>
    </div>
  );
}

export default App;
