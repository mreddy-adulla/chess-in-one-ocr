# PDF Multi-Page Workflow Plan

## 1. Objective
Allow users to upload a multi-page PDF, preview individual pages, and explicitly select which pages to process (or process all).

## 2. Backend Architecture Changes

### A. Dependency
*   Add `pdf2image` to `backend/requirements.txt`.
*   Note: `pdf2image` requires `poppler` installed on the system (`brew install poppler` on Mac).

### B. Session Management
*   **Session State Update:**
    *   `source_file_type`: 'image' or 'pdf'
    *   `total_pages`: int
    *   `page_images`: List[str] (paths to cached jpgs of each page)
    *   `selected_pages`: List[int] (indices of pages to process)
    *   `current_page_index`: int (pointer to which page we are OCRing)

### C. API Endpoints
1.  **`POST /api/v1/session/upload`** (New/Refactored)
    *   Input: File
    *   Logic:
        *   Save file.
        *   If PDF -> Convert to images (temp dir). Return `session_id`, `total_pages`, `thumbnails` (base64).
        *   If Image -> Treat as 1 page. Return same structure.
    *   Status: `waiting_for_selection`

2.  **`POST /api/v1/session/{id}/select_pages`** (New)
    *   Input: `page_indices` (List[int])
    *   Logic:
        *   Update session `selected_pages`.
        *   Reset `current_row_index` and `current_page_index`.
    *   Status: `ready`

3.  **`POST /api/v1/session/{id}/process_next`** (Updated)
    *   Logic:
        *   Check `current_page_index`.
        *   Load image for that page.
        *   Crop row from that page image.
        *   If end of page -> Advance `current_page_index`.
        *   If end of selected pages -> `is_complete: True`.

## 3. Frontend Architecture Changes

### A. `PageSelector.jsx` (New Component)
*   **Visuals:** Grid of card thumbnails.
*   **Interaction:** Click to toggle selection. "Select All" / "Deselect All".
*   **Preview:** Hover/Click to zoom (Modal).
*   **Action:** "Start Processing" button.

### B. `App.jsx` State Machine
*   `IDLE` -> `UPLOADING` -> `PAGE_SELECTION` (New) -> `PROCESSING` -> `REVIEW`.

## 4. Implementation Steps
1.  **Backend:** Add dependencies & refactor `session_manager`.
2.  **Backend:** Implement PDF splitting logic.
3.  **Frontend:** Build `PageSelector`.
4.  **Integration:** Wire up the flow.
