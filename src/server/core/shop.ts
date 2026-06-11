import { redis } from '@devvit/web/server';
import { getUserCurrency, setUserCurrency, refreshUserTTL } from './progress';
import { THEMES, ThemeId } from '../../shared/themes';
import { TRAILS, TrailId } from '../../shared/trails';

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

const ACTIVE_TRAIL_KEY = (username: string) => `user_active_trail:${username}`;
const PURCHASED_TRAILS_KEY = (username: string) => `user_purchased_trails:${username}`;

export const getUserTrailStatus = async (
  username: string
): Promise<{ activeTrail: TrailId; purchasedTrails: TrailId[] }> => {
  if (!username) {
    return { activeTrail: 'none', purchasedTrails: ['none'] };
  }

  const [activeTrail, purchasedTrailsStr] = await Promise.all([
    redis.get(ACTIVE_TRAIL_KEY(username)),
    redis.get(PURCHASED_TRAILS_KEY(username)),
  ]);

  const purchasedTrails: TrailId[] = purchasedTrailsStr
    ? JSON.parse(purchasedTrailsStr)
    : ['none'];

  const active: TrailId = (activeTrail as TrailId) || 'none';

  return {
    activeTrail: purchasedTrails.includes(active) ? active : 'none',
    purchasedTrails,
  };
};

export const purchaseTrail = async (
  username: string,
  trailId: TrailId
): Promise<{ success: boolean; purchasedTrails: TrailId[]; balance: number; error?: string }> => {
  if (!username) {
    return { success: false, purchasedTrails: ['none'], balance: 0, error: 'NOT_LOGGED_IN' };
  }

  const trail = TRAILS.find((t) => t.id === trailId);
  if (!trail) {
    return { success: false, purchasedTrails: ['none'], balance: 0, error: 'INVALID_TRAIL' };
  }

  const { purchasedTrails } = await getUserTrailStatus(username);
  if (purchasedTrails.includes(trailId)) {
    const balance = await getUserCurrency(username);
    return { success: true, purchasedTrails, balance };
  }

  const balance = await getUserCurrency(username);
  if (balance < trail.cost) {
    return { success: false, purchasedTrails, balance, error: 'INSUFFICIENT_FUNDS' };
  }

  const newBalance = balance - trail.cost;
  await setUserCurrency(username, newBalance);

  purchasedTrails.push(trailId);
  await redis.set(PURCHASED_TRAILS_KEY(username), JSON.stringify(purchasedTrails));
  await refreshUserTTL(username);

  return { success: true, purchasedTrails, balance: newBalance };
};

export const setUserActiveTrail = async (
  username: string,
  trailId: TrailId
): Promise<{ success: boolean; activeTrail: TrailId; error?: string }> => {
  if (!username) {
    return { success: false, activeTrail: 'none', error: 'NOT_LOGGED_IN' };
  }

  const { purchasedTrails } = await getUserTrailStatus(username);
  if (!purchasedTrails.includes(trailId)) {
    return { success: false, activeTrail: 'none', error: 'TRAIL_LOCKED' };
  }

  await redis.set(ACTIVE_TRAIL_KEY(username), trailId);
  await refreshUserTTL(username);

  return { success: true, activeTrail: trailId };
};
