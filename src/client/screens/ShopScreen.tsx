import { useState } from 'react';
import { Theme, ThemeId, ThemeConfig, getBaseThemeId, getThemeBgClass } from '../../shared/themes';
import { showToast } from '@devvit/web/client';
import { ThemeBoardRenderer } from '../components/ThemeBoardRenderer';



const getThemePanelClass = (themeId: ThemeId) => {
  const base = getBaseThemeId(themeId);
  switch (base) {
    case 'winter':
      return 'bg-sky-950/20 border border-sky-400/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.2)]';
    case 'forest':
      return 'bg-emerald-950/20 border border-emerald-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)]';
    case 'candy':
      return 'bg-pink-950/20 border border-pink-500/30 rounded-3xl backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.15)]';
    case 'neon':
    default:
      return 'glass-panel rounded-3xl';
  }
};

export const ShopScreen = ({
  onReturnToMenu,
  activeTheme,
  activeThemeStyle,
  purchasedThemes,
  currency,
  onPurchaseTheme,
  onEquipTheme,
  themeConfigs,
  themes,
}: {
  onReturnToMenu: () => void;
  activeTheme: ThemeId;
  activeThemeStyle?: Theme | undefined;
  purchasedThemes: ThemeId[];
  currency: number;
  onPurchaseTheme: (themeId: ThemeId) => Promise<unknown>;
  onEquipTheme: (themeId: ThemeId) => Promise<unknown>;
  themeConfigs: Record<ThemeId, ThemeConfig>;
  themes: Theme[];
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
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Failed to complete action';
      showToast({ text: errMsg, appearance: 'neutral' });
    } finally {
      setProcessingId(null);
    }
  };

  const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);

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
            {themes.map((theme) => {
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

              const displayPanelClass = theme.panelClass || getThemePanelClass(theme.id);

              return (
                <div
                  key={theme.id}
                  className={`flex flex-col justify-between p-6 ${displayPanelClass} transition-all duration-350 ${
                    isActive ? 'ring-2 ring-cyan-400 shadow-lg' : ''
                  }`}
                >
                  <div className="flex gap-4 items-start mb-6">
                    {/* Visual 3x3 Mock Preview */}
                    <div className="shrink-0">
                      <ThemeBoardRenderer
                        gridSize={3}
                        walls={[{ x: 1, y: 0 }]}
                        destinations={[{ pos: { x: 2, y: 1 }, type: 'blue-diamond' }]}
                        blocks={[{ pos: { x: 1, y: 2 }, type: 'blue-diamond' }]}
                        playerPos={{ x: 1, y: 1 }}
                        activeTheme={theme.id}
                        activeThemeStyle={theme}
                        themeConfig={themeConfigs[theme.id]}
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
