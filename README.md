# Block Down ✦

Block Down is a grid puzzle game, built specifically for Reddit using the Devvit web view platform. Players navigate a glowing cursor core to push neon block shapes onto matching target destinations. The catch? The blocks slide with ice-like inertia, moving all the way until they hit an obstacle or wall!

---

## 🎮 Puzzle Mechanics & Gameplay

* **The Core**: You control a white glowing circular core that moves grid-by-grid.
* **Blocks & Targets**: The level grid contains different colored block shapes (e.g. Blue Square, Yellow Triangle, Red Circle) and matching dashed target zones.
* **Ice-Slide Physics**: Pushing a block slides it in the direction of the push. It will not stop until it collides with a wall or another block.
* **Objective**: Position all neon blocks onto their matching target destinations in as few pushes as possible.
* **Helper Tools**: 
  * **Undo**: Rewind your last move.
  * **Undo 5**: Rewind the last 5 moves.
  * **Reset**: Clear the board and start the level over.
  * **Audio**: Toggle background melodies and sound effects on/off.

### Game Modes
1. **Daily Puzzle**: Compete against the Reddit community on a fresh puzzle released every 24 hours. Beat the global developer and player records for Moves, Pushes, and Time.
2. **Campaign**: Progress through series of increasingly complex levels. Solving a stage unlocks access to the next locked level.
3. **Past Puzzles**: Access and replay archived daily puzzles to hone your skills.
4. **Shop (Coming Soon)**: Spend the Neon Shards you earn from solving daily puzzles and campaign levels.

---

## 🛠️ Installer-Facing Instructions

Block Down is built using **React 19**, **Tailwind CSS 4**, and **Vite** on the frontend, with a **Node.js (Devvit serverless)**, **Hono**, and **tRPC** backend.

### Prerequisites
* **Node.js**: Version `22.2.0` or higher.
* **Reddit Account**: A Reddit developer account setup to test and upload apps.
* **Devvit CLI**: Installed globally or run via local project dependencies.

### Local Development Setup
1. Clone this repository to your machine.
2. Install the package dependencies:
   ```bash
   npm install
   ```
3. Log in to your Reddit account using the Devvit CLI:
   ```bash
   npm run login
   ```
4. Start the interactive playtest environment. This builds the client files and initiates the server simulation on Reddit:
   ```bash
   npm run dev
   ```
5. Click the playtest URL generated in your terminal (usually pointing to your custom testing subreddit) to load and play the game live.

### Subreddit Deployment & Release
1. **Type Check & Build**: Ensure all TypeScript files compile and are linted:
   ```bash
   npm run type-check
   ```
2. **Upload/Deploy**: Upload the package to Reddit's dev servers:
   ```bash
   npm run deploy
   ```
3. **Publish / Launch**: Submit the app version for Reddit's review team to publish:
   ```bash
   npm run launch
   ```

### Mod Operations
Subreddit moderators and creators can access the **Mod Panel** directly from the main menu overlay to import custom puzzle JSON configurations, add campaign levels, and configure active daily puzzles.

---

## 🔒 Privacy, Data Practices & Moderator Permissions

This application values transparency and security. Here is how user data, moderator permissions, and exceptions are handled:

### 1. Data Collection & Usage Practices
* **Transparency & UI Accessibility**: Players can review these data practices directly inside the game at any time by clicking the **"Privacy & Data Practices"** link at the bottom of the main menu.
* **What Data is Stored**: 
  * Reddit usernames of players who solve puzzles or save progress.
  * Level-specific game statistics (e.g., number of attempts, pushes, moves, time taken, date solved, and timestamp).
  * Neon Shards currency balance per username.
  * Subreddit subscription status (boolean flag indicating if the user has subscribed to the host subreddit).
* **How it is Used**:
  * **Leaderboards**: Displaying the top 10 best-scoring players for each puzzle.
  * **Game Progression**: Saving unlocked Campaign levels and completed Daily Puzzles history.
  * **In-Game Economy**: Awarding Neon Shards for puzzle completions and tracking shop balance.
  * **Subscription Rewards**: Rewarding players for subscribing to the subreddit where the app is installed.
* **Data Storage**: All data is stored locally in Reddit's internal serverless Redis database associated directly with the subreddit's app installation. No external servers, third-party databases, or trackers are utilized.

### 2. Moderator Permissions & Enforcement
* **Mod-Only Actions**: Administrative tasks—such as creating new puzzles, assigning daily puzzles, editing levels, resetting/factory resetting the app, adjusting shard balances, or modifying post mappings—are restricted.
* **Permissions Checked**: The application verifies that the calling user is a moderator of the current subreddit and has at least one of the following Reddit permissions:
  * `all` (Everything)
  * `config` (Manage Settings)
  * `posts` (Manage Posts & Comments)
* **API Validation**: Enforced both on the client-side UI and verified programmatically on the backend (Hono routes and tRPC endpoints) to prevent unauthorized API payloads.

### 3. Developer Access Exception
* **Exception Scope**: The developer account (`Fit-Worldliness-1588`) has access to the Mod Panel on any subreddit where the app is installed.
* **Use Case & Rationale**: This bypass is strictly used to facilitate initial setup, debug issues, check database consistency, and load default campaign levels.
* **Privacy Impact**: The developer does not collect or access private user data; all operations are conducted in accordance with Reddit’s developer guidelines.

### 4. Compromise Notification
* **Policy**: In the unlikely event that a data breach, unauthorized access, or compromise of this application occurs, the developers commit to immediately notifying Reddit and all affected users through appropriate channels.

---

## 📝 Changelog

### v0.0.1 (Current Build)
* **Features**:
  * Unified navigation with symmetrical floating **Menu** (top-left) and **Shard Count** (top-right) pill buttons across Campaign, Past Puzzles, and Shop screens.
  * Implemented progression lock states and layout wrappers for the **Campaign Level Select** screen.
  * Added **Past Puzzles** screen allowing players to access historic daily levels.
  * Added **ShopScreen** view template and corresponding main menu action button.
  * Optimized viewport responsiveness and fixed mobile alignment bugs.
* **Technical**:
  * Upgraded backend API bindings and type mappings for puzzle metadata storage.
  * Configured build pipelines to resolve type-check parameters cleanly.
