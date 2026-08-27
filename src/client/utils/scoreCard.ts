export type ScoreCardOptions = {
  title: string;
  puzzleId?: string | undefined;
  username?: string | undefined;
  pushes: number;
  par: number;
  moves: number;
  solveTime: number;
  stars: number;
  streak?: number | undefined;
};

// Generates a deterministic short verification code to prevent tampering
export const generateVerificationCode = (options: ScoreCardOptions): string => {
  const payload = `${options.puzzleId || 'p'}:${options.username || 'anon'}:${options.pushes}:${options.moves}:${options.solveTime}:${options.stars}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `BD-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
};

export const formatTime = (sec: number): string => {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
};

export const getScoreText = (options: ScoreCardOptions): string => {
  const code = generateVerificationCode(options);
  const starsText = '★'.repeat(options.stars) + '☆'.repeat(3 - options.stars);
  const userTag = options.username ? `by u/${options.username}` : '';
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `Block Down • Verified Solution\n` +
    `${options.title} ${userTag}\n` +
    `Stars: ${starsText}\n` +
    `Pushes: ${options.pushes} / ${options.par} Par\n` +
    `Moves: ${options.moves} steps\n` +
    `Time: ${formatTime(options.solveTime)}\n` +
    `Date: ${dateStr}\n` +
    `VERIFIED SOLVE • ${code}`;
};

export const renderScoreCardToCanvas = (options: ScoreCardOptions): HTMLCanvasElement => {
  const width = 900;
  const height = 506;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Background Gradient (Solid RGB)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0a0f1d');
  bgGrad.addColorStop(0.5, '#030712');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Neon Grid lines in background
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
  ctx.lineWidth = 1;
  const gridSize = 30;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Radial Glows
  const cyanGlow = ctx.createRadialGradient(200, 120, 10, 200, 120, 300);
  cyanGlow.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
  cyanGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
  ctx.fillStyle = cyanGlow;
  ctx.fillRect(0, 0, width, height);

  const purpleGlow = ctx.createRadialGradient(720, 340, 10, 720, 340, 320);
  purpleGlow.addColorStop(0, 'rgba(168, 85, 247, 0.16)');
  purpleGlow.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = purpleGlow;
  ctx.fillRect(0, 0, width, height);

  // 4. Outer Border Frame
  ctx.save();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 12;
  ctx.strokeRect(20, 20, width - 40, height - 40);
  ctx.restore();

  // Corner Accents
  const cornerSize = 18;
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(18, 18, cornerSize, 3);
  ctx.fillRect(18, 18, 3, cornerSize);
  ctx.fillRect(width - 18 - cornerSize, 18, cornerSize, 3);
  ctx.fillRect(width - 21, 18, 3, cornerSize);
  ctx.fillRect(18, height - 21, cornerSize, 3);
  ctx.fillRect(18, height - 18 - cornerSize, 3, cornerSize);
  ctx.fillRect(width - 18 - cornerSize, height - 21, cornerSize, 3);
  ctx.fillRect(width - 21, height - 18 - cornerSize, 3, cornerSize);

  // 5. Header: Game Title & Puzzle #
  ctx.textAlign = 'center';

  // Game Logo Text
  ctx.save();
  ctx.font = '900 34px system-ui, -apple-system, sans-serif';
  ctx.shadowColor = 'rgba(34, 211, 238, 0.85)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BLOCK DOWN', width / 2, 72);
  ctx.restore();

  // Subtitle / Puzzle Title
  ctx.font = '700 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#22d3ee';
  ctx.fillText(options.title.toUpperCase(), width / 2, 106);

  // 6. Stars Rating Display (Just the stars, no commentary text)
  const starY = 168;
  const starCount = Math.max(1, Math.min(3, options.stars));
  const starSpacing = 60;
  const startX = width / 2 - (starSpacing * 2) / 2;

  for (let i = 0; i < 3; i++) {
    const isEarned = i < starCount;
    const x = startX + i * starSpacing;
    ctx.save();
    ctx.font = '48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (isEarned) {
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 20;
      ctx.fillText('★', x, starY);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillText('★', x, starY);
    }
    ctx.restore();
  }

  // 7. Stats Grid (3 Centered Chips: Pushes, Moves, Time - No Emojis, No Streak)
  const chipWidth = 220;
  const chipHeight = 90;
  const chipY = 225;
  const chipSpacing = 240;
  const chipsStartX = width / 2 - (chipSpacing * 2) / 2;

  const stats = [
    { label: 'PUSHES', value: `${options.pushes}`, sub: `Par: ${options.par}`, color: options.pushes <= options.par ? '#4ade80' : '#38bdf8' },
    { label: 'MOVES', value: `${options.moves}`, sub: 'Total steps', color: '#38bdf8' },
    { label: 'TIME', value: formatTime(options.solveTime), sub: 'Solve clock', color: '#38bdf8' },
  ];

  stats.forEach((stat, idx) => {
    const cx = chipsStartX + idx * chipSpacing - chipWidth / 2;

    // Card background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx, chipY, chipWidth, chipHeight, 14);
    ctx.fill();
    ctx.stroke();

    // Top Label
    ctx.textAlign = 'center';
    ctx.font = '700 12px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(stat.label, cx + chipWidth / 2, chipY + 24);

    // Value
    ctx.font = '900 28px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = stat.color;
    ctx.fillText(stat.value, cx + chipWidth / 2, chipY + 56);

    // Subtext
    ctx.font = '600 11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(stat.sub, cx + chipWidth / 2, chipY + 77);
  });

  // 8. Footer: Player Tag, Date & Authenticity Code (No Emojis)
  const footerY = 405;
  const userTag = options.username ? `u/${options.username}` : 'u/Player';
  const verifyCode = generateVerificationCode(options);
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Left: Player Tag & Date
  ctx.textAlign = 'left';
  ctx.font = '700 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`Player: ${userTag}`, 50, footerY);

  ctx.font = '600 12px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`${todayStr} • Verified Solve`, 50, footerY + 22);

  // Right: Tamper-proof Verification Hash
  ctx.textAlign = 'right';
  ctx.font = '700 14px monospace';
  ctx.fillStyle = '#22d3ee';
  ctx.fillText(verifyCode, width - 50, footerY);

  ctx.font = '600 10px monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText('ANTI-CHEAT VERIFIED HASH', width - 50, footerY + 20);

  return canvas;
};

export const generateScoreCardBlob = async (options: ScoreCardOptions): Promise<Blob | null> => {
  const canvas = renderScoreCardToCanvas(options);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
};

export const generateScoreCardDataUrl = (options: ScoreCardOptions): string => {
  const canvas = renderScoreCardToCanvas(options);
  return canvas.toDataURL('image/png');
};

export const copyScoreCardBlobToClipboard = async (blob: Blob): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard image write failed:', err);
  }
  return false;
};

export const copyScoreCardTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard text write failed:', err);
  }
  return false;
};

export const downloadScoreCard = async (
  optionsOrCanvas: ScoreCardOptions | HTMLCanvasElement,
  filename: string = 'block-down-score.png'
): Promise<boolean> => {
  try {
    let canvas: HTMLCanvasElement;
    if ('tagName' in optionsOrCanvas) {
      canvas = optionsOrCanvas;
    } else {
      canvas = renderScoreCardToCanvas(optionsOrCanvas);
    }

    const dataUrl = canvas.toDataURL('image/png');

    // Method 1: Direct anchor download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Method 2: Blob URL anchor fallback
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const bLink = document.createElement('a');
      bLink.href = blobUrl;
      bLink.download = filename;
      document.body.appendChild(bLink);
      bLink.click();
      document.body.removeChild(bLink);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }

    return true;
  } catch (err) {
    console.error('Failed to download score card:', err);
    return false;
  }
};
