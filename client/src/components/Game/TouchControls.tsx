import { useRef, useEffect } from "react";
import { useCoinGame } from "@/lib/stores/useCoinGame";

export default function TouchControls() {
  const touchAreaRef = useRef<HTMLDivElement>(null);
  const { playerPosition } = useCoinGame();

  useEffect(() => {
    // Touch controls are handled by the canvas component
    // This component just provides visual feedback
  }, []);

  return (
    <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
      <div className="bg-black/50 text-white text-center py-2 px-4 rounded-lg text-sm">
        Tap and hold to move • Collect yellow coins • Avoid red obstacles
      </div>
    </div>
  );
}
