# OCR Performance Benchmarks

## Google Cloud Vision (Handwriting)
- **Accuracy:** Very High for unconstrained handwriting.
- **Latency:** ~1-2 seconds per page.
- **Cost:** 1000 units free per month (Personal use).

## Azure Computer Vision (Read API)
- **Accuracy:** Excellent.
- **Latency:** ~1.5 seconds.
- **Cost:** Free tier available (limited requests per minute).

## Local TrOCR (Large)
- **Accuracy:** Good for clean handwriting.
- **Latency:** Dependent on hardware (CPU: 5-10s, GPU: <1s).
- **Cost:** Free/Open Source.

## Recommendations
1. Use **Google Cloud Vision** for best results if comfortable with cloud.
2. Use **Local TrOCR** for privacy or if offline.
