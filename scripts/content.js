// first call initializing AI Analyzer button and insertion in DOM
// appendAiAnalyzerButton();

/** 
*Gets the sibling node:
*Sibling Node: node adjacent to which the insertion of Ai Button is supposed to happen
*Identified using the selectively used background color and unique textContent(Solution) 
*/
function getSiblingNode() {
  const buttons = Array.from(document.querySelectorAll("button.bg-green-s"));
  if (buttons.length === 0) {
    console.info("No Buttons found");
    return;
  }
  const solutionButton = buttons.find((button) => {
    return button.textContent === "Solution";
  });
  if (!solutionButton) {
    return null;
  }
  return solutionButton;
}

/**
 * Fetches the analysis from the background script
 * Checks if an analysis is already in flight to prevent multiple simultaneous requests
 * Sends a message to the background script to get the analysis and handles the response
 * @returns void
 */
async function getAnalysis() {
  if (getAnalysis.isLoading) {
    return;
  }

  getAnalysis.isLoading = true;
  try {
    const review = await chrome.runtime.sendMessage({ type: "getAnalysis" });
    if (review?.error) {
      console.warn("Analysis error:", review.error);
      return;
    }
    
    // Log the analysis result received from the background script
    console.log("Response received from background script:", review?.data);
  
  } catch (error) {
    console.warn("Unable to send message to extension:", error);
  } finally {
    getAnalysis.isLoading = false;
  }
}

/**
* Creates the AI Analyzer button element
  defines the style aiming to match the sibling node returned from getSiblingNode()
  eventListener for click event that handles the call to getAnalysis api
*/
function createAiAnalyzerButton() {
  const aiAnalyzerButton = document.createElement("div");
  aiAnalyzerButton.id = "ai-analyzer-button";
  
  // Add click event listener to call GetAnalysis function that send message to worker 
  aiAnalyzerButton.addEventListener("click", () => {
      getAnalysis();
  });

  aiAnalyzerButton.className =
    "inline-flex items-center justify-center gap-2 text-sm font-medium px-3.5 py-1 bg-pink rounded-sd-md opacity-80 h";
  aiAnalyzerButton.style.cursor = "pointer";
  const analyzerIcon = document.createElement("img");
  analyzerIcon.src = chrome.runtime.getURL("images/icon1.png");
  analyzerIcon.alt = "Analyzer";
  analyzerIcon.style.width = "16px";
  analyzerIcon.style.height = "16px";

  const analyzerLabel = document.createElement("span");
  analyzerLabel.textContent = "Ai Analyzer";

  aiAnalyzerButton.append(analyzerIcon, analyzerLabel);
  return aiAnalyzerButton;
}

/**
 *  Appends the AI Analyzer button to the DOM if it doesn't already exist.
 *  It first checks if the button is already present to avoid duplicates.
 *  Then it finds the sibling node (the "Solution" button) and inserts the AI Analyzer button adjacent to it. 
 * @returns none
 */
function appendAiAnalyzerButton() {
  if (document.getElementById("ai-analyzer-button")) {
    return;
  }
  const sibling = getSiblingNode();
  if (!sibling) {
    console.info("No Solution button found, exiting");
    return;
  }
  const aiAnalyzerButton = createAiAnalyzerButton();
  sibling.parentNode.insertAdjacentElement("afterBegin", aiAnalyzerButton);
}

/**
 * Sets up a MutationObserver to monitor changes in the DOM and calls appendAiAnalyzerButton whenever a mutation occurs.
 * This ensures that the AI Analyzer button is added to the page whenever the relevant elements are loaded or updated.
 */
const observer = new MutationObserver(() => {
  appendAiAnalyzerButton();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
