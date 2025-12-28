#!/bin/bash

# 0. Ensure common paths are in PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Load NVM if it exists
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Load User Profile for Node/NPM
if [ -f "$HOME/.zshrc" ]; then
    source "$HOME/.zshrc" 2>/dev/null
elif [ -f "$HOME/.bash_profile" ]; then
    source "$HOME/.bash_profile" 2>/dev/null
fi

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
# Ensure Tesseract can find its data files (Relative to brew prefix)
TESS_PREFIX=$(brew --prefix tesseract 2>/dev/null)
if [ ! -z "$TESS_PREFIX" ]; then
    export TESSDATA_PREFIX="$TESS_PREFIX/share/tessdata"
fi

# Kill existing uvicorn on port 8000 and vite on port 1421
lsof -ti:8000,1421 | xargs kill -9 2>/dev/null

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
    # Get the process group ID
    PGID=$(ps -o pgid= -p $$ | tr -d ' ')
    # Kill the entire process group
    kill -TERM -$PGID 2>/dev/null
    # Force kill anything on our ports just in case
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    lsof -ti:1421 | xargs kill -9 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

npm run dev -- --port 1421
