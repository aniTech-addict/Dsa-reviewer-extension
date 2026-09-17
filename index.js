const form = document.querySelector('form');
const apiKeyInput = document.querySelector('#api_key');
const status = document.querySelector('#status');

chrome.storage.local.get('openRouterApiKey', ({ openRouterApiKey }) => {
  if (openRouterApiKey) {
    apiKeyInput.value = openRouterApiKey;
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const openRouterApiKey = apiKeyInput.value.trim();
  if (!openRouterApiKey) {
    status.textContent = 'Enter an API key.';
    return;
  }

  try {
    await chrome.storage.local.set({ openRouterApiKey });
    status.textContent = 'API key saved.';
  } catch (error) {
    status.textContent = 'Could not save the API key.';
    console.error('Failed to save API key:', error);
  }
});
