import { useCoinBank } from "@/lib/stores/useCoinBank";

interface CoinBankDisplayProps {
  className?: string;
  showSessionCoins?: boolean;
}

export default function CoinBankDisplay({ className = "", showSessionCoins = false }: CoinBankDisplayProps) {
  const { totalCoins, sessionCoins } = useCoinBank();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Pot of Gold SVG */}
      <div className="relative">
        <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-md">
          {/* Pot body */}
          <path
            d="M8 20 L40 20 L38 40 L10 40 Z"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />
          {/* Pot rim */}
          <ellipse
            cx="24"
            cy="20"
            rx="16"
            ry="3"
            fill="#A0522D"
            stroke="#654321"
            strokeWidth="2"
          />
          {/* Gold coins inside pot */}
          <circle cx="18" cy="28" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          <circle cx="26" cy="26" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          <circle cx="22" cy="32" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          <circle cx="30" cy="30" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          <circle cx="14" cy="32" r="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1" />
          {/* Pot handles */}
          <path
            d="M8 22 Q4 22 4 26 Q4 30 8 30"
            fill="none"
            stroke="#654321"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M40 22 Q44 22 44 26 Q44 30 40 30"
            fill="none"
            stroke="#654321"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Sparkle effects */}
          <g fill="#FFFF99" opacity="0.8">
            <circle cx="12" cy="18" r="1" />
            <circle cx="36" cy="16" r="1" />
            <circle cx="32" cy="38" r="1" />
            <circle cx="16" cy="38" r="1" />
          </g>
        </svg>
        
        {/* Coin count overlay */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="bg-yellow-400 border-2 border-yellow-600 rounded-full px-2 py-1 min-w-[32px] shadow-lg">
            <span className="text-xs font-bold text-yellow-900 text-center block leading-none">
              {totalCoins > 999 ? `${Math.floor(totalCoins / 1000)}k` : totalCoins}
            </span>
          </div>
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