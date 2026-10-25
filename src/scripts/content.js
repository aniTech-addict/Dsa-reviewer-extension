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

function getCopyToEditorButton() {
  const copyToEditor = document.querySelector(
    "#cfb273c3-00e3-e5b4-c8e6-78771508ea35 > div > div > div > div.w-full.flex-1.overflow-y-auto > div > div:nth-child(4) > div.flex.flex-col.w-full > div > div.w-full.px-4.py-3 > div > div > div.hidden.cursor-pointer.rounded.border.z-base-1.group-hover\\:block.border-border-quaternary.dark\\:border-border-quaternary.bg-layer-02.dark\\:bg-layer-02"
  );
  return copyToEditor ? copyToEditor : null;
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
  // Call copyToEditor to get the <Submission> sections editor value to <Code> sections editor, as the <Code> sections editor is where the analysis is done.
  aiAnalyzerButton.addEventListener("click", () => {
    const copyToEditor = getCopyToEditorButton();
    if (copyToEditor) {
      copyToEditor.click();
    }
    getAnalysis();
  });

  aiAnalyzerButton.className =
    "inline-flex items-center justify-center gap-2 text-sm font-medium px-3.5 py-1 bg-yellow rounded-sd-md opacity-80 hover:bg-[#D62143]";
  aiAnalyzerButton.style.cursor = "pointer";
  const analyzerIcon = document.createElement("img");
  analyzerIcon.src = chrome.runtime.getURL("images/icons/icon1.png");
  analyzerIcon.alt = "Analyzer";
  analyzerIcon.style.width = "20px";
  analyzerIcon.style.height = "20px";

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

(async function initNavigation() {
  const { installNavigationObserver } = await import("../utils/mutationObserver.js");
  installNavigationObserver();

  window.addEventListener("navigationEvent", (e) => {
    const { destination } = e.detail;
    const solutionPageRegex = /.*\/submissions\/\d+/;
    if (solutionPageRegex.test(destination)) {
      appendAiAnalyzerButton();
      console.log("Appending analyzer button");
    }
  });
})();
