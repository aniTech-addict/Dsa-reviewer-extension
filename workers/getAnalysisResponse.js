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



const apiKey = "AIzaSyCzI6zetE9yZFwR2hHDiscEj3Tw4ZUx8mo"

const getAnalysis = async (code) => {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `System Prompt: ${systemPrompt} Code-To-Analyze: ${code}`
                    }]
                }]
            })
        });
        
        const data = await response.json();
        if (data.candidates && data.candidates[0]) {
            console.log(data.candidates[0].content.parts[0].text);
            return data.candidates[0].content.parts[0].text;
        }
    } catch (error) {
        console.error('Error analyzing code:', error);
        throw error;
    }
}

function testing () {
    return "Result of test Script";
}

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

const runScript = async (type, sender) => {
    if (!sender?.tab?.id) return;
    let scriptTOExecute = null;
    let world = "ISOLATED";

    if (type === "test") {
        scriptTOExecute = testing;
    }
    else if (type === "getCode") {
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

    
    console.log(result);
};

const handleMessages = (message, sender) => {
    runScript(message.type, sender).catch((error) => {
        console.error("Failed to run test script:", error);
    });
};

chrome.runtime.onMessage.addListener(handleMessages);
