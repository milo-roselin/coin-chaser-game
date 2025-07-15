import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useLeaderboard } from "@/lib/stores/useLeaderboard";
import { Trophy, Home, Upload, Lock } from "lucide-react";

export default function VictoryScreen() {
  const { score, coinsCollected, resetGame, totalScore, highestLevelUnlocked, startFromLevel } = useCoinGame();
  const { addScore } = useLeaderboard();
  const [playerName, setPlayerName] = useState("");
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  const handleSubmitScore = () => {
    if (playerName.trim()) {
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
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'h':
        case 'escape':
          e.preventDefault();
          handleHome();
          break;
        case 's':
        case 'enter':
          if (!scoreSubmitted && playerName.trim()) {
            e.preventDefault();
            handleSubmitScore();
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const level = parseInt(e.key);
          if (level <= highestLevelUnlocked) {
            e.preventDefault();
            startFromLevel(level);
          }
          break;
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
        <h1 className="text-4xl font-bold text-green-600 mb-2">You Win!</h1>
        <p className="text-lg text-gray-600">Congratulations on completing the level!</p>
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

          {!scoreSubmitted ? (
            <div className="space-y-4">
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="text-center"
              />
              <Button
                onClick={handleSubmitScore}
                disabled={!playerName.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
              >
                <Upload className="mr-2 h-4 w-4" />
                Submit Score
                <span className="ml-auto text-sm opacity-75">[S]</span>
              </Button>
            </div>
          ) : (
            <div className="text-green-600 font-semibold">
              ✅ Score submitted successfully!
            </div>
          )}
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
