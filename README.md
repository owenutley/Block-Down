# Block Down

Block Down is an ice-sliding grid puzzle game built for Reddit using Devvit Web. Players navigate a robotic character to push colored blocks onto matching target slots. Blocks slide until they hit a wall, obstacle, portal, or another block.

---

## Core Gameplay

* **Movement**: Move your character one square at a time across the grid.
* **Ice-Slide Physics**: Pushing a block slides it continuously until it collides with a wall, obstacle, or another block.
* **Portals**: Colored portal pairs teleport sliding blocks across the board and redirect their slide direction based on portal orientation.
* **Objective**: Place every block onto its matching target destination using as few pushes and moves as possible.
* **Helpers**:
  * **Undo**: Step back your last move.
  * **Reset**: Restart the current puzzle from the beginning.
  * **Audio**: Toggle background music and sound effects.

---

## Game Modes

### 1. Daily Puzzle
A new competitive puzzle is released every day. Compete on global leaderboards for fewest pushes, fewest moves, and fastest solve time. Completing the daily puzzle awards Neon Shards and advances your play streak.

### 2. Daily Warm-Up
A lighter companion puzzle alongside each daily puzzle, designed for quick sessions:
* **Monday and Tuesday**: Tier 0 (2 blocks, 3 minimum pushes)
* **Wednesday and Thursday**: Tier 1 (3 blocks, 5 minimum pushes)
* **Friday, Saturday, and Sunday**: Tier 2 (3 blocks, 7 minimum pushes)

### 3. Campaign (Adventure)
Progress through handcrafted level sets divided into Easy, Medium, and Hard stages. Completing campaign stages awards shards and unlocks exclusive shop cosmetics.

### 4. Past Puzzles Archive
Replay previously published daily puzzles to practice and earn bonus shards.

### 5. Puzzle Maker & Community Challenges
Design custom 9x9 puzzles using the in-game editor:
* Place custom walls, blocks, targets, and portals.
* Solve and verify your level to prove it can be completed.
* Publish directly to Reddit as a post with the Player Challenge flair, with your username credited as author.

### 6. Weekly Creator Contest (Master Architect)
A weekly contest for community level creators:
* **Creation Phase (first 3 days)**: Submit your custom puzzle.
* **Solving Phase (remaining 4 days)**: Players solve entries. Puzzles are ranked dynamically by difficulty based on solve rates, attempts, and move efficiency.
* **Prizes**: Top 3 creators earn Neon Shards and creator trophies for their profile showcase.

---

## Player Progression & Features

* **Play Streaks & Reddit User Flair**: Maintain your daily streak to earn user flair updates on the subreddit (for example, `7 Day Streak`).
* **Streak Freeze Protection**: Up to 3 streak freezes are automatically applied during any 30-day window if you miss a day.
* **Player Profile**: Tracks completed puzzles, total pushes, moves, stars earned, weekly contest trophies, and an interactive 60-day activity calendar.
* **Cosmetic Shop**: Spend earned Neon Shards on:
  * **Board Themes**: Visual board styles including Neon Cyber, Winter Wonderland, Retro Arcade, Cyber Synthwave, and more.
  * **Character Skins**: Distinct avatar looks for your robotic character.
  * **Block Trails**: Visual slide trails left behind by moving blocks.

---

## Developer & Moderator Panel

Subreddit moderators can open the Dev Panel from the main menu:
* **Puzzles**: Create, test, edit, delete, and import/export puzzle configurations.
* **Themes**: Customize block colors and target shapes for all game themes.
* **Analytics**: View real-time daily active users (DAU), total solves, and most-used game features.

---

## Tech Stack

* **Frontend**: React 19, Tailwind CSS 4, Vite (Devvit Web iframe)
* **Backend**: Node.js 22 serverless environment, Hono, tRPC
* **Storage**: Redis via `@devvit/web/server`
* **Puzzle Generator**: Procedural reverse-search solver with stage step-downs and static fail-safes

Documentation:
* [PUZZLE_GENERATOR.md](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/PUZZLE_GENERATOR.md): Explains the reverse-push generator, reachability algorithms, and solver rules.
* [THEME_CREATION_GUIDE.md](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/THEME_CREATION_GUIDE.md): Guidelines for creating custom themes, block shapes, and characters.

---

## Development Setup

### Prerequisites
* Node.js v22 or higher
* Reddit account with developer access to a test subreddit
* Devvit CLI installed

### Running Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Log in with Devvit:
   ```bash
   npm run login
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the playtest link output in your terminal.

### Checks & Publishing
* Run type checks: `npm run type-check`
* Run linter: `npm run lint`
* Deploy to Reddit: `npm run deploy`
* Launch for review: `npm run launch`

---

## Privacy & Data Practices

* **Storage**: All player data (scores, streaks, custom levels, shop inventory) is stored inside Reddit's serverless Redis database.
* **Third Parties**: No external analytics, tracking pixels, or third-party servers are used.
* **Permissions**:
  * Score sharing (`SUBMIT_COMMENT`) is triggered only when a player clicks the share button.
  * Level publishing (`SUBMIT_POST`) prompts for user authorization before creating a Reddit post.
* **Moderator Security**: Administrative endpoints and puzzle solutions are protected on the server using `moderatorProcedure`.
