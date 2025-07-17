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
        <svg width="70" height="70" viewBox="0 0 70 70" className="drop-shadow-lg">
          {/* Rainbow bands - more distinct and colorful */}
          <path d="M15 50 Q35 15 55 50" fill="none" stroke="#FF0000" strokeWidth="4" opacity="0.9" />
          <path d="M16 51 Q35 18 54 51" fill="none" stroke="#FF8C00" strokeWidth="4" opacity="0.9" />
          <path d="M17 52 Q35 21 53 52" fill="none" stroke="#FFD700" strokeWidth="4" opacity="0.9" />
          <path d="M18 53 Q35 24 52 53" fill="none" stroke="#32CD32" strokeWidth="4" opacity="0.9" />
          <path d="M19 54 Q35 27 51 54" fill="none" stroke="#1E90FF" strokeWidth="4" opacity="0.9" />
          <path d="M20 55 Q35 30 50 55" fill="none" stroke="#4169E1" strokeWidth="4" opacity="0.9" />
          <path d="M21 56 Q35 33 49 56" fill="none" stroke="#8A2BE2" strokeWidth="4" opacity="0.9" />
          
          {/* Main pot body - traditional black cauldron shape */}
          <path
            d="M15 48 L15 55 Q15 62 20 62 L50 62 Q55 62 55 55 L55 48 Q55 45 52 45 L18 45 Q15 45 15 48 Z"
            fill="#0D0D0D"
            stroke="#000000"
            strokeWidth="2"
          />
          
          {/* Pot rim - wider traditional style */}
          <ellipse
            cx="35"
            cy="45"
            rx="22"
            ry="3"
            fill="#1F1F1F"
            stroke="#000000"
            strokeWidth="1.5"
          />
          
          {/* Traditional pot handles */}
          <path
            d="M13 48 Q8 48 8 52 Q8 56 13 56"
            fill="none"
            stroke="#1F1F1F"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M57 48 Q62 48 62 52 Q62 56 57 56"
            fill="none"
            stroke="#1F1F1F"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Gold coins filling the pot */}
          <g opacity="1">
            {/* Back layer coins */}
            <circle cx="25" cy="55" r="3.5" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
            <circle cx="40" cy="54" r="3.5" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
            <circle cx="30" cy="59" r="3" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
            <circle cx="45" cy="58" r="3" fill="#FFD700" stroke="#B8860B" strokeWidth="1" />
            
            {/* Front layer coins */}
            <circle cx="20" cy="52" r="3.5" fill="#FFED4E" stroke="#DAA520" strokeWidth="1" />
            <circle cx="35" cy="50" r="3.5" fill="#FFED4E" stroke="#DAA520" strokeWidth="1" />
            <circle cx="50" cy="52" r="3.5" fill="#FFED4E" stroke="#DAA520" strokeWidth="1" />
            <circle cx="28" cy="54" r="3" fill="#FFED4E" stroke="#DAA520" strokeWidth="1" />
            <circle cx="42" cy="55" r="3" fill="#FFED4E" stroke="#DAA520" strokeWidth="1" />
          </g>
          
          {/* Magical glow around pot */}
          <circle cx="35" cy="52" r="25" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.3" />
          
          {/* Sparkles around rainbow */}
          <g fill="#FFFFFF" opacity="0.9">
            <circle cx="20" cy="25" r="1" />
            <circle cx="50" cy="25" r="1" />
            <circle cx="35" cy="18" r="1" />
            <circle cx="12" cy="40" r="1" />
            <circle cx="58" cy="40" r="1" />
          </g>
        </svg>
        
        {/* Coin count centered on pot front */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-1">
          <span className="text-lg font-black text-yellow-300 text-center block leading-none" 
                style={{
                  textShadow: '2px 2px 0px #000000, -1px -1px 0px #000000, 1px -1px 0px #000000, -1px 1px 0px #000000',
                  filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
                }}>
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