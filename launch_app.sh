#!/bin/bash

# Configuration
VENV_PATH="/Users/mreddy.adulla/.pyenv/versions/.venv"
ROOT_DIR="$(pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "🚀 Starting Chess OCR Environment Setup..."

# 1. Activate Venv
if [ -d "$VENV_PATH" ]; then
    echo "✅ Found virtual environment at $VENV_PATH"
    source "$VENV_PATH/bin/activate"
else
    echo "❌ Virtual environment NOT found at $VENV_PATH"
    exit 1
fi

# 2. Install/Update Dependencies
echo "📦 Checking dependencies..."
if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    # Simply install requirements. onnxruntime works on Mac Silicon now via standard pip install
    pip install -r "$BACKEND_DIR/requirements.txt" --quiet
else
    echo "⚠️ Warning: requirements.txt not found in backend/"
fi

# 3. Start Backend in background
echo "🔌 Launching FastAPI Backend..."
export PYTHONPATH="$ROOT_DIR"

# Kill existing uvicorn on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Run from root
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 4. Start Frontend
echo "🎨 Launching Vite Frontend..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "  (Installing node modules...)"
    npm install --quiet
fi

cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

npm run dev -- --port 1421
