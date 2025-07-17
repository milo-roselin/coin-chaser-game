import { useCoinBank } from "@/lib/stores/useCoinBank";

interface CoinBankDisplayProps {
  className?: string;
  showSessionCoins?: boolean;
}

export default function CoinBankDisplay({ className = "", showSessionCoins = false }: CoinBankDisplayProps) {
  const { totalCoins, sessionCoins } = useCoinBank();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Leprechaun's Pot of Gold SVG */}
      <div className="relative">
        <svg width="56" height="56" viewBox="0 0 56 56" className="drop-shadow-lg">
          {/* Pot body - black round leprechaun pot */}
          <ellipse
            cx="28"
            cy="32"
            rx="20"
            ry="16"
            fill="#1a1a1a"
            stroke="#000000"
            strokeWidth="2"
          />
          {/* Pot rim */}
          <ellipse
            cx="28"
            cy="22"
            rx="22"
            ry="4"
            fill="#2d2d2d"
            stroke="#000000"
            strokeWidth="2"
          />
          {/* Pot handles */}
          <path
            d="M6 24 Q2 24 2 28 Q2 32 6 32"
            fill="none"
            stroke="#000000"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M50 24 Q54 24 54 28 Q54 32 50 32"
            fill="none"
            stroke="#000000"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Gold coins visible inside pot */}
          <g opacity="0.9">
            <circle cx="20" cy="30" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
            <circle cx="32" cy="28" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
            <circle cx="24" cy="36" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
            <circle cx="36" cy="34" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
            <circle cx="16" cy="36" r="2.5" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
            <circle cx="28" cy="40" r="2.5" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          </g>
          
          {/* Magical sparkle effects around pot */}
          <g fill="#FFD700" opacity="0.7">
            <circle cx="8" cy="18" r="1.5" />
            <circle cx="48" cy="16" r="1.5" />
            <circle cx="45" cy="42" r="1" />
            <circle cx="11" cy="44" r="1" />
            <circle cx="28" cy="8" r="1" />
          </g>
          
          {/* Star sparkles */}
          <g fill="#FFFF99" opacity="0.8" stroke="#FFD700" strokeWidth="0.5">
            <path d="M15 12 L16 15 L19 15 L16.5 17 L17.5 20 L15 18 L12.5 20 L13.5 17 L11 15 L14 15 Z" />
            <path d="M42 10 L43 13 L46 13 L43.5 15 L44.5 18 L42 16 L39.5 18 L40.5 15 L38 13 L41 13 Z" />
          </g>
        </svg>
        
        {/* Coin count displayed in center of pot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-1">
          <span className="text-lg font-bold text-yellow-300 text-center block leading-none drop-shadow-md">
            {totalCoins > 999 ? `${Math.floor(totalCoins / 1000)}k` : totalCoins}
          </span>
        </div>
      </div>
      
      {/* Session coins indicator */}
      {showSessionCoins && sessionCoins > 0 && (
        <div className="text-sm font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-md border border-yellow-300">
          +{sessionCoins}
        </div>
      )}
    </div>
  );
}