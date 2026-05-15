# Puzzle Manager Usage Guide

## Quick Start

### Step 1: Access the Puzzle Manager
![Menu with Puzzle Manager Button]
- On the main menu screen, look for the **"⚙️ Manage Puzzles"** button in the **bottom left corner**
- Click it to open the Puzzle Manager modal

### Step 2: Navigate Difficulty Levels
```
┌─────────────────────────────────────┐
│ Tutorial │ Easy │ Medium │ Hard     │  <- Click tabs to switch
└─────────────────────────────────────┘
```
- Use the tabs at the top to select which difficulty level you want to manage
- The puzzle list below will update automatically

### Step 3: Import a New Puzzle

**Option A: Quick Import**
```
Click "+ Import Puzzle" button
    ↓
Enter puzzle name (e.g., "Training Level 1")
    ↓
Click "Create"
    ↓
Puzzle appears in the list
```

**Example Names:**
- Easy: "Introduction", "Warm Up", "Starter Pack"
- Medium: "Challenge 1", "Brain Teaser", "Puzzle Sprint"  
- Hard: "Master Challenge", "Ultimate Test", "Expert Mode"

### Step 4: View Your Puzzles
```
Puzzle Name            │ ID           │ Action
───────────────────────┼──────────────┼─────────
Introduction           │ easy-1234567 │ [Delete]
Warm Up               │ easy-1234568 │ [Delete]
Starter Pack          │ easy-1234569 │ [Delete]
```

### Step 5: Delete a Puzzle
1. Find the puzzle in the list
2. Click the **"Delete"** button
3. Confirm the deletion when prompted
4. Puzzle is removed from the database

## Features Explained

### Import/Create Puzzles
- **Name**: Give your puzzle a unique, descriptive name
- **Difficulty**: Choose from Tutorial, Easy, Medium, or Hard
- **ID**: Auto-generated unique identifier (timestamp-based)
- **Grid**: Default 2x2 blocks (customize in database later)

### Puzzle List Display
- Shows all puzzles for the current difficulty
- Displays puzzle name and auto-generated ID
- One-click delete option

### Difficulty Levels

| Level | Usage | Example Puzzles |
|-------|-------|-----------------|
| **Tutorial** | Teaching basics | Movement 101, Push Blocks |
| **Easy** | Warm-up puzzles | Introduction, First Steps |
| **Medium** | Main gameplay | Challenge 1-5, Brain Teasers |
| **Hard** | Expert puzzles | Endgame, Master Challenge |

## Tips & Tricks

### Naming Conventions
**Good Names:**
- "Introduction" (clear, descriptive)
- "Training: Push Mechanics" (includes category)
- "Daily Challenge #42" (numbered series)

**Avoid:**
- Single letters or numbers
- Special characters
- Very long names

### Organization Strategy
1. **Start with Easy** - Test basic mechanics
2. **Create Tutorial Puzzles** - Teach players gradually
3. **Build Medium Set** - Main gameplay progression
4. **Design Hard Puzzles** - Endgame content

### Workflow Example
```
Session 1: Create 3 easy puzzles
Session 2: Review and create 5 medium puzzles  
Session 3: Build 2 hard puzzles
Session 4: Test all and tweak difficulty
```

## Common Tasks

### Create a Series of Puzzles
1. Click "+ Import Puzzle"
2. Enter "Challenge 1"
3. Click Create
4. Repeat with "Challenge 2", "Challenge 3", etc.

### Delete a Puzzle Category
1. Switch to the difficulty you want to clear
2. Click Delete on each puzzle (confirm each time)
3. Or select puzzles and delete one by one

### Switch Difficulty and View All
1. Click each tab (Tutorial → Easy → Medium → Hard)
2. Observe the puzzle count for each
3. Identify which difficulties need more puzzles

## Troubleshooting

### Puzzle Doesn't Appear
- Check you entered a name and clicked Create
- Make sure you're on the correct difficulty tab
- Try refreshing (close and reopen the manager)

### Can't Delete Puzzle
- Puzzle may be in use (remove from rotation first)
- Check browser console for errors
- Try again or contact support

### Name Already Used?
- Each puzzle gets a unique ID (timestamp-based)
- You can create multiple puzzles with the same name
- Consider adding numbers for clarity

## Coming Soon

Future enhancements planned:
- 📝 Edit puzzle details
- 📂 Import from files
- 🔄 Duplicate puzzles
- 🔍 Search & filter
- 📊 View puzzle statistics

---

**Tip**: Start simple with a few puzzles per difficulty, then gradually add more as you test and refine.
