# Fabian's Test Generator Chrome Extension

A powerful Chrome extension that generates comprehensive test scenarios and edge cases from documentation, web pages, and manual input using AI APIs (OpenAI, Gemini, DeepSeek).

## Features

- **Multi-Source Analysis**: Extract content from current web pages, uploaded documents, or manual input
- **AI-Powered Generation**: Support for OpenAI GPT-4, Google Gemini, and DeepSeek APIs
- **Comprehensive Test Scenarios**: Generate functional, non-functional, edge cases, and boundary tests
- **Excel Export**: Download generated scenarios as CSV/Excel files
- **Smart Content Extraction**: Automatically identifies requirements, specifications, and testable elements
- **Priority Classification**: Categorizes tests by priority (high, medium, low)
- **Edge Case Detection**: Specifically focuses on boundary conditions and edge cases

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your Chrome toolbar

## Setup

1. Click the extension icon to open the popup
2. Go to the "Settings" tab
3. Select your preferred AI provider (OpenAI, Gemini, or DeepSeek)
4. Enter your API key for the selected provider
5. Configure generation options (edge cases, negative tests, etc.)
6. Click "Save Settings"

## Usage

### From Web Pages
1. Navigate to any webpage with documentation or requirements
2. Open the extension popup
3. Ensure "Current Page" is selected as the content source
4. Click "Generate Test Scenarios"
5. View results in the "Results" tab
6. Download as Excel or copy to clipboard

### From Documents
1. Open the extension popup
2. Select "Upload Document" as the content source
3. Upload a text document (.txt, .pdf, .doc, .docx)
4. **Note**: DOCX and PDF files are currently processed as plain text, which might result in loss of formatting or specific content.
5. Click "Generate Test Scenarios"

### Manual Input
1. Open the extension popup
2. Select "Manual Input" as the content source
3. Paste your requirements or specifications
4. Click "Generate Test Scenarios"

## API Configuration

### OpenAI
- Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Uses GPT-4 model for best results
- Requires billing setup on OpenAI account

### Google Gemini
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Uses Gemini Pro model
- Free tier available with usage limits

### DeepSeek
- Get your API key from [DeepSeek Platform](https://platform.deepseek.com/)
- Uses DeepSeek Chat model
- Competitive pricing for API usage

## Generated Test Scenarios Include

- **Functional Tests**: Core functionality validation
- **Non-Functional Tests**: Performance, security, usability
- **Edge Cases**: Boundary conditions and extreme scenarios
- **Negative Tests**: Error handling and invalid input scenarios
- **Integration Tests**: Component interaction scenarios
- **Regression Tests**: Backward compatibility scenarios

## Output Format

Each test scenario includes:
- Unique ID and title
- Detailed description
- Test type classification
- Priority level
- Preconditions
- Step-by-step test procedures
- Expected results
- Actual results
- Status
- Scenario Type
- Comments

## File Structure

```
test-generator-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content.js            # Content script for page extraction
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── styles/
│   └── popup.css         # Popup styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Privacy & Security

- API keys are stored locally in Chrome's sync storage
- No data is transmitted except to your chosen AI provider
- Content analysis happens locally in the browser
- Generated scenarios are not stored or transmitted

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify your API key is correct and active
   - Check if you have sufficient credits/quota
   - Ensure billing is set up for paid APIs

2. **Content Not Extracted**
   - Refresh the webpage and try again
   - Some pages may have anti-scraping measures
   - Try using manual input as an alternative

3. **Generation Fails**
   - Check your internet connection
   - Verify API provider status
   - Try with shorter content input

### Error Messages

- "Please enter your API key": Configure API settings first
- "No content available": Ensure content source is properly selected
- "API error": Check your API key and provider status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please create an issue in the repository.
