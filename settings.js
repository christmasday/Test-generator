// settings.js

document.addEventListener('DOMContentLoaded', () => {
  const apiProvider = document.getElementById('apiProvider');
  const openaiModelGroup = document.getElementById('openaiModelGroup');
  const deepseekModelGroup = document.getElementById('deepseekModelGroup');
  const geminiModelGroup = document.getElementById('geminiModelGroup');
  const openaiModel = document.getElementById('openaiModel');
  const deepseekModel = document.getElementById('deepseekModel');
  const geminiModel = document.getElementById('geminiModel');
  const apiKey = document.getElementById('apiKey');
  const saveSettings = document.getElementById('saveSettings');
  const messageDiv = document.getElementById('settings-message');

  function toggleModelVisibility() {
    openaiModelGroup.style.display = (apiProvider.value === 'openai') ? 'block' : 'none';
    deepseekModelGroup.style.display = (apiProvider.value === 'deepseek') ? 'block' : 'none';
    geminiModelGroup.style.display = (apiProvider.value === 'gemini') ? 'block' : 'none';
  }

  apiProvider.addEventListener('change', toggleModelVisibility);

  async function loadSettings() {
    const result = await chrome.storage.sync.get([
      'apiProvider', 'apiKey', 'openaiModel', 'deepseekModel', 'geminiModel'
    ]);
    apiProvider.value = result.apiProvider || 'openai';
    apiKey.value = result.apiKey || '';
    openaiModel.value = result.openaiModel || 'gpt-3.5-turbo';
    deepseekModel.value = result.deepseekModel || 'deepseek-chat';
    geminiModel.value = result.geminiModel || 'gemini-2.5-pro';
    toggleModelVisibility();
  }

  async function saveSettingsHandler() {
    const settings = {
      apiProvider: apiProvider.value,
      apiKey: apiKey.value,
      openaiModel: openaiModel.value,
      deepseekModel: deepseekModel.value,
      geminiModel: geminiModel.value
    };
    await chrome.storage.sync.set(settings);
    messageDiv.textContent = 'Settings saved successfully!';
    messageDiv.className = 'success-message';
    setTimeout(() => { messageDiv.textContent = ''; messageDiv.className = ''; }, 2000);
  }

  saveSettings.addEventListener('click', saveSettingsHandler);
  loadSettings();
});
