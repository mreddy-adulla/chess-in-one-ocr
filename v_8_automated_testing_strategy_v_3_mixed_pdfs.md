# Chess Notation OCR – V8 Automated Testing Strategy (v3)

**Version:** v8.0.0 (Mixed-Source Update)
**Audience:** Developers, QA, Release Engineers
**Scope:** Backend, Frontend (Desktop), Integration, OCR Pipelines
**Key Context:** **Production PDFs are inherently mixed (White/Black notation sides in one file) and source separation is not guaranteed.**

---

## 1. Executive Summary: The "Mixed Source" Reality

Previous strategies assumed clean separation (White PDF vs Black PDF). **v3 acknowledges reality:**
- A single PDF upload contains pages from **both players**.
- We **cannot** rely on file-level metadata to determine player side.
- We **cannot** assume adjacent pages belong to the same game or side.

**Testing Goal:** Validate that the system correctly **disentangles** a chaotic stream of mixed pages into coherent, reconciled games.

---

## 2. Updated Testing Philosophy

| Old Assumption | New Reality (v3) | Testing Implication |
| :--- | :--- | :--- |
| 1 File = 1 Player | 1 File = Many Pages (Mixed) | Tests must treat **Page** as the atomic unit of source. |
| Metadata trusted | Metadata absent/wrong | System must **infer** side from move content (e.g., odd/even bias). |
| Sequential pages | Scrambled pages | Tests must verify **game ID clustering** (grouping pages into games). |

---

## 3. Core Testing Pillars

### 3.1 Page-Level Atomicity
Every test case involving a PDF must:
1.  Decompose PDF into $N$ individual page images.
2.  Process each page as an independent source candidate.
3.  Assert that `source_id` in the database maps to a **Page**, not a File.

### 3.2 Side Inference Heuristics
Since we lack labels, the system uses heuristics. Tests must cover:
- **Strong White Bias:** Page has moves 1, 3, 5... -> Infers White.
- **Strong Black Bias:** Page has moves 1... 2, 4, 6... -> Infers Black.
- **Ambiguous/Mixed:** Page has random moves -> Flags for Human Review.

### 3.3 Game Clustering (The "Bag of Pages" Problem)
Users might upload a PDF with 5 games.
**Test Requirement:**
- Input: 10 mixed pages (5 games x 2 players).
- Output: 5 distinct `Game` objects in DB.
- Failure Mode: Merging Game A (White) with Game B (Black) -> **Critical Bug**.

---

## 4. Test Pyramid & Coverage

### 4.1 Unit Tests (Python Backend)

#### `test_inference_logic.py`
- `test_infer_side_white_standard()`: Inputs standard White score sheet moves. Asserts `white`.
- `test_infer_side_black_standard()`: Inputs standard Black score sheet moves. Asserts `black`.
- `test_infer_side_ambiguous()`: Inputs conflicting move list. Asserts `unknown`.

#### `test_clustering.py`
- `test_group_pages_by_header()`: If OCR detects "Round 1" vs "Round 2", assert separate games.
- `test_group_pages_by_time()`: If timestamps differ significantly, assert separate games.

### 4.2 Integration Tests (The Golden Path)

**Scenario:** "The Messy Tournament PDF"
1.  **Input:** `tournament_mixed.pdf` (Contains: Game 1 White, Game 1 Black, Game 2 White, Game 2 Black - shuffled).
2.  **Action:** Run full pipeline.
3.  **Assertions:**
    - DB contains **2 Games**.
    - Game 1 has 2 distinct sources (1 White-inferred, 1 Black-inferred).
    - Game 2 has 2 distinct sources.
    - No "cross-contamination" of moves between Game 1 and 2.

### 4.3 Manual/User Acceptance Tests (UAT)

**Scenario:** "Human Override"
1.  Upload mixed PDF.
2.  System incorrectly identifies a Black sheet as White (due to poor OCR).
3.  **User Action:** Right-click page -> "Set as Black".
4.  **System Response:**
    - Re-runs reconciliation for that game.
    - Confidence scores update.
    - Conflicts recalculate based on new side assignment.

---

## 5. Test Data Strategy (`spleens/` v3)

We need a specific dataset for this.

`spleens/mixed_chaos/`:
- `mixed_simple.pdf`: Page 1 (White), Page 2 (Black) - same game.
- `mixed_multi_game.pdf`: P1(G1,W), P2(G1,B), P3(G2,W), P4(G2,B).
- `ambiguous.pdf`: Poor OCR quality where side is hard to guess.

**Rule:** CI must run `mixed_simple.pdf` integration test on every merge to `v8`.

---

## 6. Failure Modes & Severity

| Failure | Severity | Mitigation Test |
| :--- | :--- | :--- |
| Merging distinct games | **Critical** | `test_clustering.py` (Header separation) |
| Wrong side inference | High | UI "Set Side" capability (Manual Test) |
| Dropped pages | High | Page count vs Source count assertion |
| Mixed-up moves (W/B swap) | Medium | Confidence score < 0.5 checks |

---

## 7. Definition of Done (v3 Update)

- [ ] Unit tests exist for Side Inference logic.
- [ ] Integration test passes for a multi-page mixed PDF.
- [ ] UI allows manual re-assignment of Page Side (White/Black).
- [ ] DB schema supports `source_type` inference metadata (e.g., `inferred_white`, `manual_black`).
