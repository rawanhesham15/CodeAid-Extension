import DetectionAction from "./detectionAction.js";
import DetectCouplingPG from "./../promptGenerator/detectCouplingPG.js";

class CouplingDetection extends DetectionAction {
  generatePrompt(codeJSON, summary) {
    let codeString = "";
    codeJSON.forEach((file) => {
      codeString = codeString + file.content;
    });
    let promptGenerator = new DetectCouplingPG();
    return promptGenerator.generatePrompt(codeString, summary);
  }
}

export default CouplingDetection;
