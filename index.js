import { MODELS } from './constants/constants.js';

const form = document.querySelector('form');
const apiKeyInput = document.querySelector('#api_key');
const status = document.querySelector('#status');
const modelSelect = document.querySelector('#model');

MODELS.forEach((model) => {
  const option = document.createElement('option');
  option.value = model;
  option.textContent = model;
  modelSelect.appendChild(option);
});

chrome.storage.local.get(
  ['openRouterApiKey', 'selectedModel'],
  ({ openRouterApiKey, selectedModel }) => {
  if (openRouterApiKey) {
    apiKeyInput.value = openRouterApiKey;
  }

  if (selectedModel && MODELS.includes(selectedModel)) {
    modelSelect.value = selectedModel;
  }
  },
);

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const openRouterApiKey = apiKeyInput.value.trim();
  const selectedModel = modelSelect.value;

  if (!openRouterApiKey) {
    status.textContent = 'Enter an API key.';
    return;
  }

  try {
    await chrome.storage.local.set({ openRouterApiKey, selectedModel });
    status.textContent = 'API key and model saved.';
  } catch (error) {
    status.textContent = 'Could not save the settings.';
    console.error('Failed to save settings:', error);
  }
});
