# How to Configure Online OCR (Free for Personal Use)

This application supports online OCR services for significantly better handwriting recognition. These services offer generous free tiers for personal use.

## 1. Google Cloud Vision API (Recommended)

Google Cloud offers **1,000 free units per month**, which is sufficient for processing hundreds of game sheets monthly.

### Steps to Get a Free API Key:
1.  **Go to Google Cloud Console:** [https://console.cloud.google.com/](https://console.cloud.google.com/)
2.  **Create a Project:** Click the project dropdown (top left) -> "New Project". Name it "Chess OCR".
3.  **Enable the API:**
    - Search for "Cloud Vision API" in the search bar.
    - Click "Enable".
4.  **Create Credentials:**
    - Go to "APIs & Services" -> "Credentials".
    - Click "Create Credentials" -> "API Key".
    - **Important:** Copy this key.
5.  **Configure App:**
    - Open Chess OCR App.
    - Go to "Settings" -> "OCR Configuration".
    - Select "Online API" -> "Google Cloud Vision".
    - Paste your API Key.

## 2. Microsoft Azure Computer Vision

Azure offers a free tier (F0) allowing **20 calls per minute** and **5,000 calls per month**.

### Steps to Get a Free API Key:
1.  **Go to Azure Portal:** [https://portal.azure.com/](https://portal.azure.com/)
2.  **Create a Resource:** Search for "Computer Vision".
3.  **Click Create:**
    - Subscription: "Azure for Students" or "Pay-As-You-Go" (Free tier available on both).
    - Pricing Tier: Select **Free F0**.
4.  **Get Keys:**
    - Once deployed, go to the resource.
    - Click "Keys and Endpoint" in the left menu.
    - Copy "Key 1".
5.  **Configure App:**
    - Open Chess OCR App.
    - Select "Azure Computer Vision".
    - Paste the Key.

## 3. Local Model (TrOCR)
If you prefer not to use cloud services, you can use the local model.
- **Privacy:** No data leaves your computer.
- **Cost:** Free.
- **Performance:** Slower and less accurate on messy handwriting than cloud APIs.
