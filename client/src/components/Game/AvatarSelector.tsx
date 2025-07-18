import React from 'react';
import { usePlayerAvatar } from '../../lib/stores/usePlayerAvatar';
import { useCoinBank } from '../../lib/stores/useCoinBank';
import { useAudio } from '../../lib/stores/useAudio';

interface AvatarSelectorProps {
  onClose: () => void;
}

export function AvatarSelector({ onClose }: AvatarSelectorProps) {
  const { 
    availableAvatars, 
    selectedAvatar, 
    unlockedAvatars, 
    selectAvatar, 
    unlockAvatar, 
    isAvatarUnlocked 
  } = usePlayerAvatar();
  
  const { totalCoins, spendCoins } = useCoinBank();
  const { playCoin } = useAudio();

  const handleAvatarSelect = (avatarId: string) => {
    // All avatars are now free, so just unlock and select
    if (!isAvatarUnlocked(avatarId)) {
      unlockAvatar(avatarId);
    }
    selectAvatar(avatarId);
    playCoin(); // Play selection sound
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-yellow-400">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-yellow-400">Choose Your Avatar</h2>
          <button
            onClick={onClose}
            className="text-yellow-400 hover:text-yellow-300 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-4 text-center">
          <div className="text-yellow-400 font-semibold">
            Your Coins: {totalCoins}
          </div>
        </div>

        <div className="space-y-3">
          {availableAvatars.map(avatar => {
            const isSelected = selectedAvatar === avatar.id;

            return (
              <div
                key={avatar.id}
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${isSelected 
                    ? 'border-yellow-400 bg-yellow-900 bg-opacity-30' 
                    : 'border-gray-600 hover:border-yellow-600'
                  }
                `}
                onClick={() => handleAvatarSelect(avatar.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                    {avatar.id === 'leprechaun' ? (
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🍀</span>
                      </div>
                    ) : avatar.id === 'count-olaf' ? (
                      <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🎭</span>
                      </div>
                    ) : avatar.id === 'tom-nook' ? (
                      <div className="w-10 h-10 bg-amber-700 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🦝</span>
                      </div>
                    ) : avatar.id === 'ebenezer-scrooge' ? (
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">👴</span>
                      </div>
                    ) : avatar.id === 'wario' ? (
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-purple-800 text-xs font-bold">W</span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-gray-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white">{avatar.name}</h3>
                      {isSelected && (
                        <div className="text-yellow-400 text-sm font-semibold">
                          SELECTED
                        </div>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">{avatar.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-yellow-600 text-black font-semibold rounded hover:bg-yellow-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}