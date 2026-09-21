# Block Down — Theme & Character Creation Guide

This document is the definitive architectural manual and design specification for creating new **Board Themes**, **Block Shapes**, and **Player Character Bot Skins** in Block Down. Follow these guidelines to ensure that all future themes maintain 100% visual consistency, tactile depth, and structural fidelity with the established game aesthetics.

---

## 1. Architecture & File Map

When adding or modifying a theme, the following files work together in the system:

| File Path | Purpose | What to Add/Update |
| :--- | :--- | :--- |
| [`src/shared/themes.ts`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/shared/themes.ts) | Shared Theme & Character Models | Register `ThemeId`, add theme to `THEMES`, add 6 shape IDs to `ALL_SHAPE_IDS`, configure `DEFAULT_THEME_CONFIGS`, add `GameCharacter` to `CHARACTERS`, update `getBaseThemeId` and `getThemeBgClass`. |
| [`src/client/components/PuzzleShape.tsx`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/components/PuzzleShape.tsx) | Vector SVG Shape Renderer | Implement the 6 vector SVG shapes using the **3-Tier Lighting Standard**. |
| [`src/client/components/HexagonBlock.tsx`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/components/HexagonBlock.tsx) | 3D Pushable Block Squircle Component | Register the theme's ambient dark background fill in `darkBgFill`. |
| [`src/client/components/ThemeBoardRenderer.tsx`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/components/ThemeBoardRenderer.tsx) | Board, Wall, Orb, and Avatar Rendering | Add board styling to `THEME_STYLES`, wall class to `getWallStyle`, color overrides to `THEME_COLOR_PALETTES`, preview orb in `ThemeOrb`, and custom bot avatar in `CharacterOrb`. |
| [`src/client/index.css`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/index.css) | Ambient Background Classes | Add the CSS background class `.bg-theme-<id>` with gradients and subtle ambient lighting. |
| [`README.md`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/README.md) | Project Documentation | Update the theme and character tables with the new theme name, description, cost, and shapes. |

---

## 2. Standard 1: Realistic 3D Block Shapes (`PuzzleShape.tsx`)

Pushable blocks in Block Down must feel **tactile, dimensional, and grounded**. Flat 2D silhouettes or simple wireframe outlines look like flat stickers and break visual immersion. 

### The 3-Tier Lighting Model

Every shape in [`PuzzleShape.tsx`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/components/PuzzleShape.tsx) must be composed using three distinct layers:

```
+-----------------------------------------------------------+
| 1. Base Silhouette / Color Identity  (`currentColor`)     | -> Preserves puzzle gameplay color (Red, Blue, Green, etc.)
| 2. Lit Facets & Specular Highlights (`accentColor`)       | -> Crisp white (#ffffff) sunlit faces, razor bevels, glints
| 3. Shadow Facets & Cavity Depth      (`accentDarkColor`)   | -> Translucent dark (#000000 with 0.2-0.5 opacity) shadows
+-----------------------------------------------------------+
```

#### Tier 1: Base Silhouette & Color Identity (`currentColor`)
* The primary mass and silhouette of the object is drawn with `fill="currentColor"` or `stroke="currentColor"`.
* This connects directly to the block's assigned puzzle color (e.g. `red`, `blue`, `green`, `yellow`) inherited from `HexagonBlock`.
* Never hardcode the base color as a static hex code.

#### Tier 2: Lit Facets & Specular Highlights (`accentColor`)
* **Dynamic Palette**: In `PuzzleShape`, `accentColor` evaluates to `#ffffff` (crisp white) when unsolved, and dynamically transitions to `#cbd5e1` (soft slate grey/white) when solved.
* **Sunlit Facets**: Use `fill={accentColor} fillOpacity="0.4"` to `0.85"` on faces oriented toward the top-left light source (e.g. `cube` top face, `pyramid` left slope).
* **Razor Bevels & Blade Edges**: Use `stroke={accentColor} strokeWidth="1"` to `1.5` on sharp cutting edges (e.g. `pirate_cutlass`, `wrench`, `scissors`, `lightning_bolt`).
* **Glass & Metallic Glints**: Use curved arcs or circular catchlights in `accentColor` (e.g. `pocket_watch` glass glare arc, `lightbulb` reflection crescent, `cyclops_eye` specular catchlights).

#### Tier 3: Ambient Shadows & Cavity Depth (`accentDarkColor`)
* **Dynamic Palette**: In `PuzzleShape`, `accentDarkColor` evaluates to `#000000` (pure dark) when unsolved, and dynamically transitions to `#94a3b8` (medium slate grey) when solved.
* **Undercuts & Shaded Slopes**: Use `fill={accentDarkColor} fillOpacity="0.3"` to `0.55"` on faces oriented away from the light source (e.g. `cube` right face, `pyramid` right slope, `compass` South needle).
* **Deep Recesses & Cavities**: Use solid or high-opacity `accentDarkColor` for interior cavities (e.g. `pirate_skull` eye sockets, `tombstone` recess, `wrench` handle channel, `cannon` bore shadow).

### Shape Anatomy Examples

#### Example A: Faceted / Crystalline Object (`cube`, `neon_triangle`, `pyramid`)
```tsx
// 3D Chrome Penrose / Impossible Triangle
<polygon points="12,2 22,19.5 2,19.5" />                                                        {/* Base silhouette */}
<polygon points="12,2 14.5,6.5 6.5,19.5 2,19.5" fill={accentColor} opacity="0.9" />              {/* Lit facet */}
<polygon points="2,19.5 22,19.5 19.5,15.5 8.5,15.5" fill={accentDarkColor} fillOpacity="0.5" />  {/* Shadow facet */}
<polygon points="12,7.5 17.5,16.5 6.5,16.5" fill={accentDarkColor} fillOpacity="0.65" />       {/* Center cutout shadow */}
<polygon points="12,2 22,19.5 2,19.5" fill="none" stroke={accentColor} strokeWidth="1.2" />     {/* Razor edge bevel */}
<circle cx="12" cy="2.5" r="1" fill="#ffffff" />                                                {/* Corner glint */}
```

#### Example B: Cylindrical / Curved Metallic Object (`cannon`, `valve_wheel`, `pocket_watch`)
```tsx
// Cylindrical Iron Cannon
<path d="M3.8 14.5l12.5-7.5 2.5 1.5-12.5 7.5z" />                                               {/* Iron barrel base */}
<path d="M4.5 13.8l12-7.2" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" />      {/* Specular streak */}
<line x1="11" y1="10" x2="12.5" y2="12.5" stroke={accentDarkColor} strokeWidth="1.2" />         {/* Underbelly shadow */}
<path d="M5 19.5l4.5-3.5 5.5 3.5z" fill={accentDarkColor} fillOpacity="0.5" />                  {/* Carriage shadow */}
<circle cx="9" cy="16.2" r="1.3" fill={accentColor} />                                          {/* Spindle pin highlight */}
```

### Critical Rules for Block Shapes
1. **Always use standard `viewBox="0 0 24 24"`** with `className={cn}`.
2. **Never hardcode static bright hex colors** (like `#ffffff` or `#000000`) for elements that change appearance on target match; always route through `accentColor` and `accentDarkColor`.
3. **Include both light and dark accents**: Every shape should have at least one `accentColor` highlight AND at least one `accentDarkColor` shadow element to establish true 3D contrast.

---

## 3. Standard 2: Player Character Bot Avatars (`CharacterOrb`)

Every theme is paired with an iconic **bot character** in [`ThemeBoardRenderer.tsx`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/components/ThemeBoardRenderer.tsx) (`CharacterOrb`).

### The Blueprint of a Block Down Bot

All character avatars follow an isometric/front-facing robot bust silhouette:

```
        [ Thematic Horns / Antennas / Crests ]
             \            |            /
        +-----------------------------------+
        |       Outer Glow Halo & Ring      |
        |   +---------------------------+   |
        |   |    Thematic Helmet/Head   |   |
        |   |   +-------------------+   |   |
        |   |   |  Visor / Optics   |   |   |
        |   |   +-------------------+   |   |
        |   |   | Mouth / Vent / Jaw|   |   |
        |   +---+-------------------+---+   |
        +-----------------------------------+
```

### Core Anatomical Elements
1. **Outer Ambient Halo & Container**:
   - Outer wrapper with `rounded-2xl` and a themed gradient border (e.g. `bg-gradient-to-br from-amber-400 via-orange-600 to-amber-950`).
   - Frosted inner backdrop (`bg-zinc-950/70 backdrop-blur-sm`).
2. **Helmet / Head Structure**:
   - Themed structural material (e.g. Corinthian marble helmet for Olympus, brass automaton head for Steampunk, tricorne pirate captain hat for Pirate, aerodynamic racer helmet for Synthwave).
3. **Visor / Optic Sensors**:
   - The focal point of the face: a glowing cyber visor or distinct optical lenses (e.g. lightning storm eyes, gauge dials, spyglass monocle, reflective mirrored aviator shades).
4. **Thematic Ear Guards / Horns / Antennas**:
   - Silhouette-defining side accessories (e.g. spinning brass cogs, curved magma horns, cassette tape spools, gold hoop earring, winged laurel leaves).
5. **Mouth Grille / Exhaust / Chin Plate**:
   - Speaker grille, steam exhaust pipe, beard plate, or jaw bevel.

---

## 4. Standard 3: Theme Preview Orbs (`ThemeOrb`)

The **Theme Preview Orb** in [`ThemeBoardRenderer.tsx`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/components/ThemeBoardRenderer.tsx) (`ThemeOrb`) is the compact visual token shown in the Cosmetic Shop:

* **Outer Container**: `rounded-2xl bg-gradient-to-br from-[primary] via-[secondary] to-[dark] p-0.5 border border-[primary]/50 shadow-[0_0_10px_rgba(...)]`.
* **Inner Frosted Core**: `w-3/4 h-3/4 rounded-xl bg-[theme-dark]/70 backdrop-blur-sm border border-[primary]/40 flex items-center justify-center`.
* **Center Vector Emblem**: Clean 24x24 SVG emblem representing the theme (e.g. brass cog for Steampunk, thunderbolt for Olympus, pirate skull for Pirate, palm sunset for Synthwave).

---

## 5. Standard 4: Board Atmosphere & Styling

### 1. Board Background (`index.css`)
Define `.bg-theme-<id>` in [`src/client/index.css`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/index.css):
* Use deep radial gradients with dark center tones (`#081315`, `#1c140c`, `#090d16`, `#0e061a`).
* Include subtle ambient color glows (15-25% opacity) to avoid muddy darkness.
* Maintain high contrast against walls and puzzle blocks.

### 2. Panel, Cell, & Wall Styles (`THEME_STYLES` & `getWallStyle`)
* **`panelClass`**: Frosted dark glass container with border color matching theme accents (`border-[#d97706]/60`, `border-[#fbbf24]/60`, etc.).
* **`cellClass`**: Translucent grid cells with subtle border dividers.
* **`wallClass` & `getWallStyle`**: Dark obstacle blocks with built-in 3D lighting ramps (top-left white light ramp, bottom-right dark shadow ramp).

### 3. Pushable Block Base (`HexagonBlock.tsx` -> `darkBgFill`)
* Register the theme's ambient dark background hex code in `darkBgFill` in [`HexagonBlock.tsx`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/components/HexagonBlock.tsx).
* This ensures unsolved blocks blend seamlessly with the board's dark ambiance rather than showing generic black edges.

### 4. Custom Palette Overrides (`THEME_COLOR_PALETTES`)
* Register theme-specific overrides for the 6 color slots (`red`, `blue`, `yellow`, `purple`, `green`, `orange`) in `THEME_COLOR_PALETTES` in [`ThemeBoardRenderer.tsx`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/src/client/components/ThemeBoardRenderer.tsx).
* Tailor the hex codes and Tailwind text/border/glow classes to match the theme (e.g. Tyrian royal purple and divine gold for Olympus; boiler copper and brass for Steampunk; hot laser pink and electric cyan for Synthwave).

---

## 6. Step-by-Step 9-Point Checklist for Adding a New Theme

When adding any future theme, complete this checklist in order:

- [ ] **Step 1: Register Theme & Character in `src/shared/themes.ts`**
  - Add theme ID to `BaseThemeId` union type.
  - Add 6 new shape IDs to `ALL_SHAPE_IDS`.
  - Add theme definition to `THEMES` (id, name, cost, description, bgGradient, panelClass, cellClass, wallClass).
  - Map 6 puzzle block types to shape/color pairs in `DEFAULT_THEME_CONFIGS`.
  - Add bot character definition to `CHARACTERS`.
  - Update `getBaseThemeId` and `getThemeBgClass` helper switches.

- [ ] **Step 2: Implement 6 Vector SVG Shapes in `src/client/components/PuzzleShape.tsx`**
  - Use `viewBox="0 0 24 24"` and `className={cn} fill="currentColor"`.
  - Apply the **3-Tier Lighting Standard**: base `currentColor` + white highlights `accentColor` + dark grey shadows `accentDarkColor`.

- [ ] **Step 3: Update `darkBgFill` in `src/client/components/HexagonBlock.tsx`**
  - Add `baseThemeId === '<id>' ? '#<ambient-hex>' : ...` to `darkBgFill`.

- [ ] **Step 4: Register Board Styles in `src/client/components/ThemeBoardRenderer.tsx`**
  - Add entry to `THEME_STYLES` (`bgClass`, `panelClass`, `cellClass`, `wallClass`).
  - Add case to `getWallStyle` function.

- [ ] **Step 5: Register Color Overrides in `THEME_COLOR_PALETTES`**
  - Provide customized `text`, `border`, `shadow`, `bg`, `destBorder`, `colorHex`, `blockFill`, and `solidFill` for each of the 6 color slots.

- [ ] **Step 6: Implement Preview Orb in `ThemeOrb`**
  - Add `case '<id>':` with themed gradient border, frosted glass, and vector emblem.

- [ ] **Step 7: Implement Character Avatar in `CharacterOrb`**
  - Add `case '<id>':` with custom bot helmet, glowing visor, and thematic antennas/accessories.

- [ ] **Step 8: Define Background Gradient in `src/client/index.css`**
  - Add `.bg-theme-<id>` class with radial lighting and theme-appropriate color tones.

- [ ] **Step 9: Verification & Documentation**
  - Run `npm run type-check` (verify 0 TypeScript compilation errors).
  - Run `npm run lint` (verify clean lint checks).
  - Update [`README.md`](file:///c:/Users/owenu/Documents/game-dev/devvit-games/block-down/README.md) tables.
  - Test in Cosmetic Shop preview (`ShopScreen`) to inspect blocks, orbs, and bot characters.
