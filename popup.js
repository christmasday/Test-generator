// Popup script for handling user interface interactions

class PopupController {
  constructor() {
    this.currentTab = 'generate';
    this.currentSource = 'current-page';
    this.testResults = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.setupTabs();
    // Only load current page content if the source is set to current-page
    if (this.currentSource === 'current-page') {
      this.loadCurrentPageContent();
    }
    // Note: toggleModelVisibility() is now called in loadSettingsContent() when settings are loaded

    // PING TEST: Test background connection on popup load
    chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
      console.log('Ping response from background:', response);
    });
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Source selection
    document.querySelectorAll('.source-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchSource(e.target.dataset.source);
      });
    });

    // Document upload
    document.getElementById('documentUpload').addEventListener('change', (e) => {
      this.handleDocumentUpload(e.target.files[0]);
    });

    // Generate scenarios
    document.getElementById('generateScenarios').addEventListener('click', () => {
      this.generateTestScenarios();
    });

    // Results actions
    document.getElementById('downloadExcel').addEventListener('click', () => {
      this.downloadExcel();
    });

    document.getElementById('downloadJSON').addEventListener('click', () => {
      this.downloadJSON();
    });

    document.getElementById('copyToClipboard').addEventListener('click', () => {
      this.copyToClipboard();
    });

    // Gear settings button
    const gearButton = document.getElementById('gearSettings');
    console.log('Gear button element:', gearButton);
    if (gearButton) {
      gearButton.addEventListener('click', () => {
        console.log('Gear button clicked!');
        this.showSettingsTab();
      });
    } else {
      console.error('Gear button not found!');
    }
  }

  setupTabs() {
    this.switchTab('generate');
  }

  showSettingsTab() {
    console.log('showSettingsTab called');
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });
    // Show settings tab
    const settingsTab = document.getElementById('settings');
    console.log('Settings tab element:', settingsTab);
    if (settingsTab) {
      settingsTab.style.display = 'block';
      settingsTab.classList.add('active');
      this.currentTab = 'settings';
      // Load settings content dynamically
      this.loadSettingsContent();
    } else {
      console.error('Settings tab element not found!');
    }
  }

  loadSettingsContent() {
    const settingsContent = document.getElementById('settings-content');
    settingsContent.innerHTML = `
      <div class="form-group">
        <label for="apiProvider">AI Provider:</label>
        <select id="apiProvider">
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
          <option value="deepseek">DeepSeek</option>
        </select>
      </div>
      <div class="form-group" id="openaiModelGroup">
        <label for="openaiModel">OpenAI Model:</label>
        <select id="openaiModel">
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>
      <div class="form-group" id="geminiModelGroup" style="display: none;">
        <label for="geminiModel">Gemini Model:</label>
        <select id="geminiModel">
          <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
        </select>
      </div>
      <div class="form-group" id="deepseekModelGroup" style="display: none;">
        <label for="deepseekModel">DeepSeek Model:</label>
        <select id="deepseekModel">
          <option value="deepseek-chat">DeepSeek Chat</option>
          <option value="deepseek-coder">DeepSeek Coder</option>
        </select>
      </div>
      <div class="form-group">
        <label for="apiKey">API Key:</label>
        <input type="password" id="apiKey" placeholder="Enter your API key">
        <small>Your API key is stored locally and never shared</small>
      </div>
      <button id="saveSettings" class="btn btn-primary">Save Settings</button>
      <button id="backToGenerate" class="btn btn-secondary">Back to Generate</button>
    `;
    
    // Re-setup event listeners for dynamically created elements
    this.setupSettingsEventListeners();
    this.loadSettings();
    this.toggleModelVisibility(); // Set initial visibility after elements are created
  }

  setupSettingsEventListeners() {
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('backToGenerate').addEventListener('click', () => {
      this.switchTab('generate');
    });

    document.getElementById('apiProvider').addEventListener('change', () => {
      this.toggleModelVisibility();
    });

    document.getElementById('openaiModel').addEventListener('change', () => {
      this.saveSettings();
    });

    document.getElementById('deepseekModel').addEventListener('change', () => {
      this.saveSettings();
    });

    document.getElementById('geminiModel').addEventListener('change', () => {
      this.saveSettings();
    });
  }

  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });
    // Show selected tab
    const tab = document.getElementById(tabName);
    tab.style.display = 'block';
    tab.classList.add('active');
    this.currentTab = tabName;
    if (tabName === 'results' && this.testResults) {
      this.displayResults();
    }
  }

  switchSource(source) {
    // Update source buttons
    document.querySelectorAll('.source-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-source="${source}"]`).classList.add('active');

    // Show/hide sections
    document.getElementById('current-page-section').style.display = source === 'current-page' ? 'block' : 'none';
    document.getElementById('document-section').style.display = source === 'document' ? 'block' : 'none';
    // Removed web-link-section and manual-section visibility toggles

    this.currentSource = source;
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'apiProvider', 'apiKey', 'autoGenerate', 'openaiModel', 'deepseekModel', 'geminiModel',
        'includeEdgeCases', 'includeNegativeTests', 'includePerformanceTests', 'includeSecurityTests'
      ]);
      
      // Store API key for use in generation
      this.apiKey = result.apiKey || '';
      
      // Load settings for elements that exist (settings form elements)
      const apiProviderEl = document.getElementById('apiProvider');
      if (apiProviderEl) {
        apiProviderEl.value = result.apiProvider || 'openai';
      }
      
      const apiKeyEl = document.getElementById('apiKey');
      if (apiKeyEl) {
        apiKeyEl.value = result.apiKey || '';
      }
      
      const openaiModelEl = document.getElementById('openaiModel');
      if (openaiModelEl) {
        openaiModelEl.value = result.openaiModel || 'gpt-3.5-turbo';
      }
      
      const deepseekModelEl = document.getElementById('deepseekModel');
      if (deepseekModelEl) {
        deepseekModelEl.value = result.deepseekModel || 'deepseek-chat';
      }
      
      const geminiModelEl = document.getElementById('geminiModel');
      if (geminiModelEl) {
        geminiModelEl.value = result.geminiModel || 'gemini-2.5-pro';
      }
      
      // Load checkbox states (these exist on the generate tab)
      const includeEdgeCasesEl = document.getElementById('includeEdgeCases');
      if (includeEdgeCasesEl) {
        includeEdgeCasesEl.checked = result.includeEdgeCases !== false;
      }
      
      const includeNegativeTestsEl = document.getElementById('includeNegativeTests');
      if (includeNegativeTestsEl) {
        includeNegativeTestsEl.checked = result.includeNegativeTests !== false;
      }
      
      const includePerformanceTestsEl = document.getElementById('includePerformanceTests');
      if (includePerformanceTestsEl) {
        includePerformanceTestsEl.checked = result.includePerformanceTests || false;
      }
      
      const includeSecurityTestsEl = document.getElementById('includeSecurityTests');
      if (includeSecurityTestsEl) {
        includeSecurityTestsEl.checked = result.includeSecurityTests || false;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      const settings = {};
      
      // Only save settings for elements that exist
      const apiProviderEl = document.getElementById('apiProvider');
      if (apiProviderEl) {
        settings.apiProvider = apiProviderEl.value;
      }
      
      const apiKeyEl = document.getElementById('apiKey');
      if (apiKeyEl) {
        settings.apiKey = apiKeyEl.value;
        this.apiKey = apiKeyEl.value; // Update stored API key
      }
      
      const openaiModelEl = document.getElementById('openaiModel');
      if (openaiModelEl) {
        settings.openaiModel = openaiModelEl.value;
      }
      
      const deepseekModelEl = document.getElementById('deepseekModel');
      if (deepseekModelEl) {
        settings.deepseekModel = deepseekModelEl.value;
      }
      
      const geminiModelEl = document.getElementById('geminiModel');
      if (geminiModelEl) {
        settings.geminiModel = geminiModelEl.value;
      }
      
      const includeEdgeCasesEl = document.getElementById('includeEdgeCases');
      if (includeEdgeCasesEl) {
        settings.includeEdgeCases = includeEdgeCasesEl.checked;
      }
      
      const includeNegativeTestsEl = document.getElementById('includeNegativeTests');
      if (includeNegativeTestsEl) {
        settings.includeNegativeTests = includeNegativeTestsEl.checked;
      }
      
      const includePerformanceTestsEl = document.getElementById('includePerformanceTests');
      if (includePerformanceTestsEl) {
        settings.includePerformanceTests = includePerformanceTestsEl.checked;
      }
      
      const includeSecurityTestsEl = document.getElementById('includeSecurityTests');
      if (includeSecurityTestsEl) {
        settings.includeSecurityTests = includeSecurityTestsEl.checked;
      }

      await chrome.storage.sync.set(settings);
      this.showMessage('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showMessage('Error saving settings', 'error');
    }
  }

  async loadCurrentPageContent() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Update page info
      document.getElementById('current-url').textContent = tab.url;
      document.getElementById('current-title').textContent = tab.title;

      // Get content from content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
      
      if (response && response.success && response.content) {
        const content = response.content;
        document.getElementById('content-length').textContent = content.text.length;
        
        // Display document type information
        this.displayDocumentTypeInfo(content);
        
        // Display extracted requirements
        if (content.requirements && content.requirements.length > 0) {
          const requirementsPreview = document.getElementById('extracted-requirements');
          requirementsPreview.innerHTML = content.requirements.slice(0, 5).map(req => 
            `<div class="requirement-item">${req.substring(0, 100)}...</div>`
          ).join('');
        }
      }
    } catch (error) {
      console.error('Error loading page content:', error);
    }
  }

  handleDocumentUpload(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      if (!content || content.trim().length === 0) {
        document.getElementById('document-preview').innerHTML =
          `<div class="error-message">Error: Could not extract readable text from ${file.name}. Please try a different file or use manual input.</div>`;
        this.showMessage(`Error: Could not extract readable text from ${file.name}.`, 'error');
      } else {
        document.getElementById('document-preview').innerHTML =
          `<div class="success-message">Document loaded: ${file.name} (${content.length} characters)</div>`;
        // Clarify that DOCX/PDF are treated as plain text if applicable
        if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
          this.showMessage('Note: DOCX and PDF files are currently processed as plain text.', 'info');
        }
      }
    };
    reader.onerror = () => {
      document.getElementById('document-preview').innerHTML =
        `<div class="error-message">Error reading file: ${file.name}</div>`;
      this.showMessage(`Error reading file: ${file.name}`, 'error');
    };
    reader.readAsText(file);
  }

  // Removed listAvailableGeminiModels function

  // Utility: Check if content script is available in the current tab
  async isContentScriptAvailable() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('Checking content script availability for tab:', tab.id, tab.url);
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
      console.log('Ping response:', response);
      return !!response;
    } catch (e) {
      console.log('Content script not available, error:', e.message);
      return false;
    }
  }

  async generateTestScenarios() {
    // Load settings from storage
    const settings = await chrome.storage.sync.get(['apiKey', 'apiProvider', 'openaiModel', 'deepseekModel', 'geminiModel']);
    const apiKey = settings.apiKey;
    const apiProvider = settings.apiProvider || 'openai';
    
    if (!apiKey) {
      this.updateStatus('Please enter your API key in Settings', 'error');
      this.showSettingsTab();
      return;
    }

    // Determine the selected model based on the API provider
    let selectedModel = '';
    if (apiProvider === 'openai') {
      selectedModel = settings.openaiModel || 'gpt-3.5-turbo';
    } else if (apiProvider === 'deepseek') {
      selectedModel = settings.deepseekModel || 'deepseek-chat';
    } else if (apiProvider === 'gemini') {
      selectedModel = settings.geminiModel || 'gemini-2.5-pro';
    }

    // Show progress
    document.getElementById('generation-progress').style.display = 'block';
    document.getElementById('generateScenarios').disabled = true;
    this.updateStatus('Preparing request...', 'info');

    try {
      let content = '';

      // Get content based on selected source
      switch (this.currentSource) {
        case 'current-page':
          this.updateStatus('Checking page availability...', 'info');
          // Check if content script is available
          if (!(await this.isContentScriptAvailable())) {
            this.updateStatus('Content script not available. Attempting to inject...', 'info');
            // Try to inject the content script manually
            try {
              await chrome.scripting.executeScript({
                target: { tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id },
                files: ['content.js']
              });
              this.updateStatus('Content script injected. Retrying...', 'info');
              // Wait a moment for the script to initialize
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (injectError) {
              console.error('Failed to inject content script:', injectError);
              this.updateStatus('Current Page analysis is not available on this page. Try a different website.', 'error');
              document.getElementById('generation-progress').style.display = 'none';
              document.getElementById('generateScenarios').disabled = false;
              return;
            }
          }
          this.updateStatus('Extracting page content...', 'info');
          content = await this.getCurrentPageContent();
          
          // Verify that we got meaningful content
          if (!content || content === 'null' || content === '{}') {
            this.updateStatus('No content extracted from page. The page might be restricted or still loading.', 'error');
            document.getElementById('generation-progress').style.display = 'none';
            document.getElementById('generateScenarios').disabled = false;
            return;
          }
          break;
        case 'document':
          this.updateStatus('Reading document...', 'info');
          content = await this.getDocumentContent();
          break;
      }

      if (!content || !content.trim()) {
        throw new Error('No content available for analysis');
      }

      // Add content size check before sending to API
      const MAX_CONTENT_LENGTH = 100000;
      if (content.length > MAX_CONTENT_LENGTH) {
        this.updateStatus(`Warning: Document content is very large (${content.length} characters). It might exceed API token limits.`, 'info');
      }

      this.updateStatus('Sending request to AI service...', 'info');

      // Generate test scenarios
      const response = await chrome.runtime.sendMessage({
        action: 'generateTestScenarios',
        content: content,
        apiProvider: apiProvider,
        apiKey: apiKey,
        model: selectedModel
      });

      this.updateStatus('Processing AI response...', 'info');

      console.log('Response from background script:', response);
      
      if (response && response.success) {
        this.updateStatus('Test scenarios generated successfully!', 'success');
        this.testResults = response.data;
        this.switchTab('results');
        this.displayResults();
      } else if (response && response.error) {
        this.updateStatus(`Error: ${response.error}`, 'error');
        throw new Error(response.error);
      } else {
        console.error('Unexpected response format:', response);
        this.updateStatus('Unknown error from background script.', 'error');
        throw new Error('Unknown error from background script.');
      }
    } catch (error) {
      console.error('Error generating test scenarios:', error);
      this.updateStatus(`Error: ${error.message}`, 'error');
    } finally {
      document.getElementById('generation-progress').style.display = 'none';
      document.getElementById('generateScenarios').disabled = false;
    }
  }

  updateStatus(message, type = 'info') {
    const statusArea = document.getElementById('generation-status');
    statusArea.textContent = message;
    statusArea.className = `status-area ${type}`;
  }

  displayDocumentTypeInfo(content) {
    const pageInfo = document.getElementById('page-info');
    const documentType = content.documentType || { type: 'general_web_page', confidence: 0.5 };
    
    // Add document type information to the page info
    const typeInfo = document.createElement('p');
    typeInfo.innerHTML = `<strong>Document Type:</strong> <span class="document-type ${documentType.type.replace('_', '-')}">${this.formatDocumentType(documentType.type)}</span>`;
    
    if (documentType.confidence) {
      const confidenceBar = document.createElement('div');
      confidenceBar.className = 'confidence-bar';
      confidenceBar.innerHTML = `
        <span class="confidence-label">Confidence: ${Math.round(documentType.confidence * 100)}%</span>
        <div class="confidence-fill" style="width: ${documentType.confidence * 100}%"></div>
      `;
      typeInfo.appendChild(confidenceBar);
    }
    
    // Insert after the content length
    const contentLengthElement = pageInfo.querySelector('p:last-child');
    if (contentLengthElement) {
      pageInfo.insertBefore(typeInfo, contentLengthElement.nextSibling);
    } else {
      pageInfo.appendChild(typeInfo);
    }
    
    // Add specific information based on document type
    if (documentType.type === 'software_specification') {
      this.displaySpecificationInfo(content);
    } else if (documentType.type === 'web_application') {
      this.displayWebApplicationInfo(content);
    }
  }

  formatDocumentType(type) {
    const typeMap = {
      'software_specification': 'Software Specification Document',
      'web_application': 'Web Application',
      'general_web_page': 'General Web Page'
    };
    return typeMap[type] || type;
  }

  displaySpecificationInfo(content) {
    const requirementsPreview = document.getElementById('extracted-requirements');
    let info = '<div class="spec-info">';
    
    if (content.requirements && content.requirements.length > 0) {
      info += `<div class="info-item"><strong>Requirements:</strong> ${content.requirements.length} found</div>`;
    }
    
    if (content.userStories && content.userStories.length > 0) {
      info += `<div class="info-item"><strong>User Stories:</strong> ${content.userStories.length} found</div>`;
    }
    
    if (content.acceptanceCriteria && content.acceptanceCriteria.length > 0) {
      info += `<div class="info-item"><strong>Acceptance Criteria:</strong> ${content.acceptanceCriteria.length} found</div>`;
    }
    
    if (content.testCases && content.testCases.length > 0) {
      info += `<div class="info-item"><strong>Existing Test Cases:</strong> ${content.testCases.length} found</div>`;
    }
    
    info += '</div>';
    
    if (requirementsPreview) {
      requirementsPreview.innerHTML = info + requirementsPreview.innerHTML;
    }
  }

  displayWebApplicationInfo(content) {
    const requirementsPreview = document.getElementById('extracted-requirements');
    let info = '<div class="app-info">';
    
    if (content.interactiveElements && content.interactiveElements.length > 0) {
      info += `<div class="info-item"><strong>Interactive Elements:</strong> ${content.interactiveElements.length} found</div>`;
    }
    
    if (content.forms && content.forms.length > 0) {
      info += `<div class="info-item"><strong>Forms:</strong> ${content.forms.length} found</div>`;
    }
    
    if (content.dataElements && content.dataElements.length > 0) {
      info += `<div class="info-item"><strong>Data Elements:</strong> ${content.dataElements.length} found</div>`;
    }
    
    info += '</div>';
    
    if (requirementsPreview) {
      requirementsPreview.innerHTML = info + requirementsPreview.innerHTML;
    }
  }

  async getCurrentPageContent() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
      
      if (response && response.success && response.content) {
        const content = response.content;
        console.log('Successfully retrieved page content:', content);
        
        // Pass the full structured content to the background script
        // The background script will handle the intelligent analysis
        return JSON.stringify(content);
      } else {
        console.error('Invalid response from content script:', response);
        throw new Error('Invalid response from content script');
      }
    } catch (error) {
      console.error('Error communicating with content script:', error);
      throw new Error(`Could not extract page content: ${error.message}`);
    }
  }

  async getDocumentContent() {
    const fileInput = document.getElementById('documentUpload');
    if (!fileInput.files[0]) {
      throw new Error('Please upload a document');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsText(fileInput.files[0]);
    });
  }

  // Removed getWebPageContent function

  displayResults() {
    if (!this.testResults) {
      console.error('No test results to display');
      return;
    }

    console.log('Displaying results:', this.testResults);
    console.log('Test results structure:', Object.keys(this.testResults));
    
    const summary = this.testResults.summary;
    const scenarios = this.testResults.testScenarios;
    
    console.log('Summary:', summary);
    console.log('Scenarios:', scenarios);
    console.log('Scenarios length:', scenarios ? scenarios.length : 'undefined');

    // Display summary with error handling
    const totalScenarios = summary ? (summary.totalScenarios || 0) : 0;
    const edgeCases = summary ? (summary.edgeCases || 0) : 0;
    const highPriority = summary && summary.priorityBreakdown ? (summary.priorityBreakdown.high || 0) : 0;
    
    document.getElementById('results-summary').innerHTML = `
      <h4>Generation Summary</h4>
      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-number">${totalScenarios}</div>
          <div class="stat-label">Total Scenarios</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${edgeCases}</div>
          <div class="stat-label">Edge Cases</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${highPriority}</div>
          <div class="stat-label">High Priority</div>
        </div>
      </div>
    `;

    // Display scenarios with error handling
    const scenariosList = document.getElementById('scenarios-list');
    if (!scenarios || !Array.isArray(scenarios) || scenarios.length === 0) {
      scenariosList.innerHTML = '<div class="no-scenarios">No test scenarios were generated. Please try again or check the console for errors.</div>';
      return;
    }
    
    scenariosList.innerHTML = scenarios.map(scenario => `
      <div class="scenario-item">
        <div class="scenario-header">
          <span class="scenario-id">${scenario.testCaseID}</span>
          <span class="scenario-type ${scenario.scenarioType.toLowerCase().replace(/ /g, '-')}">${scenario.scenarioType}</span>
        </div>
        <div class="scenario-title">${scenario.testObjective}</div>
        <div class="scenario-description">${scenario.testCaseDescription}</div>
        <div class="scenario-details">
          <div><strong>Precondition:</strong> ${scenario.precondition}</div>
          <div><strong>Steps:</strong> <ol>${Array.isArray(scenario.steps) ? scenario.steps.map(step => `<li>${step}</li>`).join('') : ''}</ol></div>
          <div><strong>Test Data:</strong> ${scenario.testData}</div>
          <div><strong>Expected Result:</strong> ${scenario.expectedResult}</div>
          <div><strong>Actual Result:</strong> ${scenario.actualResult}</div>
          <div><strong>Status:</strong> ${scenario.status}</div>
          <div><strong>Comments:</strong> ${scenario.comments}</div>
        </div>
      </div>
    `).join('');
  }

  downloadExcel() {
    if (!this.testResults) return;

    const data = this.generateExcelData();
    chrome.runtime.sendMessage({
      action: 'downloadExcel',
      data: data,
      filename: 'test_scenarios.xlsx'
    });
  }

  downloadJSON() {
    if (!this.testResults) return;

    const dataStr = JSON.stringify(this.testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'test_scenarios.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  copyToClipboard() {
    if (!this.testResults) return;

    const text = this.formatResultsAsText();
    navigator.clipboard.writeText(text).then(() => {
      this.showMessage('Results copied to clipboard!', 'success');
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      this.showMessage('Error copying to clipboard', 'error');
    });
  }

  generateExcelData() {
    const headers = [
      'Test Case ID', 'Test Objective', 'Test Case Description', 'Scenario Type', 'Priority', 'Precondition',
      'Steps', 'Test Data', 'Expected Result', 'Actual Result', 'Status', 'Comments'
    ];

    const rows = [headers];
    
    this.testResults.testScenarios.forEach(scenario => {
      rows.push([
        scenario.testCaseID || '',
        scenario.testObjective || '',
        scenario.testCaseDescription || '',
        scenario.scenarioType || '',
        scenario.priority || '',
        scenario.precondition || '',
        Array.isArray(scenario.steps) ? scenario.steps.join('\n') : '',
        scenario.testData || '',
        scenario.expectedResult || '',
        scenario.actualResult || '',
        scenario.status || '',
        scenario.comments || ''
      ]);
    });

    return rows;
  }

  formatResultsAsText() {
    let text = `TEST SCENARIOS GENERATION REPORT\n`;
    text += `Generated on: ${new Date().toLocaleString()}\n`;
    text += `Total Scenarios: ${this.testResults.summary.totalScenarios}\n`;
    text += `Edge Cases: ${this.testResults.summary.edgeCases}\n\n`;
    
    text += `TEST SCENARIOS:\n`;
    this.testResults.testScenarios.forEach((scenario, index) => {
      text += `\n${index + 1}. Test Case ID: ${scenario.testCaseID}\n`;
      text += `   Test Objective: ${scenario.testObjective}\n`;
      text += `   TESTCASE: ${scenario.testCaseDescription}\n`;
      text += `   Precondition: ${scenario.precondition}\n`;
      text += `   Steps:\n`;
      scenario.steps.forEach((step, i) => {
        text += `     ${i + 1}. ${step}\n`;
      });
      text += `   Test Data: ${scenario.testData}\n`;
      text += `   Expected Result: ${scenario.expectedResult}\n`;
      text += `   Actual Result: ${scenario.actualResult}\n`;
      text += `   STATUS: ${scenario.status}\n`;
      text += `   Scenario Type: ${scenario.scenarioType}\n`;
      text += `   Comments: ${scenario.comments}\n`;
    });
    
    return text;
  }

  showMessage(message, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;

    // Insert at the top of the current tab content
    const currentTab = document.querySelector('.tab-content.active');
    currentTab.insertBefore(messageDiv, currentTab.firstChild);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 3000);
  }

  toggleModelVisibility() {
    const apiProviderEl = document.getElementById('apiProvider');
    if (!apiProviderEl) return;
    
    const apiProvider = apiProviderEl.value;
    
    const openaiModelGroup = document.getElementById('openaiModelGroup');
    if (openaiModelGroup) {
      openaiModelGroup.style.display = (apiProvider === 'openai') ? 'block' : 'none';
    }
    
    const deepseekModelGroup = document.getElementById('deepseekModelGroup');
    if (deepseekModelGroup) {
      deepseekModelGroup.style.display = (apiProvider === 'deepseek') ? 'block' : 'none';
    }
    
    const geminiModelGroup = document.getElementById('geminiModelGroup');
    if (geminiModelGroup) {
      geminiModelGroup.style.display = (apiProvider === 'gemini') ? 'block' : 'none';
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});