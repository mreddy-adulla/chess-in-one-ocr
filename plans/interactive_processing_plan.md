# Interactive "Human-in-the-Loop" Processing Plan

## 1. Goal
Replace the "all-at-once" mock processing with a **Stepwise Interactive Flow**.
Instead of waiting for the entire game to be OCR'd, the system will process the image in chunks (e.g., 5-move rows) and pause if confidence is low or legality checks fail.

## 2. Architecture Changes

### Backend (FastAPI)
We need a stateful or semi-stateful session to handle the stepwise processing.

*   **POST `/api/v1/session/start`**
    *   **Input:** File (PDF/Image)
    *   **Output:** `session_id`, `total_rows_detected`, `preview_image_url`
    *   **Logic:**
        1.  Receives file.
        2.  Segments the grid into rows (using existing `aligner.py` logic but stopping before OCR).
        3.  Stores the segmented row images in a temporary folder keyed by `session_id`.

*   **POST `/api/v1/session/{session_id}/process_next`**
    *   **Input:** `current_fen`, `last_move_ply` (Context for legality checking)
    *   **Output:**
        *   `moves`: List of moves detected in this batch (e.g., 1 row = 2 moves).
        *   `confidence`: Score (0-1).
        *   `needs_review`: Boolean (True if low confidence or illegal).
        *   `row_image`: Base64 crop of the row being processed (for UI verification).
        *   `is_complete`: Boolean.

### Frontend (React)

*   **State Machine:**
    *   `IDLE` -> `UPLOADING` -> `SESSION_STARTED`
    *   `PROCESSING_ROW` -> `REVIEW_REQUIRED` (Paused) -> `PROCESSING_ROW`
    *   `COMPLETED`

*   **UI Changes (`ReviewUI.jsx`):**
    *   **Active Row Highlight:** Show the specific crop of the scoresheet row currently being analyzed.
    *   **"Continue" Button:** If the system is confident, it might auto-advance (with a small delay). If not, it pauses and waits for user "Approve/Edit".
    *   **Live Board:** Updates incrementally.

## 3. Implementation Plan

1.  **Backend: Session Manager**
    *   Create `backend/session_manager.py` to handle temporary file storage and row segmentation state.
    *   Modify `backend/main.py` to expose the new endpoints.

2.  **Backend: Row Segmentation**
    *   Reuse `backend/ocr/merge.py` or `backend/reconcile/aligner.py` to extract row bounding boxes *without* running full OCR immediately.

3.  **Frontend: Stepwise Logic**
    *   Refactor `App.jsx` to replace `mockBackendProcessing` with the `session/start` call.
    *   Update `ReviewUI.jsx` to loop: `process_next` -> `update board` -> `check confidence` -> `continue/pause`.

## 4. User Workflow
1.  User uploads image.
2.  Backend detects grid and returns "Ready".
3.  Frontend requests "Row 1".
4.  Backend OCRs Row 1 (Moves 1. e4 e5). Checks legality. Returns result.
5.  Frontend shows moves on board.
    *   *Scenario A (High Conf):* Auto-requests Row 2 after 500ms.
    *   *Scenario B (Low Conf/Illegal):* Pauses. Shows the cropped row image. User corrects "e5" to "c5". User clicks "Continue".
6.  Repeat until end of game.

## 5. Mock vs Real
For this immediate task, since we might not have the full OCR pipeline perfect for the user's specific image, I will:
1.  **Implement the API structure.**
2.  **Stub the OCR response** but make it *dynamic* based on the session (so it's not just a hardcoded list).
3.  **Prepare the Frontend** to actually call these endpoints.

**Crucial Note:** The user wants to use *their* image. I cannot "OCR" their specific image perfectly without the actual ML models running (TrOCR). I will assume the `launch_app.sh` setup (installing dependencies) makes the backend capable of *attempting* real OCR if `tesserocr` or `onnxruntime` is available.
