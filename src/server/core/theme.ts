import { redis } from '@devvit/web/server';
import { Theme, ThemeConfig, DEFAULT_THEME_CONFIGS, getBaseThemeId } from '../../shared/themes';

const THEME_CONFIG_KEY = (themeId: string) => `custom_theme_config:${themeId}`;
const CUSTOM_THEMES_LIST_KEY = 'custom_themes_list';

/**
 * Get the list of moderator-created custom themes.
 */
export const getCustomThemes = async (): Promise<Theme[]> => {
  return [];
};

/**
 * Get the configuration for a specific theme, merging with defaults if not custom defined.
 */
export const getThemeConfig = async (themeId: string): Promise<ThemeConfig> => {
  const baseTheme = getBaseThemeId(themeId);
  const fallbackConfig = DEFAULT_THEME_CONFIGS[baseTheme] || DEFAULT_THEME_CONFIGS.neon;
  try {
    const data = await redis.get(THEME_CONFIG_KEY(themeId));
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with base config to ensure complete shape/color mapping in case schema evolves
      return {
        ...fallbackConfig,
        ...parsed,
      };
    }
  } catch (err) {
    console.error(`Failed to get theme config for ${themeId}:`, err);
  }
  return fallbackConfig;
};

/**
 * Get configurations for all available default and custom themes.
 */
export const getAllThemeConfigs = async (): Promise<Record<string, ThemeConfig>> => {
  const defaultThemes: string[] = ['neon', 'winter', 'forest', 'candy', 'space', 'ocean', 'retro', 'desert', 'spooky', 'volcanic'];
  const allThemeIds = defaultThemes;
  
  const results = await Promise.all(allThemeIds.map((t) => getThemeConfig(t)));

  return allThemeIds.reduce((acc, themeId, idx) => {
    const config = results[idx];
    if (config) {
      acc[themeId] = config;
    }
    return acc;
  }, {} as Record<string, ThemeConfig>);
};

/**
 * Update the customization of a theme.
 */
export const updateThemeConfig = async (themeId: string, config: ThemeConfig): Promise<void> => {
  await redis.set(THEME_CONFIG_KEY(themeId), JSON.stringify(config));
};

/**
 * Reset theme customization to defaults.
 */
export const resetThemeConfig = async (themeId: string): Promise<void> => {
  await redis.del(THEME_CONFIG_KEY(themeId));
};

/**
 * Create a new custom theme metadata entry and its config.
 */
export const createCustomTheme = async (
  themeData: Omit<Theme, 'id'> & { baseTheme: string },
  initialConfig: ThemeConfig
): Promise<Theme> => {
  const id = `custom_${themeData.baseTheme}_${Date.now()}`;
  const newTheme: Theme = {
    ...themeData,
    id,
  };

  const customThemes = await getCustomThemes();
  customThemes.push(newTheme);
  await redis.set(CUSTOM_THEMES_LIST_KEY, JSON.stringify(customThemes));

  await updateThemeConfig(id, initialConfig);

  return newTheme;
};

/**
 * Delete a custom theme entry, its configurations, and active users links.
 */
export const deleteCustomTheme = async (themeId: string): Promise<void> => {
  const customThemes = await getCustomThemes();
  const filtered = customThemes.filter((t) => t.id !== themeId);
  await redis.set(CUSTOM_THEMES_LIST_KEY, JSON.stringify(filtered));

  await resetThemeConfig(themeId);
};

/**
 * Update custom theme metadata.
 */
export const updateCustomTheme = async (
  themeId: string,
  updatedData: Partial<Omit<Theme, 'id'>>
): Promise<Theme | null> => {
  const customThemes = await getCustomThemes();
  const idx = customThemes.findIndex((t) => t.id === themeId);
  if (idx === -1) return null;

  const existingTheme = customThemes[idx];
  if (!existingTheme) return null;

  const updatedTheme: Theme = {
    ...existingTheme,
    ...updatedData,
  };

  customThemes[idx] = updatedTheme;

  await redis.set(CUSTOM_THEMES_LIST_KEY, JSON.stringify(customThemes));
  return updatedTheme;
};
