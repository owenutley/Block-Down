export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Devvit native client context check
  try {
    const devvitCtx = (window as unknown as { __DEVVIT_CLIENT_CONTEXT__?: { client?: { name?: string } } }).__DEVVIT_CLIENT_CONTEXT__;
    if (devvitCtx?.client?.name === 'ANDROID' || devvitCtx?.client?.name === 'IOS') {
      return true;
    }
  } catch {
    // Context check fallback
  }

  // 2. User agent string check
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }

  // 3. Touch / coarse pointer check
  if (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
    return true;
  }

  return false;
};

export const isSplashPage = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check window location
  if (window.location.pathname.includes('splash') || window.location.pathname.endsWith('/splash.html')) {
    return true;
  }

  return false;
};

export const shouldShowTrails = (override?: boolean): boolean => {
  if (typeof override === 'boolean') {
    return override;
  }

  // Splash page always removes trails
  if (isSplashPage()) {
    return false;
  }

  // Mobile view always removes trails
  if (isMobileDevice()) {
    return false;
  }

  // Keep trails on desktop game/fullscreen view
  return true;
};
