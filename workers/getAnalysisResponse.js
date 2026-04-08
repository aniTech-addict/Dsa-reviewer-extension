const systemPrompt = 
`
# Code Review System Prompt

You are an expert code reviewer. Analyze code systematically across four sections and provide specific, actionable feedback.

## 1. Complexity Analysis

**Time:** Identify Big-O notation. Explain dominant operations (loops, recursion, nested iterations). Define what "n" represents.

**Space:** Identify Big-O for auxiliary space. Explain allocations (call stack, data structures, variables).

**Format:**

Time: O(...) - [reason]
Space: O(...) - [reason]


---

## 2. Readability

Assess: naming clarity, code style consistency, comments, logic flow, line length, organization, language idioms, magic numbers, function focus.

**Provide:**
- Strengths: specific readable sections
- Improvements: confusing sections with reasoning

---

## 3. Logic & Implementation Review

**Check:**
- **Correctness**: Does it solve the problem? Edge cases (empty, single element, duplicates, negatives)?
- **Algorithm**: Is it optimal? Better patterns available?
- **Data structures**: Right choice for efficiency?
- **Implementation**: Correct library usage? Subtle bugs? Error handling?

**Provide verdict**, alternative approaches, and potential edge case failures.

---

## 4. Improvements & Suggestions

Organize by **Complexity**, **Readability**, **Logic** improvements. Include code snippets and priority levels:
- **Critical**: breaks correctness
- **High**: major improvement
- **Medium**: moderate improvement  
- **Low**: nice-to-have

---

## Guidelines

- **Be specific**: Reference lines/sections
- **Balance praise & critique**: Acknowledge strengths first
- **Provide context**: Explain *why* suggestions matter
- **Prioritize**: correctness > complexity > readability
- **Offer alternatives**: Explain trade-offs
- **Hint-based feedback**: Avoid direct answers. Guide with questions or observations (e.g., "Notice the nested loop here—what's the worst-case scenario?" or "Consider what happens when the array is already sorted"). Let the reviewer discover issues and solutions independently.

---

## Output Format


## Code Review

### 1. Complexity Analysis
[breakdown]

### 2. Readability
[analysis]

### 3. Logic & Implementation Review
[verdict & issues]

### 4. Improvements & Suggestions
[organized by category with priorities]

---
**Summary:** [2-3 sentence assessment]
`;




const openRouterApiKey = "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"
const openRouterModel = "minimax/minimax-m2.5:free"
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
const getAnalysis = async (code) => {
    if (!openRouterApiKey) {
        throw new Error("OpenRouter API key missing. Set openRouterApiKey first.");
    }
    console.time("Calling api");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: openRouterModel,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            "type": "text",
                            "text":`System Prompt:\n${systemPrompt}\n\nCode-To-Analyze:\n${code}`
                        }
                    ]
                }
            ],
            "reasoning" : {"enabled": true}
            
        })
    });

    
    const data = await response.json();
    console.timeEnd("Calling api");
    if (!response.ok) {
        console.error("OpenRouter API error:", data);
        const providerCode = data?.error?.code;
        const status = response.status;
        if (status === 429 || providerCode === 429) {
            throw new Error("Rate limited by provider (429). Wait a few seconds and retry.");
        }

        throw new Error(data?.error?.message || "OpenRouter request failed");
    }

    const analysis = data?.choices?.[0]?.message?.content;
    if (!analysis) {
        console.error("No analysis returned from OpenRouter:", data);
        return null;
    }

    console.log("Analysis received from OpenRouter:", analysis);

    return analysis;
}

function testing () {
    return "Result of test Script";
}

/** 
* Executes the script in the Main world, allowing access to the variables of the senderTab.id
* get reference to monaco editor and retrieves code from editor.
* @returns {Object}: { ok: boolean, code: string } 
*/
function getMonacoCode() {
    const monacoRef = globalThis.monaco;
    if (!monacoRef?.editor?.getEditors) {
        return { ok: false, error: "Monaco is not available on this page yet" };
    }

    const editors = monacoRef.editor.getEditors();
    if (!editors || editors.length === 0) {
        return { ok: false, error: "No Monaco editor instances found" };
    }

    return { ok: true, code: editors[0].getValue() };
}


const handleResponse = async (type, result, sendResponse) => {
    let analysis = "";
    console.log("handleResponse", result);
    let code = null;

    try {
        if (type === "getAnalysis") {
            if (isAnalysisInFlight) {
                await sendResponse({
                    type: "analysis",
                    error: "Analysis already running. Please wait..."
                });
                return;
            }

            code = result?.[0]?.result?.code;
            if (!code) {
                await sendResponse({ type: "analysis", error: "No code returned from Monaco" });
                return;
            }

            isAnalysisInFlight = true;
            analysis = await getAnalysis(code);
            console.log("Analysis:", analysis);
            await sendResponse({ type: "analysis", data: analysis });
        }

        console.log("CODE", code);
        console.log("Tried Handling response")
    } catch (error) {
        await sendResponse({ type: "analysis", error: error?.message || "Analysis failed" });
    } finally {
        if (type === "getAnalysis") {
            isAnalysisInFlight = false;
        }
    }
}

const runScript = async (type, sender, sendResponse) => {
    if (!sender?.tab?.id) return;
    let scriptTOExecute = null;
    let world = "ISOLATED";

    if (type === "test") {
        scriptTOExecute = testing;
    }
    else if (type === "getAnalysis") {
        scriptTOExecute = getMonacoCode;
        world = "MAIN";
    }

    if ( scriptTOExecute === null ) {
        console.log("Script to execute is null");
        return;
    }

    const result = await chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: scriptTOExecute,
        world
    });

    if (result.length <= 0 ) {
        console.error("No result returned from script execution");
        return;
    }

    await handleResponse(type, result, sendResponse);
    console.log(result);
};

const handleMessages = (message, sender, sendResponse) => {
    runScript(message.type, sender, sendResponse).catch((error) => {
        console.error("Failed to run test script:", error);
    });

    return true;
};

chrome.runtime.onMessage.addListener(handleMessages);
