import { useMemo, useState } from 'react';
import {
  ScoreCardOptions,
  generateScoreCardDataUrl,
  generateScoreCardBlob,
  copyScoreCardBlobToClipboard,
} from '../utils/scoreCard';
import { showToast } from '@devvit/web/client';

export const ScoreCardModal = ({
  options,
  onClose,
}: {
  options: ScoreCardOptions;
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
      <div className="glass-panel max-w-md sm:max-w-lg w-full p-4 sm:p-5 rounded-3xl border border-cyan-500/40 text-white relative shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[88vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-7 h-7 flex items-center justify-center transition-all z-10"
        >
          ×
        </button>

        <div className="text-center mb-2.5">
          <h2 className="text-lg sm:text-2xl font-black neon-text-title tracking-tight mt-0.5">
            Victory Score Card
          </h2>
          <p className="text-[10px] sm:text-xs text-cyan-400/80 font-mono uppercase tracking-wider mt-0.5">
            Share with Others
          </p>
        </div>

        {/* Score Card Image Preview */}
        <div className="rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/50 shadow-inner mb-2.5 flex items-center justify-center p-1">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Block Down Score Card"
              className="w-auto max-h-[35vh] sm:max-h-[42vh] object-contain rounded-xl select-all cursor-pointer"
              title="Right-click or hold to save image"
            />
          ) : (
            <div className="h-36 flex items-center justify-center text-zinc-500 text-sm">
              Generating score card...
            </div>
          )}
        </div>

        {/* Share prompt message */}
        <p className="text-center text-[11px] sm:text-xs text-zinc-300 mb-3 font-medium">
          Copy your score card image to share your solve directly in Reddit comments!
        </p>

        {/* Action Button: Copy Image */}
        <div>
          <button
            onClick={handleCopyImage}
            disabled={copying}
            className="w-full rounded-2xl theme-btn py-3 text-xs sm:text-sm font-extrabold transition-all hover:scale-102 active:scale-98 shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{copiedImage ? 'Image Copied to Clipboard!' : copying ? 'Copying...' : 'Copy Image'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
