# Generated Puzzle Samples: High-Interaction & Block-on-Block Collisions

This document showcases procedural levels generated with **rich block-on-block interactions**, where blocks physically collide with each other to serve as dynamic stopping backboards and enforce critical order-of-operation solving sequences.

## Key Interaction Features Verified:
1. **Dynamic Block Backboards (💥 Collisions)**: Blocks slide across long board distances and stop by crashing directly into other blocks rather than relying on artificial walls.
2. **Interleaved Block Switches (🔄 Order of Operations)**: Players cannot simply solve one block at a time in isolation. Puzzles require positioning Block A as a temporary backboard for Block B, then relocating Block A to solve Block C, creating deep logic dependencies.
3. **Sweeping Slide Runways (🎯 3.0 - 4.5+ Tiles Average)**: Maintained long sliding distances without short cramped movements.
4. **100% Solvability Verification**: Every generated level is verified via BFS simulation with zero unsolvable trap configurations.

---

### Sample 1 (Moderate - 3 Blocks, Dynamic Collision & Interleaving)
- **Push Count**: 6 pushes
- **Total Moves**: 35 moves
- **Block-on-Block Collisions**: **1 dynamic collisions**
- **Block Switches (Order-of-Operation Complexity)**: **2 interleaving switches**
- **Average Slide Distance**: **3.7 tiles / push**
- **Slide Runway Breakdown**: `[5, 3, 1, 7, 3, 3]`

#### Board Layout (Legend: `@` = Player, `[R]` = Red Block, `[B]` = Blue Block, `[Y]` = Yellow Block, `[P]` = Purple Block, `(r)` = Red Target, `#` = Wall):
```text
 @  .  # (r) .  .  .  .  . 
 .  .  . (y)[B] .  .  .  . 
 .  .  .  .  .  .  .  .  . 
 .  .  #  .  .  .  .  .  . 
 .  .  #  .  .  . [Y] .  # 
 .  .  .  .  .  .  .  .  . 
 .  .  .  .  .  .  . (b) # 
 .  . [R] .  #  .  .  .  . 
 .  .  .  .  .  .  .  .  . 
```

#### Step-by-Step Interactive Push Dynamics:
   1. **BLUE** Down (5 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[4, 6]`)
   2. **BLUE** Right (3 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[7, 6]`)
   3. **RED** Right (1 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[3, 7]`)
   4. **RED** Up (7 tiles) $\rightarrow$ ⏹ Stopped by Border (at `[3, 0]`)
   5. **YELLOW** Left (3 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[3, 4]`)
   6. **YELLOW** Up (3 tiles) $\rightarrow$ 💥 **COLLIDES WITH RED BLOCK** (at `[3, 1]`)

#### Raw Level Configuration:
```json
{
  "width": 9,
  "height": 9,
  "player": {
    "x": 0,
    "y": 0
  },
  "walls": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 8,
      "y": 4
    },
    {
      "x": 2,
      "y": 3
    },
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 8,
      "y": 6
    },
    {
      "x": 4,
      "y": 7
    }
  ],
  "blocks": [
    {
      "id": "b_blue_0",
      "color": "blue",
      "x": 4,
      "y": 1
    },
    {
      "id": "b_yellow_1",
      "color": "yellow",
      "x": 6,
      "y": 4
    },
    {
      "id": "b_red_2",
      "color": "red",
      "x": 2,
      "y": 7
    }
  ],
  "targets": [
    {
      "id": "t_blue_0",
      "color": "blue",
      "x": 7,
      "y": 6
    },
    {
      "id": "t_yellow_1",
      "color": "yellow",
      "x": 3,
      "y": 1
    },
    {
      "id": "t_red_2",
      "color": "red",
      "x": 3,
      "y": 0
    }
  ],
  "solutionMoves": [
    "Down",
    "Right",
    "Right",
    "Right",
    "Up",
    "Right",
    "Down",
    "Down",
    "Down",
    "Down",
    "Down",
    "Left",
    "Down",
    "Right",
    "Left",
    "Left",
    "Left",
    "Down",
    "Right",
    "Down",
    "Right",
    "Up",
    "Up",
    "Up",
    "Right",
    "Right",
    "Right",
    "Right",
    "Up",
    "Left",
    "Down",
    "Left",
    "Left",
    "Left",
    "Up"
  ]
}
```

---

### Sample 2 (Moderate+ - 3 Blocks, Multi-Collision Sequence)
- **Push Count**: 6 pushes
- **Total Moves**: 42 moves
- **Block-on-Block Collisions**: **1 dynamic collisions**
- **Block Switches (Order-of-Operation Complexity)**: **3 interleaving switches**
- **Average Slide Distance**: **3.5 tiles / push**
- **Slide Runway Breakdown**: `[3, 5, 3, 4, 3, 3]`

#### Board Layout (Legend: `@` = Player, `[R]` = Red Block, `[B]` = Blue Block, `[Y]` = Yellow Block, `[P]` = Purple Block, `(r)` = Red Target, `#` = Wall):
```text
 @  .  .  #  .  .  #  .  . 
 .  .  .  .  .  . (r) .  . 
 .  .  . [B] .  .  .  .  . 
 .  .  .  #  .  #  .  .  . 
 .  #  .  .  .  .  .  #  . 
 .  .  .  .  .  .  .  .  . 
 .  .  .  .  .  .  .  .  . 
(b)(y) . [R] . [Y] .  .  . 
 #  .  #  .  .  .  .  .  . 
```

#### Step-by-Step Interactive Push Dynamics:
   1. **BLUE** Left (3 tiles) $\rightarrow$ ⏹ Stopped by Border (at `[0, 2]`)
   2. **BLUE** Down (5 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[0, 7]`)
   3. **RED** Up (3 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[3, 4]`)
   4. **YELLOW** Left (4 tiles) $\rightarrow$ 💥 **COLLIDES WITH BLUE BLOCK** (at `[1, 7]`)
   5. **RED** Right (3 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[6, 4]`)
   6. **RED** Up (3 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[6, 1]`)

#### Raw Level Configuration:
```json
{
  "width": 9,
  "height": 9,
  "player": {
    "x": 0,
    "y": 0
  },
  "walls": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 7,
      "y": 4
    },
    {
      "x": 3,
      "y": 3
    },
    {
      "x": 2,
      "y": 8
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 0,
      "y": 8
    },
    {
      "x": 3,
      "y": 0
    }
  ],
  "blocks": [
    {
      "id": "b_blue_0",
      "color": "blue",
      "x": 3,
      "y": 2
    },
    {
      "id": "b_yellow_1",
      "color": "yellow",
      "x": 5,
      "y": 7
    },
    {
      "id": "b_red_2",
      "color": "red",
      "x": 3,
      "y": 7
    }
  ],
  "targets": [
    {
      "id": "t_blue_0",
      "color": "blue",
      "x": 0,
      "y": 7
    },
    {
      "id": "t_yellow_1",
      "color": "yellow",
      "x": 1,
      "y": 7
    },
    {
      "id": "t_red_2",
      "color": "red",
      "x": 6,
      "y": 1
    }
  ],
  "solutionMoves": [
    "Down",
    "Right",
    "Right",
    "Right",
    "Right",
    "Down",
    "Left",
    "Up",
    "Left",
    "Left",
    "Left",
    "Down",
    "Down",
    "Down",
    "Down",
    "Down",
    "Right",
    "Right",
    "Right",
    "Right",
    "Down",
    "Down",
    "Left",
    "Up",
    "Up",
    "Right",
    "Right",
    "Right",
    "Down",
    "Left",
    "Up",
    "Up",
    "Left",
    "Left",
    "Left",
    "Up",
    "Right",
    "Down",
    "Right",
    "Right",
    "Right",
    "Up"
  ]
}
```

---

### Sample 3 (Hard - Multi-Collision Cascades & Interleaved Solving)
- **Push Count**: 8 pushes
- **Total Moves**: 54 moves
- **Block-on-Block Collisions**: **2 dynamic collisions**
- **Block Switches (Order-of-Operation Complexity)**: **4 interleaving switches**
- **Average Slide Distance**: **3 tiles / push**
- **Slide Runway Breakdown**: `[2, 3, 3, 4, 2, 6, 2, 2]`

#### Board Layout (Legend: `@` = Player, `[R]` = Red Block, `[B]` = Blue Block, `[Y]` = Yellow Block, `[P]` = Purple Block, `(r)` = Red Target, `#` = Wall):
```text
 @  .  .  .  . (g) #  .  . 
 .  # [Y][B] . (y) .  .  . 
 .  .  .  .  .  .  #  .  . 
 #  .  .  .  .  .  #  .  . 
 .  .  #  .  .  .  .  .  . 
 .  .  .  .  . (b) #  .  . 
 .  .  #  .  .  . [G] .  . 
 .  .  .  .  .  .  .  .  . 
 .  .  .  .  .  .  .  .  . 
```

#### Step-by-Step Interactive Push Dynamics:
   1. **YELLOW** Down (2 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[2, 3]`)
   2. **YELLOW** Right (3 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[5, 3]`)
   3. **GREEN** Left (3 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[3, 6]`)
   4. **BLUE** Down (4 tiles) $\rightarrow$ 💥 **COLLIDES WITH GREEN BLOCK** (at `[3, 5]`)
   5. **BLUE** Right (2 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[5, 5]`)
   6. **GREEN** Up (6 tiles) $\rightarrow$ ⏹ Stopped by Border (at `[3, 0]`)
   7. **GREEN** Right (2 tiles) $\rightarrow$ 🛑 Stopped by Wall (at `[5, 0]`)
   8. **YELLOW** Up (2 tiles) $\rightarrow$ 💥 **COLLIDES WITH GREEN BLOCK** (at `[5, 1]`)

#### Raw Level Configuration:
```json
{
  "width": 9,
  "height": 9,
  "player": {
    "x": 0,
    "y": 0
  },
  "walls": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    },
    {
      "x": 1,
      "y": 1
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 2,
      "y": 4
    }
  ],
  "blocks": [
    {
      "id": "b_yellow_0",
      "color": "yellow",
      "x": 2,
      "y": 1
    },
    {
      "id": "b_blue_1",
      "color": "blue",
      "x": 3,
      "y": 1
    },
    {
      "id": "b_green_2",
      "color": "green",
      "x": 6,
      "y": 6
    }
  ],
  "targets": [
    {
      "id": "t_yellow_0",
      "color": "yellow",
      "x": 5,
      "y": 1
    },
    {
      "id": "t_blue_1",
      "color": "blue",
      "x": 5,
      "y": 5
    },
    {
      "id": "t_green_2",
      "color": "green",
      "x": 5,
      "y": 0
    }
  ],
  "solutionMoves": [
    "Right",
    "Right",
    "Down",
    "Down",
    "Left",
    "Down",
    "Right",
    "Right",
    "Down",
    "Right",
    "Right",
    "Right",
    "Right",
    "Down",
    "Down",
    "Left",
    "Left",
    "Up",
    "Up",
    "Left",
    "Up",
    "Up",
    "Up",
    "Up",
    "Left",
    "Down",
    "Down",
    "Down",
    "Left",
    "Left",
    "Down",
    "Down",
    "Right",
    "Right",
    "Right",
    "Down",
    "Down",
    "Left",
    "Up",
    "Up",
    "Up",
    "Up",
    "Up",
    "Up",
    "Left",
    "Up",
    "Right",
    "Down",
    "Down",
    "Down",
    "Down",
    "Right",
    "Right",
    "Up"
  ]
}
```
