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

### Admin Operations
Subreddit moderators and creators can access the **Admin Panel** directly from the main menu overlay to import custom puzzle JSON configurations, add campaign levels, and configure active daily puzzles.

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
