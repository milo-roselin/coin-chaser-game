import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Trophy, Play, Volume2, VolumeX, Lock } from "lucide-react";

export default function StartScreen() {
  const { startGame, startFromLevel, showLeaderboard, highestLevelUnlocked, totalScore, resetProgress } = useCoinGame();
  const { isMuted, toggleMute } = useAudio();

  const handleStartGame = () => {
    // Enable audio context on user interaction
    const { explosionSound } = useAudio.getState();
    if (explosionSound) {
      explosionSound.muted = false;
      explosionSound.load();
    }
    startGame();
  };

  const handleContinue = () => {
    startFromLevel(highestLevelUnlocked);
  };

  const handleShowLeaderboard = () => {
    showLeaderboard();
  };

  const handleResetProgress = () => {
    if (confirm("Reset all progress? This will delete your checkpoint and start from Level 1.")) {
      resetProgress();
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Skip if typing in input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      

      
      const key = e.key.toLowerCase();
      const code = e.code;
      
      // Handle Enter key (multiple ways for Microsoft keyboards)
      if (key === 'enter' || code === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        handleStartGame();
        return;
      }
      
      // Handle letter keys
      if (key === 'n' || code === 'KeyN') {
        e.preventDefault();
        handleStartGame();
        return;
      }
      
      if ((key === 'c' || code === 'KeyC') && highestLevelUnlocked > 1) {
        e.preventDefault();
        handleContinue();
        return;
      }
      
      if (key === 'l' || code === 'KeyL') {
        e.preventDefault();
        handleShowLeaderboard();
        return;
      }
      
      if (key === 'm' || code === 'KeyM') {
        e.preventDefault();
        toggleMute();
        return;
      }
      
      if ((key === 'r' || code === 'KeyR') && highestLevelUnlocked > 1) {
        e.preventDefault();
        handleResetProgress();
        return;
      }
      
      // Handle number keys (multiple ways for Microsoft keyboards)
      const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const numberCodes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'];
      
      let level = 0;
      if (numberKeys.includes(key)) {
        level = parseInt(key);
      } else if (numberCodes.includes(code)) {
        level = parseInt(code.replace('Digit', ''));
      } else if (e.keyCode >= 49 && e.keyCode <= 57) {
        level = e.keyCode - 48;
      }
      
      if (level > 0 && level <= highestLevelUnlocked) {
        e.preventDefault();
        startFromLevel(level);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleStartGame, handleContinue, handleShowLeaderboard, toggleMute, handleResetProgress, highestLevelUnlocked, startFromLevel]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      {/* Game Logo */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4">🪙</div>
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Coin Rush</h1>
        <p className="text-lg text-gray-600">Collect coins, avoid obstacles!</p>
        {highestLevelUnlocked > 1 && (
          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
            <p className="text-sm font-semibold text-purple-700">
              Checkpoint: Level {highestLevelUnlocked} Unlocked
            </p>
            <p className="text-xs text-purple-600">
              Total Score: {totalScore.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Main Menu Card */}
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6 space-y-4">
          <Button 
            onClick={handleStartGame}
            size="lg"
            className="w-full text-xl py-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg"
          >
            <Play className="mr-2 h-6 w-6" />
            New Game
            <span className="ml-auto text-sm opacity-75">[N]</span>
          </Button>

          {highestLevelUnlocked > 1 && (
            <Button 
              onClick={handleContinue}
              size="lg"
              className="w-full text-xl py-6 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg"
            >
              🌀 Continue from Level {highestLevelUnlocked}
              <span className="ml-auto text-sm opacity-75">[C]</span>
            </Button>
          )}

          <Button 
            onClick={handleShowLeaderboard}
            variant="outline"
            size="lg"
            className="w-full text-lg py-4 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl"
          >
            <Trophy className="mr-2 h-5 w-5" />
            Leaderboard
            <span className="ml-auto text-sm opacity-75">[L]</span>
          </Button>

          <Button 
            onClick={toggleMute}
            variant="outline"
            size="lg"
            className="w-full text-lg py-4 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl"
          >
            {isMuted ? <VolumeX className="mr-2 h-5 w-5" /> : <Volume2 className="mr-2 h-5 w-5" />}
            {isMuted ? "Unmute" : "Mute"} Sound
            <span className="ml-auto text-sm opacity-75">[M]</span>
          </Button>

          {highestLevelUnlocked > 1 && (
            <Button 
              onClick={handleResetProgress}
              variant="outline"
              size="sm"
              className="w-full text-sm py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg"
            >
              Reset Progress
              <span className="ml-auto text-xs opacity-75">[R]</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Level Selection Grid */}
      {highestLevelUnlocked > 1 && (
        <Card className="w-full max-w-2xl bg-white/90 backdrop-blur-sm shadow-xl mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🎯 Level Select</h3>
            <div className="grid grid-cols-8 gap-3 mb-4">
              {Array.from({ length: highestLevelUnlocked }, (_, i) => {
                const level = i + 1;
                const isUnlocked = level <= highestLevelUnlocked;
                return (
                  <Button
                    key={level}
                    onClick={() => startFromLevel(level)}
                    size="default"
                    className={`aspect-square text-base font-bold min-h-12 ${
                      isUnlocked 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!isUnlocked}
                    title={isUnlocked ? `Press ${level} to start Level ${level}` : `Level ${level} locked`}
                  >
                    {isUnlocked ? level : <Lock className="h-4 w-4" />}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Jump to any unlocked level • Highest: Level {highestLevelUnlocked}
              <br />
              <span className="text-xs opacity-75">Press 1-9 keys for quick access</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="mt-8 text-center max-w-md">
        <p className="text-sm text-gray-600 mb-2">How to Play:</p>
        <p className="text-xs text-gray-500">
          Use arrow keys or WASD to move your character. You can also tap and hold to move. 
          Collect coins and avoid TNT guards patrolling around them. Reach the portal to win!
        </p>
      </div>
    </div>
  );
}
