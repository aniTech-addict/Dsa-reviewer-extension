import dotenv from 'dotenv';
import { API_KEY, DEFAULT_MODEL, MODELS } from '../constants/constants.js';
import { systemPrompt } from '../prompts/prompts.js';
dotenv.config();

const openRouterApiKey = process.env.OPEN_ROUTER_API_KEY;
const openRouterModel = process.env.OPEN_ROUTER_MODEL;
let isAnalysisInFlight = false;

/**
 *
 * @param {*} code - code to be analyzed
 * Fetches the analysis from the background script
 * Checks if an analysis is already in flight to prevent multiple simultaneous requests
 * @throws Will throw an error if the OpenRouter API key is missing, if the request fails, or if the response is not ok. It also handles rate limiting errors specifically.
 * @var operRouterApiKey (pre-defined)  - API key for authenticating with the OpenRouter API, which is required to fetch the analysis. It should be set before calling this function.
 * @var popenRouterModel (pre-defined)  - The specific model to use for analysis when making the API request. It should be set before calling this function.
 * @returns {string} analysis result from the API in markdown format with sections: Complexity Analysis, Readability, Logic & Implementation Review, Improvements & Suggestions and Summary
 */
export const getAnalysis = async (code) => {
  const openRouterApiKey = API_KEY;
  if (!openRouterApiKey) {
    throw new Error('OpenRouter API key missing. Set openRouterApiKey first.');
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

/**
 * Executes the script in the Main world, allowing access to the variables of the senderTab.id
 * get reference to monaco editor and retrieves code from editor.
 * @returns {Object}: { ok: boolean, code: string }
 */
function getMonacoCode() {
  const monacoRef = globalThis.monaco;
  if (!monacoRef?.editor?.getEditors) {
    return { ok: false, error: 'Monaco is not available on this page yet' };
  }

  const editors = monacoRef.editor.getEditors();
  if (!editors || editors.length === 0) {
    return { ok: false, error: 'No Monaco editor instances found' };
  }

  return { ok: true, code: editors[0].getValue() };
}

const handleResponse = async (type, result, sendResponse) => {
  let analysis = '';
  console.log('handleResponse', result);
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
      analysis = await getAnalysis(code);
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
    scriptTOExecute = getMonacoCode;
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

  await handleResponse(type, result, sendResponse);
  console.log(result);
};

const handleMessages = (message, sender, sendResponse) => {
  runScript(message.type, sender, sendResponse).catch((error) => {
    console.error('Failed to run test script:', error);
  });

  return true;
};

// chrome.runtime.onMessage.addListener(handleMessages);
