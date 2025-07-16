import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useLeaderboard } from "@/lib/stores/useLeaderboard";
import { Trophy, Home, Upload, Lock } from "lucide-react";

export default function VictoryScreen() {
  const { score, coinsCollected, resetGame, totalScore, highestLevelUnlocked, startFromLevel, currentLevel, totalCoinsCollected } = useCoinGame();
  const { addScore } = useLeaderboard();
  const [playerName, setPlayerName] = useState("");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [levelInput, setLevelInput] = useState("");
  const [inputTimeout, setInputTimeout] = useState<NodeJS.Timeout | null>(null);

  // Auto-submit score when screen loads
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
      addScore({
        name: savedName,
        score: totalScore,
        coins: totalCoinsCollected,
        date: new Date().toISOString()
      });
      setScoreSubmitted(true);
    } else {
      // Don't auto-submit anonymous scores, just mark as submitted
      setScoreSubmitted(true);
    }
  }, [addScore, totalScore, totalCoinsCollected]);

  const handleSubmitScore = () => {
    if (playerName.trim()) {
      localStorage.setItem('playerName', playerName.trim());
      addScore({
        name: playerName.trim(),
        score: totalScore,
        coins: totalCoinsCollected,
        date: new Date().toISOString()
      });
      setScoreSubmitted(true);
    }
  };

  const handleHome = () => {
    resetGame();
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      

      
      const key = e.key.toLowerCase();
      const code = e.code;
      
      // Handle home/escape keys
      if (key === 'h' || code === 'KeyH' || key === 'escape' || code === 'Escape' || e.keyCode === 27) {
        e.preventDefault();
        handleHome();
        return;
      }
      
      // Handle submit score keys
      if ((key === 's' || code === 'KeyS' || key === 'enter' || code === 'Enter' || e.keyCode === 13) && playerName.trim()) {
        e.preventDefault();
        handleSubmitScore();
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
  }, [handleHome, handleSubmitScore, scoreSubmitted, playerName, startFromLevel, highestLevelUnlocked, levelInput, inputTimeout]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      {/* Victory Message */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold text-green-600 mb-2">Level {currentLevel} Complete!</h1>
        <p className="text-lg text-gray-600">
          Score automatically saved to leaderboard!
        </p>
      </div>

      {/* Score Card */}
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl mb-6">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800">Victory!</h2>
          </div>
          <div className="space-y-2 mb-6">
            <div className="text-3xl font-bold text-blue-600">{score}</div>
            <div className="text-lg text-gray-600">
              Level Coins: <span className="font-semibold text-yellow-600">{coinsCollected}</span>
            </div>
            <div className="text-sm text-gray-500 border-t pt-2">
              Total Progress: <span className="font-semibold text-purple-600">{totalScore.toLocaleString()}</span>
            </div>
            <div className="text-sm text-gray-500">
              Total Coins: <span className="font-semibold text-yellow-600">{totalCoinsCollected}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-green-600 font-semibold flex items-center justify-center mb-4">
              <Trophy className="mr-2 h-5 w-5" />
              Score saved to leaderboard!
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Want to update your name?</p>
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="text-center mb-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    handleSubmitScore();
                  }
                }}
              />
              <Button
                onClick={handleSubmitScore}
                disabled={!playerName.trim()}
                size="sm"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                <Upload className="mr-2 h-4 w-4" />
                Update Name
                <span className="ml-auto text-sm opacity-75">[S]</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Level Selection Grid */}
      {highestLevelUnlocked > 1 && (
        <Card className="w-full max-w-4xl bg-white/90 backdrop-blur-sm shadow-xl mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🎯 Play Another Level</h3>
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

      {/* Action Button */}
      <div className="w-full max-w-md">
        <Button 
          onClick={handleHome}
          size="lg"
          className="w-full text-xl py-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg"
        >
          <Home className="mr-2 h-6 w-6" />
          Back to Menu
          <span className="ml-auto text-sm opacity-75">[H]</span>
        </Button>
      </div>
    </div>
  );
}
