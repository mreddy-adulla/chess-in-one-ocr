# Chess Notation OCR – V8 Automated Testing Strategy (v2)

**Version:** v8.0.0  
**Audience:** Developers, QA, Release Engineers, Auditors  
**Scope:** Backend, Frontend (Desktop), Integration, OCR Pipelines  
**Key Update:** **Page‑level source handling for mixed PDF notation screenshots**

---

## 1. Purpose & Testing Philosophy

V8 testing is designed around **real tournament data**, not idealized inputs.

Key realities:
- PDFs contain **screenshots/photos**, not clean text
- A single PDF may include **White pages, Black pages, or mixed pages**
- Player ownership is **not known upfront**

Therefore, tests must validate:
- Robustness to ambiguity
- Deterministic behavior after reconciliation
- Human‑in‑the‑loop correction paths

We prioritize **correctness, traceability, and explainability** over raw OCR accuracy.

---

## 2. Core Concept: Page‑Level Source Model

### Definition

> **PDF = container**  
> **Page = independent OCR source**

Each page is treated as a separate source regardless of PDF grouping.

### Implications for Testing
- No test assumes "this PDF = White" or "this PDF = Black"
- Tests assert that the system **infers, not assumes** player side
- Human override is always possible

---

## 3. Test Pyramid (Updated)

```
            Manual Review Tests
         ───────────────────────
         Mixed‑page PDFs
         Human correction flows

         Integration Tests
       ───────────────────────────
       PDF → Pages → OCR → PGN

        Unit Tests (Deterministic)
     ─────────────────────────────
     Chess logic, alignment, DB
```

---

## 4. Backend Unit Tests

### 4.1 Opening & Chess Logic

**Target:** Fully deterministic

Covered:
- ECO loader
- Opening index depth preference
- SAN legality

_No changes from v1._

---

### 4.2 Page‑Level OCR Source Tests

**New in v2**

#### Test Objectives
- Each page becomes an independent source
- OCR engine processes pages independently

#### Example
```python

def test_pdf_pages_create_multiple_sources(pdf_pages):
    sources = extract_sources_from_pdf(pdf_pages)
    assert len(sources) == len(pdf_pages)
```

---

### 4.3 Player Side Inference Tests

#### Heuristic Under Test
- Mostly odd plies → White‑leaning
- Mostly even plies → Black‑leaning
- Mixed → Mixed source

```python

def test_page_side_inference():
    page_moves = [
        {"ply": 1, "san": "e4"},
        {"ply": 3, "san": "Nf3"},
    ]
    side = infer_page_side(page_moves)
    assert side == "white"
```

---

## 5. Reconciliation & Conflict Tests

### 5.1 Alignment with Mixed Sources

```python

def test_alignment_with_mixed_pages():
    aligned = align_pages([white_page, black_page, mixed_page])
    assert len(aligned) > 0
```

### 5.2 Conflict Resolution from Pages

Tests must assert:
- Conflicts are detected
- Conflicts reference **page sources**, not PDFs

---

## 6. Database Tests (SQLite)

### Page‑Aware Persistence

Covered:
- Page ID stored with each move
- Source metadata preserved
- No overwrites

```python

def test_page_source_persistence(db):
    move = db.get_move(ply=5)
    assert move.source_page_id is not None
```

---

## 7. Integration Tests (Critical)

### Golden Flow (Updated)

```
PDF (mixed pages)
 ↓
Split into pages
 ↓
OCR each page
 ↓
Infer side per page
 ↓
Align & reconcile
 ↓
Human review
 ↓
PGN export
```

Only **one** golden‑path integration test is required.

---

## 8. Frontend Tests (Desktop)

### New Assertions
- Page ownership visible in UI
- Mixed source flagged visually
- Human reassignment updates confidence

_No pixel‑level OCR tests._

---

## 9. Release Smoke‑Test Checklist (Updated)

### Mixed PDF Verification (MANDATORY)

- [ ] Upload PDF containing mixed pages
- [ ] Verify pages listed as separate sources
- [ ] Confirm inferred White/Black/Mixed labels
- [ ] Manually reassign at least one page
- [ ] Observe confidence recalculation

---

## 10. Confidence System – Page Awareness

### Rules

| Condition | Confidence Impact |
|--------|------------------|
Mixed page source | −0.1 |
Page reassigned by human | origin = human |
Conflicting pages | −0.3 |

Confidence must always explain *why*.

---

## 11. Test Data Management

### `spleens/` Folder (Authoritative)

```
spleens/
├── README.md
├── tournament_round_1.pdf
├── tournament_round_2.pdf
└── mixed_school_event.pdf
```

Rules:
- PDFs are **never modified**
- Used only for manual QA & smoke tests
- Not part of automated CI

---

## 12. CI Strategy (No Change)

- Unit + API tests on every PR
- Integration tests on release tags only
- No OCR accuracy gating

---

## 13. Audit & Risk Review (Updated)

### Addressed Risks

| Risk | Mitigation |
|----|-----------|
Mixed ownership | Page‑level attribution |
Wrong side inference | Human override |
Data corruption | SQLite ACID |
Silent mis‑merge | Explicit conflicts |

---

## 14. Definition of Done (Testing)

✔ Mixed‑page PDFs handled correctly  
✔ Page‑level sources preserved  
✔ Human override validated  
✔ PGN export stable  
✔ Confidence explainable  

---

## 15. Explicit Non‑Goals

- Auto‑detect player with 100% certainty
- Fully automated tournament ingestion

Human judgment is a feature, not a bug.

---

**END OF DOCUMENT**

