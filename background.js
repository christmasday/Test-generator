// Background service worker for handling API calls and data processing

importScripts('libs/xlsx.full.min.js');

class TestScenarioGenerator {
    constructor() {
      this.apiEndpoints = {
        openai: 'https://api.openai.com/v1/chat/completions',
        gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', // Updated Gemini model endpoint
        deepseek: 'https://api.deepseek.com/v1/chat/completions'
      };
    }
  
    async generateTestScenarios(content, apiProvider, apiKey, model = '') {
      const prompt = this.createPrompt(content);
      
      try {
        let responseText;
        switch (apiProvider) {
          case 'openai':
            responseText = await this.callOpenAI(prompt, apiKey, model);
            break;
          case 'gemini':
            responseText = await this.callGemini(prompt, apiKey, model);
            break;
          case 'deepseek':
            responseText = await this.callDeepSeek(prompt, apiKey, model);
            break;
          default:
            throw new Error('Unsupported API provider');
        }
        
        console.log('Raw API response:', responseText);
        return this.parseResponse(responseText);
      } catch (error) {
        console.error('Error generating test scenarios:', error);
        throw error;
      }
    }
  
    createPrompt(content) {
      // Parse the content to understand its structure
      let parsedContent;
      try {
        parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      } catch (e) {
        // If it's not JSON, treat as plain text
        parsedContent = { text: content };
      }

      const documentType = parsedContent.documentType || { type: 'general_web_page' };
      const pageStructure = parsedContent.pageStructure || {};
      
      let prompt = `You are an expert QA engineer. Analyze the following content and generate comprehensive test scenarios including edge cases.

  Document Type: ${documentType.type}
  Confidence: ${documentType.confidence || 'unknown'}
  Format: ${documentType.format || 'unknown'}

  Content to analyze:`;

      // Add structured content based on document type
      if (documentType.type === 'software_specification') {
        prompt += this.createSpecificationPrompt(parsedContent);
      } else if (documentType.type === 'web_application') {
        prompt += this.createWebApplicationPrompt(parsedContent);
      } else {
        prompt += this.createGeneralWebPagePrompt(parsedContent);
      }

      prompt += `

  Please provide test scenarios in the following JSON format:
  {
    "testScenarios": [
      {
        "testCaseID": "TS001",
        "testObjective": "Verify login with invalid email and password",
        "testCaseDescription": "A detailed description of the test case, covering the overall scenario including context, preconditions, and expected system behavior.",
        "precondition": "User is on the login page.",
        "steps": [
          "1. Enter invalid email",
          "2. Enter invalid password",
          "3. Click login button"
        ],
        "testData": "invalid_email@test.com, password123",
        "expectedResult": "Error message for invalid credentials.",
        "actualResult": "",
        "status": "NOT RUN",
        "scenarioType": "Negative",
        "priority": "High",
        "comments": "Includes edge cases like empty fields, SQL injection attempts. Also consider account lockout scenarios."
      }
    ],
    "summary": {
      "totalScenarios": 0,
      "functionalTests": 0,
      "edgeCases": 0,
      "priorityBreakdown": {
        "high": 0,
        "medium": 0,
        "low": 0
      }
    }
  }

  Focus on:
  1. Functional test scenarios
  2. Edge cases and boundary conditions
  3. Negative test cases
  4. Error handling scenarios
  5. Performance considerations
  6. Security aspects
  7. Usability tests
  8. Integration scenarios

  Generate at least 15-20 comprehensive test scenarios.`;

      return prompt;
    }

    createSpecificationPrompt(content) {
      let prompt = `
  
  SOFTWARE SPECIFICATION DOCUMENT ANALYSIS:
  
  Title: ${content.title || 'N/A'}
  URL: ${content.url || 'N/A'}
  
  Requirements Found: ${content.requirements ? content.requirements.length : 0}
  ${content.requirements ? content.requirements.slice(0, 5).map(req => `- ${req.substring(0, 100)}...`).join('\n') : ''}
  
  Specifications: ${content.specifications ? content.specifications.length : 0}
  ${content.specifications ? content.specifications.map(spec => `- ${spec.heading}: ${spec.content.substring(0, 100)}...`).join('\n') : ''}
  
  User Stories: ${content.userStories ? content.userStories.length : 0}
  ${content.userStories ? content.userStories.map(story => `- As ${story.role}, I want ${story.want}, so that ${story.benefit}`).join('\n') : ''}
  
  Acceptance Criteria: ${content.acceptanceCriteria ? content.acceptanceCriteria.length : 0}
  ${content.acceptanceCriteria ? content.acceptanceCriteria.map(criteria => `- ${criteria.text.substring(0, 100)}...`).join('\n') : ''}
  
  Test Cases Found: ${content.testCases ? content.testCases.length : 0}
  ${content.testCases ? content.testCases.map(tc => `- ${tc.text.substring(0, 100)}...`).join('\n') : ''}
  
  Main Content:
  ${content.text ? content.text.substring(0, 2000) : 'No main content available'}
  
  Based on this software specification document, generate granular and detailed test scenarios that:
  1. Cover all functional requirements mentioned
  2. Test each user story with positive and negative scenarios
  3. Validate all acceptance criteria
  4. Include edge cases for data validation and boundary conditions
  5. Test error handling and exception scenarios
  6. Consider integration points and dependencies
  7. Include performance and security test scenarios`;

      return prompt;
    }

    createWebApplicationPrompt(content) {
      let prompt = `
  
  WEB APPLICATION ANALYSIS:
  
  Title: ${content.title || 'N/A'}
  URL: ${content.url || 'N/A'}
  
  Interactive Elements: ${content.interactiveElements ? content.interactiveElements.length : 0}
  ${content.interactiveElements ? content.interactiveElements.slice(0, 10).map(el => `- ${el.type}: ${el.text || el.name || el.href}`).join('\n') : ''}
  
  Forms: ${content.forms ? content.forms.length : 0}
  ${content.forms ? content.forms.map(form => `- Form with ${form.inputs.length} inputs (${form.inputs.map(input => input.type).join(', ')})`).join('\n') : ''}
  
  Data Elements: ${content.dataElements ? content.dataElements.length : 0}
  ${content.dataElements ? content.dataElements.map(data => `- ${data.type}: ${data.rowCount || data.itemCount} items`).join('\n') : ''}
  
  Main Content:
  ${content.text ? content.text.substring(0, 2000) : 'No main content available'}
  
  Based on this web application, generate granular and detailed test scenarios that:
  1. Test all interactive elements (buttons, links, inputs)
  2. Validate form submissions with valid and invalid data
  3. Test data display and manipulation
  4. Include navigation and user flow testing
  5. Test responsive design and cross-browser compatibility
  6. Include accessibility testing scenarios
  7. Test error handling and validation messages
  8. Include performance testing for data loading`;

      return prompt;
    }

    createGeneralWebPagePrompt(content) {
      let prompt = `
  
  GENERAL WEB PAGE ANALYSIS:
  
  Title: ${content.title || 'N/A'}
  URL: ${content.url || 'N/A'}
  
  Page Structure:
  - Headings: ${content.pageStructure && content.pageStructure.headings ? content.pageStructure.headings.length : 0}
  - Sections: ${content.pageStructure && content.pageStructure.sections ? content.pageStructure.sections.length : 0}
  - Lists: ${content.pageStructure && content.pageStructure.lists ? content.pageStructure.lists.length : 0}
  - Tables: ${content.pageStructure && content.pageStructure.tables ? content.pageStructure.tables.length : 0}
  
  Main Content:
  ${content.text ? content.text.substring(0, 2000) : 'No main content available'}
  
  Based on this web page content, generate granular and detailed test scenarios that:
  1. Test content accuracy and completeness
  2. Validate information presentation and formatting
  3. Test user interaction with available elements
  4. Include content accessibility testing
  5. Test page loading and performance
  6. Validate links and navigation
  7. Test responsive design if applicable
  8. Include content management and update scenarios`;

      return prompt;
    }
  
    async callOpenAI(prompt, apiKey, model) {
      const response = await fetch(this.apiEndpoints.openai, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert QA engineer specializing in comprehensive test scenario generation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });
  
      if (!response.ok) {
        let errorDetail = `OpenAI API error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorDetail = `OpenAI API error: ${errorData.error.message}`;
          } else if (errorData.message) {
            errorDetail = `OpenAI API error: ${errorData.message}`;
          }
        } catch (jsonError) {
          console.warn("Could not parse OpenAI error response as JSON.", jsonError);
        }
        throw new Error(errorDetail);
      }
  
      const data = await response.json();
      return data.choices[0].message.content;
    }
  
    async callGemini(prompt, apiKey, model) {
        // Gemini models are handled directly now from popup.js
        let geminiModel = model || 'gemini-2.5-pro'; // Default to gemini-pro if no model specified from popup.js

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4000
              }
            })
          });
  
      if (!response.ok) {
        let errorDetail = `Gemini API error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorDetail = `Gemini API error: ${errorData.error.message}`;
          } else if (errorData.message) {
            errorDetail = `Gemini API error: ${errorData.message}`;
          }
        } catch (jsonError) {
          console.warn("Could not parse Gemini error response as JSON.", jsonError);
        }
        throw new Error(errorDetail);
      }
  
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
  
    async callDeepSeek(prompt, apiKey, model) {
      const response = await fetch(this.apiEndpoints.deepseek, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert QA engineer specializing in comprehensive test scenario generation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });
  
      if (!response.ok) {
        let errorDetail = `DeepSeek API error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error && errorData.error.message) {
            errorDetail = `DeepSeek API error: ${errorData.error.message}`;
          } else if (errorData.message) {
            errorDetail = `DeepSeek API error: ${errorData.message}`;
          }
        } catch (jsonError) {
          console.warn("Could not parse DeepSeek error response as JSON.", jsonError);
        }
        throw new Error(errorDetail);
      }
  
      const data = await response.json();
      return data.choices[0].message.content;
    }
  
    parseResponse(responseText) {
      try {
        // Check if responseText is valid
        if (!responseText || typeof responseText !== 'string') {
          console.error('Invalid response text:', responseText);
          return this.createFallbackResponse('No valid response received from AI service');
        }

        console.log('Parsing response text:', responseText.substring(0, 200) + '...');
        
        // Try to extract and parse JSON from the response
        const parsedJson = this.extractAndParseJSON(responseText);
        if (parsedJson) {
          console.log('Successfully parsed JSON response');
          
          // Validate the response structure
          if (parsedJson.testScenarios && Array.isArray(parsedJson.testScenarios) && parsedJson.testScenarios.length > 0) {
            console.log('Valid JSON response with', parsedJson.testScenarios.length, 'scenarios');
            return parsedJson;
          } else {
            console.log('JSON response missing or empty testScenarios array, creating fallback');
            return this.createFallbackResponse(responseText);
          }
        } else {
          console.log('No valid JSON found, creating fallback response');
          // Fallback: create a structured response from text
          return this.createFallbackResponse(responseText);
        }
      } catch (error) {
        console.error('Error parsing response:', error);
        console.error('Response text that caused error:', responseText);
        return this.createFallbackResponse(responseText || 'Error parsing AI response');
      }
    }

    extractAndParseJSON(text) {
      try {
        // First, try to find JSON object boundaries
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
          console.log('No JSON object boundaries found');
          return null;
        }
        
        let jsonString = text.substring(jsonStart, jsonEnd + 1);
        console.log('Extracted JSON string length:', jsonString.length);
        
        // Try to parse as-is first
        try {
          return JSON.parse(jsonString);
        } catch (parseError) {
          console.log('Initial JSON parse failed, attempting to fix common issues:', parseError.message);
          
          // Fix common JSON issues
          jsonString = this.fixCommonJSONIssues(jsonString);
          
          // Try parsing again
          try {
            return JSON.parse(jsonString);
          } catch (secondParseError) {
            console.log('Second JSON parse attempt failed:', secondParseError.message);
            
            // Try to extract individual test scenarios manually
            return this.extractTestScenariosManually(text);
          }
        }
      } catch (error) {
        console.error('Error in extractAndParseJSON:', error);
        return null;
      }
    }

    fixCommonJSONIssues(jsonString) {
      // Fix unescaped quotes in string values
      jsonString = jsonString.replace(/"([^"]*)"([^"]*)"([^"]*)":/g, '"$1\\"$2\\"$3":');
      
      // Fix missing quotes around keys
      jsonString = jsonString.replace(/(\w+):/g, '"$1":');
      
      // Fix trailing commas
      jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
      
      // Fix single quotes to double quotes
      jsonString = jsonString.replace(/'/g, '"');
      
      // Fix unescaped quotes in string values (more comprehensive)
      jsonString = jsonString.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, (match, p1, p2, p3) => {
        return `"${p1}\\"${p2}\\"${p3}"`;
      });
      
      return jsonString;
    }

    extractTestScenariosManually(text) {
      console.log('Attempting to extract test scenarios manually from text');
      
      const scenarios = [];
      let scenarioId = 1;
      
      // Look for test case patterns
      const testCasePattern = /"testCaseID":\s*"([^"]+)"/g;
      let match;
      
      while ((match = testCasePattern.exec(text)) !== null) {
        const testCaseID = match[1];
        
        // Extract other fields around this test case
        const startIndex = Math.max(0, match.index - 1000);
        const endIndex = Math.min(text.length, match.index + 2000);
        const testCaseText = text.substring(startIndex, endIndex);
        
        const scenario = this.extractScenarioFields(testCaseText, testCaseID, scenarioId);
        if (scenario) {
          scenarios.push(scenario);
          scenarioId++;
        }
      }
      
      if (scenarios.length > 0) {
        return {
          testScenarios: scenarios,
          summary: {
            totalScenarios: scenarios.length,
            functionalTests: scenarios.filter(s => s.scenarioType === 'Functional' || s.scenarioType === 'Positive').length,
            edgeCases: scenarios.filter(s => s.scenarioType === 'Edge Case').length,
            priorityBreakdown: {
              high: scenarios.filter(s => s.priority === 'High').length,
              medium: scenarios.filter(s => s.priority === 'Medium').length,
              low: scenarios.filter(s => s.priority === 'Low').length
            }
          }
        };
      }
      
      return null;
    }

    extractScenarioFields(text, testCaseID, scenarioId) {
      try {
        // Extract fields using regex patterns
        const extractField = (fieldName, defaultValue = '') => {
          const pattern = new RegExp(`"${fieldName}":\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i');
          const match = text.match(pattern);
          return match ? match[1].replace(/\\"/g, '"') : defaultValue;
        };
        
        const extractArrayField = (fieldName) => {
          const pattern = new RegExp(`"${fieldName}":\\s*\\[([^\\]]+)\\]`, 'i');
          const match = text.match(pattern);
          if (match) {
            // Split by commas and clean up
            return match[1].split(',').map(item => 
              item.trim().replace(/^["']|["']$/g, '').replace(/\\"/g, '"')
            ).filter(item => item.length > 0);
          }
          return [];
        };
        
        const testObjective = extractField('testObjective', `Test Case ${scenarioId}`);
        const testCaseDescription = extractField('testCaseDescription', '');
        const precondition = extractField('precondition', '');
        const steps = extractArrayField('steps');
        const testData = extractField('testData', '');
        const expectedResult = extractField('expectedResult', '');
        const scenarioType = extractField('scenarioType', 'Functional');
        const priority = extractField('priority', 'Medium');
        const comments = extractField('comments', '');
        
        return {
          testCaseID: testCaseID || `TS${String(scenarioId).padStart(3, '0')}`,
          testObjective,
          testCaseDescription,
          precondition,
          steps: steps.length > 0 ? steps : ['1. Execute test case'],
          testData,
          expectedResult,
          actualResult: 'NOT RUN',
          status: 'NOT RUN',
          scenarioType,
          priority,
          comments
        };
      } catch (error) {
        console.error('Error extracting scenario fields:', error);
        return null;
      }
    }
  
    createFallbackResponse(text) {
      console.log('Creating fallback response from text:', text.substring(0, 200) + '...');
      
      const lines = text.split('\n').filter(line => line.trim());
      const scenarios = [];
      let currentScenario = null;
      let scenarioId = 1;
  
      // If no structured content found, return empty response
      if (lines.length === 0 || !lines.some(line => line.match(/^\d+\./))) {
        console.log('No structured content found, returning empty response');
        return {
          testScenarios: [],
          summary: {
            totalScenarios: 0,
            functionalTests: 0,
            edgeCases: 0,
            priorityBreakdown: {
              high: 0,
              medium: 0,
              low: 0
            }
          }
        };
      }
  
      for (const line of lines) {
        if (line.match(/^\d+\./)) {
          if (currentScenario) {
            scenarios.push(currentScenario);
          }
          currentScenario = {
            testCaseID: `TS${String(scenarioId).padStart(3, '0')}`,
            testObjective: line.replace(/^\d+\.\s*/, ''),
            testCaseDescription: '',
            precondition: '',
            steps: [],
            testData: '',
            expectedResult: '',
            actualResult: 'NOT RUN',
            status: 'NOT RUN',
            scenarioType: 'Functional',
            priority: 'Medium',
            comments: '',
          };
          scenarioId++;
        } else if (currentScenario && line.trim()) {
          // For fallback, we'll put subsequent lines into description or steps
          if (!currentScenario.testCaseDescription) {
            currentScenario.testCaseDescription = line.trim();
          } else if (currentScenario.steps.length < 5) { // Limit steps for simplicity in fallback
            currentScenario.steps.push(line.trim());
          } else if (!currentScenario.comments) {
            currentScenario.comments = line.trim(); // Add extra lines to comments
          } else {
            currentScenario.comments += ' ' + line.trim();
          }
        }
      }
  
      if (currentScenario) {
        scenarios.push(currentScenario);
      }
      
      // If still no scenarios, return empty response
      if (scenarios.length === 0) {
        console.log('No scenarios created from text, returning empty response');
        return {
          testScenarios: [],
          summary: {
            totalScenarios: 0,
            functionalTests: 0,
            edgeCases: 0,
            priorityBreakdown: {
              high: 0,
              medium: 0,
              low: 0
            }
          }
        };
      }
  
      return {
        testScenarios: scenarios,
        summary: {
          totalScenarios: scenarios.length,
          functionalTests: scenarios.length,
          edgeCases: 0,
          priorityBreakdown: {
            high: 0,
            medium: scenarios.length,
            low: 0
          }
        }
      };
    }

  
    generateExcelData(testScenarios) {
      const headers = [
        'Test case ID',
        'Test Objective',
        'TESTCASE',
        'Precondition',
        'Steps',
        'Test Data',
        'Expected result',
        'Actual result',
        'STATUS',
        'Scenario Type',
        'Comments'
      ];
  
      const rows = [headers];
      
      testScenarios.forEach(scenario => {
        rows.push([
          scenario.testCaseID,
          scenario.testObjective,
          scenario.testCaseDescription,
          scenario.precondition,
          scenario.steps.join('\n'),
          scenario.testData,
          scenario.expectedResult,
          scenario.actualResult,
          scenario.status,
          scenario.scenarioType,
          scenario.comments
        ]);
      });
  
      return rows;
    }
  
    downloadExcel(data, filename = 'test_scenarios.xlsx') {
      // Use SheetJS to generate a true .xlsx file
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Test Scenarios");

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Convert to base64 data URL (works in service workers)
      const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(wbout)));
      const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;

      if (chrome && chrome.downloads) {
        chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: true
        });
      } else {
        // fallback for environments without chrome.downloads
        console.warn('chrome.downloads API not available.');
      }
    }

    async listGeminiModels(apiKey) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
          throw new Error(`HTTP error listing models! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Available Gemini Models:", data.models.map(model => model.name));
        return data.models.map(model => model.name);
      } catch (error) {
        console.error('Error listing Gemini models:', error);
        throw new Error(`Failed to list Gemini models: ${error.message}`);
      }
    }
  }
  
  // Initialize the generator
  const testGenerator = new TestScenarioGenerator();
  
  // Message handling
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background received message:", request);

    if (request.action === 'ping') {
      sendResponse({ success: true, message: 'pong' });
      return;
    }

    if (request.action === 'generateTestScenarios') {
      console.log("Generating test scenarios with content length:", request.content.length);
      console.log("API Provider:", request.apiProvider);
      console.log("Model:", request.model);
      testGenerator.generateTestScenarios(
        request.content,
        request.apiProvider,
        request.apiKey,
        request.model // Pass the model parameter
      ).then(result => {
        sendResponse({ success: true, data: result });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      
      return true; // Keep message channel open for async response
    }
  
    if (request.action === 'downloadExcel') {
      console.log("Downloading Excel with filename:", request.filename);
      testGenerator.downloadExcel(request.data, request.filename);
      sendResponse({ success: true });
    }

    if (request.action === 'listGeminiModels') {
      console.log("Listing Gemini models...");
      testGenerator.listGeminiModels(request.apiKey)
        .then(models => sendResponse({ success: true, models: models }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
    }
  });
  
  // Storage management
  chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
      apiProvider: 'openai',
      apiKey: '',
      autoGenerate: false,
      openaiModel: 'gpt-3.5-turbo', // Default OpenAI model (changed from gpt-4o for broader access)
      deepseekModel: 'deepseek-chat', // Default DeepSeek model
      geminiModel: 'gemini-2.5-pro' // Default Gemini model
    });
  });