import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCoinGame } from "@/lib/stores/useCoinGame";
import { useLeaderboard } from "@/lib/stores/useLeaderboard";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";

export default function LeaderboardScreen() {
  const { resetGame } = useCoinGame();
  const { scores } = useLeaderboard();

  const handleBack = () => {
    resetGame();
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'b':
        case 'escape':
        case 'h':
          e.preventDefault();
          handleBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleBack]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex flex-col items-center w-full h-full p-4">
      {/* Header */}
      <div className="w-full max-w-md mb-6">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="mb-4 bg-white/90 hover:bg-white border-gray-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
          <span className="ml-auto text-xs opacity-75">[B]</span>
        </Button>

        <div className="text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-blue-600 mb-2">Leaderboard</h1>
          <p className="text-gray-600">Top players and their scores</p>
        </div>
      </div>

      {/* Leaderboard */}
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-xl">High Scores</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {scores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold mb-2">No scores yet!</p>
              <p className="text-sm">Be the first to complete a level and submit your score.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {scores.map((score, index) => (
                <div
                  key={`${score.name}-${score.date}`}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <div className="font-semibold text-gray-800 truncate">
                      {score.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(score.date)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      {score.score}
                    </div>
                    <div className="text-xs text-yellow-600">
                      {score.coins} coins
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
