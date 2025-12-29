# TRAINING_OLMOCR.md

## Purpose

This document defines the **standalone training and usage** of **olmOCR / VLM-based OCR** as an **independent provider** in *Chess‑in‑One OCR*.

olmOCR is a **context‑aware OCR engine**, not a fallback and not used alongside TrOCR.

---

## 1. Scope & Constraints

- **Inference granularity:** full page or multi‑row blocks
- **Context:** implicit (visual + textual)
- **Responsibility:** full transcription only
- **Chess rules:** enforced post‑OCR only

olmOCR trades memory and latency for robustness.

---

## 2. Dataset Construction

From the same 158 scoresheets:

```
training-data/
  olmocr/
    images/
      page_0001.png
    labels/
      page_0001.txt
```

Labels contain:
```
1. e4 e5
2. Nf3 Nc6
3. Bb5 a6
```

Ordering and formatting **must be preserved**.

---

## 3. Model Choices

Recommended (MLX / GPU friendly):

- Qwen2‑VL‑7B or 13B
- olmOCR‑style instruction‑tuned VLM

Training method:
- LoRA / QLoRA only

---

## 4. Prompt Design

Base prompt:
```
You are transcribing handwritten chess notation.
Return standard algebraic notation only.
Do not explain.
```

---

## 5. Training Strategy

### Stage 1 – Clean Pages

- Explicit prompts
- No noise

### Stage 2 – Noisy Handwriting

- Minimal prompts
- Overwrites allowed

### Stage 3 – Ambiguity Handling

- Cross‑row reasoning
- Consistent move numbering

---

## 6. Evaluation Metrics

- Full‑line accuracy
- Move legality rate after parsing
- PGN completeness

Target:
- ≥98% legal move rate

---

## 7. Provider‑Specific Config Schema

```yaml
olmocr:
  model_name: qwen2-vl-7b
  lora_path: models/olmocr-lora
  max_image_size: 1024
  temperature: 0.0
  device: mps   # cuda | mps
```

---

## 8. Inference Pseudo‑Code (olmOCR Provider)

```python
text = olmocr.generate(page_image, prompt)

moves = parse_moves(text)

for move in moves:
    if not is_legal(move, board):
        flag_for_review(move)
        break
    board.push(move)
```

---

## 9. Memory Guarantees

- Only the VLM is loaded
- No TrOCR, no cell models
- Clear GPU / unified memory budgeting

---

## 10. Failure Modes

| Issue | Handling |
|----|--------|
| Hallucinated move | validator rejection |
| Missing move | manual review |
| Wrong numbering | parser normalization |

---

## 11. Summary

olmOCR provides **maximum handwriting tolerance** at the cost of memory. It is ideal when handwriting quality is poor and hardware allows.

