# Block Down ✦

Block Down is a grid puzzle game built specifically for Reddit using the Devvit web view platform. Players navigate a glowing cursor core to push neon block shapes onto matching target destinations. The catch? The blocks slide with ice-like inertia, moving all the way until they hit an obstacle or wall!

---

## 🎮 Puzzle Mechanics & Gameplay

* **The Core**: You control a white glowing circular core (default "Cyber Sphere" or customized character avatars) that moves grid-by-grid.
* **Blocks & Targets**: The level grid contains different colored block shapes and matching dashed target zones.
* **Ice-Slide Physics**: Pushing a block slides it in the direction of the push. It will not stop until it collides with a wall or another block.
* **Objective**: Position all neon blocks onto their matching target destinations in as few pushes as possible.
* **Helper Tools**: 
  * **Undo**: Rewind your last move.
  * **Reset**: Clear the board and start the level over.
  * **Audio**: Toggle background melodies and sound effects (sliding, collision, target matching, and win sequences) on/off.

### Game Modes & Rewards
1. **Daily Puzzle**: Compete against the Reddit community on a fresh daily level. Beat global and developer records for Moves, Pushes, and Time. Completing a daily puzzle awards **100 Neon Shards**.
2. **Campaign**: Select and progress through a series of increasingly complex levels categorized by difficulty (**Easy**, **Medium**, and **Hard**). Solving a level unlocks the next stage and awards **10 Neon Shards**.
3. **Past Puzzles**: Access and replay archived daily puzzles from previous days. Solving a past puzzle awards **10 Neon Shards**.
4. **Cosmetic Shop**: Spend your earned Neon Shards on custom board themes and character skins.

---

## 🛍️ Cosmetic Shop & Customization

The **Cosmetic Shop** (implemented in [ShopScreen.tsx](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/screens/ShopScreen.tsx)) is fully integrated, allowing players to purchase and equip different visual styles:

### 1. Board Themes
Themes modify the entire aesthetic of the game, altering the background gradient, grid cells, wall tiles, block colors, and target shapes:
* **Neon Cyber** (Default - `0` ✦): The classic pulsing neon cyber grid.
* **Winter Wonderland** (`1000` ✦): Snowy, ice-cold blue and white cells with snowflake, crystal, and snowman shapes.
* **Enchanted Forest** (`1500` ✦): Deep woodland greens and stones with leafy acorns, mushrooms, and pinecones.
* **Candy Land** (`2000` ✦): Pink and violet pastels with sweet lollipop, cupcake, and donut patterns.
* **Deep Space** (`2500` ✦): Cosmical indigo space panels with rockets, aliens, and planet silhouettes.
* **Abyssal Ocean** (`3000` ✦): Underwater blue gradient cells featuring anchors, waves, and submarine patterns.
* **Retro Arcade** (`3500` ✦): 8-bit classic arcade grid styling with ghosts, joysticks, and crowns.
* **Desert Oasis** (`4000` ✦): Sandy amber and emerald sands featuring pyramids, camels, and cacti.
* **Spooky Halloween** (`4500` ✦): Eerie purple and orange chambers with jack-o'-lanterns, skulls, and bats.
* **Volcanic Magma** (`5000` ✦): Fiery crimson magma layers featuring volcanoes, obsidian walls, and lava chests.

### 2. Player Characters
Players can equip custom avatars/cores:
* **Cyber Sphere** (Default - `0` ✦): Rotating rings surrounding a cyber sphere.
* **Snowman** (`1000` ✦): Cute carrot-nosed snowman core.
* **Acorn Sprite** (`1500` ✦): Little wooden-capped acorn helper.
* **Candy Lollipop** (`2000` ✦): Swirling pink candy core.
* **Astronaut Helmet** (`2500` ✦): Visored space helmet core.
* **Yellow Submarine** (`3000` ✦): Underwater propeller sub core.
* **Retro Invader** (`3500` ✦): Pixelated purple space sprite.
* **Cactus Buddy** (`4000` ✦): Flower-topped green desert cactus.
* **Jack-o'-Lantern** (`4500` ✦): Glowing orange Halloween pumpkin.
* **Magma Orb** (`5000` ✦): Obsidian-shelled cracked magma core.

---

## 🛠️ Tech Stack & Architecture

Block Down follows a strict decoupled frontend-backend architecture integrated with Devvit web views:

* **Frontend**: React 19, Tailwind CSS 4, and Vite.
  * [splash.html](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/splash.html) / [splash.tsx](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/splash.tsx): The inline feed view. Features an automated gameplay preview (demos player moves on load), displays player shard counts, community completion statistics, and handles navigation to prior daily puzzles.
  * [game.html](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/game.html) / [game.tsx](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/game.tsx): The expanded gameplay interface.
* **Backend**: Node.js v22 serverless environment, Hono, and tRPC.
  * [index.ts](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/server/index.ts): Main serverless Hono application router.
  * [trpc.ts](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/server/trpc.ts): Handles client-backend communication, providing end-to-end type safety for operations including score submissions, currency acquisition, shop inventories, and dev configurations.
* **Testing**: Vitest runner.

---

## ⚙️ Local Development & Deployment

### Prerequisites
* **Node.js**: Version `22.2.0` or higher.
* **Reddit Account**: A Reddit developer account with test subreddit access.
* **Devvit CLI**: Standard Reddit Devvit SDK installed.

### Setup Instructions
1. Install project dependencies:
   ```bash
   npm install
   ```
2. Log in to your Reddit account using the Devvit CLI:
   ```bash
   npm run login
   ```
3. Start the dev server. This compiles assets and runs a live simulation of the game in your local browser and on Reddit:
   ```bash
   npm run dev
   ```
4. Access the playtest URL generated in your terminal to test block-sliding gameplay.

> [!TIP]
> Use `npm run lint` and `npm run type-check` before deployment to ensure formatting and types are clean.

### Publishing to Reddit
1. Upload package to Reddit's dev server:
   ```bash
   npm run deploy
   ```
2. Launch/Publish the app version for Reddit's review:
   ```bash
   npm run launch
   ```

---

## 🔧 Developer & Moderator Panel

Subreddit moderators and creators can access the **Dev Panel** (implemented in [dev.tsx](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/dev.tsx)) by clicking the "Dev Panel" button on the main menu. It contains three admin tabs:

1. **Puzzles Tab**:
   * **Visual Grid Editor**: Modify puzzle size and draw walls, players, blocks, and target slots interactively.
   * **JSON Editor**: Export and import raw puzzle configs directly.
   * **Playtest & Record**: Playtest the custom level and record a path of moves. Recorded paths are used to run automated previews on the Reddit post feed card.
   * **Manage Puzzles**: Delete, edit, clone, or set puzzles active.
2. **Themes Tab**:
   * **Theme Customizer Panel**: Edit the shape and color assignments for all 6 target block types (e.g. `red-heart`, `blue-diamond`, `yellow-crescent`, `purple-circle`, `green-cross`, `orange-square`) for any theme, saving custom visual overrides to Redis.
3. **Devs Tab**:
   * **Developer Access List**: Authorize additional Reddit usernames as developers, giving them access to the Dev Panel.

---

## 🔒 Privacy, Data Practices & Moderator Permissions

### 1. Data Collection & Usage Practices
* **Transparency**: Players can review data practices directly inside the game by clicking the **"Privacy & Data Practices"** link at the bottom of the main menu.
* **What Data is Stored**: 
  * Reddit usernames of players who solve puzzles or save progress.
  * Level-specific game statistics (e.g., number of attempts, pushes, moves, time taken, date solved, and timestamp).
  * Neon Shards currency balance per username.
  * Purchased theme inventories and character inventories.
  * Subreddit subscription status (boolean flag indicating if the user has subscribed to the host subreddit).
* **Usage**:
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

### 3. Compromise Notification
* **Policy**: In the unlikely event that a data breach, unauthorized access, or compromise of this application occurs, the developers commit to immediately notifying Reddit and all affected users through appropriate channels.

---

## 📝 Changelog

### v0.0.1 (Current Build)
* **Features**:
  * Unified navigation with symmetrical floating **Menu** (top-left) and **Shard Count** (top-right) pill buttons across Campaign, Past Puzzles, and Shop screens.
  * Implemented progression lock states and layout wrappers for the **Campaign Level Select** screen.
  * Added **Past Puzzles** screen allowing players to access historic daily levels.
  * Integrated **Cosmetic Shop** with separate tabs for **Themes** and **Characters**, allowing Neon Shards to unlock and equip custom layouts and avatars.
  * Configured **Theme Customizer Panel** in Dev Panel for editing target cell configurations per theme.
  * Optimized viewport responsiveness and fixed mobile alignment bugs.
* **Technical**:
  * Upgraded backend API bindings and type mappings for puzzle metadata storage.
  * Configured build pipelines to resolve type-check parameters cleanly.
