import PromptGenerator from "./promptGenerator.js";

class FileDetectSOLIDViolationsPG extends PromptGenerator {
  generatePrompt(codeJSON, summary) {
    return `For the following Code: \n ${codeJSON}\n Act as Software Engineer and detect SOLID violations. Then return the response in the form of bullet points (Class, Names of Principles Violated), don't explain the violations`;
  }
}
export default FileDetectSOLIDViolationsPG;
