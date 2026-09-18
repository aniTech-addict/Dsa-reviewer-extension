import { DEFAULT_MODEL, MODELS } from '../constants/constants.js';
import { systemPrompt } from '../prompts/prompts.js';
import { getUserCode } from '../utils/monacoCode.js';
let isAnalysisInFlight = false;

/**
 *
 * @param {*} code - code to be analyzed
 * Fetches the analysis from the background script
 * Checks if an analysis is already in flight to prevent multiple simultaneous requests
 * @throws Will throw an error if the OpenRouter API key is missing, if the request fails, or if the response is not ok. It also handles rate limiting errors specifically.
 * @var operRouterApiKey provided by user and retrived from the chorme.storage using bg script 
 * @var popenRouterModel uses default model unless specified by user
 * @returns {string} analysis result from the API in markdown format with sections: Complexity Analysis, Readability, Logic & Implementation Review, Improvements & Suggestions and Summary
 */
export const getCodeAnalysis = async (code) => {
  const { openRouterApiKey } =
    await chrome.storage.local.get('openRouterApiKey');
  if (!openRouterApiKey) {
    throw new Error(
      'OpenRouter API key missing. Save it in the extension popup first.',
    );
  }
  console.time('Calling api');

  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `System Prompt:\n${systemPrompt}\n\nCode-To-Analyze:\n${code}`,
              },
            ],
          },
        ],
        reasoning: { enabled: true },
      }),
    },
  );

  const data = await response.json();
  console.timeEnd('Calling api');
  if (!response.ok) {
    console.error('OpenRouter API error:', data);
    const providerCode = data?.error?.code;
    const status = response.status;
    if (status === 429 || providerCode === 429) {
      throw new Error(
        'Rate limited by provider (429). Wait a few seconds and retry.',
      );
    }

    throw new Error(data?.error?.message || 'OpenRouter request failed');
  }

  const analysis = data?.choices?.[0]?.message?.content;
  if (!analysis) {
    console.error('No analysis returned from OpenRouter:', data);
    return null;
  }

  console.log('Analysis received from OpenRouter:', analysis);

  return analysis;
};

function testing() {
  return 'Result of test Script';
}

const handleModelResponse = async (type, result, sendResponse) => {
  let analysis = '';
  console.log('handleModelResponse', result);
  let code = null;

  try {
    if (type === 'getAnalysis') {
      if (isAnalysisInFlight) {
        await sendResponse({
          type: 'analysis',
          error: 'Analysis already running. Please wait...',
        });
        return;
      }

      code = result?.[0]?.result?.code;
      if (!code) {
        await sendResponse({
          type: 'analysis',
          error: 'No code returned from Monaco',
        });
        return;
      }

      isAnalysisInFlight = true;
      analysis = await getCodeAnalysis(code);
      console.log('Analysis:', analysis);
      await sendResponse({ type: 'analysis', data: analysis });
    }

    // console.log('CODE', code);
    // console.log('Tried Handling response');
  } catch (error) {
    await sendResponse({
      type: 'analysis',
      error: error?.message || 'Analysis failed',
    });
  } finally {
    if (type === 'getAnalysis') {
      isAnalysisInFlight = false;
    }
  }
};

const runScript = async (type, sender, sendResponse) => {
  if (!sender?.tab?.id) return;
  let scriptTOExecute = null;
  let world = 'ISOLATED';

  if (type === 'test') {
    scriptTOExecute = testing;
  } else if (type === 'getAnalysis') {
    scriptTOExecute = getUserCode;
    world = 'MAIN';
  }

  if (scriptTOExecute === null) {
    console.log('Script to execute is null');
    return;
  }

  const result = await chrome.scripting.executeScript({
    target: { tabId: sender.tab.id },
    func: scriptTOExecute,
    world,
  });

  if (result.length <= 0) {
    console.error('No result returned from script execution');
    return;
  }

  await handleModelResponse(type, result, sendResponse);
  console.log(result);
};

const handleMessages = (message, sender, sendResponse) => {
  runScript(message.type, sender, sendResponse).catch((error) => {
    console.error('Failed to run test script:', error);
  });

  return true;
};

// chrome.runtime.onMessage.addListener(handleMessages);
