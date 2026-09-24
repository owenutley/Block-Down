import { useState, useEffect } from 'react';
import { getMuted, setMuted } from '../utils/audio';
import { getMusicMuted, setMusicMuted, getMusicVolume, setMusicVolume, setMusicTheme } from '../utils/bgm';
import { ThemeId, Theme, GameCharacter, THEMES, getBaseThemeId } from '../../shared/themes';
import { TrailId, Trail, TRAILS } from '../../shared/trails';
import { ThemeOrb, CharacterOrb, THEME_STYLES } from './ThemeBoardRenderer';
import { trpc } from '../trpc';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  activeTheme?: ThemeId | undefined;
  purchasedThemes?: ThemeId[] | undefined;
  themes?: Theme[] | undefined;
  onEquipTheme?: ((themeId: ThemeId) => Promise<unknown> | undefined) | undefined;
  activeCharacter?: string | undefined;
  purchasedCharacters?: string[] | undefined;
  characters?: GameCharacter[] | undefined;
  onEquipCharacter?: ((characterId: string) => Promise<unknown> | undefined) | undefined;
  activeTrail?: TrailId | undefined;
  purchasedTrails?: TrailId[] | undefined;
  trails?: Trail[] | undefined;
  onEquipTrail?: ((trailId: TrailId) => Promise<unknown> | undefined) | undefined;
  onHowToPlay?: (() => void) | undefined;
  onOpenLeaderboard?: (() => Promise<void> | void) | undefined;
  panelClass?: string | undefined;
};

export const SettingsModal = ({
  isOpen,
  onClose,
  activeTheme = 'neon',
  purchasedThemes = ['neon'],
  themes = THEMES,
  onEquipTheme,
  activeCharacter = 'neon',
  purchasedCharacters = ['neon'],
  characters = [],
  onEquipCharacter,
  activeTrail = 'none',
  purchasedTrails = ['none'],
  trails = TRAILS,
  onEquipTrail,
  onHowToPlay,
  onOpenLeaderboard,
  panelClass,
}: SettingsModalProps) => {
  const [settingsTab, setSettingsTab] = useState<'general' | 'themes' | 'characters' | 'trails'>('general');
  const [muted, setMutedState] = useState(getMuted());
  const [musicMuted, setMusicMutedState] = useState(getMusicMuted());
  const [bgmVol, setBgmVolState] = useState(getMusicVolume());
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(activeTheme);
  const [currentCharacter, setCurrentCharacter] = useState<string>(activeCharacter);
  const [currentTrail, setCurrentTrail] = useState<TrailId>(activeTrail);

  useEffect(() => {
    setCurrentTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    setCurrentCharacter(activeCharacter);
  }, [activeCharacter]);

  useEffect(() => {
    setCurrentTrail(activeTrail);
  }, [activeTrail]);

  if (!isOpen) return null;

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const toggleMusicMuted = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    setMusicMutedState(next);
  };

  const handleMusicVolumeChange = (newVol: number) => {
    setMusicVolume(newVol);
    setBgmVolState(newVol);
  };

  const handleThemeSelect = async (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    setMusicTheme(themeId);
    if (onEquipTheme) {
      await onEquipTheme(themeId);
    } else {
      try {
        await trpc.shop.setActive.mutate({ themeId });
      } catch (err) {
        console.error('Failed to set active theme:', err);
      }
    }
  };

  const handleCharacterSelect = async (charId: string) => {
    setCurrentCharacter(charId);
    if (onEquipCharacter) {
      await onEquipCharacter(charId);
    } else {
      try {
        await trpc.shop.setActiveCharacter.mutate({ characterId: charId });
      } catch (err) {
        console.error('Failed to set active character:', err);
      }
    }
  };

  const handleTrailSelect = async (trailId: TrailId) => {
    setCurrentTrail(trailId);
    if (onEquipTrail) {
      await onEquipTrail(trailId);
    } else {
      try {
        await trpc.shop.setActiveTrail.mutate({ trailId });
      } catch (err) {
        console.error('Failed to set active trail:', err);
      }
    }
  };

  const baseThemeId = getBaseThemeId(currentTheme);
  const defaultStyles = THEME_STYLES[baseThemeId] || THEME_STYLES.neon;
  const activePanelClass = panelClass || defaultStyles.panelClass || 'bg-slate-900 border-slate-750';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-3 sm:px-4 py-4 pointer-events-auto overflow-hidden select-none">
      <div className={`max-w-md w-full p-4 sm:p-6 rounded-3xl border text-white relative animate-float shadow-2xl max-h-[85vh] flex flex-col overflow-hidden ${activePanelClass}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all z-10"
          title="Close Settings"
        >
          ×
        </button>

        <div className="text-center mb-4 shrink-0">
          <span className="text-3xl sm:text-4xl">⚙️</span>
          <h2 className="text-xl sm:text-2xl font-black neon-text-title tracking-tight mt-1">Settings</h2>
        </div>

        {/* Settings Tab Selector */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-white/10 mb-4 shrink-0">
          <button
            onClick={() => setSettingsTab('general')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              settingsTab === 'general' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setSettingsTab('themes')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              settingsTab === 'themes' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Themes
          </button>
          <button
            onClick={() => setSettingsTab('characters')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              settingsTab === 'characters' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Characters
          </button>
          <button
            onClick={() => setSettingsTab('trails')}
            className={`flex-1 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              settingsTab === 'trails' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Trails
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-1 py-0.5">
          {settingsTab === 'general' && (
            <div className="space-y-3">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                <div>
                  <h3 className="font-bold text-sm">Game Sound</h3>
                  <p className="text-xs text-zinc-400">Toggle sound effects</p>
                </div>
                <button
                  onClick={toggleMuted}
                  className={`w-14 h-8 rounded-full transition-all duration-300 relative cursor-pointer ${muted ? 'bg-zinc-700' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all duration-300 ${muted ? 'left-1' : 'left-7'}`}
                  />
                </button>
              </div>

              {/* Background Music Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-white/5 rounded-2xl border border-white/10">
                <div>
                  <h3 className="font-bold text-sm">Background Music</h3>
                  <p className="text-xs text-zinc-400">Relaxing ambient soundscapes</p>
                </div>
                <button
                  onClick={toggleMusicMuted}
                  className={`w-14 h-8 rounded-full transition-all duration-300 relative cursor-pointer ${musicMuted ? 'bg-zinc-700' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all duration-300 ${musicMuted ? 'left-1' : 'left-7'}`}
                  />
                </button>
              </div>

              {/* Music Volume Presets */}
              {!musicMuted && (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10 text-xs">
                  <span className="font-bold text-zinc-300">Music Volume</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: 'Soft', val: 0.2 },
                      { label: 'Med', val: 0.4 },
                      { label: 'High', val: 0.7 },
                    ].map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => handleMusicVolumeChange(preset.val)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          Math.abs(bgmVol - preset.val) < 0.1
                            ? 'bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                            : 'bg-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* How to Play Guide Button */}
              {onHowToPlay && (
                <button
                  onClick={onHowToPlay}
                  className="w-full py-3 rounded-2xl theme-btn text-center flex items-center justify-center cursor-pointer gap-2 font-bold transition-all hover:scale-102 active:scale-98 shadow-lg"
                >
                  <span>How to Play</span>
                </button>
              )}

              {/* Leaderboard Button */}
              {onOpenLeaderboard && (
                <button
                  onClick={onOpenLeaderboard}
                  className="w-full py-3 rounded-2xl theme-btn text-center flex items-center justify-center cursor-pointer gap-2 font-bold transition-all hover:scale-102 active:scale-98 shadow-lg"
                >
                  <span>Leaderboard</span>
                </button>
              )}
            </div>
          )}

          {settingsTab === 'themes' && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-zinc-300 px-1">Select Equipped Theme</h3>
              <div className="grid grid-cols-4 gap-2.5 p-1.5">
                {themes.filter((t) => purchasedThemes.includes(t.id)).map((theme) => {
                  const isActive = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
                      title={`${theme.name}: ${theme.description}`}
                      className={`p-2 rounded-2xl border flex items-center justify-center transition-all duration-200 cursor-pointer aspect-square ${
                        isActive
                          ? 'border-2 border-cyan-400 bg-cyan-950/70 shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400/40'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex items-center justify-center pointer-events-none">
                        <ThemeOrb id={theme.id} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {settingsTab === 'characters' && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-zinc-300 px-1">Select Equipped Character</h3>
              <div className="grid grid-cols-4 gap-2.5 p-1.5">
                {characters.filter((c) => purchasedCharacters.includes(c.id)).map((char) => {
                  const isActive = currentCharacter === char.id;
                  return (
                    <button
                      key={char.id}
                      onClick={() => handleCharacterSelect(char.id)}
                      title={`${char.name}: ${char.description}`}
                      className={`p-2 rounded-2xl border flex items-center justify-center transition-all duration-200 cursor-pointer aspect-square ${
                        isActive
                          ? 'border-2 border-cyan-400 bg-cyan-950/70 shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400/40'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex items-center justify-center pointer-events-none">
                        <CharacterOrb id={char.id} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {settingsTab === 'trails' && (
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-zinc-300 px-1">Select Equipped Trail</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 p-1.5">
                {trails.filter((t) => t.id === 'none' || purchasedTrails.includes(t.id)).map((trail) => {
                  const isActive = currentTrail === trail.id;
                  const trailIcon =
                    trail.id === 'none' ? '🚫' :
                    trail.id === 'pulse' ? '💫' :
                    trail.id === 'ghost' ? '👻' :
                    trail.id === 'sparkle' ? '✨' :
                    trail.id === 'fire' ? '🔥' :
                    trail.id === 'cyber' ? '⚡' : '✧';

                  return (
                    <button
                      key={trail.id}
                      onClick={() => handleTrailSelect(trail.id)}
                      title={`${trail.name}: ${trail.description}`}
                      className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer aspect-square relative ${
                        isActive
                          ? 'border-2 border-cyan-400 bg-cyan-950/70 shadow-[0_0_15px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400/40 scale-105'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-xl sm:text-2xl mb-1">{trailIcon}</span>
                      <span className="text-[10px] text-zinc-300 font-bold truncate max-w-full px-1">{trail.name}</span>
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
