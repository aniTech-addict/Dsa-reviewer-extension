import {getAnalysis} from "util/getAnalysisResponse.js"

function getSiblingNode () {

    const buttons = Array.from(document.querySelectorAll("button.bg-green-s"));
    if (!buttons) {
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

function createAiAnalyzerButton () {
    const aiAnalyzerButton = document.createElement("div");
    aiAnalyzerButton.addEventListener('click', (e) => {
        getAnalysis(getCodeFromBrowser());
        console.log("Button clicked");
    });
    aiAnalyzerButton.className = "inline-flex items-center justify-center gap-2 text-sm font-medium px-3.5 py-1 bg-pink rounded-sd-md opacity-80 h";
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

function appendAiAnalyzerButton () {
    const sibling = getSiblingNode();
    if (!sibling) {
        console.info("No Solution button found, exiting");
        return;
    }
    const aiAnalyzerButton = createAiAnalyzerButton();
    sibling.parentNode.insertAdjacentElement("afterBegin", aiAnalyzerButton);
}

function getCodeFromBrowser() {
    const model = monaco.editor.getEditors();
    try {
        if (model.length <= 0) {
            throw new Error("No editor instance found");
        }    
    } catch (error) {
        console.error(error);
    }    
    return model[0].getValue();
}
