import { Suspense, useEffect } from "react";
import { useCoinGame } from "./lib/stores/useCoinGame";
import { useAudio } from "./lib/stores/useAudio";
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

  // Initialize audio on component mount
  useEffect(() => {
    const initializeAudio = async () => {
      try {
        const backgroundMusic = new Audio("/sounds/background.mp3");
        const hitSound = new Audio("/sounds/hit.mp3");
        const successSound = new Audio("/sounds/success.mp3");
        const explosionSound = new Audio("/attached_assets/explosion-6055_1752612347276.mp3");
        const coinSound = new Audio("/sounds/coin.mp3");

        // Set properties
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.3;
        explosionSound.volume = 0.6;
        explosionSound.preload = "auto";
        
        // Preload the explosion sound
        await new Promise((resolve) => {
          explosionSound.addEventListener('canplaythrough', resolve, { once: true });
          explosionSound.load();
        });

        setBackgroundMusic(backgroundMusic);
        setHitSound(hitSound);
        setSuccessSound(successSound);
        setExplosionSound(explosionSound);
        setCoinSound(coinSound);
      } catch (error) {
        console.log("Audio initialization error:", error);
        // Fallback to default explosion sound if custom one fails
        const fallbackExplosion = new Audio("/sounds/explosion.mp3");
        setExplosionSound(fallbackExplosion);
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
      style={{ 
        width: '100vw', 
        height: '100vh', 
        position: 'relative', 
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #87CEEB 0%, #98FB98 100%)',
        fontFamily: 'Inter, sans-serif'
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
  );
}

export default App;
