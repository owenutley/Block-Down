import { useState } from 'react';
import { Theme, ThemeId, ThemeConfig, getBaseThemeId, getThemeBgClass, GameCharacter } from '../../shared/themes';
import { TrailId } from '../../shared/trails';
import { showToast } from '@devvit/web/client';
import { ThemeBoardRenderer } from '../components/ThemeBoardRenderer';

const getThemePanelClass = (themeId: ThemeId) => {
  const base = getBaseThemeId(themeId);
  switch (base) {
    case 'winter':
      return 'bg-sky-950/20 border border-sky-400/30 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.2)]';
    case 'forest':
      return 'bg-emerald-950/20 border border-emerald-500/30 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)]';
    case 'candy':
      return 'bg-pink-950/20 border border-pink-500/30 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.15)]';
    case 'neon':
    default:
      return 'glass-panel rounded-xl sm:rounded-2xl';
  }
};

export const ShopScreen = (props: {
  onReturnToMenu: () => void;
  activeTheme: ThemeId;
  activeThemeStyle?: Theme | undefined;
  purchasedThemes: ThemeId[];
  currency: number;
  onPurchaseTheme: (themeId: ThemeId) => Promise<unknown>;
  onEquipTheme: (themeId: ThemeId) => Promise<unknown>;
  themeConfigs: Record<ThemeId, ThemeConfig>;
  themes: Theme[];
  activeTrail: TrailId;
  purchasedTrails: TrailId[];
  onPurchaseTrail: (trailId: TrailId) => Promise<unknown>;
  onEquipTrail: (trailId: TrailId) => Promise<unknown>;
  activeCharacter: string;
  purchasedCharacters: string[];
  onPurchaseCharacter: (characterId: string) => Promise<unknown>;
  onEquipCharacter: (characterId: string) => Promise<unknown>;
  characters: GameCharacter[];
}) => {
  const {
    onReturnToMenu,
    activeTheme,
    activeThemeStyle,
    purchasedThemes,
    currency,
    onPurchaseTheme,
    onEquipTheme,
    themeConfigs,
    themes,
    activeCharacter,
    purchasedCharacters,
    onPurchaseCharacter,
    onEquipCharacter,
    characters,
  } = props;

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedThemeId, setExpandedThemeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'themes' | 'characters'>('themes');

  const handleThemeAction = async (theme: Theme) => {
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

  const handleCharacterAction = async (characterId: string, isUnlocked: boolean, cost: number) => {
    setProcessingId(characterId);

    try {
      if (isUnlocked) {
        await onEquipCharacter(characterId);
        showToast({ text: `Successfully equipped character!`, appearance: 'success' });
      } else {
        if (currency < cost) {
          showToast({ text: `Insufficient Neon Shards. Need ${cost} shards!`, appearance: 'neutral' });
          return;
        }
        await onPurchaseCharacter(characterId);
        showToast({ text: `Successfully purchased character!`, appearance: 'success' });
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
          <div className="flex justify-center items-center mb-6">
            <h1 className="text-5xl font-black neon-text-title tracking-tight text-center">
              Theme Store
            </h1>
          </div>

          {/* Tabs Toggles */}
          <div className="flex justify-center items-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('themes')}
              className={`px-6 py-2.5 rounded-full font-black text-sm transition-all select-none cursor-pointer border ${
                activeTab === 'themes'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                  : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
            >
              Themes
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`px-6 py-2.5 rounded-full font-black text-sm transition-all select-none cursor-pointer border ${
                activeTab === 'characters'
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                  : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
              }`}
            >
              Characters
            </button>
          </div>

          {/* Shop Items Grid */}
          <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8">
            {activeTab === 'themes' ? (
              themes.map((theme) => {
                const isUnlocked = purchasedThemes.includes(theme.id);
                const isActive = activeTheme === theme.id;
                const isProcessing = processingId === theme.id;
                const isExpanded = expandedThemeId === theme.id;

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
                    className={`flex flex-col justify-between p-5 md:p-6 ${displayPanelClass} transition-all duration-300 ${
                      isActive ? 'ring-2 ring-cyan-400 shadow-lg' : ''
                    }`}
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setExpandedThemeId(isExpanded ? null : theme.id);
                        }
                      }}
                      className="flex justify-between items-center cursor-pointer md:cursor-default select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border border-white/20 md:hidden ${
                            theme.id === 'neon'
                              ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                              : theme.id === 'winter'
                              ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                              : theme.id === 'forest'
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                              : theme.id === 'candy'
                              ? 'bg-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                              : theme.id === 'space'
                              ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                              : theme.id === 'ocean'
                              ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                              : theme.id === 'retro'
                              ? 'bg-zinc-400 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                              : theme.id === 'desert'
                              ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                              : theme.id === 'spooky'
                              ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                              : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                          }`}
                        />
                        <h3 className="text-lg md:text-xl font-black">{theme.name}</h3>
                        {isActive && (
                          <span className="text-[10px] md:hidden bg-green-500/25 border border-green-500/40 text-green-300 px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 md:hidden">
                        {!isUnlocked && (
                          <span className="text-xs font-bold text-cyan-400 font-mono">
                            {theme.cost} ✦
                          </span>
                        )}
                        {isUnlocked && !isActive && (
                          <span className="text-xs font-bold text-gray-400">
                            Owned
                          </span>
                        )}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    <div
                      className={`transition-all duration-300 overflow-hidden ${
                        isExpanded
                          ? 'max-h-[500px] opacity-100 pt-4'
                          : 'max-h-0 opacity-0 pointer-events-none md:max-h-none md:opacity-100 md:pointer-events-auto md:pt-4'
                      }`}
                    >
                      <div className="flex gap-4 items-start mb-6">
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
                            activeCharacter={activeCharacter}
                          />
                        </div>

                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-black mb-1 hidden md:block">{theme.name}</h3>
                          <p className="text-xs text-gray-400 leading-relaxed font-sans">{theme.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!isActive && !isProcessing) {
                            void handleThemeAction(theme);
                          }
                        }}
                        disabled={isActive || isProcessing || (!isUnlocked && currency < theme.cost)}
                        className={`w-full py-2.5 rounded-xl text-center text-sm transition-all select-none ${buttonStyle}`}
                      >
                        {isProcessing ? 'Processing...' : buttonText}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              characters.map((char) => {
                const isUnlocked = purchasedCharacters.includes(char.id);
                const isActive = activeCharacter === char.id;
                const isProcessing = processingId === char.id;
                const isExpanded = expandedThemeId === char.id;

                let buttonText = 'Equip';
                let buttonStyle = 'bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer';

                if (isActive) {
                  buttonText = '✓ Equipped';
                  buttonStyle = 'bg-green-950/60 border border-green-500 text-green-300 font-bold cursor-default opacity-85';
                } else if (isUnlocked) {
                  buttonText = 'Equip';
                  buttonStyle = 'bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer';
                } else {
                  buttonText = `Unlock (${char.cost} ✦)`;
                  if (currency >= char.cost) {
                    buttonStyle = 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer';
                  } else {
                    buttonStyle = 'bg-gray-800 text-gray-500 font-bold cursor-not-allowed opacity-60';
                  }
                }

                const displayPanelClass = getThemePanelClass(char.id);

                return (
                  <div
                    key={char.id}
                    className={`flex flex-col justify-between p-5 md:p-6 ${displayPanelClass} transition-all duration-300 ${
                      isActive ? 'ring-2 ring-cyan-400 shadow-lg' : ''
                    }`}
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          setExpandedThemeId(isExpanded ? null : char.id);
                        }
                      }}
                      className="flex justify-between items-center cursor-pointer md:cursor-default select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border border-white/20 md:hidden ${
                            char.id === 'neon'
                              ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                              : char.id === 'winter'
                              ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                              : char.id === 'forest'
                              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                              : char.id === 'candy'
                              ? 'bg-pink-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                              : char.id === 'space'
                              ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                              : char.id === 'ocean'
                              ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                              : char.id === 'retro'
                              ? 'bg-zinc-400 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                              : char.id === 'desert'
                              ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                              : char.id === 'spooky'
                              ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                              : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                          }`}
                        />
                        <h3 className="text-lg md:text-xl font-black">{char.name}</h3>
                        {isActive && (
                          <span className="text-[10px] md:hidden bg-green-500/25 border border-green-500/40 text-green-300 px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 md:hidden">
                        {!isUnlocked && (
                          <span className="text-xs font-bold text-cyan-400 font-mono">
                            {char.cost} ✦
                          </span>
                        )}
                        {isUnlocked && !isActive && (
                          <span className="text-xs font-bold text-gray-400">
                            Owned
                          </span>
                        )}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    <div
                      className={`transition-all duration-300 overflow-hidden ${
                        isExpanded
                          ? 'max-h-[500px] opacity-100 pt-4'
                          : 'max-h-0 opacity-0 pointer-events-none md:max-h-none md:opacity-100 md:pointer-events-auto md:pt-4'
                      }`}
                    >
                      <div className="flex gap-4 items-center mb-6">
                        {/* Rounded container with character renderer preview */}
                        <div className="shrink-0 p-2 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center w-[4.5rem] h-[4.5rem]">
                          <ThemeBoardRenderer
                            gridSize={1}
                            walls={[]}
                            destinations={[]}
                            blocks={[]}
                            playerPos={{ x: 0, y: 0 }}
                            activeTheme={activeTheme}
                            activeCharacter={char.id}
                            themeConfig={themeConfigs[activeTheme]}
                            cellSize="2.5rem"
                            gridPadding="0px"
                            isAnimated={false}
                          />
                        </div>

                        <div className="flex-1 text-left">
                          <h3 className="text-xl font-black mb-1 hidden md:block">{char.name}</h3>
                          <p className="text-xs text-gray-400 leading-relaxed font-sans">{char.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!isActive && !isProcessing) {
                            void handleCharacterAction(char.id, isUnlocked, char.cost);
                          }
                        }}
                        disabled={isActive || isProcessing || (!isUnlocked && currency < char.cost)}
                        className={`w-full py-2.5 rounded-xl text-center text-sm transition-all select-none ${buttonStyle}`}
                      >
                        {isProcessing ? 'Processing...' : buttonText}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};
