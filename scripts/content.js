// first call initializing AI Analyzer button and insertion in DOM
// appendAiAnalyzerButton();

/*
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

/*
* Creates the AI Analyzer button element
  defines the style aiming to match the sibling node returned from getSiblingNode()
  eventListener for click event that handles the call to getAnalysis api
*/
function createAiAnalyzerButton() {
  const aiAnalyzerButton = document.createElement("div");
  aiAnalyzerButton.id = "ai-analyzer-button";
  
  // Add click event listener to call GetAnalysis function that send message to worker 
  aiAnalyzerButton.addEventListener("click", async () => {
    try {
      const code = await getCodeFromBrowser();
      await getAnalysis(code);
      console.log("Button clicked");
    } catch (error) {
      console.error("Failed to read code:", error);
    }
  });

  aiAnalyzerButton.className =
    "inline-flex items-center justify-center gap-2 text-sm font-medium px-3.5 py-1 bg-pink rounded-sd-md opacity-80 h";
  aiAnalyzerButton.style.cursor = "pointer";
  const analyzerIcon = document.createElement("img");
  analyzerIcon.src = chrome.runtime.getURL("images/analyzer.png");
  analyzerIcon.alt = "Analyzer";
  analyzerIcon.style.width = "16px";
  analyzerIcon.style.height = "16px";

  const analyzerLabel = document.createElement("span");
  analyzerLabel.textContent = "Ai Analyzer";

  aiAnalyzerButton.append(analyzerIcon, analyzerLabel);
  return aiAnalyzerButton;
}

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

const observer = new MutationObserver(() => {
  appendAiAnalyzerButton();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

async function getAnalysis(code) {
  const response = await chrome.runtime.sendMessage({ task: "getAnalysis", code: code });
  console.log(response);
}

(async function setMessaging() {
    const response = await chrome.runtime.sendMessage({ task: "setMessaging"})
    console.log(response);
})();

console.log("Loaded Content script");