import React, { useMemo, useState } from 'react';
import {
  ScoreCardOptions,
  generateScoreCardDataUrl,
  generateScoreCardBlob,
  copyScoreCardBlobToClipboard,
} from '../utils/scoreCard';
import { showToast } from '@devvit/web/client';

export const ScoreCardModal = ({
  options,
  onPostScore,
  isPostingScore = false,
  scorePosted = false,
  onClose,
}: {
  options: ScoreCardOptions;
  onPostScore?: ((e: React.MouseEvent) => void) | undefined;
  isPostingScore?: boolean | undefined;
  scorePosted?: boolean | undefined;
  onClose: () => void;
}) => {
  const dataUrl = useMemo(() => generateScoreCardDataUrl(options), [options]);

  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [copying, setCopying] = useState<boolean>(false);

  const handleCopyImage = async () => {
    try {
      setCopying(true);
      const blob = await generateScoreCardBlob(options);
      if (blob) {
        const success = await copyScoreCardBlobToClipboard(blob);
        if (success) {
          setCopiedImage(true);
          showToast({
            text: 'Score image copied! Paste (Ctrl+V) directly into Reddit comments.',
            appearance: 'success',
          });
          setTimeout(() => setCopiedImage(false), 3000);
          return;
        }
      }
      showToast({
        text: 'Right-click or hold the card image above to save image!',
        appearance: 'neutral',
      });
    } catch {
      showToast({
        text: 'Right-click or hold the card image above to save image!',
        appearance: 'neutral',
      });
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 backdrop-blur-md px-3 sm:px-4 py-3 pointer-events-auto overflow-hidden">
      <div className="glass-panel max-w-md sm:max-w-lg w-full p-3.5 sm:p-5 rounded-3xl border border-cyan-500/40 text-white relative shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[88vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-7 h-7 flex items-center justify-center transition-all z-10"
        >
          ×
        </button>

        <div className="text-center mb-2">
          <h2 className="text-base sm:text-xl font-black neon-text-title tracking-tight mt-0.5">
            Victory Score Card
          </h2>
          <p className="text-[9px] sm:text-[10px] text-cyan-400/80 font-mono uppercase tracking-wider mt-0.5">
            Share with Others
          </p>
        </div>

        {/* Score Card Image Preview */}
        <div className="rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/50 shadow-inner mb-2 flex items-center justify-center p-1">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Block Down Score Card"
              className="w-auto max-h-[28vh] sm:max-h-[38vh] object-contain rounded-xl select-all cursor-pointer"
              title="Right-click or hold to save image"
            />
          ) : (
            <div className="h-28 flex items-center justify-center text-zinc-500 text-xs">
              Generating score card...
            </div>
          )}
        </div>

        {/* Share prompt message */}
        <p className="text-center text-[10px] sm:text-xs text-zinc-300 mb-2 font-medium">
          Copy your score card image or share your solve directly in Reddit comments!
        </p>

        {/* Action Buttons: Share Score in Comments & Copy Image */}
        <div className="flex flex-col gap-1.5 w-full">
          {onPostScore && (
            <button
              onClick={onPostScore}
              disabled={isPostingScore || scorePosted}
              className="w-full rounded-xl theme-btn py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold transition-all hover:scale-102 active:scale-98 bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/60 shadow-[0_0_18px_rgba(6,182,212,0.35)] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{scorePosted ? 'Score Posted in Comments ✓' : isPostingScore ? 'Posting Score...' : 'Share Score in Comments'}</span>
            </button>
          )}
          <button
            onClick={handleCopyImage}
            disabled={copying}
            className="w-full rounded-xl theme-btn py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold transition-all hover:scale-102 active:scale-98 shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{copiedImage ? 'Image Copied to Clipboard!' : copying ? 'Copying...' : 'Copy Image'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
