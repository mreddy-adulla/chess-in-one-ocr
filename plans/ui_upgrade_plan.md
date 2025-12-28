# UI Upgrade Plan: The "Chess-in-One" Experience

**Goal:** Elevate the frontend to a professional standard ("Lichess-grade") with compact workflows, standard chess notation, and robust move validation.

---

## 1. Aesthetic & Layout Overhaul

### 1.1 Branding & Theme
- **Name:** `chess-in-one-ocr` (Monospace font logo).
- **Theme:** Clean, flat design using Tailwind CSS.
- **Palette:** Slate (Backgrounds), Indigo (Primary Actions), Green/Yellow/Red (Confidence/Validation status).

### 1.2 The "Compact" Workflow
The UI will no longer use full-screen jumbotrons for simple actions.

- **Navbar:** Sticky top bar with Logo, Version, and global settings (e.g., Engine toggle).
- **Split-Pane Review:** The core interface will be a single dashboard divided into:
    1.  **Left Panel (30%):** Game Metadata, Source Images/Clusters.
    2.  **Center Panel (40%):** The Move List (Score Sheet).
    3.  **Right Panel (30%):** Interactive Chess Board (Analysis).

---

## 2. Component Upgrades

### 2.1 Compact File Uploader
**Problem:** Current uploader is too large.
**Solution:**
- **Design:** A sleek, horizontal "Upload Strip" or a compact Card (`h-32` max).
- **Visuals:** Dashed border, subtle "Drop here" animation.
- **Support:** Images (`.png`, `.jpg`) and PDFs.
- **Behavior:** Upon file drop, it immediately shrinks to a progress bar to reveal the Review UI.

### 2.2 Lichess-Style Notation View
**Problem:** Current view is a raw list.
**Solution:** Standard Algebraic Notation (SAN) Table.

**Layout:**
| # | White | Black |
| :--- | :--- | :--- |
| **1.** | e4 | c5 |
| **2.** | Nf3 | d6 |
| **3.** | d4 | cxd4 |

- **Interaction:**
    - **Click-to-Edit:** Clicking `e4` turns it into an input field.
    - **Navigation:** Arrow keys (`Left`/`Right`) move the "cursor" through the game.
    - **Highlighting:** The current ply is highlighted (e.g., light yellow background).
    - **Confidence:** Small colored dot (Green >90%, Yellow >70%, Red <70%) next to each move.

### 2.3 Interactive Chess Board & Analysis
**Goal:** Provide visual context for the moves being reviewed.

- **Visualization:**
    - **Library:** `chessboard.jsx` (or `react-chessboard`) + `chess.js`.
    - **Sync:** The board automatically updates to reflect the position at the currently selected ply in the Score Sheet.
    - **Move Tree:** Display variations if multiple OCR candidates exist (future scope) or simply allow traversing the main line.
- **Animation:**
    - **Detection Feedback:** As moves are recognized/processed by the backend, the board animates the pieces moving in real-time (or near real-time).
    - **Playback:** A "Play" button to watch the game unfold from the recognized moves.

---

## 3. Inline Move Validation Engine

**Constraint:** The UI must prevent the creation of illegal PGNs.

### 3.1 Validation Logic (Frontend)
- **Library:** `chess.js` (lightweight, standard).
- **State:** The frontend maintains a `Chess()` instance mirroring the current move list.
- **Flow:**
    1.  User edits move `2. ... d6` -> `d5`.
    2.  System attempts `game.move('d5')` on the board state at ply 3.
    3.  **If Valid:** Update UI, re-calculate future moves (if any), **Update Board Position**.
    4.  **If Invalid:**
        -   Show error tooltip: "Illegal move d5".
        -   Input turns Red.
        -   Block saving/exporting until resolved.

### 3.2 "Human Interference" Mode
If the OCR output is messy or the user wants to force a move (e.g., a variant):
- **Action:** User clicks "Force Move" or "Ignore Validation".
- **Result:** The move is accepted as a `NullMove` or raw string in the PGN, but analysis stops there.
- **UI:** The move is flagged with a warning icon.

---

## 4. Implementation Steps

1.  **Install Dependencies:** `npm install chess.js react-chessboard`
2.  **Refactor `App.jsx`:** Implement the split-pane layout.
3.  **Create `CompactUploader.jsx`:** Implement the `h-32` design.
4.  **Create `ScoreSheet.jsx`:** The table-based move list.
5.  **Create `BoardView.jsx`:** Component wrapping the chessboard and handling sync logic.
6.  **Integrate Validation:** Hook `chess.js` into the `ScoreSheet` input handlers.

---

## 5. Mockup (ASCII)

```
[ chess-in-one-ocr ]  [v8.0]                                [ Export PGN ]

+---------------------+---------------------------+----------------------+
|  METADATA           |  SCORE SHEET              |  ANALYSIS BOARD      |
|                     |                           |                      |
|  Event: Casual      |  1. e4      c5            |  +----------------+  |
|  Date: 2025-12-28   |  2. Nf3     d6            |  | r n b q k b n r|  |
|                     |  3. d4      cxd4          |  | p p p . p p p p|  |
|  SOURCE FILES       |  4. Nxd4    Nf6           |  | . . . . . . . .|  |
|  [Page 1] [Page 2]  |  5. Nc3     a6            |  | . . . . . . . .|  |
|                     |  6. Bg5     e6            |  | . . . P . . . .|  |
|                     |                           |  | . . . . . . . .|  |
|                     |                           |  | P P P . P P P P|  |
|                     |                           |  | R N B Q K B N R|  |
|                     |                           |  +----------------+  |
|                     |                           |  [<] [Play] [>]      |
+---------------------+---------------------------+----------------------+
```
