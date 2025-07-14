import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useAudio } from "@/lib/stores/useAudio";
import { Trophy, Play, Volume2, VolumeX } from "lucide-react";

export default function StartScreen() {
  const { startGame, showLeaderboard } = useCoinGame();
  const { isMuted, toggleMute } = useAudio();

  const handleStartGame = () => {
    startGame();
  };

  const handleShowLeaderboard = () => {
    showLeaderboard();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      {/* Game Logo */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-4">🪙</div>
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Coin Rush</h1>
        <p className="text-lg text-gray-600">Collect coins, avoid obstacles!</p>
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
            Play Game
          </Button>

          <Button 
            onClick={handleShowLeaderboard}
            variant="outline"
            size="lg"
            className="w-full text-lg py-4 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold rounded-xl"
          >
            <Trophy className="mr-2 h-5 w-5" />
            Leaderboard
          </Button>

          <Button 
            onClick={toggleMute}
            variant="outline"
            size="lg"
            className="w-full text-lg py-4 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl"
          >
            {isMuted ? <VolumeX className="mr-2 h-5 w-5" /> : <Volume2 className="mr-2 h-5 w-5" />}
            {isMuted ? "Unmute" : "Mute"} Sound
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="mt-8 text-center max-w-md">
        <p className="text-sm text-gray-600 mb-2">How to Play:</p>
        <p className="text-xs text-gray-500">
          Use arrow keys or WASD to move your character. You can also tap and hold to move. 
          Collect coins and avoid moving TNT bombs. Reach the end to win!
        </p>
      </div>
    </div>
  );
}
