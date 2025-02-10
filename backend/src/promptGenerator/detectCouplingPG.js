import PromptGenerator from "./promptGenerator.js";

class DetectCouplingPG extends PromptGenerator {
  constructor() {
    super();
  }
  generatePrompt(codeJSON, summary) {
    return `For the following Code in Json format: \n ${codeJSON}\n Act as Software Engineer and detect Coupling Smells. Then return the response in the form of pairs (Class, Smells)`;
  }
}
export default DetectCouplingPG;
