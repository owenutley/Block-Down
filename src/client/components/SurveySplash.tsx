import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import { requestExpandedMode } from '@devvit/web/client';
import { trpc } from '../trpc';
import { SurveyResultsData } from '../../shared/types';
import { ThemeId, getThemeBgClass } from '../../shared/themes';
import { cn } from '../utils';

export type SurveySplashProps = {
  activeTheme?: ThemeId | undefined;
  surveyId?: string | undefined;
};

export const SurveySplash = ({
  activeTheme = 'neon',
  surveyId,
}: SurveySplashProps) => {
  const [data, setData] = useState<SurveyResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSurvey = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await trpc.survey.getForPost.query();
      if (res) {
        setData(res);
        if (res.userVotedOptionIds && res.userVotedOptionIds.length > 0) {
          setSelectedOptionIds(res.userVotedOptionIds);
        }
      }
    } catch (err) {
      console.error('Failed to load survey for post:', err);
      setErrorMsg('Failed to load survey. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSurvey();
  }, [fetchSurvey, surveyId]);

  const handleToggleOption = (optionId: string) => {
    if (!data || data.hasVoted) return;

    if (data.survey.allowMultiple) {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptionIds([optionId]);
    }
    setErrorMsg(null);
  };

  const handleSubmitVote = async () => {
    if (!data || selectedOptionIds.length === 0 || submitting || data.hasVoted) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const updated = await trpc.survey.submitVote.mutate({
        surveyId: data.survey.id,
        optionIds: selectedOptionIds,
      });
      setData(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit vote.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayGame = (e: MouseEvent<HTMLButtonElement>) => {
    requestExpandedMode(e.nativeEvent, 'game');
  };

  const bgClass = getThemeBgClass(activeTheme);

  if (loading) {
    return (
      <div
        className={`h-[100dvh] w-full ${bgClass} text-white flex flex-col items-center justify-center p-4 select-none font-sans`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-300">
            Loading Survey...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className={`h-[100dvh] w-full ${bgClass} text-white flex flex-col items-center justify-center p-4 text-center select-none font-sans`}
      >
        <div className="max-w-xs bg-slate-950/80 border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
            <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-white">Survey Unavailable</h2>
          <p className="text-xs text-zinc-400">
            {errorMsg || 'This survey could not be loaded or is no longer active.'}
          </p>
          <button
            onClick={(e) => handlePlayGame(e)}
            className="w-full mt-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-indigo-600 text-white cursor-pointer hover:brightness-110 active:scale-98 transition-all"
          >
            Play Block Down &rarr;
          </button>
        </div>
      </div>
    );
  }

  const { survey, results, hasVoted, totalVoters } = data;

  return (
    <div
      className={`h-[100dvh] w-full ${bgClass} text-white flex flex-col items-center justify-between p-3 sm:p-5 transition-colors duration-500 overflow-y-auto select-none font-sans relative`}
    >
      {/* Ambient Radial FX */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md flex flex-col items-center flex-1 my-auto justify-between relative z-10 gap-3 py-1">
        {/* Header Bar */}
        <div className="w-full flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-[10px] sm:text-xs font-mono font-bold text-cyan-300 shadow-sm">
            <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Community Poll</span>
          </div>

          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider',
              survey.allowMultiple
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
            )}
          >
            {survey.allowMultiple ? 'Multi-Choice' : 'Single Choice'}
          </span>
        </div>

        {/* Question Title Card */}
        <div className="w-full text-center space-y-1.5 shrink-0">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight drop-shadow-md leading-snug">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {survey.description}
            </p>
          )}
          <p className="text-[10px] sm:text-[11px] font-mono text-cyan-300/80 uppercase tracking-widest pt-0.5">
            {hasVoted
              ? 'Results Overview'
              : survey.allowMultiple
              ? 'Select all that apply'
              : 'Tap to select your answer'}
          </p>
        </div>

        {/* Options List */}
        <div className="w-full space-y-2 flex-1 flex flex-col justify-center my-1 max-w-sm">
          {!hasVoted ? (
            /* Pre-Vote Interactive Option Buttons */
            survey.options.map((opt) => {
              const isSelected = selectedOptionIds.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleToggleOption(opt.id)}
                  className={cn(
                    'w-full p-3 sm:p-3.5 rounded-2xl border text-left font-sans transition-all flex items-center justify-between gap-3 cursor-pointer select-none active:scale-99',
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-600/30 via-indigo-600/30 to-purple-600/30 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/80 hover:bg-slate-800/90 border-white/10 text-zinc-300 hover:text-white hover:border-white/20'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-colors',
                        survey.allowMultiple ? 'rounded-md' : 'rounded-full',
                        isSelected
                          ? 'bg-cyan-400 border-cyan-300 text-slate-950 font-bold'
                          : 'border-zinc-600 bg-slate-950/60'
                      )}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate">
                      {opt.text}
                    </span>
                  </div>
                </button>
              );
            })
          ) : (
            /* Post-Vote Live Results with Percentage Bars */
            results.map((res) => {
              const userVotedForThis = (data.userVotedOptionIds || []).includes(res.id);
              return (
                <div
                  key={res.id}
                  className={cn(
                    'w-full p-2.5 sm:p-3 rounded-2xl border relative overflow-hidden flex flex-col justify-center transition-all',
                    userVotedForThis
                      ? 'bg-slate-900/90 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/60 border-white/10'
                  )}
                >
                  {/* Visual Background Percentage Bar */}
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 transition-all duration-700 ease-out opacity-25',
                      userVotedForThis
                        ? 'bg-gradient-to-r from-cyan-400 to-indigo-500 opacity-40'
                        : 'bg-gradient-to-r from-slate-700 to-cyan-800'
                    )}
                    style={{ width: `${Math.max(2, res.percentage)}%` }}
                  />

                  {/* Foreground Content */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {userVotedForThis && (
                        <span className="px-1.5 py-0.2 rounded-md bg-cyan-400 text-slate-950 text-[9px] font-black uppercase tracking-tight shrink-0">
                          Your Vote
                        </span>
                      )}
                      <span className="text-xs sm:text-sm font-bold text-white truncate">
                        {res.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-right">
                      <span className="text-xs sm:text-sm font-black text-cyan-300">
                        {res.percentage}%
                      </span>
                      <span className="text-[10px] text-zinc-400 hidden xs:inline">
                        ({res.count})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="w-full text-center py-1 px-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-mono">
            {errorMsg}
          </div>
        )}

        {/* Action Controls */}
        <div className="w-full max-w-sm shrink-0 flex flex-col gap-2 pt-1">
          {!hasVoted ? (
            <button
              onClick={handleSubmitVote}
              disabled={selectedOptionIds.length === 0 || submitting}
              className={cn(
                'w-full py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 border select-none',
                selectedOptionIds.length === 0 || submitting
                  ? 'bg-slate-900/80 text-zinc-600 border-zinc-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] border-cyan-300/50 cursor-pointer active:scale-98'
              )}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Vote...</span>
                </>
              ) : (
                <>
                  <span>Submit Vote</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          ) : (
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center justify-between px-2 text-[10px] sm:text-[11px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Vote Recorded</span>
                </span>
                <span>{totalVoters} {totalVoters === 1 ? 'total voter' : 'total voters'}</span>
              </div>

              <button
                onClick={(e) => handlePlayGame(e)}
                className="w-full py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border border-emerald-400/50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <span>Play Block Down</span>
                <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
