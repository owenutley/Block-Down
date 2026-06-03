import { useState } from 'react';
import { Theme, THEMES, ThemeId } from '../../shared/themes';
import { showToast } from '@devvit/web/client';
import { ThemeBoardRenderer } from '../components/ThemeBoardRenderer';

const getThemeBgClass = (themeId: ThemeId) => {
  switch (themeId) {
    case 'arcade':
      return 'bg-zinc-950 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]';
    case 'cosmic':
      return 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950';
    case 'zen':
      return 'bg-gradient-to-br from-stone-800 via-stone-900 to-emerald-950';
    case 'neon':
    default:
      return 'bg-mesh-gradient';
  }
};

const getThemePanelClass = (themeId: ThemeId) => {
  switch (themeId) {
    case 'arcade':
      return 'bg-zinc-900 border-4 border-yellow-500 rounded-none shadow-[6px_6px_0_#000]';
    case 'cosmic':
      return 'bg-purple-950/20 border border-purple-500/35 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.25)]';
    case 'zen':
      return 'bg-stone-900/90 border-8 border-stone-850 rounded-xl shadow-2xl';
    case 'neon':
    default:
      return 'glass-panel rounded-3xl';
  }
};

export const ShopScreen = ({
  onReturnToMenu,
  activeTheme,
  purchasedThemes,
  currency,
  onPurchaseTheme,
  onEquipTheme,
}: {
  onReturnToMenu: () => void;
  refreshCurrency?: (() => void) | undefined;
  activeTheme: ThemeId;
  purchasedThemes: ThemeId[];
  currency: number;
  onPurchaseTheme: (themeId: ThemeId) => Promise<any>;
  onEquipTheme: (themeId: ThemeId) => Promise<any>;
}) => {
  const [processingId, setProcessingId] = useState<ThemeId | null>(null);

  const handleAction = async (theme: Theme) => {
    const isUnlocked = purchasedThemes.includes(theme.id);
    setProcessingId(theme.id);

    try {
      if (isUnlocked) {
        await onEquipTheme(theme.id);
        showToast({ text: `Successfully equipped ${theme.name}!`, appearance: 'success' });
      } else {
        if (currency < theme.cost) {
          showToast({ text: `Insufficient Neon Shards. Need ${theme.cost} shards!`, appearance: 'neutral' });
          return;
        }
        await onPurchaseTheme(theme.id);
        showToast({ text: `Successfully purchased ${theme.name}!`, appearance: 'success' });
      }
    } catch (err: any) {
      console.error(err);
      showToast({ text: err.message || 'Failed to complete action', appearance: 'neutral' });
    } finally {
      setProcessingId(null);
    }
  };

  const bgClass = getThemeBgClass('neon');
  const panelThemeClass = getThemePanelClass('neon');

  return (
    <>
      {/* Menu Button - Top Left */}
      <div className="fixed top-4 left-4 sm:left-6 z-50">
        <button
          onClick={onReturnToMenu}
          className="flex items-center justify-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 hover:scale-105 active:scale-95 transition-all text-white font-extrabold text-[11px] tracking-wide cursor-pointer select-none"
        >
          Menu
        </button>
      </div>

      <div className={`min-h-screen ${bgClass} text-white p-6 pb-20 transition-colors duration-500`}>
        <div className="max-w-4xl mx-auto relative pt-12">
          {/* Centered Title */}
          <div className="flex justify-center items-center mb-12">
            <h1 className="text-5xl font-black neon-text-title tracking-tight text-center">
              Theme Store
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {THEMES.map((theme) => {
              const isUnlocked = purchasedThemes.includes(theme.id);
              const isActive = activeTheme === theme.id;
              const isProcessing = processingId === theme.id;

              let buttonText = 'Equip';
              let buttonStyle = 'bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer';

              if (isActive) {
                buttonText = '✓ Equipped';
                buttonStyle = 'bg-green-950/60 border border-green-500 text-green-300 font-bold cursor-default opacity-85';
              } else if (isUnlocked) {
                buttonText = 'Equip';
                buttonStyle = 'bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer';
              } else {
                buttonText = `Unlock (${theme.cost} ✦)`;
                if (currency >= theme.cost) {
                  buttonStyle = 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer';
                } else {
                  buttonStyle = 'bg-gray-800 text-gray-500 font-bold cursor-not-allowed opacity-60';
                }
              }

              return (
                <div
                  key={theme.id}
                  className={`flex flex-col justify-between p-6 ${panelThemeClass} transition-all duration-350 ${
                    isActive ? 'ring-2 ring-cyan-400 shadow-lg' : ''
                  }`}
                >
                  <div className="flex gap-4 items-start mb-6">
                    {/* Visual 3x3 Mock Preview */}
                    <div className="shrink-0">
                      <ThemeBoardRenderer
                        gridSize={3}
                        walls={[{ x: 1, y: 0 }]}
                        destinations={[{ pos: { x: 2, y: 1 }, type: 'blue-square' }]}
                        blocks={[{ pos: { x: 1, y: 2 }, type: 'blue-square' }]}
                        playerPos={{ x: 1, y: 1 }}
                        activeTheme={theme.id}
                        cellSize="1.5rem"
                        gridPadding="4px"
                        isAnimated={false}
                      />
                    </div>

                    <div className="flex-1 text-left">
                      <h3 className="text-xl font-black mb-1">{theme.name}</h3>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">{theme.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!isActive && !isProcessing) {
                        void handleAction(theme);
                      }
                    }}
                    disabled={isActive || isProcessing || (!isUnlocked && currency < theme.cost)}
                    className={`w-full py-2.5 rounded-xl text-center text-sm transition-all select-none ${buttonStyle}`}
                  >
                    {isProcessing ? 'Processing...' : buttonText}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
