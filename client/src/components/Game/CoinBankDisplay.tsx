import { useCoinBank } from "@/lib/stores/useCoinBank";

interface CoinBankDisplayProps {
  className?: string;
  showSessionCoins?: boolean;
}

export default function CoinBankDisplay({ className = "", showSessionCoins = false }: CoinBankDisplayProps) {
  const { totalCoins, sessionCoins } = useCoinBank();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Leprechaun's Pot of Gold with Rainbow SVG */}
      <div className="relative">
        <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-lg">
          {/* Rainbow coming from pot */}
          <defs>
            <radialGradient id="rainbowGradient" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="#FF0000" stopOpacity="0.9" />
              <stop offset="16%" stopColor="#FF8C00" stopOpacity="0.9" />
              <stop offset="33%" stopColor="#FFD700" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#32CD32" stopOpacity="0.9" />
              <stop offset="66%" stopColor="#00BFFF" stopOpacity="0.9" />
              <stop offset="83%" stopColor="#4169E1" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#8A2BE2" stopOpacity="0.9" />
            </radialGradient>
          </defs>
          
          {/* Rainbow arc emanating from pot */}
          <path
            d="M20 45 Q40 10 60 45"
            fill="none"
            stroke="url(#rainbowGradient)"
            strokeWidth="6"
            opacity="0.8"
          />
          <path
            d="M22 47 Q40 15 58 47"
            fill="none"
            stroke="#FF8C00"
            strokeWidth="3"
            opacity="0.7"
          />
          <path
            d="M24 49 Q40 20 56 49"
            fill="none"
            stroke="#FFD700"
            strokeWidth="3"
            opacity="0.7"
          />
          <path
            d="M26 51 Q40 25 54 51"
            fill="none"
            stroke="#32CD32"
            strokeWidth="3"
            opacity="0.7"
          />
          <path
            d="M28 53 Q40 30 52 53"
            fill="none"
            stroke="#00BFFF"
            strokeWidth="3"
            opacity="0.7"
          />
          <path
            d="M30 55 Q40 35 50 55"
            fill="none"
            stroke="#4169E1"
            strokeWidth="3"
            opacity="0.7"
          />
          
          {/* Black leprechaun pot */}
          <ellipse
            cx="40"
            cy="55"
            rx="18"
            ry="14"
            fill="#0a0a0a"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          
          {/* Pot rim */}
          <ellipse
            cx="40"
            cy="46"
            rx="20"
            ry="3"
            fill="#1a1a1a"
            stroke="#2d2d2d"
            strokeWidth="2"
          />
          
          {/* Pot handles */}
          <path
            d="M20 48 Q16 48 16 52 Q16 56 20 56"
            fill="none"
            stroke="#2d2d2d"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M60 48 Q64 48 64 52 Q64 56 60 56"
            fill="none"
            stroke="#2d2d2d"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Gold coins inside pot - arranged naturally */}
          <g opacity="0.95">
            <circle cx="32" cy="52" r="3" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
            <circle cx="44" cy="50" r="3" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
            <circle cx="36" cy="58" r="3" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
            <circle cx="48" cy="56" r="3" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
            <circle cx="28" cy="58" r="2.5" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
            <circle cx="40" cy="62" r="2.5" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
            <circle cx="52" cy="60" r="2.5" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
            
            {/* Dollar signs on some coins for detail */}
            <text x="32" y="55" fill="#B8860B" fontSize="4" textAnchor="middle" fontWeight="bold">$</text>
            <text x="44" y="53" fill="#B8860B" fontSize="4" textAnchor="middle" fontWeight="bold">$</text>
          </g>
          
          {/* Magical sparkles around rainbow */}
          <g fill="#FFD700" opacity="0.8">
            <circle cx="25" cy="25" r="1.5" />
            <circle cx="55" cy="25" r="1.5" />
            <circle cx="15" cy="40" r="1" />
            <circle cx="65" cy="40" r="1" />
            <circle cx="40" cy="15" r="1" />
          </g>
          
          {/* Star sparkles for magic effect */}
          <g fill="#FFFFFF" opacity="0.9">
            <path d="M20 20 L21 23 L24 23 L21.5 25 L22.5 28 L20 26 L17.5 28 L18.5 25 L16 23 L19 23 Z" />
            <path d="M60 20 L61 23 L64 23 L61.5 25 L62.5 28 L60 26 L57.5 28 L58.5 25 L56 23 L59 23 Z" />
          </g>
        </svg>
        
        {/* Gold coin count displayed prominently in center of pot */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
          <span className="text-xl font-bold text-yellow-400 text-center block leading-none drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)] stroke-black" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 1px rgba(0,0,0,0.5)'}}>
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