#!/bin/bash

# Test Scenario Generator Chrome Extension Installation Script

echo "🧪 Test Scenario Generator Chrome Extension"
echo "==========================================="
echo ""

# Check if Chrome is installed
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux specific checks
    if ! command -v google-chrome &> /dev/null && \
       ! command -v chromium-browser &> /dev/null && \
       ! command -v google-chrome-stable &> /dev/null; then
        echo "❌ Chrome or Chromium browser not found!"
        echo "Please install Chrome or Chromium first."
        exit 1
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS specific checks
    if ! mdfind "kMDItemKind == 'Application' && kMDItemFSName == 'Google Chrome.app'" &> /dev/null && \
       ! mdfind "kMDItemKind == 'Application' && kMDItemFSName == 'Chromium.app'" &> /dev/null; then
        echo "❌ Google Chrome or Chromium browser application not found on macOS!"
        echo "Please install Chrome or Chromium first."
        exit 1
    fi
else
    # Generic fallback for other OS, e.g., Windows (Git Bash/WSL)
    if ! command -v google-chrome &> /dev/null && ! command -v chromium-browser &> /dev/null; then
        echo "❌ Chrome or Chromium browser not found!"
        echo "Please install Chrome or Chromium first."
        exit 1
    fi
fi

echo "✅ Chrome/Chromium browser detected"
echo ""

# Create icons directory if it doesn't exist
mkdir -p icons

# Create PNG icons from SVG
if command -v convert &> /dev/null; then
    echo "📸 Creating PNG icons from SVG using ImageMagick..."
    convert -background transparent icons/icon.svg -resize 16x16 icons/icon16.png
    convert -background transparent icons/icon.svg -resize 48x48 icons/icon48.png
    convert -background transparent icons/icon.svg -resize 128x128 icons/icon128.png
    echo "✅ Icons created successfully using ImageMagick"
elif command -v rsvg-convert &> /dev/null; then
    echo "📸 Creating PNG icons from SVG using rsvg-convert..."
    rsvg-convert -w 16 -h 16 icons/icon.svg -o icons/icon16.png
    rsvg-convert -w 48 -h 48 icons/icon.svg -o icons/icon48.png
    rsvg-convert -w 128 -h 128 icons/icon.svg -o icons/icon128.png
    echo "✅ Icons created successfully using rsvg-convert"
else
    echo "⚠️  Neither ImageMagick (convert) nor rsvg-convert found."
    echo "   Please create the following PNG icons manually:"
    echo "   - icons/icon16.png (16x16 pixels)"
    echo "   - icons/icon48.png (48x48 pixels)"
    echo "   - icons/icon128.png (128x128 pixels)"
fi

echo ""
echo "🚀 Installation Steps:"
echo "1. Open Chrome and navigate to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked' button"
echo "4. Select this directory: $(pwd)"
echo "5. The extension will appear in your Chrome toolbar"
echo ""
echo "⚙️  Configuration:"
echo "1. Click the extension icon in Chrome toolbar"
echo "2. Go to 'Settings' tab"
echo "3. Select your AI provider (OpenAI, Gemini, or DeepSeek)"
echo "4. Enter your API key"
echo "5. Save settings and start generating test scenarios!"
echo ""
echo "📚 For detailed instructions, see README.md"
echo ""
echo "✅ Extension files are ready for installation!"