import { redis, reddit, context } from '@devvit/web/server';
import {
  SurveyPostData,
  SurveyResultsData,
  SurveyOptionResult,
  SurveyOption,
} from '../../shared/types';
import { getOrUploadShareImageUrl } from './post';

const KEYS = {
  SURVEY: (id: string) => `survey:${id}`,
  SURVEY_POST: (postId: string) => `survey_post:${postId}`,
  SURVEY_VOTES: (id: string) => `survey_votes:${id}`,
  SURVEY_USER_VOTE: (id: string, username: string) => `survey_user_vote:${id}:${username}`,
  ALL_SURVEYS: 'surveys:all_list',
};

/**
 * Creates a new survey post on Reddit and initializes its state in Redis.
 */
export const createSurveyPost = async (params: {
  title: string;
  description?: string;
  options: { id?: string; text: string }[];
  allowMultiple: boolean;
}): Promise<SurveyPostData> => {
  const cleanTitle = params.title.trim();
  if (!cleanTitle) {
    throw new Error('Survey question/title cannot be empty');
  }

  const cleanOptions: SurveyOption[] = params.options
    .map((opt, idx) => ({
      id: opt.id?.trim() || `opt_${idx + 1}_${Math.random().toString(36).substring(2, 6)}`,
      text: opt.text.trim(),
    }))
    .filter((opt) => opt.text.length > 0);

  if (cleanOptions.length < 2) {
    throw new Error('A survey must have at least 2 options');
  }
  if (cleanOptions.length > 8) {
    throw new Error('A survey cannot have more than 8 options');
  }

  const author = (await reddit.getCurrentUsername()) || 'moderator';
  const surveyId = `survey_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const shareImageUrl = await getOrUploadShareImageUrl();

  // 1. Submit Custom Post to Subreddit
  const post = await reddit.submitCustomPost({
    title: cleanTitle,
    styles: shareImageUrl ? { shareImageUrl } : undefined,
  });

  const surveyData: SurveyPostData = {
    id: surveyId,
    postId: post?.id,
    title: cleanTitle,
    description: params.description?.trim() || undefined,
    options: cleanOptions,
    allowMultiple: params.allowMultiple,
    createdAt: new Date().toISOString(),
    author,
    totalVoters: 0,
  };

  // 2. Persist in Redis
  await redis.set(KEYS.SURVEY(surveyId), JSON.stringify(surveyData));
  if (post?.id) {
    await redis.set(KEYS.SURVEY_POST(post.id), surveyId);
    try {
      await reddit.approve(post.id);
    } catch (e) {
      console.warn('Survey post approval notice:', e);
    }

    try {
      const modeText = params.allowMultiple
        ? 'Multiple selections allowed (select all that apply).'
        : 'Single choice question.';
      const optionsList = cleanOptions.map((o, i) => `${i + 1}. **${o.text}**`).join('\n');
      const comment = await reddit.submitComment({
        id: post.id,
        text: `📊 **COMMUNITY POLL: ${cleanTitle}**\n\n${modeText}\n\n${optionsList}\n\nVote on the interactive card above and join the discussion in the replies!`,
      });
      if (comment) {
        await comment.distinguish(true);
      }
    } catch (err) {
      console.error('Failed to submit stickied comment on survey post:', err);
    }
  }

  // 3. Initialize Vote Map
  const initialVotes: Record<string, number> = {};
  for (const opt of cleanOptions) {
    initialVotes[opt.id] = 0;
  }
  await redis.set(KEYS.SURVEY_VOTES(surveyId), JSON.stringify(initialVotes));

  // 4. Append to Global Survey List
  const existingListRaw = await redis.get(KEYS.ALL_SURVEYS);
  const existingList: string[] = existingListRaw ? JSON.parse(existingListRaw) : [];
  existingList.unshift(surveyId);
  await redis.set(KEYS.ALL_SURVEYS, JSON.stringify(existingList));

  return surveyData;
};

/**
 * Resolves survey data and calculates results for a given Reddit post.
 */
export const getSurveyForPost = async (targetPostId?: string): Promise<SurveyResultsData | null> => {
  const postId = targetPostId || context.postId;
  if (!postId) return null;

  const surveyId = await redis.get(KEYS.SURVEY_POST(postId));
  if (!surveyId) return null;

  return getSurveyResults(surveyId);
};

/**
 * Gets survey results including option vote counts and percentages.
 */
export const getSurveyResults = async (surveyId: string): Promise<SurveyResultsData | null> => {
  const surveyRaw = await redis.get(KEYS.SURVEY(surveyId));
  if (!surveyRaw) return null;

  const survey: SurveyPostData = JSON.parse(surveyRaw);
  const votesRaw = await redis.get(KEYS.SURVEY_VOTES(surveyId));
  const votes: Record<string, number> = votesRaw ? JSON.parse(votesRaw) : {};

  const username = await reddit.getCurrentUsername();
  let hasVoted = false;
  let userVotedOptionIds: string[] | undefined = undefined;

  if (username) {
    const userVoteRaw = await redis.get(KEYS.SURVEY_USER_VOTE(surveyId, username));
    if (userVoteRaw) {
      hasVoted = true;
      userVotedOptionIds = JSON.parse(userVoteRaw);
    }
  }

  // Calculate sum of votes to compute percentage
  let totalVoteWeight = 0;
  for (const opt of survey.options) {
    totalVoteWeight += votes[opt.id] || 0;
  }

  const results: SurveyOptionResult[] = survey.options.map((opt) => {
    const count = votes[opt.id] || 0;
    const percentage =
      totalVoteWeight > 0 ? Math.round((count / totalVoteWeight) * 1000) / 10 : 0;
    return {
      id: opt.id,
      text: opt.text,
      count,
      percentage,
    };
  });

  return {
    survey,
    results,
    totalVoters: survey.totalVoters || 0,
    userVotedOptionIds,
    hasVoted,
  };
};

/**
 * Submits a vote for a survey. Strictly enforces 1 vote per Reddit account.
 */
export const submitSurveyVote = async (
  surveyId: string,
  selectedOptionIds: string[]
): Promise<SurveyResultsData> => {
  const username = await reddit.getCurrentUsername();
  if (!username) {
    throw new Error('You must be logged in to Reddit to vote.');
  }

  const surveyRaw = await redis.get(KEYS.SURVEY(surveyId));
  if (!surveyRaw) {
    throw new Error('Survey not found.');
  }
  const survey: SurveyPostData = JSON.parse(surveyRaw);

  // Check if user already voted
  const existingVote = await redis.get(KEYS.SURVEY_USER_VOTE(surveyId, username));
  if (existingVote) {
    throw new Error('You have already voted in this survey.');
  }

  if (!selectedOptionIds || selectedOptionIds.length === 0) {
    throw new Error('Please select at least one option.');
  }

  if (!survey.allowMultiple && selectedOptionIds.length > 1) {
    throw new Error('Only a single choice is permitted for this survey.');
  }

  const validOptionIds = new Set(survey.options.map((o) => o.id));
  for (const optId of selectedOptionIds) {
    if (!validOptionIds.has(optId)) {
      throw new Error(`Invalid option selected: ${optId}`);
    }
  }

  // Record user's vote
  await redis.set(KEYS.SURVEY_USER_VOTE(surveyId, username), JSON.stringify(selectedOptionIds));

  // Increment option counters
  const votesRaw = await redis.get(KEYS.SURVEY_VOTES(surveyId));
  const votes: Record<string, number> = votesRaw ? JSON.parse(votesRaw) : {};
  for (const optId of selectedOptionIds) {
    votes[optId] = (votes[optId] || 0) + 1;
  }
  await redis.set(KEYS.SURVEY_VOTES(surveyId), JSON.stringify(votes));

  // Increment total voters on survey object
  survey.totalVoters = (survey.totalVoters || 0) + 1;
  await redis.set(KEYS.SURVEY(surveyId), JSON.stringify(survey));

  const updatedResults = await getSurveyResults(surveyId);
  if (!updatedResults) {
    throw new Error('Failed to retrieve updated survey results.');
  }

  return updatedResults;
};

/**
 * Lists all historical surveys for the Dev Panel manager.
 */
export const listAllSurveys = async (): Promise<SurveyResultsData[]> => {
  const listRaw = await redis.get(KEYS.ALL_SURVEYS);
  if (!listRaw) return [];

  const surveyIds: string[] = JSON.parse(listRaw);
  const items: SurveyResultsData[] = [];

  for (const id of surveyIds) {
    const data = await getSurveyResults(id);
    if (data) {
      items.push(data);
    }
  }

  return items;
};
