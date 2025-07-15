import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { RotateCcw, Home, Play, Lock } from "lucide-react";

export default function GameOverScreen() {
  const { score, coinsCollected, currentLevel, highestLevelUnlocked, resetGame, startGame, startFromLevel } = useCoinGame();

  const handleRetry = () => {
    startFromLevel(currentLevel);
  };

  const handleHome = () => {
    resetGame();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      {/* Game Over Message */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4">💥</div>
        <h1 className="text-4xl font-bold text-red-600 mb-2">Game Over!</h1>
        <p className="text-lg text-gray-600">Better luck next time!</p>
      </div>

      {/* Score Card */}
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl mb-6">
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Final Score</h2>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-blue-600">{score}</div>
            <div className="text-lg text-gray-600">
              Coins Collected: <span className="font-semibold text-yellow-600">{coinsCollected}</span>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Died on Level: <span className="font-semibold">{currentLevel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkpoint Section */}
      {highestLevelUnlocked > 1 && (
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🏃‍♂️ Continue from Checkpoint</h3>
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
                  >
                    {isUnlocked ? level : <Lock className="h-3 w-3" />}
                  </Button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Highest Level Reached: {highestLevelUnlocked}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 w-full max-w-md">
        <Button 
          onClick={handleRetry}
          size="lg"
          className="w-full text-xl py-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg"
        >
          <RotateCcw className="mr-2 h-6 w-6" />
          Try Again (Level {currentLevel})
        </Button>

        <Button 
          onClick={handleHome}
          variant="outline"
          size="lg"
          className="w-full text-lg py-4 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl"
        >
          <Home className="mr-2 h-5 w-5" />
          Back to Menu
        </Button>
      </div>
    </div>
  );
}
