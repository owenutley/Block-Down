import { redis } from '@devvit/web/server';
import { getUserCurrency, setUserCurrency, refreshUserTTL } from './progress';
import { THEMES, ThemeId } from '../../shared/themes';

const ACTIVE_THEME_KEY = (username: string) => `user_active_theme:${username}`;
const PURCHASED_THEMES_KEY = (username: string) => `user_purchased_themes:${username}`;

export const getUserThemeStatus = async (
  username: string
): Promise<{ activeTheme: ThemeId; purchasedThemes: ThemeId[] }> => {
  if (!username) {
    return { activeTheme: 'neon', purchasedThemes: ['neon'] };
  }

  const [activeTheme, purchasedThemesStr] = await Promise.all([
    redis.get(ACTIVE_THEME_KEY(username)),
    redis.get(PURCHASED_THEMES_KEY(username)),
  ]);

  const purchasedThemes: ThemeId[] = purchasedThemesStr
    ? JSON.parse(purchasedThemesStr)
    : ['neon'];

  const active: ThemeId = (activeTheme as ThemeId) || 'neon';

  return {
    activeTheme: purchasedThemes.includes(active) ? active : 'neon',
    purchasedThemes,
  };
};

export const purchaseTheme = async (
  username: string,
  themeId: ThemeId
): Promise<{ success: boolean; purchasedThemes: ThemeId[]; balance: number; error?: string }> => {
  if (!username) {
    return { success: false, purchasedThemes: ['neon'], balance: 0, error: 'NOT_LOGGED_IN' };
  }

  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) {
    return { success: false, purchasedThemes: ['neon'], balance: 0, error: 'INVALID_THEME' };
  }

  const { purchasedThemes } = await getUserThemeStatus(username);
  if (purchasedThemes.includes(themeId)) {
    const balance = await getUserCurrency(username);
    return { success: true, purchasedThemes, balance };
  }

  const balance = await getUserCurrency(username);
  if (balance < theme.cost) {
    return { success: false, purchasedThemes, balance, error: 'INSUFFICIENT_FUNDS' };
  }

  const newBalance = balance - theme.cost;
  await setUserCurrency(username, newBalance);

  purchasedThemes.push(themeId);
  await redis.set(PURCHASED_THEMES_KEY(username), JSON.stringify(purchasedThemes));
  await refreshUserTTL(username);

  return { success: true, purchasedThemes, balance: newBalance };
};

export const setUserActiveTheme = async (
  username: string,
  themeId: ThemeId
): Promise<{ success: boolean; activeTheme: ThemeId; error?: string }> => {
  if (!username) {
    return { success: false, activeTheme: 'neon', error: 'NOT_LOGGED_IN' };
  }

  const { purchasedThemes } = await getUserThemeStatus(username);
  if (!purchasedThemes.includes(themeId)) {
    return { success: false, activeTheme: 'neon', error: 'THEME_LOCKED' };
  }

  await redis.set(ACTIVE_THEME_KEY(username), themeId);
  await refreshUserTTL(username);

  return { success: true, activeTheme: themeId };
};
