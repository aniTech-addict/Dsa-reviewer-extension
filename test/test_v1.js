import dotenv from 'dotenv';
import { sampleCodes } from '../test/sampleInputs.js';
import fs from 'node:fs';
import path from 'node:path';
import { getAnalysis } from '../workers/getAnalysisResponse.js';

const runAnalysisTest = async () => {
  const __dirname = import.meta.dirname;
  const lineBreak = '\n\n' + '---'*10 + '\n\n'
  const testResultPath = path.join(__dirname, 'result', 'test_results.md');
  let errors = 0;
  for (const code of sampleCodes) {
    try {
      const analysisResponse = await getAnalysis(code);
      fs.appendFileSync(testResultPath, analysisResponse + lineBreak);
    } catch (error) {
      console.error(`Failed to analyze code: ${code}`, error);
      errors++;
      continue;
    }
  }
  console.log(
    `Success ${sampleCodes.length - errors}\nErrors ${errors}\n\n Check ${testResultPath} for success results`,
  );
};

runAnalysisTest();
