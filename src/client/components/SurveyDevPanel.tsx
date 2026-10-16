import { useState, useEffect, useCallback } from 'react';
import { trpc } from '../trpc';
import { SurveyResultsData } from '../../shared/types';
import { cn } from '../utils';

export type SurveyDevPanelProps = {
  className?: string;
};

export const SurveyDevPanel = ({ className }: SurveyDevPanelProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'results'>('create');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [options, setOptions] = useState<string[]>(['', '']);
  const [creating, setCreating] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Results State
  const [surveys, setSurveys] = useState<SurveyResultsData[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSurveys = useCallback(async () => {
    try {
      setLoadingSurveys(true);
      const list = await trpc.survey.list.query();
      setSurveys(list);
      if (list.length > 0 && !selectedSurveyId) {
        setSelectedSurveyId(list[0]?.survey.id ?? null);
      }
    } catch (e) {
      console.error('Failed to load surveys:', e);
    } finally {
      setLoadingSurveys(false);
    }
  }, [selectedSurveyId]);

  useEffect(() => {
    void fetchSurveys();
  }, [fetchSurveys]);

  const handleAddOption = () => {
    if (options.length >= 8) return;
    setOptions((prev) => [...prev, '']);
    setFormError(null);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setFormError(null);
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
    setFormError(null);
  };

  const handleCreateSurvey = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFormError('Please enter a question or statement for the post title.');
      return;
    }

    const cleanedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (cleanedOptions.length < 2) {
      setFormError('Please provide at least 2 non-empty options.');
      return;
    }

    try {
      setCreating(true);
      setFormError(null);
      setFormSuccess(null);

      const created = await trpc.survey.createPost.mutate({
        title: trimmedTitle,
        description: description.trim() || undefined,
        options: cleanedOptions.map((text, i) => ({ id: `opt_${i + 1}`, text })),
        allowMultiple,
      });

      setCreatedPostId(created.postId || null);
      setFormSuccess(`Survey post "${created.title}" successfully created and posted to Reddit!`);
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setAllowMultiple(false);

      // Refresh surveys and select new one
      await fetchSurveys();
      setSelectedSurveyId(created.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create survey post';
      setFormError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleRefreshResults = async () => {
    if (!selectedSurveyId) return;
    try {
      setRefreshing(true);
      const updated = await trpc.survey.getResults.query({ surveyId: selectedSurveyId });
      if (updated) {
        setSurveys((prev) =>
          prev.map((s) => (s.survey.id === selectedSurveyId ? updated : s))
        );
      }
    } catch (err) {
      console.error('Failed refreshing survey results:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const activeSurvey = surveys.find((s) => s.survey.id === selectedSurveyId);

  return (
    <div className={cn('w-full flex flex-col gap-6 text-white font-sans', className)}>
      {/* Top Banner / Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              Survey Post Splash Manager
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Create interactive Reddit poll posts & view live response quantities & percentages
            </p>
          </div>
        </div>

        {/* Sub-Tabs: Create vs Results */}
        <div className="flex p-1 rounded-2xl bg-slate-950/80 border border-white/10 shrink-0">
          <button
            onClick={() => setActiveSubTab('create')}
            className={cn(
              'px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
              activeSubTab === 'create'
                ? 'bg-cyan-600/40 text-cyan-300 border border-cyan-500/50 shadow'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            <span>+ Create Survey</span>
          </button>
          <button
            onClick={() => setActiveSubTab('results')}
            className={cn(
              'px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
              activeSubTab === 'results'
                ? 'bg-cyan-600/40 text-cyan-300 border border-cyan-500/50 shadow'
                : 'text-zinc-400 hover:text-white'
            )}
          >
            <span>Results & Analytics ({surveys.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Create Survey Post */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Configuration Form (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-5 p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-white/10 shadow-xl">
            <div className="border-b border-white/10 pb-3">
              <h3 className="text-sm sm:text-base font-black text-cyan-300 uppercase tracking-wide">
                1. Survey Details
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                This question or statement will be published as the Reddit post title.
              </p>
            </div>

            {/* Question / Title Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                Question or Statement (Post Title) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setFormError(null);
                }}
                placeholder="e.g. Which puzzle mechanic should we introduce next?"
                maxLength={300}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>Keep it clear and engaging</span>
                <span>{title.length} / 300</span>
              </div>
            </div>

            {/* Optional Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                Optional Description / Context
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add extra context or instructions for voters (optional)..."
                rows={2}
                maxLength={500}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none transition-all font-sans resize-none"
              />
            </div>

            {/* Selection Mode Toggle */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                Vote Selection Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAllowMultiple(false)}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3',
                    !allowMultiple
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                      : 'bg-slate-900/60 border-white/10 text-zinc-400 hover:border-white/20'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0',
                      !allowMultiple ? 'border-cyan-400 bg-cyan-400' : 'border-zinc-500'
                    )}
                  >
                    {!allowMultiple && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold">Single Choice</div>
                    <div className="text-[10px] text-zinc-400">Choose only 1 option</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAllowMultiple(true)}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3',
                    allowMultiple
                      ? 'bg-purple-500/15 border-purple-400 text-white shadow-sm'
                      : 'bg-slate-900/60 border-white/10 text-zinc-400 hover:border-white/20'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-md border flex items-center justify-center shrink-0',
                      allowMultiple ? 'border-purple-400 bg-purple-400 text-slate-950 font-bold' : 'border-zinc-500'
                    )}
                  >
                    {allowMultiple && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold">Multiple Selection</div>
                    <div className="text-[10px] text-zinc-400">Select all that apply</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Answer Options (2 to 8) */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div>
                  <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase">
                    Answer Options ({options.length}/8)
                  </h4>
                  <p className="text-[11px] text-zinc-400">Provide between 2 and 8 choices for players.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={options.length >= 8}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border',
                    options.length >= 8
                      ? 'bg-slate-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-400/40 cursor-pointer active:scale-95'
                  )}
                >
                  <span>+ Add Option</span>
                </button>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 text-center text-xs font-mono text-zinc-500">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1} text...`}
                      maxLength={120}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs focus:border-cyan-400 focus:outline-none transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      disabled={options.length <= 2}
                      title="Remove option"
                      className={cn(
                        'w-8 h-8 rounded-xl border flex items-center justify-center transition-all',
                        options.length <= 2
                          ? 'border-transparent text-zinc-700 cursor-not-allowed'
                          : 'border-rose-500/30 text-rose-400 hover:bg-rose-500/20 cursor-pointer active:scale-95'
                      )}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Error & Success Feedback */}
            {formError && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
                <span>{formSuccess}</span>
                {createdPostId && (
                  <span className="text-[10px] underline text-cyan-300 ml-2">Post ID: {createdPostId}</span>
                )}
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCreateSurvey}
                disabled={creating}
                className={cn(
                  'w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 border cursor-pointer',
                  creating
                    ? 'bg-slate-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] border-cyan-300/50 active:scale-98'
                )}
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publishing to Reddit...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Publish Survey Post to Reddit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Real-time Visual Feed Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Live Feed Preview
              </h3>
              <span className="text-[10px] text-cyan-400 font-mono">
                Interactive Splash Card
              </span>
            </div>

            <div className="w-full bg-slate-950 border border-cyan-500/30 rounded-3xl p-5 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col gap-3.5">
              {/* Preview Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Community Poll</span>
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                  {allowMultiple ? 'Multi-Choice' : 'Single Choice'}
                </span>
              </div>

              {/* Preview Title */}
              <div className="text-center space-y-1">
                <h4 className="text-sm sm:text-base font-black text-white leading-snug">
                  {title.trim() || 'Your Survey Question Will Appear Here'}
                </h4>
                {description.trim() && (
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {description.trim()}
                  </p>
                )}
                <p className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest pt-0.5">
                  {allowMultiple ? 'Select all that apply' : 'Choose 1 option'}
                </p>
              </div>

              {/* Preview Options */}
              <div className="space-y-1.5 my-1">
                {options.map((opt, i) => (
                  <div
                    key={i}
                    className="w-full p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center gap-2.5 text-xs text-zinc-300"
                  >
                    <div
                      className={cn(
                        'w-4 h-4 border border-zinc-600 bg-slate-950/60 shrink-0',
                        allowMultiple ? 'rounded-md' : 'rounded-full'
                      )}
                    />
                    <span className="truncate">
                      {opt.trim() || `Option ${i + 1}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Preview Action Button */}
              <div className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-center shadow opacity-80">
                Submit Vote &rarr;
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Results & Analytics Viewer */}
      {activeSubTab === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of Surveys (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3 p-4 rounded-3xl bg-slate-950/80 border border-white/10">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-xs font-mono font-bold text-zinc-300 uppercase">
                All Published Surveys ({surveys.length})
              </h3>
              <button
                onClick={fetchSurveys}
                disabled={loadingSurveys}
                className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer font-mono"
              >
                {loadingSurveys ? 'Loading...' : 'Refresh List'}
              </button>
            </div>

            {surveys.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                No surveys created yet. Use the Create tab to publish your first survey!
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {surveys.map((item) => {
                  const isSelected = item.survey.id === selectedSurveyId;
                  const dateStr = new Date(item.survey.createdAt).toLocaleDateString();
                  return (
                    <button
                      key={item.survey.id}
                      onClick={() => setSelectedSurveyId(item.survey.id)}
                      className={cn(
                        'w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5',
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                          : 'bg-slate-900/60 hover:bg-slate-900 border-white/10'
                      )}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span>{dateStr}</span>
                        <span className="text-cyan-300 font-bold">
                          {item.totalVoters} {item.totalVoters === 1 ? 'voter' : 'voters'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-2">
                        {item.survey.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500">
                        <span>{item.survey.allowMultiple ? 'Multi-Choice' : 'Single Choice'}</span>
                        <span>•</span>
                        <span>{item.survey.options.length} options</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Survey Detailed Breakdown (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {!activeSurvey ? (
              <div className="p-12 text-center text-xs text-zinc-500 font-mono bg-slate-950/60 rounded-3xl border border-white/10">
                Select a survey on the left to review breakdown metrics.
              </div>
            ) : (
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-cyan-500/30 flex flex-col gap-5 shadow-xl">
                {/* Survey Title & Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 uppercase">
                      {activeSurvey.survey.allowMultiple ? 'Multiple Selection' : 'Single Choice'}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-white mt-1.5 leading-snug">
                      {activeSurvey.survey.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Created by u/{activeSurvey.survey.author} on{' '}
                      {new Date(activeSurvey.survey.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={handleRefreshResults}
                    disabled={refreshing}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 border border-white/20 text-zinc-300 hover:text-white cursor-pointer active:scale-95 transition-all font-mono flex items-center gap-1.5"
                  >
                    <svg className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Live'}</span>
                  </button>
                </div>

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-cyan-500/30 flex flex-col">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      Total Voters
                    </span>
                    <span className="text-xl font-black text-cyan-300 font-mono mt-0.5">
                      {activeSurvey.totalVoters.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900 border border-purple-500/30 flex flex-col">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      Total Votes Cast
                    </span>
                    <span className="text-xl font-black text-purple-300 font-mono mt-0.5">
                      {activeSurvey.results.reduce((acc, r) => acc + r.count, 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900 border border-emerald-500/30 flex flex-col col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      Top Leading Option
                    </span>
                    <span className="text-xs font-bold text-emerald-300 truncate mt-1">
                      {activeSurvey.results.slice().sort((a, b) => b.count - a.count)[0]?.text || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Option Breakdown: Quantity and Percentage */}
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Answer Option Quantities & Percentages
                  </h4>

                  <div className="space-y-2.5">
                    {activeSurvey.results.map((res, i) => (
                      <div
                        key={res.id}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 relative overflow-hidden flex flex-col gap-1.5"
                      >
                        {/* Gradient Fill Bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600/40 to-indigo-600/40 transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(1, res.percentage)}%` }}
                        />

                        {/* Foreground Content */}
                        <div className="relative z-10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 text-center text-xs font-mono text-zinc-500 shrink-0">
                              {i + 1}.
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {res.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 font-mono">
                            <span className="text-xs sm:text-sm font-black text-cyan-300">
                              {res.percentage}%
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 border border-white/10 text-xs text-zinc-300 font-bold">
                              {res.count} {res.count === 1 ? 'vote' : 'votes'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
