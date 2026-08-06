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
    case 'space':
      return 'bg-indigo-950/20 border border-indigo-500/30 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(99,102,241,0.15)]';
    case 'ocean':
      return 'bg-cyan-950/20 border border-cyan-500/30 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(34,211,238,0.15)]';
    case 'retro':
      return 'bg-purple-950/20 border border-purple-500/30 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.15)]';
    case 'desert':
      return 'bg-amber-950/20 border border-amber-500/30 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.15)]';
    case 'spooky':
      return 'bg-purple-950/30 border border-purple-500/40 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.2)]';
    case 'volcanic':
      return 'bg-red-950/20 border border-red-500/30 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.15)]';
    case 'vantage':
      return 'bg-amber-950/20 border border-amber-600/30 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(217,119,6,0.15)]';
    case 'papercraft':
      return 'bg-[#1c1917]/60 border border-[#78350f]/50 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_0_30px_rgba(120,53,15,0.2)]';
    case 'neon':
    default:
      return 'glass-panel rounded-xl sm:rounded-2xl';
  }
};

const getItemColorConfig = (id: string) => {
  const base = getBaseThemeId(id);
  switch (base) {
    case 'winter':
      return {
        dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]',
        activeHighlight: 'ring-2 ring-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.4)]',
        previewBorder: 'border-sky-400/40',
        badge: 'bg-sky-500/25 border-sky-400/40 text-sky-300',
      };
    case 'forest':
      return {
        dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
        activeHighlight: 'ring-2 ring-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]',
        previewBorder: 'border-emerald-400/40',
        badge: 'bg-emerald-500/25 border-emerald-400/40 text-emerald-300',
      };
    case 'candy':
      return {
        dot: 'bg-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
        activeHighlight: 'ring-2 ring-pink-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]',
        previewBorder: 'border-pink-400/40',
        badge: 'bg-pink-500/25 border-pink-400/40 text-pink-300',
      };
    case 'space':
      return {
        dot: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]',
        activeHighlight: 'ring-2 ring-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.4)]',
        previewBorder: 'border-indigo-400/40',
        badge: 'bg-indigo-500/25 border-indigo-400/40 text-indigo-300',
      };
    case 'ocean':
      return {
        dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
        activeHighlight: 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]',
        previewBorder: 'border-cyan-400/40',
        badge: 'bg-cyan-500/25 border-cyan-400/40 text-cyan-300',
      };
    case 'retro':
      return {
        dot: 'bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.8)]',
        activeHighlight: 'ring-2 ring-fuchsia-400 shadow-[0_0_20px_rgba(232,121,249,0.4)]',
        previewBorder: 'border-fuchsia-400/40',
        badge: 'bg-fuchsia-500/25 border-fuchsia-400/40 text-fuchsia-300',
      };
    case 'desert':
      return {
        dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
        activeHighlight: 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]',
        previewBorder: 'border-amber-400/40',
        badge: 'bg-amber-500/25 border-amber-400/40 text-amber-300',
      };
    case 'spooky':
      return {
        dot: 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]',
        activeHighlight: 'ring-2 ring-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.4)]',
        previewBorder: 'border-purple-400/40',
        badge: 'bg-purple-500/25 border-purple-400/40 text-purple-300',
      };
    case 'volcanic':
      return {
        dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
        activeHighlight: 'ring-2 ring-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]',
        previewBorder: 'border-red-500/40',
        badge: 'bg-red-500/25 border-red-500/40 text-red-300',
      };
    case 'vantage':
      return {
        dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        activeHighlight: 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
        previewBorder: 'border-amber-500/40',
        badge: 'bg-amber-500/25 border-amber-500/40 text-amber-300',
      };
    case 'papercraft':
      return {
        dot: 'bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.8)]',
        activeHighlight: 'ring-2 ring-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.4)]',
        previewBorder: 'border-amber-600/40',
        badge: 'bg-amber-700/25 border-amber-600/40 text-amber-300',
      };
    case 'neon':
    default:
      return {
        dot: 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]',
        activeHighlight: 'ring-2 ring-white shadow-[0_0_20px_rgba(255,255,255,0.5)]',
        previewBorder: 'border-white/40',
        badge: 'bg-white/20 border-white/40 text-white',
      };
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
      <div className={`min-h-screen ${bgClass} text-white flex flex-col items-center justify-start p-4 md:p-6 transition-all duration-500 overflow-y-auto`}>
        {/* Top Header */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-6 pt-2">
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 hover:bg-slate-800/80 border border-white/20 rounded-xl text-sm font-bold backdrop-blur-md transition-all shadow-md active:scale-95"
          >
            ← Back to Menu
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-950/60 border border-cyan-500/40 rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span className="text-cyan-400 text-base">✦</span>
            <span className="font-mono font-bold text-cyan-300 text-sm md:text-base">{currency.toLocaleString()}</span>
            <span className="text-xs text-cyan-400/80 font-bold hidden sm:inline">Shards</span>
          </div>
        </div>

        {/* Shop Container */}
        <div className="w-full max-w-4xl flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-black text-center mb-2 tracking-tight drop-shadow-md">
            Cosmetic Shop
          </h1>
          <p className="text-xs md:text-sm text-gray-300 text-center mb-6 max-w-md">
            Customize your grid aesthetics and player glowing core spheres with Neon Shards.
          </p>

          {/* Tab Selection Header */}
          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 mb-8 max-w-md w-full shadow-inner">
            <button
              onClick={() => setActiveTab('themes')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'themes'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Grid Themes
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'characters'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Characters
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full mb-12">
            {activeTab === 'themes' ? (
              themes.map((theme) => {
                const isUnlocked = purchasedThemes.includes(theme.id);
                const isActive = activeTheme === theme.id;
                const isProcessing = processingId === theme.id;
                const isExpanded = expandedThemeId === theme.id;
                const colorConfig = getItemColorConfig(theme.id);

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
                      isActive ? colorConfig.activeHighlight : ''
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
                        <div className={`w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 ${colorConfig.dot}`} />
                        <h3 className="text-lg md:text-xl font-black">{theme.name}</h3>
                        {isActive && (
                          <span className={`text-[10px] md:hidden ${colorConfig.badge} px-2 py-0.5 rounded-full font-bold`}>
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
                const colorConfig = getItemColorConfig(char.id);

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
                      isActive ? colorConfig.activeHighlight : ''
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
                        <div className={`w-3.5 h-3.5 rounded-full border border-white/20 shrink-0 ${colorConfig.dot}`} />
                        <h3 className="text-lg md:text-xl font-black">{char.name}</h3>
                        {isActive && (
                          <span className={`text-[10px] md:hidden ${colorConfig.badge} px-2 py-0.5 rounded-full font-bold`}>
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
                        <div className={`shrink-0 p-2 bg-black/40 rounded-2xl border ${colorConfig.previewBorder} flex items-center justify-center w-[4.5rem] h-[4.5rem]`}>
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
