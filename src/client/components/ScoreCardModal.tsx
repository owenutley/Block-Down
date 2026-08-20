import { useEffect, useState } from 'react';
import {
  ScoreCardOptions,
  generateScoreCardDataUrl,
  generateScoreCardBlob,
  copyScoreCardBlobToClipboard,
  downloadScoreCard,
} from '../utils/scoreCard';
import { showToast } from '@devvit/web/client';

export const ScoreCardModal = ({
  options,
  onClose,
}: {
  options: ScoreCardOptions;
  onClose: () => void;
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [copying, setCopying] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    const url = generateScoreCardDataUrl(options);
    setDataUrl(url);
  }, [options]);

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
      // If clipboard copy fails, trigger download
      const filename = `block-down-${options.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      await downloadScoreCard(options, filename);
      showToast({
        text: 'Score image downloaded to your device!',
        appearance: 'neutral',
      });
    } catch {
      showToast({
        text: 'Could not copy image. Tap Save PNG to download!',
        appearance: 'neutral',
      });
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const filename = `block-down-${options.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      const success = await downloadScoreCard(options, filename);
      if (success) {
        showToast({
          text: 'Score image download started!',
          appearance: 'success',
        });
      } else {
        showToast({
          text: 'Download started! If blocked by browser, right-click/hold the card to save.',
          appearance: 'neutral',
        });
      }
    } catch {
      showToast({
        text: 'Right-click or hold the card image above to save image!',
        appearance: 'neutral',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 backdrop-blur-md px-3 sm:px-4 py-4 pointer-events-auto overflow-y-auto">
      <div className="glass-panel max-w-xl w-full p-4 sm:p-6 rounded-3xl border border-cyan-500/40 text-white relative animate-float shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col my-auto max-h-[95vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all z-10"
        >
          ×
        </button>

        <div className="text-center mb-3">
          <span className="text-3xl">🏆</span>
          <h2 className="text-xl sm:text-2xl font-black neon-text-title tracking-tight mt-1">
            Victory Score Card
          </h2>
          <p className="text-xs text-cyan-400/80 font-mono uppercase tracking-wider mt-0.5">
            Share with Others
          </p>
        </div>

        {/* Score Card Image Preview */}
        <div className="rounded-2xl overflow-hidden border border-cyan-500/30 bg-black/50 shadow-inner mb-3 flex items-center justify-center">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Block Down Score Card"
              className="w-full h-auto object-contain rounded-xl select-all"
            />
          ) : (
            <div className="h-40 flex items-center justify-center text-zinc-500 text-sm">
              Generating score card...
            </div>
          )}
        </div>

        {/* Share prompt message */}
        <p className="text-center text-xs text-zinc-300 mb-4 font-medium">
          Copy or save your score card to share your solve in the Reddit comments!
        </p>

        {/* Action Buttons: Copy Image & Save PNG */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleCopyImage}
            disabled={copying}
            className="flex-1 rounded-2xl theme-btn py-3.5 text-sm font-extrabold transition-all hover:scale-102 active:scale-98 shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{copiedImage ? '✓' : '📋'}</span>
            <span>{copiedImage ? 'Image Copied to Clipboard!' : copying ? 'Copying...' : 'Copy Image'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-2xl bg-white/10 hover:bg-white/15 px-5 py-3.5 text-sm font-bold transition-all text-zinc-200 hover:text-white flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <span>💾</span>
            <span>{downloading ? 'Saving...' : 'Save PNG'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
