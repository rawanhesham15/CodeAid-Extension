import DetectionAction from "./detectionAction.js";
import DetectCouplingPG from './../promptGenerator/detectCouplingPG.js';

class CouplingDetection extends DetectionAction {
  constructor(llmController, fileManager) {
    super(llmController, fileManager);
  }
  generatePrompt(codeJSON, summary) {
    let promptGenerator = new DetectCouplingPG();
    return promptGenerator.generatePrompt(codeJSON, summary);
  }
}

export default CouplingDetection;