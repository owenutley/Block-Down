export interface ScoreHashInput {
  puzzleId: string;
  username: string;
  pushes: number;
  moves: number;
  solveTime: number;
  stars: number;
  blockOrderEmojis?: string;
}

export interface ParsedScoreComment {
  claimedCode: string | null;
  pushes: number;
  moves: number;
  solveTime: number;
  stars: number;
  blockOrderEmojis: string;
  extractedUsernames: string[];
}

/**
 * Generate standard BD-XXXX-XXXX verification code for a solution
 */
export function generateScoreHash(input: ScoreHashInput): string {
  const puzzleId = (input.puzzleId || 'p').trim().toLowerCase();
  const username = (input.username || 'anon').trim().toLowerCase();
  const pushes = input.pushes || 0;
  const moves = input.moves || 0;
  const solveTime = input.solveTime || 0;
  const stars = input.stars || 1;
  const blockOrder = (input.blockOrderEmojis || '').trim();

  const payload = `${puzzleId}:${username}:${pushes}:${moves}:${solveTime}:${stars}:${blockOrder}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `BD-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

/**
 * Robustly parse metrics and verification code from a score comment text
 */
export function parseScoreComment(text: string): ParsedScoreComment {
  const commentText = text || '';

  // 1. Verification code (e.g. BD-1234-5678)
  const codeMatch = commentText.match(/BD-[A-F0-9]{4}-[A-F0-9]{4}/i);
  const claimedCode = codeMatch ? codeMatch[0].toUpperCase() : null;

  // 2. Extracted usernames (e.g. u/PlayerOne or [u/PlayerOne])
  const userMatches = commentText.match(/\[?u\/([A-Za-z0-9_-]+)\]?/gi) || [];
  const extractedUsernames = userMatches
    .map((m) => m.replace(/^[\[\s]*u\//i, '').replace(/[\]\s'"].*$/, '').trim())
    .filter(Boolean);

  // 3. Pushes (handles "**Pushes**:", "Pushes:", "🚀 **Pushes**: **8** / 8 Par")
  const pushesMatch =
    commentText.match(/Pushes\*?:?\s*(?:\*\*)?(\d+)/i) ||
    commentText.match(/Pushes[^\d\n]*(\d+)/i);
  const pushes = pushesMatch ? parseInt(pushesMatch[1] || '0', 10) : 0;

  // 4. Moves (handles "**Moves**:", "Moves: 45 steps")
  const movesMatch =
    commentText.match(/Moves\*?:?\s*(?:\*\*)?(\d+)/i) ||
    commentText.match(/Moves[^\d\n]*(\d+)/i);
  const moves = movesMatch ? parseInt(movesMatch[1] || '0', 10) : 0;

  // 5. Solve Time (handles "Solve Time: 14s", "**Solve Time**: 1m 05s", etc.)
  const timeMinuteSecondMatch = commentText.match(/Solve Time[^\d\n]*(\d+)m\s*(\d+)s/i);
  const timeSecondMatch = commentText.match(/Solve Time[^\d\n]*(\d+)s/i);

  let solveTime = 0;
  if (timeMinuteSecondMatch && timeMinuteSecondMatch[1] !== undefined && timeMinuteSecondMatch[2] !== undefined) {
    solveTime = parseInt(timeMinuteSecondMatch[1], 10) * 60 + parseInt(timeMinuteSecondMatch[2], 10);
  } else if (timeSecondMatch && timeSecondMatch[1] !== undefined) {
    solveTime = parseInt(timeSecondMatch[1], 10);
  }

  // 6. Stars
  let stars = 1;
  if (commentText.includes('⭐⭐⭐')) stars = 3;
  else if (commentText.includes('⭐⭐')) stars = 2;
  else if (commentText.includes('⭐')) stars = 1;

  // 7. Block Order Emojis
  const spoilerMatch =
    commentText.match(/Block Order\*?:?\s*(?:\*\*)?(?:>!\s*)?([^\n!<]+)/i) ||
    commentText.match(/>!\s*(.*?)\s*!</);

  let blockOrderEmojis = '';
  if (spoilerMatch && spoilerMatch[1]) {
    blockOrderEmojis = spoilerMatch[1]
      .replace(/^>!/, '')
      .replace(/!<$/, '')
      .replace(/\*\*/g, '')
      .trim();
  }

  return {
    claimedCode,
    pushes,
    moves,
    solveTime,
    stars,
    blockOrderEmojis,
    extractedUsernames,
  };
}

export interface VerifyScoreOptions {
  text: string;
  commentAuthor?: string;
  mappedPuzzleId?: string | null;
  puzzleIdCandidates?: string[];
}

export interface VerifyScoreResult {
  isLegit: boolean;
  claimedCode: string | null;
  matchedPuzzleId?: string;
  matchedUsername?: string;
  expectedCode?: string;
  parsed: ParsedScoreComment;
}

/**
 * Verify whether a score comment is authentic and legitimate.
 * Tests candidate combinations of usernames and puzzle IDs against the claimed BD-XXXX-XXXX code.
 */
export function verifyScoreComment(options: VerifyScoreOptions): VerifyScoreResult {
  const parsed = parseScoreComment(options.text);

  if (!parsed.claimedCode || parsed.pushes <= 0) {
    return {
      isLegit: false,
      claimedCode: parsed.claimedCode,
      parsed,
    };
  }

  // Build candidate usernames
  const rawAuthor = (options.commentAuthor || '').trim();
  const cleanAuthor = rawAuthor.replace(/^u\//i, '').trim();

  const usernameCandidates = Array.from(
    new Set([
      cleanAuthor,
      rawAuthor,
      ...parsed.extractedUsernames,
      'anon',
    ])
  ).filter((u): u is string => Boolean(u && u.trim()));

  // Build candidate puzzle IDs
  const puzzleIdCandidates = Array.from(
    new Set([
      options.mappedPuzzleId || '',
      ...(options.puzzleIdCandidates || []),
      'p',
    ])
  ).filter((p): p is string => Boolean(p && p.trim()));

  for (const pid of puzzleIdCandidates) {
    for (const uname of usernameCandidates) {
      const expectedCode = generateScoreHash({
        puzzleId: pid,
        username: uname,
        pushes: parsed.pushes,
        moves: parsed.moves,
        solveTime: parsed.solveTime,
        stars: parsed.stars,
        blockOrderEmojis: parsed.blockOrderEmojis,
      });

      if (parsed.claimedCode === expectedCode) {
        return {
          isLegit: true,
          claimedCode: parsed.claimedCode,
          matchedPuzzleId: pid,
          matchedUsername: uname,
          expectedCode,
          parsed,
        };
      }
    }
  }

  return {
    isLegit: false,
    claimedCode: parsed.claimedCode,
    parsed,
  };
}
