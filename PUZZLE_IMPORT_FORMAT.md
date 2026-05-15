# Puzzle Import Format Guide

## Core Type Definition

```typescript
interface Puzzle {
  id: string;                    // Unique identifier (required)
  difficulty: string;            // 'tutorial' | 'easy' | 'medium' | 'hard'
  blocks: number[][];           // 2D array of block IDs
  target: number;               // Target score/moves (must be > 0)
  title: string;                // Puzzle name/title
  description?: string;         // Optional description
  createdAt: number;            // Unix timestamp (auto-generated)
}
```

## tRPC Mutation Format

**Endpoint**: `trpc.puzzle.create.mutate()`

```typescript
await trpc.puzzle.create.mutate({
  id: "puzzle-unique-id",
  difficulty: "easy",
  blocks: [[1, 2], [3, 4]],
  target: 50,
  title: "Puzzle Name",
  description: "Optional description"
})
```

## Field Definitions

| Field | Type | Required | Details |
|-------|------|----------|---------|
| `id` | string | ✅ Yes | Unique identifier. Format: `{difficulty}-{timestamp}` or custom name |
| `difficulty` | string | ✅ Yes | One of: `tutorial`, `easy`, `medium`, `hard` |
| `blocks` | number[][] | ✅ Yes | 2D grid array. Numbers represent block types (1-9) |
| `target` | number | ✅ Yes | Must be positive number (e.g., 50, 100, 200) |
| `title` | string | ✅ Yes | Display name of the puzzle |
| `description` | string | ❌ No | Optional description/hint |
| `createdAt` | number | ❌ Auto | Unix timestamp (generated automatically) |

## Grid Format Explanation

The `blocks` field is a 2D array where each number represents a block type:

```typescript
// 2x2 grid with 4 blocks of different types
blocks: [
  [1, 2],      // Row 0: Type 1 block, Type 2 block
  [3, 4]       // Row 1: Type 3 block, Type 4 block
]

// 3x3 grid
blocks: [
  [1, 1, 2],
  [1, 1, 2],
  [3, 3, 3]
]

// 4x4 grid (grid size will be detected from array dimensions)
blocks: [
  [1, 2, 3, 4],
  [1, 2, 3, 4],
  [1, 2, 3, 4],
  [1, 2, 3, 4]
]
```

### Block Type Numbers

- `1` = Red Circle
- `2` = Blue Square
- `3` = Yellow Triangle
- `4` = Purple Star
- `5` = Green Leaf
- `6` = Orange Block
- `7-9` = Reserved for future block types

## Complete Examples

### Tutorial Puzzle Example

```json
{
  "id": "tutorial-getting-started",
  "difficulty": "tutorial",
  "blocks": [
    [1, 1],
    [1, 1]
  ],
  "target": 10,
  "title": "Getting Started",
  "description": "Learn how to move blocks around"
}
```

### Easy Puzzle Example

```json
{
  "id": "easy-warm-up-1",
  "difficulty": "easy",
  "blocks": [
    [1, 2, 3],
    [1, 2, 3],
    [1, 2, 3]
  ],
  "target": 50,
  "title": "Warm Up Challenge",
  "description": "Clear all blocks of matching colors"
}
```

### Medium Puzzle Example

```json
{
  "id": "medium-brain-teaser",
  "difficulty": "medium",
  "blocks": [
    [1, 2, 1, 2],
    [2, 1, 2, 1],
    [1, 2, 1, 2],
    [2, 1, 2, 1]
  ],
  "target": 100,
  "title": "Brain Teaser",
  "description": "Strategic thinking required"
}
```

### Hard Puzzle Example

```json
{
  "id": "hard-master-challenge",
  "difficulty": "hard",
  "blocks": [
    [3, 3, 1, 1],
    [3, 3, 1, 1],
    [2, 2, 4, 4],
    [2, 2, 4, 4]
  ],
  "target": 200,
  "title": "Master Challenge",
  "description": "Only for experienced players"
}
```

## Creating Puzzles Programmatically

### TypeScript Example

```typescript
import { trpc } from './client/trpc';

// Create a single puzzle
const puzzle = await trpc.puzzle.create.mutate({
  id: "easy-intro-1",
  difficulty: "easy",
  blocks: [[1, 2], [3, 4]],
  target: 50,
  title: "Introduction",
  description: "Start here"
});

// Create multiple puzzles
const puzzles = [
  {
    id: "easy-level-1",
    difficulty: "easy",
    blocks: [[1, 1], [1, 1]],
    target: 40,
    title: "Level 1",
  },
  {
    id: "easy-level-2",
    difficulty: "easy",
    blocks: [[2, 2], [2, 2]],
    target: 50,
    title: "Level 2",
  }
];

for (const puzzle of puzzles) {
  await trpc.puzzle.create.mutate(puzzle);
}
```

### Via Puzzle Manager UI

1. Click "⚙️ Manage Puzzles" (bottom left of menu)
2. Select difficulty tab
3. Click "+ Import Puzzle"
4. Enter puzzle name
5. Click "Create"

**Note**: UI creates basic puzzles. For custom grid layouts, use the API directly.

## ID Format Convention

Recommended ID format for organization:

```
{difficulty}-{category}-{number}
```

Examples:
- `tutorial-basics-1`
- `easy-warm-up-1`
- `medium-challenge-5`
- `hard-expert-1`

Or with timestamp:
```
{difficulty}-{timestamp}
```

Examples:
- `easy-1715625600000`
- `medium-1715625700000`

## Validation Rules

All puzzle imports must follow these rules:

✅ **Valid**
```typescript
{
  id: "puzzle-001",
  difficulty: "easy",
  blocks: [[1, 2], [3, 4]],
  target: 50,
  title: "My Puzzle"
}
```

❌ **Invalid** - Missing required field
```typescript
{
  id: "puzzle-001",
  // Missing difficulty
  blocks: [[1, 2], [3, 4]],
  target: 50,
  title: "My Puzzle"
}
```

❌ **Invalid** - Wrong difficulty value
```typescript
{
  id: "puzzle-001",
  difficulty: "expert",  // Should be: tutorial, easy, medium, hard
  blocks: [[1, 2], [3, 4]],
  target: 50,
  title: "My Puzzle"
}
```

❌ **Invalid** - Non-positive target
```typescript
{
  id: "puzzle-001",
  difficulty: "easy",
  blocks: [[1, 2], [3, 4]],
  target: -50,  // Must be > 0
  title: "My Puzzle"
}
```

❌ **Invalid** - Empty blocks
```typescript
{
  id: "puzzle-001",
  difficulty: "easy",
  blocks: [],  // Must have at least 1x1 grid
  target: 50,
  title: "My Puzzle"
}
```

## Batch Import Template

For importing multiple puzzles at once:

```json
[
  {
    "id": "tutorial-1",
    "difficulty": "tutorial",
    "blocks": [[1, 1], [1, 1]],
    "target": 10,
    "title": "Tutorial 1"
  },
  {
    "id": "tutorial-2",
    "difficulty": "tutorial",
    "blocks": [[2, 2], [2, 2]],
    "target": 20,
    "title": "Tutorial 2"
  },
  {
    "id": "easy-1",
    "difficulty": "easy",
    "blocks": [[1, 2], [3, 4]],
    "target": 50,
    "title": "Easy 1"
  }
]
```

## Tips for Puzzle Design

### Grid Sizes
- **Small** (2x2, 3x3): Easier puzzles
- **Medium** (4x4, 5x5): Moderate difficulty
- **Large** (6x6+): Hard puzzles

### Block Distribution
- **Balanced**: Mix different block types
- **Clustered**: Group same types together
- **Scattered**: Spread block types apart

### Target Difficulty
- Tutorial: 10-30
- Easy: 30-80
- Medium: 80-150
- Hard: 150-300+

## JSON Schema Reference

```json
{
  "title": "Puzzle",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier"
    },
    "difficulty": {
      "type": "string",
      "enum": ["tutorial", "easy", "medium", "hard"]
    },
    "blocks": {
      "type": "array",
      "items": {
        "type": "array",
        "items": {
          "type": "number",
          "minimum": 1,
          "maximum": 9
        }
      },
      "minItems": 1
    },
    "target": {
      "type": "number",
      "exclusiveMinimum": 0
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string"
    }
  },
  "required": ["id", "difficulty", "blocks", "target", "title"]
}
```

---

## Quick Reference

```typescript
// Minimal puzzle (required fields only)
{
  id: "puzzle-1",
  difficulty: "easy",
  blocks: [[1, 2]],
  target: 50,
  title: "My Puzzle"
}

// Full puzzle (all fields)
{
  id: "puzzle-1",
  difficulty: "easy",
  blocks: [[1, 2], [3, 4]],
  target: 50,
  title: "My Puzzle",
  description: "A fun puzzle",
  createdAt: 1715625600000  // Optional (auto-generated)
}
```
