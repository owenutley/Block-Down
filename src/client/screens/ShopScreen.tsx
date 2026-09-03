import { useState } from 'react';
import { Theme, ThemeId, ThemeConfig, getThemeBgClass, GameCharacter, THEMES, CHARACTERS } from '../../shared/themes';
import { TrailId } from '../../shared/trails';
import { showToast } from '@devvit/web/client';
import { ThemeBoardRenderer, ThemeOrb, CharacterOrb } from '../components/ThemeBoardRenderer';

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

  const availableThemes = themes && themes.length > 0 ? themes : THEMES;
  const availableCharacters = characters && characters.length > 0 ? characters : CHARACTERS;

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'themes' | 'characters'>('themes');
  const [selectedThemeId, setSelectedThemeId] = useState<ThemeId>(activeTheme || 'neon');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(activeCharacter || 'neon');

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
      <div className={`h-[100dvh] w-full ${bgClass} text-white flex flex-col items-center justify-between p-3 sm:p-4 md:p-6 transition-all duration-500 overflow-hidden`}>
        {/* Top Header */}
        <div className="w-full max-w-4xl flex justify-between items-center mb-2 pt-1 shrink-0">
          <button
            onClick={onReturnToMenu}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/60 hover:bg-slate-800/80 border border-white/20 rounded-xl text-xs sm:text-sm font-bold backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer"
          >
            ← Back to Menu
          </button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-950/60 border border-cyan-500/40 rounded-xl backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span className="text-cyan-400 text-sm sm:text-base">✦</span>
            <span className="font-mono font-bold text-cyan-300 text-xs sm:text-sm md:text-base">{currency.toLocaleString()}</span>
            <span className="text-xs text-cyan-400/80 font-bold hidden sm:inline">Shards</span>
          </div>
        </div>

        {/* Shop Container */}
        <div className="w-full max-w-4xl flex flex-col items-center flex-1 min-h-0 overflow-hidden">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black neon-text-title tracking-tight text-center mb-2 shrink-0">
            Cosmetic Shop
          </h1>

          {/* Live Feature Preview Stage (Horizontal Split) */}
          <div className="w-full max-w-lg bg-slate-900/80 border border-white/15 rounded-2xl p-3 sm:p-4 mb-3 flex flex-row items-center gap-3 sm:gap-4 shrink-0 shadow-2xl backdrop-blur-md">
            {/* Left: Board Display */}
            <div className="shrink-0 flex justify-center items-center">
              <ThemeBoardRenderer
                gridSize={3}
                walls={[{ x: 1, y: 0 }]}
                destinations={[{ pos: { x: 2, y: 1 }, type: 'blue-diamond' }]}
                blocks={[{ pos: { x: 1, y: 2 }, type: 'blue-diamond' }]}
                playerPos={{ x: 1, y: 1 }}
                activeTheme={selectedThemeId}
                activeThemeStyle={availableThemes.find((t) => t.id === selectedThemeId)}
                themeConfig={themeConfigs[selectedThemeId]}
                cellSize="1.35rem"
                gridPadding="3px"
                isAnimated={true}
                activeCharacter={selectedCharacterId}
              />
            </div>

            {/* Right: Selected Item Info & Action Button */}
            {activeTab === 'themes' ? (
              (() => {
                const currentTheme = availableThemes.find((t) => t.id === selectedThemeId) || availableThemes[0] || THEMES[0];
                const isUnlocked = purchasedThemes.includes(currentTheme.id);
                const isActive = activeTheme === currentTheme.id;
                const isProcessing = processingId === currentTheme.id;

                let buttonText = 'Equip';
                let buttonStyle = 'bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold cursor-pointer shadow-md';

                if (isActive) {
                  buttonText = '✓ Equipped';
                  buttonStyle = 'bg-green-950/60 border border-green-500/50 text-green-300 font-extrabold cursor-default opacity-90';
                } else if (isUnlocked) {
                  buttonText = 'Equip Theme';
                  buttonStyle = 'bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold cursor-pointer shadow-md';
                } else if (currentTheme.earnRequirement) {
                  buttonText = `Earn in ${currentTheme.earnRequirement}`;
                  buttonStyle = 'bg-amber-600/90 hover:bg-amber-500 text-white font-extrabold cursor-pointer shadow-md';
                } else {
                  buttonText = `Unlock (${currentTheme.cost} ✦)`;
                  if (currency >= currentTheme.cost) {
                    buttonStyle = 'bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold cursor-pointer shadow-md';
                  } else {
                    buttonStyle = 'bg-zinc-800 text-zinc-500 font-extrabold cursor-not-allowed opacity-60';
                  }
                }

                return (
                  <div className="flex-1 flex flex-col justify-between text-left space-y-1.5 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-white truncate">{currentTheme.name}</h3>
                        {isActive && (
                          <span className="text-[10px] bg-green-500/20 border border-green-500/40 text-green-300 px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-300 font-sans leading-tight mt-0.5">
                        {currentTheme.description}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!isActive && !isProcessing) {
                          if (!isUnlocked && currentTheme.earnRequirement) {
                            showToast({ text: `Earn this theme by completing ${currentTheme.earnRequirement}!`, appearance: 'neutral' });
                            return;
                          }
                          void handleThemeAction(currentTheme);
                        }
                      }}
                      disabled={isActive || isProcessing || (!isUnlocked && !currentTheme.earnRequirement && currency < currentTheme.cost)}
                      className={`w-full py-1.5 rounded-xl text-xs sm:text-sm transition-all select-none ${buttonStyle}`}
                    >
                      {isProcessing ? 'Processing...' : buttonText}
                    </button>
                  </div>
                );
              })()
            ) : (
              (() => {
                const currentCharacter = availableCharacters.find((c) => c.id === selectedCharacterId) || availableCharacters[0] || CHARACTERS[0];
                const isUnlocked = purchasedCharacters.includes(currentCharacter.id);
                const isActive = activeCharacter === currentCharacter.id;
                const isProcessing = processingId === currentCharacter.id;

                let buttonText = 'Equip';
                let buttonStyle = 'bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold cursor-pointer shadow-md';

                if (isActive) {
                  buttonText = '✓ Equipped';
                  buttonStyle = 'bg-green-950/60 border border-green-500/50 text-green-300 font-extrabold cursor-default opacity-90';
                } else if (isUnlocked) {
                  buttonText = 'Equip Character';
                  buttonStyle = 'bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold cursor-pointer shadow-md';
                } else if (currentCharacter.earnRequirement) {
                  buttonText = `Earn in ${currentCharacter.earnRequirement}`;
                  buttonStyle = 'bg-amber-600/90 hover:bg-amber-500 text-white font-extrabold cursor-pointer shadow-md';
                } else {
                  buttonText = `Unlock (${currentCharacter.cost} ✦)`;
                  if (currency >= currentCharacter.cost) {
                    buttonStyle = 'bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold cursor-pointer shadow-md';
                  } else {
                    buttonStyle = 'bg-zinc-800 text-zinc-500 font-extrabold cursor-not-allowed opacity-60';
                  }
                }

                return (
                  <div className="flex-1 flex flex-col justify-between text-left space-y-1.5 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-white truncate">{currentCharacter.name}</h3>
                        {isActive && (
                          <span className="text-[10px] bg-green-500/20 border border-green-500/40 text-green-300 px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-300 font-sans leading-tight mt-0.5">
                        {currentCharacter.description}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!isActive && !isProcessing) {
                          if (!isUnlocked && currentCharacter.earnRequirement) {
                            showToast({ text: `Earn this character by completing ${currentCharacter.earnRequirement}!`, appearance: 'neutral' });
                            return;
                          }
                          void handleCharacterAction(currentCharacter.id, isUnlocked, currentCharacter.cost);
                        }
                      }}
                      disabled={isActive || isProcessing || (!isUnlocked && !currentCharacter.earnRequirement && currency < currentCharacter.cost)}
                      className={`w-full py-1.5 rounded-xl text-xs sm:text-sm transition-all select-none ${buttonStyle}`}
                    >
                      {isProcessing ? 'Processing...' : buttonText}
                    </button>
                  </div>
                );
              })()
            )}
          </div>

          {/* Tab Selection Header */}
          <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/10 mb-2 max-w-md w-full shadow-inner shrink-0">
            <button
              onClick={() => setActiveTab('themes')}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'themes'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Grid Themes
            </button>
            <button
              onClick={() => setActiveTab('characters')}
              className={`flex-1 py-1.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                activeTab === 'characters'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Characters
            </button>
          </div>

          {/* Compact Settings-Style Selector Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar max-w-md w-full p-1.5">
            {activeTab === 'themes' ? (
              <div className="grid grid-cols-4 gap-2">
                {availableThemes.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  const isEquipped = activeTheme === theme.id;
                  const isUnlocked = purchasedThemes.includes(theme.id);

                  return (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedThemeId(theme.id)}
                      title={`${theme.name}${!isUnlocked ? ' (Locked)' : ''}`}
                      className={`p-2 rounded-2xl border flex items-center justify-center transition-all duration-200 cursor-pointer aspect-square relative ${
                        isSelected
                          ? 'border-2 border-cyan-400 bg-cyan-950/70 shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400/40 scale-105'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex items-center justify-center pointer-events-none">
                        <ThemeOrb id={theme.id} />
                      </div>
                      {isEquipped && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
                          ✓
                        </span>
                      )}
                      {!isUnlocked && !isEquipped && (
                        <span className="absolute top-1 right-1 text-[10px]">
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availableCharacters.map((char) => {
                  const isSelected = selectedCharacterId === char.id;
                  const isEquipped = activeCharacter === char.id;
                  const isUnlocked = purchasedCharacters.includes(char.id);

                  return (
                    <button
                      key={char.id}
                      onClick={() => setSelectedCharacterId(char.id)}
                      title={`${char.name}${!isUnlocked ? ' (Locked)' : ''}`}
                      className={`p-2 rounded-2xl border flex items-center justify-center transition-all duration-200 cursor-pointer aspect-square relative ${
                        isSelected
                          ? 'border-2 border-cyan-400 bg-cyan-950/70 shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400/40 scale-105'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex items-center justify-center pointer-events-none">
                        <CharacterOrb id={char.id} />
                      </div>
                      {isEquipped && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
                          ✓
                        </span>
                      )}
                      {!isUnlocked && !isEquipped && (
                        <span className="absolute top-1 right-1 text-[10px]">
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
