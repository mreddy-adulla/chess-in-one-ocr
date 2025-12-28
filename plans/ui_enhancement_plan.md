# UI Enhancement Plan: "Chess-in-One OCR"

## 1. Goal
Transform the current layout into a sleek, compact, and visually appealing dashboard. Address the specific complaint: "Upload button consumes almost all screen."

## 2. Design Philosophy
-   **Modern Minimalist:** Clean lines, ample whitespace, but higher information density.
-   **Compact Utility:** Controls should be accessible but not overwhelming.
-   **Brand:** "chess-in-one-ocr" as the central identity.

## 3. Key Changes

### 3.1 `App.jsx` (Layout & Branding)
-   **Header:**
    -   Update Title: "chess-in-one-ocr" (lowercase/monospace aesthetic or clean sans-serif).
    -   Add navigation/mode toggles if needed (e.g., "History", "Settings") to make it look like a real app.
-   **Main Layout:**
    -   **Before:** Single centered column with massive components.
    -   **After:**
        -   **Idle State:** A focused "Hero" card centered on screen, but strictly sized (e.g., `max-w-2xl`).
        -   **Review State:** A split-pane or dashboard layout.
            -   Left/Top: Game Info & source pages.
            -   Center: Move list & confidence.
            -   Right: Actions.

### 3.2 `FileUploader.jsx` (Redesign)
-   **Problem:** Currently `h-64` and full width.
-   **Solution:** "Compact Dropzone".
    -   Reduce height to `h-32` or `h-40`.
    -   Use a subtle border and icon.
    -   Add a secondary "Browse Files" button style that looks like a standard button, not a giant box.
    -   *Alternative:* A "floating" action button or a sidebar upload area in the review view.

### 3.3 `ReviewUI.jsx` (Visual Polish)
-   **Typography:** Use `font-mono` for moves (standard for chess).
-   **Color:** Dark mode option or a "Chess Board" theme (Cream/Brown accents) could be nice, but sticking to Slate/Indigo is safer for now. Let's refine the Indigo to be more subtle.
-   **Density:** Reduce padding in the move list to see more moves at once.

## 4. Implementation Steps

1.  **Refine `App.jsx`:**
    -   Update Title.
    -   Wrap content in a better container structure.
2.  **Redesign `FileUploader.jsx`:**
    -   Make it compact.
    -   Add hover effects (`hover:border-indigo-400`, `hover:bg-indigo-50`).
3.  **Refine `ReviewUI.jsx`:**
    -   Use a "Card" layout for the move list.
    -   Make the "Confidence" indicators smaller (dots instead of badges?).

## 5. Mockup (Mental)
**Idle Screen:**
```
[ Header: chess-in-one-ocrV8.0 ]
       |
       v
[ Card: New Project ]
[ Drop PDF Here ] (Height: 150px)
[   Or Browse   ]
```

**Review Screen:**
```
[ Header ]
[ Page Clusters (Horizontal Scroll) ]
-------------------------------------
[ Move List (Table) ]  [ Info Panel ]
[ 1. e4 (99%)       ]  [ Confidence ]
[ 2. c5 (95%)       ]  [ Edit Btn   ]
```
