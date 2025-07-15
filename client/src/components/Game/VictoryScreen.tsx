import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useLeaderboard } from "@/lib/stores/useLeaderboard";
import { Trophy, Home, Upload, Lock } from "lucide-react";

export default function VictoryScreen() {
  const { score, coinsCollected, resetGame, totalScore, highestLevelUnlocked, startFromLevel, currentLevel } = useCoinGame();
  const { addScore } = useLeaderboard();
  const [playerName, setPlayerName] = useState("");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Auto-submit score when screen loads
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
      addScore({
        name: savedName,
        score: totalScore,
        coins: coinsCollected,
        date: new Date().toISOString()
      });
      setScoreSubmitted(true);
    } else {
      // Auto-submit with default name if no name saved
      addScore({
        name: 'Anonymous',
        score: totalScore,
        coins: coinsCollected,
        date: new Date().toISOString()
      });
      setScoreSubmitted(true);
    }
  }, [addScore, totalScore, coinsCollected]);

  const handleSubmitScore = () => {
    if (playerName.trim()) {
      localStorage.setItem('playerName', playerName.trim());
      addScore({
        name: playerName.trim(),
        score: totalScore,
        coins: coinsCollected,
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
      
      // Handle number keys
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
  }, [handleHome, handleSubmitScore, scoreSubmitted, playerName, startFromLevel, highestLevelUnlocked]);

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
              Coins Collected: <span className="font-semibold text-yellow-600">{coinsCollected}</span>
            </div>
            <div className="text-sm text-gray-500 border-t pt-2">
              Total Progress: <span className="font-semibold text-purple-600">{totalScore.toLocaleString()}</span>
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
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🎯 Play Another Level</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({ length: Math.min(highestLevelUnlocked, 10) }, (_, i) => {
                const level = i + 1;
                const isUnlocked = level <= highestLevelUnlocked;
                return (
                  <Button
                    key={level}
                    onClick={() => startFromLevel(level)}
                    size="sm"
                    className={`aspect-square text-sm font-bold ${
                      isUnlocked 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!isUnlocked}
                    title={isUnlocked ? `Press ${level} to start Level ${level}` : `Level ${level} locked`}
                  >
                    {isUnlocked ? level : <Lock className="h-3 w-3" />}
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
