import { useState } from 'react';
import { navigateTo, showToast } from '@devvit/web/client';
import { trpc } from '../trpc';

export interface ReportModalProps {
  puzzleId: string;
  puzzleTitle?: string | undefined;
  author?: string | undefined;
  postId?: string | undefined;
  onClose: () => void;
}

export const ReportModal = ({
  puzzleId,
  puzzleTitle = 'Custom Challenge',
  author,
  postId,
  onClose,
}: ReportModalProps) => {
  const [reason, setReason] = useState<string>('Inappropriate Text / Title');
  const [submitting, setSubmitting] = useState(false);

  const handleInAppReport = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await trpc.puzzle.reportPuzzle.mutate({
        puzzleId,
        postId,
        reason,
      });
      showToast({
        text: '🚩 Content reported. Thank you for keeping the community safe!',
        appearance: 'success',
      });
      onClose();
    } catch (err) {
      console.error('Failed to report content:', err);
      showToast({
        text: 'Failed to submit report. Please try again.',
        appearance: 'neutral',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedditReport = () => {
    const postUrl = postId
      ? `https://reddit.com/comments/${postId.replace(/^t3_/, '')}`
      : undefined;

    if (postUrl) {
      navigateTo(postUrl);
      onClose();
    } else {
      showToast({
        text: 'Original Reddit post not found. Submitted in-app report.',
        appearance: 'neutral',
      });
      void handleInAppReport();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 pointer-events-auto">
      <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-red-500/40 text-white relative shadow-[0_0_50px_rgba(239,68,68,0.25)] flex flex-col space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all"
        >
          ×
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-red-500/20 pb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-xl">
            🚩
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Report Content
            </h3>
            <p className="text-xs text-red-300 font-mono">
              {puzzleTitle} {author ? `by ${author}` : ''}
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-sans">
          Reddit guidelines require user-generated content to be reportable. Please select a reason below or navigate directly to the Reddit post to report to moderators.
        </p>

        {/* Reason Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Reason for Report:
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-900 border border-white/20 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-red-400 cursor-pointer"
          >
            <option value="Inappropriate Text / Title">Inappropriate Text / Title</option>
            <option value="Offensive or Harassing Content">Offensive or Harassing Content</option>
            <option value="Spam or Unsolicited Promotion">Spam or Unsolicited Promotion</option>
            <option value="Other Policy Violation">Other Policy Violation</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {postId && (
            <button
              onClick={handleRedditReport}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer border border-red-400/40 flex items-center justify-center gap-2"
            >
              <span>Report Post on Reddit ↗</span>
            </button>
          )}

          <button
            onClick={handleInAppReport}
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-red-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 disabled:opacity-50"
          >
            {submitting ? (
              <span>Submitting Flag...</span>
            ) : (
              <span>Flag Content In-App</span>
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
