import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useLeaderboard } from "@/lib/stores/useLeaderboard";
import { Trophy, Home, Upload } from "lucide-react";

export default function VictoryScreen() {
  const { score, coinsCollected, resetGame, totalScore } = useCoinGame();
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
              </Button>
            </div>
          ) : (
            <div className="text-green-600 font-semibold">
              ✅ Score submitted successfully!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="w-full max-w-md">
        <Button 
          onClick={handleHome}
          size="lg"
          className="w-full text-xl py-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg"
        >
          <Home className="mr-2 h-6 w-6" />
          Back to Menu
        </Button>
      </div>
    </div>
  );
}
