# TRAINING_TROCR.md

## Purpose

This document defines the **complete, standalone training pipeline for TrOCR** as used in *Chess‑in‑One OCR*.

TrOCR is treated as a **cell‑level OCR provider**, operating **independently** of any VLM or contextual OCR.

---

## 1. Scope & Constraints

- **Inference granularity:** one move cell → one OCR call
- **Context:** none (no previous / next move)
- **Responsibility:** text transcription only
- **Chess rules:** NOT learned, NOT injected

TrOCR must remain:
- lightweight
- deterministic
- memory efficient

---

## 2. Dataset Structure (Mandatory)

Your original dataset:
```
training-data/
  images/   # 158 full-page scoresheets
  labels/   # ground truth
```

### 2.1 Derived TrOCR Dataset (Required)

You **must** generate a cell-level dataset:

```
training-data/
  trocr/
    images/
      cell_000001.png
      cell_000002.png
    labels/
      cell_000001.txt   # e4
      cell_000002.txt   # Nf3
```

Expected scale:
- 40–60 moves per game
- ~6,000–9,000 total samples

⚠️ Training on full pages is explicitly forbidden.

---

## 3. Label Normalization Rules

Allowed:
- Trim whitespace
- Normalize castling → `O-O`, `O-O-O`

Forbidden:
- Injecting legality fixes
- Expanding abbreviations
- Removing promotions, checks, mates

TrOCR must learn **what is written**, not what is correct.

---

## 4. Base Model

Recommended:

- `microsoft/trocr-base-handwritten`

Why:
- Pretrained on handwriting
- Stable decoder
- Fits local hardware

---

## 5. Training Strategy

### 5.1 Phase 1 – Decoder Warm‑up

- Freeze ViT encoder
- Train decoder only
- LR: `5e-5`
- Epochs: 5–8

### 5.2 Phase 2 – Partial Fine‑tuning

- Unfreeze last N encoder layers
- LR: `2e-5`
- Epochs: 10–15

### 5.3 Phase 3 – Stabilization

- Lower LR: `1e-5`
- Epochs: 5–10

---

## 6. Augmentation (Light Only)

Allowed:
- ±2° rotation
- Contrast jitter
- Light Gaussian noise

Forbidden:
- Horizontal flip
- Heavy warping

---

## 7. Evaluation Metrics

Primary:
- Character Error Rate (CER)
- Exact token accuracy

Chess‑specific:
- % outputs parsable as SAN

Target:
- ≥95% SAN‑parsable

---

## 8. Provider‑Specific Config Schema

```yaml
trocr:
  model_path: models/trocr
  image_size: 384
  batch_size: 16
  confidence_threshold: 0.85
  device: auto   # cpu | cuda | mps
```

---

## 9. Inference Pseudo‑Code (TrOCR Provider)

```python
for cell_image in extracted_cells:
    text, conf = trocr.predict(cell_image)

    if conf < CONF_THRESHOLD:
        mark_for_review(cell_image)
        continue

    move = parse_SAN(text)

    if not is_legal(move, board):
        move = auto_correct(move, board)

    board.push(move)
```

---

## 10. Design Guarantees

- TrOCR never loads a VLM
- Memory footprint remains minimal
- All chess intelligence lives downstream

---

## 11. Common Failure Modes

| Issue | Cause | Resolution |
|-----|------|-----------|
| b vs 6 | handwriting | validator correction |
| O vs 0 | OCR confusion | normalization |
| Missing capture | OCR | manual review |

---

## 12. Summary

TrOCR is the **fast, deterministic backbone** of Chess‑in‑One OCR. Its power comes not from understanding chess, but from clean integration with chess validation.

