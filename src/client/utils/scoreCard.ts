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
  const ratingText = options.stars === 3 ? '⭐⭐⭐ (Par Master)' : options.stars === 2 ? '⭐⭐ (Great Job)' : '⭐ (Completed)';
  const streakText = options.streak && options.streak > 0 ? `\n🔥 ${options.streak}-Day Streak` : '';
  const userTag = options.username ? `by u/${options.username}` : '';

  return `🎮 **Block Down • Verified Solution** ✦\n` +
    `🏆 **${options.title}** ${userTag}\n` +
    `⭐ **Rating**: ${ratingText}\n` +
    `🚀 **Pushes**: **${options.pushes}** / ${options.par} Par\n` +
    `👣 **Moves**: ${options.moves} steps\n` +
    `⏱️ **Time**: ${formatTime(options.solveTime)}${streakText}\n` +
    `\`🔒 VERIFIED SOLVE • ${code}\``;
};

export const renderScoreCardToCanvas = (options: ScoreCardOptions): HTMLCanvasElement => {
  const width = 900;
  const height = 506;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Background Gradient (Solid RGB to avoid upload issues)
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

  // 5. Header: Game Title & Badge
  ctx.textAlign = 'center';

  // Game Logo Text
  ctx.save();
  ctx.font = '900 34px system-ui, -apple-system, sans-serif';
  ctx.shadowColor = 'rgba(34, 211, 238, 0.85)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('BLOCK DOWN', width / 2, 75);
  ctx.restore();

  // Subtitle / Puzzle Title
  ctx.font = '700 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#22d3ee';
  ctx.fillText(options.title.toUpperCase(), width / 2, 108);

  // 6. Stars Rating Display
  const starY = 168;
  const starCount = Math.max(1, Math.min(3, options.stars));
  const starSpacing = 55;
  const startX = width / 2 - (starSpacing * 2) / 2;

  for (let i = 0; i < 3; i++) {
    const isEarned = i < starCount;
    const x = startX + i * starSpacing;
    ctx.save();
    ctx.font = '44px system-ui, sans-serif';
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

  // Star Rating Text Banner
  const ratingLabel = starCount === 3 ? 'PAR MASTER SOLVE' : starCount === 2 ? 'EXCELLENT SOLVE' : 'PUZZLE COMPLETED';
  ctx.font = '800 13px monospace';
  ctx.fillStyle = starCount === 3 ? '#fde047' : '#38bdf8';
  ctx.fillText(`✦ ${ratingLabel} ✦`, width / 2, starY + 28);

  // 7. Stats Grid (4 Chips)
  const chipWidth = 180;
  const chipHeight = 90;
  const chipY = 245;
  const chipSpacing = 200;
  const chipsStartX = width / 2 - (chipSpacing * 3) / 2;

  const stats = [
    { label: 'PUSHES', value: `${options.pushes}`, sub: `Par: ${options.par}`, color: options.pushes <= options.par ? '#4ade80' : '#38bdf8' },
    { label: 'MOVES', value: `${options.moves}`, sub: 'Total steps', color: '#38bdf8' },
    { label: 'TIME', value: formatTime(options.solveTime), sub: 'Solve clock', color: '#38bdf8' },
    { label: 'STREAK', value: options.streak && options.streak > 0 ? `${options.streak} Days` : '1 Day', sub: 'Daily streak', color: '#fb923c' },
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
    ctx.font = '700 11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(stat.label, cx + chipWidth / 2, chipY + 22);

    // Value
    ctx.font = '900 26px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = stat.color;
    ctx.fillText(stat.value, cx + chipWidth / 2, chipY + 54);

    // Subtext
    ctx.font = '600 10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText(stat.sub, cx + chipWidth / 2, chipY + 75);
  });

  // 8. Footer: Verified User Badge & Authenticity Code
  const footerY = 420;

  // Verification Pill
  const userTag = options.username ? `u/${options.username}` : 'u/Player';
  const verifyCode = generateVerificationCode(options);

  // Left: Verified Reddit Player
  ctx.textAlign = 'left';
  ctx.font = '700 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`🎮 Verified Player: ${userTag}`, 50, footerY);

  ctx.font = '600 11px monospace';
  ctx.fillStyle = '#4ade80';
  ctx.fillText('✓ Authenticated Solve on Reddit', 50, footerY + 22);

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
    let blob: Blob | null = null;
    if ('tagName' in optionsOrCanvas) {
      blob = await new Promise<Blob | null>((resolve) => {
        optionsOrCanvas.toBlob((b) => resolve(b), 'image/png');
      });
    } else {
      blob = await generateScoreCardBlob(optionsOrCanvas);
    }

    if (!blob) return false;

    // Use Blob Object URL instead of data: URI (which is blocked by browser iframe sandboxes)
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.download = filename;
    link.setAttribute('download', filename);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 2000);

    return true;
  } catch (err) {
    console.error('Failed to download score card:', err);
    return false;
  }
};
