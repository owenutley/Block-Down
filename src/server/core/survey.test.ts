import { expect } from 'vitest';
import { test } from '../test';
import {
  createSurveyPost,
  getSurveyResults,
  submitSurveyVote,
  listAllSurveys,
} from './survey';

test('creates a survey post with valid options and retrieves it', async () => {
  const survey = await createSurveyPost({
    title: 'Favorite Feature?',
    options: [
      { id: 'opt_1', text: 'Daily Puzzles' },
      { id: 'opt_2', text: 'Slide Match' },
      { id: 'opt_3', text: 'Shop Skins' },
    ],
    allowMultiple: false,
  });

  expect(survey.id).toBeDefined();
  expect(survey.title).toBe('Favorite Feature?');
  expect(survey.options.length).toBe(3);
  expect(survey.allowMultiple).toBe(false);

  const results = await getSurveyResults(survey.id);
  expect(results).not.toBeNull();
  expect(results?.survey.id).toBe(survey.id);
  expect(results?.results.length).toBe(3);
  expect(results?.totalVoters).toBe(0);
});

test('enforces minimum and maximum options', async () => {
  await expect(
    createSurveyPost({
      title: 'Invalid',
      options: [{ text: 'Only One' }],
      allowMultiple: false,
    })
  ).rejects.toThrow('A survey must have at least 2 options');

  await expect(
    createSurveyPost({
      title: 'Too Many',
      options: [
        { text: '1' },
        { text: '2' },
        { text: '3' },
        { text: '4' },
        { text: '5' },
        { text: '6' },
        { text: '7' },
        { text: '8' },
        { text: '9' },
      ],
      allowMultiple: false,
    })
  ).rejects.toThrow('A survey cannot have more than 8 options');
});

test('submits vote and computes percentage results correctly', async () => {
  const survey = await createSurveyPost({
    title: 'Testing Percentages',
    options: [
      { id: 'opt_a', text: 'Option A' },
      { id: 'opt_b', text: 'Option B' },
    ],
    allowMultiple: false,
  });

  const updated = await submitSurveyVote(survey.id, ['opt_a']);
  expect(updated.totalVoters).toBe(1);
  expect(updated.hasVoted).toBe(true);
  expect(updated.userVotedOptionIds).toEqual(['opt_a']);

  const optA = updated.results.find((r) => r.id === 'opt_a');
  const optB = updated.results.find((r) => r.id === 'opt_b');
  expect(optA?.count).toBe(1);
  expect(optA?.percentage).toBe(100);
  expect(optB?.count).toBe(0);
  expect(optB?.percentage).toBe(0);
});

test('rejects duplicate voting by the same account', async () => {
  const survey = await createSurveyPost({
    title: 'One Vote Only',
    options: [
      { id: 'opt_1', text: 'Choice 1' },
      { id: 'opt_2', text: 'Choice 2' },
    ],
    allowMultiple: false,
  });

  await submitSurveyVote(survey.id, ['opt_1']);

  // Second vote must be rejected
  await expect(submitSurveyVote(survey.id, ['opt_2'])).rejects.toThrow(
    'You have already voted in this survey.'
  );
});

test('lists all historical surveys', async () => {
  const listBefore = await listAllSurveys();
  const initialCount = listBefore.length;

  await createSurveyPost({
    title: 'List Survey Test',
    options: [
      { id: 'o1', text: 'Yes' },
      { id: 'o2', text: 'No' },
    ],
    allowMultiple: true,
  });

  const listAfter = await listAllSurveys();
  expect(listAfter.length).toBe(initialCount + 1);
  expect(listAfter[0]?.survey.title).toBe('List Survey Test');
});
