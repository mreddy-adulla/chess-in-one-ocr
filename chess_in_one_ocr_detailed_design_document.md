# Chess-in-One OCR – Detailed Design Document

## 1. Overview

**Chess-in-One OCR** is a standalone, production-grade system designed to convert handwritten chess notation (scoresheets, scans, PDFs, photos) into **validated, corrected PGN**. The system is optimized for:

- Youth and professional chess tournaments
- Handwritten scoresheets from both White and Black players
- Offline-first usage with optional cloud fallback
- Human-in-the-loop correction where ambiguity cannot be resolved

The project combines **computer vision, OCR, chess-rule reasoning, and UI workflows** into a single cohesive application.

---

## 2. Goals & Non‑Goals

### 2.1 Goals

- Accurate digitization of handwritten chess notation
- Context-aware correction using chess rules and move history
- Support for dual scoresheets (White + Black)
- Batch processing of PDFs and images
- Export to standard PGN
- Manual review UI for unresolved ambiguities
- Fully offline-capable local mode

### 2.2 Non‑Goals (Explicit)

- Not a chess engine for strength evaluation
- Not a tournament pairing or results system
- Not cloud-dependent by default

---

## 3. High-Level Architecture

```
+-------------------+
|   Desktop UI      |
| (Tauri / Web UI)  |
+---------+---------+
          |
          v
+-------------------+
|  OCR Orchestrator |
+---------+---------+
          |
          v
+-------------------+
|  Vision + OCR     |
| (ML / VLM / OCR)  |
+---------+---------+
          |
          v
+-------------------+
| Chess Reasoning   |
| (Parser/Validator|
+---------+---------+
          |
          v
+-------------------+
| PGN Store / DB    |
+-------------------+
```

---

## 4. Data Flow (End-to-End)

1. User uploads **PDF / image batch**
2. Pages are split → preprocessed (deskew, crop, binarize)
3. OCR/VLM extracts raw move text per line
4. Chess parser converts text → SAN candidates
5. Validator checks legality using move context
6. Auto-correction engine resolves ambiguities
7. Confidence scoring applied
8. If confidence < threshold → manual review UI
9. Final PGN stored/exported

---

## 5. Input Types Supported

- PDF (multi-page)
- JPG / PNG scans
- Mobile camera images

Each input may contain:
- One player’s notation
- Both players’ notation (consecutive pages)
- Corrections, overwrites, arrows

---

## 6. OCR & Vision Layer

### 6.1 Preprocessing

- Grayscale conversion
- Adaptive thresholding
- Line detection (scoresheet rows)
- Noise removal (pen bleed, shadows)

### 6.2 OCR Engines

| Engine | Purpose |
|------|--------|
| Tesseract | Fast baseline OCR |
| TrOCR (ONNX) | Handwriting OCR |
| VLM (MLX/Qwen) | Context-aware understanding |

The system supports **multi-engine fusion** where outputs are merged and scored.

---

## 7. Chess Parsing Layer

### 7.1 SAN Parsing

- Supports algebraic notation
- Handles:
  - Castling (O-O, O-O-O)
  - Captures
  - Promotions
  - Checks / mates

### 7.2 Move Disambiguation

If OCR yields ambiguous tokens:

- `b5` vs `65`
- `Nf3` vs `Ng3`

The parser generates candidates and defers to validator.

---

## 8. Validation & Auto‑Correction

### 8.1 Rule-Based Validation

- Uses python-chess for legality
- Validates move sequence incrementally

### 8.2 Contextual Correction

Uses:

- Previous move
- Next move
- Board state
- Dual scoresheet reconciliation

Example:

```
White: Nf3
Black: Nf6
OCR sees: "Nf6" twice → second rejected
```

---

## 9. Dual Scoresheet Reconciliation

When both players’ notation is available:

- Moves aligned by ply
- Disagreements flagged
- Majority / legality resolution applied
- Manual override if needed

This significantly improves accuracy in junior tournaments.

---

## 10. Confidence Scoring Model

Each move receives a confidence score based on:

- OCR certainty
- Parser certainty
- Validation success
- Agreement across engines/sheets

Thresholds:

- ≥0.90 → auto-accept
- 0.70–0.89 → soft accept
- <0.70 → manual review

---

## 11. Manual Review UI

Features:

- Highlight ambiguous moves
- Show board position
- Show both players’ notation
- One-click correction suggestions
- Keyboard-first workflow

No blindfold functionality is modified or affected.

---

## 12. Storage & Export

### 12.1 Database

- SQLite (local)
- Schema:
  - Games
  - Moves
  - Confidence
  - Review status

### 12.2 Export Formats

- PGN
- Annotated PGN
- CSV (optional)

---

## 13. Offline & Fallback Strategy

### Local First

- Runs fully on local machine (Mac Mini M4 optimized)
- MLX / ONNX execution

### Optional Cloud Fallback

- Triggered only when enabled
- Sanitized image crops
- No raw PDFs uploaded

---

## 14. Security Considerations

- No internet required by default
- Explicit user consent for cloud usage
- No permanent cloud storage

---

## 15. Testing Strategy

### Automated

- OCR regression tests (golden images)
- SAN parsing tests
- Full-game legality tests

### Manual

- Tournament sample PDFs
- Stress tests (poor handwriting)

---

## 16. Performance Targets

- <2s per page (local M4)
- Batch-friendly (100+ pages)
- Memory bounded (unified memory aware)

---

## 17. Future Extensions

- Opening-aware correction (ECO)
- Player handwriting profiles
- Tournament integration exports
- Federations bulk upload mode

---

## 18. Design Principles Recap

- Chess rules > OCR text
- Deterministic corrections first
- Human override always available
- Offline-first
- Tournament-realistic workflows

---

## 19. Conclusion

This design positions **Chess-in-One OCR** as a practical, chess-native digitization system—not a generic OCR tool. The emphasis on legality, context, and reconciliation makes it suitable for real-world tournament usage, especially for youth chess where handwritten notation quality varies widely.

---

## 20. Training Plan – TrOCR and olmOCR (NEW)

This section defines a **concrete, reproducible training strategy** for both **TrOCR** (cell-level handwriting OCR) and **olmOCR / VLM-style models** (context-aware page understanding), explicitly aligned with how inference is performed in this project.

---

## 21. Ground Truth & Dataset Assumptions

You currently have:

- `training-data/`
  - `images/` → 158 handwritten scoresheet images
  - `labels/` → ground-truth move text (line- or cell-aligned)

Key assumptions validated for this design:

- Inference is **cell-based**, not full-page
- Each move cell corresponds to **one SAN token** (e.g., `Nf3`, `exd5`, `O-O`)
- Training must therefore **match inference granularity exactly**

⚠️ This is critical: **TrOCR must be trained on cell crops, not pages**.

---

## 22. Inference Granularity (Confirmed Design)

### 22.1 How Images Are Given to Models

**TrOCR**
- Input: single move cell image
- Output: raw text string (no chess logic)

**olmOCR / VLM**
- Input: page OR multi-cell context
- Output: structured text with implicit chess understanding

### 22.2 Why Cell-Level Is Mandatory for TrOCR

- Handwritten chess notation is highly ambiguous (`b` vs `6`, `O` vs `0`)
- TrOCR is sequence-to-sequence but **context-blind**
- Cell-level crops reduce noise and overfitting

Therefore:

```
PDF/Image
  → Page crop
    → Line detection
      → Cell crop (this is the TrOCR unit)
```

---

## 23. TrOCR Training Plan (Primary OCR Engine)

### 23.1 Objective

Train a **handwriting-specialized TrOCR model** that:

- Reads isolated chess notation cells
- Outputs clean SAN-like strings
- Defers legality to downstream validation

---

### 23.2 Dataset Preparation (MOST IMPORTANT STEP)

#### Step 1: Cell Extraction

For each of the 158 images:

- Detect notation grid (rows × columns)
- Extract **one image per move cell**
- Save as:

```
training-data/
  trocr/
    images/
      img_0001.png
      img_0002.png
    labels/
      img_0001.txt  # e4
      img_0002.txt  # Nf3
```

Target size:
- ~40–60 moves per game
- Expected total samples: **6,000–9,000 cells**

---

### 23.3 Label Normalization

Apply strict normalization:

- Trim whitespace
- Normalize castling (`O-O`, `O-O-O` only)
- Strip annotations (`! ? + #`) **only if inconsistent**

❌ Do NOT inject chess corrections here

---

### 23.4 Base Model Selection

Recommended:

- `microsoft/trocr-base-handwritten`
- Encoder: ViT
- Decoder: RoBERTa-style

Reason:
- Already trained on handwriting
- Small enough to fine-tune locally

---

### 23.5 Training Strategy

| Phase | Description |
|-----|------------|
| Warm-up | Freeze encoder, train decoder only |
| Fine-tune | Unfreeze last N encoder layers |
| Stabilize | Lower LR, longer epochs |

Key hyperparameters:

- Image size: 384×384
- Batch size: 16–32
- LR: 5e-5 → 1e-5
- Epochs: 20–30

---

### 23.6 Augmentation (Light Only)

Allowed:

- Small rotation (±2°)
- Contrast jitter
- Gaussian noise

Forbidden:

- Horizontal flip ❌
- Heavy warping ❌

---

### 23.7 Evaluation Metrics

- Character Error Rate (CER)
- Token Accuracy (exact match)

Chess-specific metric:

- % of outputs parsable as SAN

---

## 24. olmOCR / VLM Training Plan (Context Engine)

olmOCR is **NOT a replacement for TrOCR**.
It is a **contextual arbitrator** used when TrOCR confidence is low.

---

### 24.1 Objective

Teach the model to:

- Understand chess notation patterns
- Use previous/next moves implicitly
- Resolve ambiguous handwriting

---

### 24.2 Training Format

olmOCR training samples are **multi-cell or page-level**.

Example input:

```
<Image: cropped page>
Prompt:
"Transcribe the chess moves row by row. Use standard algebraic notation."
```

Output:

```
1. e4 e5
2. Nf3 Nc6
3. Bb5 a6
```

---

### 24.3 Dataset Construction from Existing 158 Images

Reuse the same data:

- Group cell crops back into rows
- Preserve ordering
- Generate full-move ground truth

This yields:

- ~158 high-quality page samples
- Small but **very dense** domain signal

---

### 24.4 Model Choices (MLX-friendly)

Recommended:

- Qwen2-VL (7B / 13B)
- olmOCR-style instruction-tuned VLM

Training mode:

- LoRA / QLoRA only
- No full fine-tuning

---

### 24.5 Prompt Curriculum

Stage 1:

- Clean handwriting
- Explicit prompts

Stage 2:

- Noisy handwriting
- Minimal prompts

Stage 3:

- Ambiguous characters
- Implicit correction expected

---

### 24.6 Evaluation Criteria

- Full-line accuracy
- Move legality rate
- Agreement with TrOCR + validator

---

## 25. Model Exclusivity & Provider Selection (UPDATED)

To control **memory usage, latency, and operational complexity**, the system **MUST NOT load TrOCR and olmOCR simultaneously**.

Instead, they are treated as **mutually exclusive OCR providers**, selectable by the user from the GUI.

At runtime:

- **Exactly ONE OCR provider is loaded into memory**
- The other provider remains completely unloaded
- No shared inference, arbitration, or fallback occurs

This design is intentional and mandatory.

---

## 26. Provider Modes (User-Selectable)

### 26.1 Provider A – TrOCR (Cell-Level OCR Mode)

**Purpose:**

- Fast, low-memory, deterministic OCR
- Optimized for laptops and local-only execution

**Pipeline:**

```
PDF/Image
 → Page preprocessing
   → Line detection
     → Cell crop
       → TrOCR
         → Chess parser
           → Validator
             → Auto-correction
```

**Characteristics:**

- OCR unit = single move cell
- No visual context beyond the cell
- Chess legality drives correction
- Lowest RAM / VRAM footprint

**Failure handling:**

- If a move is ambiguous but illegal → corrected by validator
- If multiple legal candidates exist → flagged for manual review

❗ No VLM assistance is used in this mode.

---

### 26.2 Provider B – olmOCR / VLM (Context OCR Mode)

**Purpose:**

- Context-aware transcription
- Superior at messy handwriting and overwrites

**Pipeline:**

```
PDF/Image
 → Page preprocessing
   → Page or multi-row crop
     → olmOCR / VLM
       → Chess parser
         → Validator
           → Manual review (if needed)
```

**Characteristics:**

- OCR unit = full page or row block
- Implicit chess understanding
- Higher memory usage
- Slower but more tolerant

**Failure handling:**

- Illegal moves rejected by validator
- Ambiguities shown directly in review UI

❗ No TrOCR inference is used in this mode.

---

## 27. Training Plan – TrOCR (Standalone Provider)

### 27.1 Training Scope

TrOCR is trained **exclusively for cell-level inference**.

- One image = one move
- No page context
- No chess-rule injection during training

This guarantees:

- Low memory inference
- Predictable behavior
- Clean separation of concerns

---

### 27.2 Dataset Preparation

(unchanged, but now explicitly standalone)

- Extract move cells from 158 images
- Expected samples: 6k–9k
- Labels = raw SAN strings

Directory:

```
training-data/
  trocr/
    images/
    labels/
```

---

### 27.3 Training & Evaluation

Same as previously defined:

- Base: `microsoft/trocr-base-handwritten`
- CER + SAN parsability
- No context-based loss terms

---

## 28. Training Plan – olmOCR / VLM (Standalone Provider)

### 28.1 Training Scope

olmOCR is trained **as a full OCR provider**, not a fallback.

- Operates independently
- No reliance on TrOCR outputs

---

### 28.2 Dataset Construction

From the same 158 images:

- Preserve page layout
- Group rows correctly
- Ground truth = full move list

Each sample is self-contained.

---

### 28.3 Training Method

- LoRA / QLoRA only
- No full fine-tuning
- Prompted as sole transcriber

Example:

```
<Image>
"Transcribe all chess moves in standard algebraic notation."
```

---

## 29. Memory & Runtime Guarantees

| Mode | Loaded Models | Memory Profile |
|----|---------------|----------------|
| TrOCR | TrOCR only | Low |
| olmOCR | VLM only | High |

There is **no scenario** where both are loaded.

---

## 30. Design Rationale (UPDATED)

This separation ensures:

- Predictable memory usage
- Simple debugging
- Clear UX choice
- Safe offline operation

The GUI provider switch is therefore a **hard architectural boundary**, not a cosmetic option.



- TrOCR is fast and precise at micro-level
- olmOCR understands chess as a language
- Validator guarantees correctness

This avoids:

❌ Over-reliance on VLM hallucinations
❌ Overfitting TrOCR to chess rules

---

## 27. Scaling Beyond 158 Images

Once deployed:

- Collect corrected cells
- Auto-add to training buffer
- Periodic TrOCR fine-tuning
- Monthly LoRA refresh for olmOCR

---

## 28. Final Recommendation

- **Train TrOCR first** (mandatory)
- Use olmOCR only as a resolver
- Keep inference cell-based
- Let chess rules dominate decisions

This ensures maximum accuracy with minimum model risk.

