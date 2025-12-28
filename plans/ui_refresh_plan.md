# UI Improvement & Setup Plan (v8.1)

## 1. Goal
Modernize the `chess-in-one-ocr` frontend with a cleaner, "Lichess-inspired" layout and ensure a robust developer setup using the existing `.venv`.

## 2. UI/UX Redesign

### A. Layout Strategy: "Split Focus"
Instead of the current 3-column layout, we will move to a **2-Column "Game Focus" Layout** for the main review screen, with a collapsible/compact metadata header.

**New Layout Structure:**
```
[ Header: Logo | Upload New File (Compact) | OCR Provider Select | Export PGN ]
-----------------------------------------------------------------------
[ Left Pane: Chess Board (Flexible 50-60%) ]  |  [ Right Pane: Move Tree & Tools (40-50%) ]
                                              |
(Interactive Board)                           |  (Scrollable Move List - Lichess Style)
                                              |  1. e4      c5
                                              |  2. Nf3     d6
                                              |  ...
                                              |  [ Edit Controls / Analysis ]
```

### B. Component Changes

#### 1. `CompactUploader` (Redesigned)
*   **Current:** Large dropzone occupying full screen in "idle" state.
*   **New:**
    *   **Idle State:** Still a hero section, but cleaner.
    *   **Review State:** Becomes a small button group in the top navigation bar.
    *   **Features:**
        *   `[Icon] Choose File` (Small button)
        *   `[Dropdown] OCR Provider` (e.g., Tesseract, TrOCR, Google Cloud)
        *   `[Button] Upload` (Triggers processing)
        *   `[Button] Download PGN` (Visible in Review State)

#### 2. `ReviewUI` (The Dashboard)
*   **Board:** Pinned to the left (or center-left). Resizes dynamically.
*   **Move Tree:**
    *   Vertical list, grouped by move number (White/Black).
    *   **Click-to-Navigate:** Clicking a move updates the board immediately.
    *   **Keyboard Nav:** Left/Right arrow keys support.
    *   **Editing:**
        *   Clicking a move turns it into an input field (or opens a popover).
        *   "Resend for Analysis" button for specific moves (mocked for now, or wired if backend supports).
    *   **Confidence:**
        *   Subtle background coloring (Green/Yellow/Red) on the move text or a small dot.
        *   Tooltips for exact % confidence.

#### 3. `Sidebar` / `Tools` (Right Pane Bottom)
*   Instead of a separate column, place tools below the move list or in a tabbed panel.
*   Tabs: `Metadata` (Players, Event), `Conflicts` (if any), `Raw Source` (Image crop).

## 3. Setup Script (`setup_and_launch.sh`)
The user specified using `/Users/mreddy.adulla/.pyenv/versions/.venv`.
We will create a shell script to:
1.  Source this specific virtual environment.
2.  Install/Update backend dependencies.
3.  Launch the FastAPI backend (background).
4.  Launch the Vite frontend (background or foreground).

## 4. Implementation Steps

1.  **Refactor `App.jsx`**:
    *   Move state management for "OCR Provider" to the top level.
    *   Implement the persistent "Header" which houses the Compact Uploader when in Review mode.

2.  **Update `ReviewUI.jsx`**:
    *   Switch to Flex/Grid layout: `Board` (Left) + `MoveList` (Right).
    *   Remove the "Metadata" column and move it to a "Game Info" modal or collapsible section in the Right pane.

3.  **Enhance `ScoreSheet.jsx` (Move Tree)**:
    *   Style it to look like Lichess (table-less or CSS grid).
    *   Add "Edit" and "Re-analyze" actions.

4.  **Create `setup_and_launch.sh`**:
    *   Target the specific `.venv`.
    *   Ensure robust startup of both servers.

## 5. Technical Stack (No Changes)
*   React + Vite
*   Tailwind CSS
*   `react-chessboard`
*   `chess.js`
