import { GoogleGenAI } from "@google/genai";

// for testing
import { code, systemPrompt } from '../test/sample_inputs.js'

const apiKey = "AIzaSyCzI6zetE9yZFwR2hHDiscEj3Tw4ZUx8mo"
const aiAnalyzer = new GoogleGenAI({apiKey});

const getAnalysis = async ( code ) => {
    const analysisResponse = await aiAnalyzer.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `System Prompt: ${systemPrompt} Code-To-Analyze: ${code}`
    })
    console.log(analysisResponse.candidates[0].content.parts[0].text);
}

getAnalysis(code);