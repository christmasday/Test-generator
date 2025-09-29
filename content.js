// Content script for extracting content from web pages

class PageContentExtractor {
  constructor() {
    console.log("Content script loaded and initialized.");
    this.extractContent();
  }

  extractContent() {
    console.log("Attempting to extract content from page.");
    // Remove existing markers
    this.removeExistingMarkers();

    // Detect document type and content structure
    const documentType = this.detectDocumentType();
    const pageStructure = this.analyzePageStructure();

    // Extract different types of content
    const content = {
      title: document.title,
      url: window.location.href,
      documentType: documentType,
      pageStructure: pageStructure,
      text: this.extractTextContent(),
      requirements: this.extractRequirements(),
      specifications: this.extractSpecifications(),
      testCases: this.extractTestCases(),
      userStories: this.extractUserStories(),
      acceptanceCriteria: this.extractAcceptanceCriteria(),
      forms: this.extractForms(),
      links: this.extractLinks(),
      images: this.extractImages(),
      metadata: this.extractMetadata(),
      interactiveElements: this.extractInteractiveElements(),
      dataElements: this.extractDataElements()
    };

    // Store content for popup access
    window.testScenarioContent = content;
    
    // Send content to background script
    console.log("Sending extracted content to background script. Content length:", content.text.length);
    console.log("Document type detected:", documentType);
    chrome.runtime.sendMessage({
      action: 'pageContentExtracted',
      content: content
    });
  }

  extractTextContent() {
    // Get main content, excluding navigation and footer
    const mainSelectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '#content',
      '#main',
      '.container',
      '.wrapper'
    ];

    let mainContent = null;
    for (const selector of mainSelectors) {
      mainContent = document.querySelector(selector);
      if (mainContent) break;
    }

    if (!mainContent) {
      mainContent = document.body;
    }

    // Remove script and style elements
    const clone = mainContent.cloneNode(true);
    const scripts = clone.querySelectorAll('script, style, nav, header, footer');
    scripts.forEach(el => el.remove());

    return clone.textContent.trim();
  }

  extractRequirements() {
    const requirements = [];
    const reqKeywords = [
      'requirement',
      'specification',
      'functional',
      'non-functional',
      'acceptance criteria',
      'user story',
      'feature',
      'shall',
      'must',
      'should'
    ];

    const text = document.body.textContent.toLowerCase();
    const paragraphs = document.querySelectorAll('p, li, div');

    paragraphs.forEach(p => {
      const text = p.textContent.toLowerCase();
      if (reqKeywords.some(keyword => text.includes(keyword))) {
        requirements.push(p.textContent.trim());
      }
    });

    return requirements;
  }

  extractSpecifications() {
    const specifications = [];
    const specElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    specElements.forEach(heading => {
      const text = heading.textContent.toLowerCase();
      if (text.includes('specification') || text.includes('design') || text.includes('architecture')) {
        const content = this.getContentAfterHeading(heading);
        specifications.push({
          heading: heading.textContent.trim(),
          content: content
        });
      }
    });

    return specifications;
  }

  getContentAfterHeading(heading) {
    let content = '';
    let nextElement = heading.nextElementSibling;
    
    while (nextElement && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(nextElement.tagName)) {
      content += nextElement.textContent.trim() + '\n';
      nextElement = nextElement.nextElementSibling;
    }
    
    return content.trim();
  }

  extractForms() {
    const forms = [];
    const formElements = document.querySelectorAll('form');
    
    formElements.forEach(form => {
      const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
      const formData = {
        action: form.action,
        method: form.method,
        inputs: inputs.map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          required: input.required,
          placeholder: input.placeholder,
          value: input.value
        }))
      };
      forms.push(formData);
    });
    
    return forms;
  }

  extractLinks() {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links.map(link => ({
      text: link.textContent.trim(),
      href: link.href,
      title: link.title
    })).filter(link => link.text && link.href);
  }

  extractImages() {
    const images = Array.from(document.querySelectorAll('img'));
    return images.map(img => ({
      src: img.src,
      alt: img.alt,
      title: img.title
    })).filter(img => img.src);
  }

  extractMetadata() {
    const meta = {};
    const metaTags = document.querySelectorAll('meta');
    
    metaTags.forEach(tag => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (name && content) {
        meta[name] = content;
      }
    });
    
    return meta;
  }

  detectDocumentType() {
    const title = document.title.toLowerCase();
    const url = window.location.href.toLowerCase();
    const bodyText = document.body.textContent.toLowerCase();
    
    // Check for software specification document indicators
    const specIndicators = [
      'software requirements specification',
      'srs',
      'functional requirements',
      'technical specification',
      'system specification',
      'product requirements document',
      'prd',
      'software design document',
      'sdd',
      'test plan',
      'test specification',
      'acceptance criteria',
      'user stories',
      'epic',
      'feature specification'
    ];
    
    const hasSpecIndicators = specIndicators.some(indicator => 
      title.includes(indicator) || bodyText.includes(indicator)
    );
    
    // Check for document formats
    const isPDF = url.includes('.pdf') || document.querySelector('embed[type="application/pdf"]');
    const isConfluence = url.includes('confluence') || url.includes('atlassian');
    const isNotion = url.includes('notion');
    const isGoogleDoc = url.includes('docs.google.com');
    const isSharePoint = url.includes('sharepoint');
    
    // Check for structured content
    const hasRequirements = this.hasRequirementsStructure();
    const hasUserStories = this.hasUserStoriesStructure();
    const hasTestCases = this.hasTestCasesStructure();
    
    if (hasSpecIndicators || hasRequirements || hasUserStories || hasTestCases) {
      return {
        type: 'software_specification',
        confidence: this.calculateConfidence(hasSpecIndicators, hasRequirements, hasUserStories, hasTestCases),
        format: isPDF ? 'pdf' : isConfluence ? 'confluence' : isNotion ? 'notion' : isGoogleDoc ? 'google_doc' : isSharePoint ? 'sharepoint' : 'web_page',
        hasRequirements,
        hasUserStories,
        hasTestCases
      };
    }
    
    // Check for application/web interface
    const hasForms = document.querySelectorAll('form').length > 0;
    const hasInputs = document.querySelectorAll('input, select, textarea').length > 0;
    const hasButtons = document.querySelectorAll('button, input[type="button"], input[type="submit"]').length > 0;
    
    if (hasForms || hasInputs || hasButtons) {
      return {
        type: 'web_application',
        confidence: 0.8,
        format: 'web_page',
        hasForms,
        hasInputs,
        hasButtons
      };
    }
    
    return {
      type: 'general_web_page',
      confidence: 0.5,
      format: 'web_page'
    };
  }
  
  hasRequirementsStructure() {
    const reqKeywords = ['requirement', 'specification', 'shall', 'must', 'should', 'functional', 'non-functional'];
    const bodyText = document.body.textContent.toLowerCase();
    return reqKeywords.some(keyword => bodyText.includes(keyword));
  }
  
  hasUserStoriesStructure() {
    const storyKeywords = ['as a', 'i want', 'so that', 'user story', 'epic', 'feature'];
    const bodyText = document.body.textContent.toLowerCase();
    return storyKeywords.some(keyword => bodyText.includes(keyword));
  }
  
  hasTestCasesStructure() {
    const testKeywords = ['test case', 'test scenario', 'test step', 'expected result', 'actual result', 'precondition'];
    const bodyText = document.body.textContent.toLowerCase();
    return testKeywords.some(keyword => bodyText.includes(keyword));
  }
  
  calculateConfidence(hasSpecIndicators, hasRequirements, hasUserStories, hasTestCases) {
    let confidence = 0.3; // Base confidence
    if (hasSpecIndicators) confidence += 0.4;
    if (hasRequirements) confidence += 0.2;
    if (hasUserStories) confidence += 0.1;
    if (hasTestCases) confidence += 0.1;
    return Math.min(confidence, 1.0);
  }
  
  analyzePageStructure() {
    return {
      headings: this.extractHeadings(),
      sections: this.extractSections(),
      lists: this.extractLists(),
      tables: this.extractTables(),
      codeBlocks: this.extractCodeBlocks()
    };
  }
  
  extractHeadings() {
    const headings = [];
    const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headingElements.forEach(heading => {
      headings.push({
        level: parseInt(heading.tagName.charAt(1)),
        text: heading.textContent.trim(),
        id: heading.id
      });
    });
    
    return headings;
  }
  
  extractSections() {
    const sections = [];
    const sectionElements = document.querySelectorAll('section, div[class*="section"], div[id*="section"]');
    
    sectionElements.forEach(section => {
      const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
      sections.push({
        title: heading ? heading.textContent.trim() : 'Untitled Section',
        content: section.textContent.trim(),
        id: section.id
      });
    });
    
    return sections;
  }
  
  extractLists() {
    const lists = [];
    const listElements = document.querySelectorAll('ul, ol');
    
    listElements.forEach(list => {
      const items = Array.from(list.querySelectorAll('li')).map(li => li.textContent.trim());
      lists.push({
        type: list.tagName.toLowerCase(),
        items: items,
        ordered: list.tagName.toLowerCase() === 'ol'
      });
    });
    
    return lists;
  }
  
  extractTables() {
    const tables = [];
    const tableElements = document.querySelectorAll('table');
    
    tableElements.forEach(table => {
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
      const rows = Array.from(table.querySelectorAll('tr')).map(tr => 
        Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())
      );
      
      tables.push({
        headers: headers,
        rows: rows
      });
    });
    
    return tables;
  }
  
  extractCodeBlocks() {
    const codeBlocks = [];
    const codeElements = document.querySelectorAll('pre, code, .code-block, .highlight');
    
    codeElements.forEach(code => {
      codeBlocks.push({
        language: code.className.match(/language-(\w+)/) ? code.className.match(/language-(\w+)/)[1] : 'unknown',
        content: code.textContent.trim()
      });
    });
    
    return codeBlocks;
  }
  
  extractTestCases() {
    const testCases = [];
    const testKeywords = ['test case', 'test scenario', 'tc-', 'ts-'];
    
    // Look for structured test cases
    const elements = document.querySelectorAll('p, div, li, td');
    elements.forEach(element => {
      const text = element.textContent.toLowerCase();
      if (testKeywords.some(keyword => text.includes(keyword))) {
        testCases.push({
          text: element.textContent.trim(),
          element: element.tagName
        });
      }
    });
    
    return testCases;
  }
  
  extractUserStories() {
    const userStories = [];
    const storyPattern = /as\s+a\s+([^,]+),\s*i\s+want\s+([^,]+),\s*so\s+that\s+(.+)/gi;
    const bodyText = document.body.textContent;
    
    let match;
    while ((match = storyPattern.exec(bodyText)) !== null) {
      userStories.push({
        role: match[1].trim(),
        want: match[2].trim(),
        benefit: match[3].trim(),
        fullText: match[0].trim()
      });
    }
    
    return userStories;
  }
  
  extractAcceptanceCriteria() {
    const criteria = [];
    const criteriaKeywords = ['given', 'when', 'then', 'acceptance criteria', 'criteria'];
    
    const elements = document.querySelectorAll('p, div, li, td');
    elements.forEach(element => {
      const text = element.textContent.toLowerCase();
      if (criteriaKeywords.some(keyword => text.includes(keyword))) {
        criteria.push({
          text: element.textContent.trim(),
          type: this.classifyCriteriaType(text)
        });
      }
    });
    
    return criteria;
  }
  
  classifyCriteriaType(text) {
    if (text.includes('given')) return 'given';
    if (text.includes('when')) return 'when';
    if (text.includes('then')) return 'then';
    if (text.includes('acceptance criteria')) return 'acceptance_criteria';
    return 'criteria';
  }
  
  extractInteractiveElements() {
    const interactiveElements = [];
    
    // Buttons
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    buttons.forEach(button => {
      interactiveElements.push({
        type: 'button',
        text: button.textContent || button.value,
        id: button.id,
        className: button.className,
        onclick: button.onclick ? 'has_onclick' : 'no_onclick'
      });
    });
    
    // Links
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      interactiveElements.push({
        type: 'link',
        text: link.textContent.trim(),
        href: link.href,
        target: link.target
      });
    });
    
    // Form inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      interactiveElements.push({
        type: 'input',
        inputType: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        required: input.required
      });
    });
    
    return interactiveElements;
  }
  
  extractDataElements() {
    const dataElements = [];
    
    // Tables with data
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
      const rows = Array.from(table.querySelectorAll('tr')).slice(1).map(tr => 
        Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())
      );
      
      if (headers.length > 0 && rows.length > 0) {
        dataElements.push({
          type: 'table',
          headers: headers,
          rows: rows,
          rowCount: rows.length
        });
      }
    });
    
    // Lists that might contain data
    const lists = document.querySelectorAll('ul, ol');
    lists.forEach(list => {
      const items = Array.from(list.querySelectorAll('li')).map(li => li.textContent.trim());
      if (items.length > 3) { // Only consider lists with multiple items as potential data
        dataElements.push({
          type: 'list',
          items: items,
          itemCount: items.length
        });
      }
    });
    
    return dataElements;
  }

  removeExistingMarkers() {
    const markers = document.querySelectorAll('.test-scenario-marker');
    markers.forEach(marker => marker.remove());
  }

  highlightRequirements() {
    const text = document.body.textContent;
    const reqKeywords = [
      'requirement',
      'specification',
      'functional',
      'acceptance criteria',
      'user story'
    ];

    reqKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      // Implementation for highlighting would go here
    });
  }
}

// Initialize content extractor when page loads
function initializeContentExtractor() {
  console.log('Initializing content extractor for:', window.location.href);
  new PageContentExtractor();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeContentExtractor);
} else {
  initializeContentExtractor();
}

// Also initialize if the page is dynamically loaded
if (document.readyState === 'complete') {
  // Page is already loaded, initialize immediately
  initializeContentExtractor();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request.action);
  if (request.action === 'getPageContent') {
    console.log("Responding with page content.");
    sendResponse({
      success: true,
      content: window.testScenarioContent || null
    });
  }
  // PING TEST: Handle ping message from popup
  if (request.action === 'ping') {
    console.log("Received ping from popup in content script.");
    sendResponse({ success: true, message: 'pong from content' });
    return true;
  }
});

// Debug function to test content script functionality
window.testContentScript = function() {
  console.log('Content script is working!');
  console.log('Page URL:', window.location.href);
  console.log('Content available:', !!window.testScenarioContent);
  console.log('Content preview:', window.testScenarioContent ? 
    Object.keys(window.testScenarioContent) : 'No content');
  return {
    working: true,
    url: window.location.href,
    hasContent: !!window.testScenarioContent,
    contentKeys: window.testScenarioContent ? Object.keys(window.testScenarioContent) : []
  };
};