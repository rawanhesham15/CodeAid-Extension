import DiagramGenerator from "./diagramGenerator.js";
import FileManager from "./../fileManager/fileManager.js";
class PlottingAction {
  constructor() {
    this.diagramGenerator = new DiagramGenerator();
    this.fileManager = new FileManager();
    if (new.target === PlottingAction) {
      throw new Error("Can't instantiate an abstract class directly");
    }
  }
  /**
   *
   * @param {Object} req
   * @returns {Object}
   */
  async createDiagram(req){
    var projectJSON = this.gatherCode(req.body.path);
    var parsedProject = this.parseProject(projectJSON);
    var returnedVal = await this.generateDiagram(parsedProject, req.body.path);
    return returnedVal;
  }
  /**
   *
   * @param {string} path
   * @returns {Object}
   */
  gatherCode(path) {
    var projectContent = this.fileManager.getProjectContent(path);
    return projectContent;
  }
  /**
   *
   * @param {Object} projectJSON
   * @returns {Object}
   */
  parseProject(projectJSON) {}
  /**
   *
   * @param {string} parsedCode
   * @param {string} projectPath
   * @param {string} fileName
   * @returns {string}
   */
  async generateDiagram(parsedCode, projectPath) {
  }
}

export default PlottingAction;
