import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useAudio } from "@/lib/stores/useAudio";
import { usePlayerAvatar } from "@/lib/stores/usePlayerAvatar";
import { useCoinBank } from "@/lib/stores/useCoinBank";
import { Trophy, Play, Volume2, VolumeX, Lock, Settings, User } from "lucide-react";
import AudioSettingsMenu from "./AudioSettingsMenu";
import CoinBankDisplay from "./CoinBankDisplay";
import { AvatarSelector } from "./AvatarSelector";
import MobileFullscreenButton from "../ui/MobileFullscreenButton";

export default function StartScreen() {
  const { startGame, startFromLevel, showLeaderboard, highestLevelUnlocked, totalScore, resetProgress } = useCoinGame();
  const { isMuted, toggleMute, startBackgroundMusic } = useAudio();
  const { getSelectedAvatar } = usePlayerAvatar();
  const { totalCoins } = useCoinBank();
  const [levelInput, setLevelInput] = useState("");
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const handleStartGame = () => {
    // Enable audio context on user interaction
    const { explosionSound } = useAudio.getState();
    if (explosionSound) {
      explosionSound.muted = false;
      explosionSound.load();
    }
    
    // Start background music
    startBackgroundMusic();
    
    startGame();
  };

  const handleContinue = () => {
    // Start background music
    startBackgroundMusic();
    
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
      
      if (key === 'o' || code === 'KeyO') {
        e.preventDefault();
        setShowAudioSettings(true);
        return;
      }
      
      if (key === 'a' || code === 'KeyA') {
        e.preventDefault();
        setShowAvatarSelector(true);
        return;
      }
      
      if ((key === 'r' || code === 'KeyR') && highestLevelUnlocked > 1) {
        e.preventDefault();
        handleResetProgress();
        return;
      }
      
      // Handle number keys for multi-digit input
      const numberKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      const numberCodes = ['Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'];
      
      let digit = '';
      if (numberKeys.includes(key)) {
        digit = key;
      } else if (numberCodes.includes(code)) {
        digit = code.replace('Digit', '');
      } else if (e.keyCode >= 48 && e.keyCode <= 57) {
        digit = String(e.keyCode - 48);
      }
      
      if (digit !== '') {
        e.preventDefault();
        
        // Clear existing timeout
        if (inputTimeout) {
          clearTimeout(inputTimeout);
        }
        
        const newInput = levelInput + digit;
        setLevelInput(newInput);
        
        // Set timeout to execute level selection after 1 second
        const timeout = setTimeout(() => {
          const level = parseInt(newInput);
          if (level > 0 && level <= highestLevelUnlocked) {
            startFromLevel(level);
          }
          setLevelInput("");
        }, 1000);
        
        setInputTimeout(timeout);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (inputTimeout) {
        clearTimeout(inputTimeout);
      }
    };
  }, [handleStartGame, handleContinue, handleShowLeaderboard, toggleMute, handleResetProgress, highestLevelUnlocked, startFromLevel, levelInput, inputTimeout]);

  return (
    <div className="game-container flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white relative">
      {/* Coin Bank Display - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        <CoinBankDisplay showSessionCoins={true} />
      </div>
      
      {/* Mobile Fullscreen Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <MobileFullscreenButton />
      </div>
      
      {/* Game Logo */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <img src="/gold-coin.svg" alt="Gold Coin" className="w-20 h-20" />
        </div>
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Coin Rush</h1>
        <p className="text-lg text-gray-600">Collect coins, avoid obstacles and more!</p>
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
            onClick={() => setShowAvatarSelector(true)}
            variant="outline"
            size="lg"
            className="w-full text-lg py-4 border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-semibold rounded-xl"
          >
            <User className="mr-2 h-5 w-5" />
            Choose Avatar
            <span className="ml-2 text-sm text-yellow-500">({totalCoins} coins)</span>
            <span className="ml-auto text-sm opacity-75">[A]</span>
          </Button>

          <div className="flex gap-2">
            <Button 
              onClick={toggleMute}
              variant="outline"
              size="lg"
              className="flex-1 text-lg py-4 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl"
            >
              {isMuted ? <VolumeX className="mr-2 h-5 w-5" /> : <Volume2 className="mr-2 h-5 w-5" />}
              {isMuted ? "Unmute" : "Mute"}
              <span className="ml-auto text-sm opacity-75">[M]</span>
            </Button>
            
            <Button 
              onClick={() => setShowAudioSettings(true)}
              variant="outline"
              size="lg"
              className="px-4 py-4 border-2 border-blue-300 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl"
              title="Audio Settings [O]"
            >
              <Settings className="h-5 w-5" />
              <span className="ml-2 text-sm opacity-75">[O]</span>
            </Button>
          </div>

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
        <Card className="w-full max-w-4xl bg-white/90 backdrop-blur-sm shadow-xl mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🎯 Level Select</h3>
            <div className="overflow-x-auto">
              <div className="flex flex-wrap gap-3 mb-4 justify-center min-h-[60px]">
                {Array.from({ length: highestLevelUnlocked }, (_, i) => {
                  const level = i + 1;
                  const isUnlocked = level <= highestLevelUnlocked;
                  return (
                    <Button
                      key={level}
                      onClick={() => startFromLevel(level)}
                      size="default"
                      className={`w-12 h-12 text-base font-bold flex-shrink-0 ${
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
            </div>
            <p className="text-xs text-gray-500 text-center">
              Jump to any unlocked level • Highest: Level {highestLevelUnlocked}
              <br />
              <span className="text-xs opacity-75">
                Type level number (e.g., press 1 then 7 for Level 17)
                {levelInput && <span className="ml-2 text-blue-600 font-semibold">Typing: {levelInput}...</span>}
              </span>
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
      
      {/* Audio Settings Modal */}
      <AudioSettingsMenu 
        isOpen={showAudioSettings} 
        onClose={() => setShowAudioSettings(false)} 
      />

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector 
          onClose={() => setShowAvatarSelector(false)} 
        />
      )}
    </div>
  );
}
