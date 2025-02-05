class PlottingAction{
  constructor(diagramGenerator, fileManager){
    this.diagramGenerator = diagramGenerator;
    this.fileManager = fileManager;
    if(new.target === PlottingAction) {
      throw new Error("Can't instantiate an abstract class directly");
    }
  }
  /**
   * 
   * @param {Object} req 
   * @returns {Object}
   */
  createDiagram(req){
    projectJSON = this.gatherCode(req.path);
    parsedProject = this.parseProject(projectJSON);
    returnedVal = this.generateDiagram(parsedProject, req.path);
    if(returnedVal == null){

    }else{

    }
  }
  /**
   * 
   * @param {string} path 
   * @returns {Object}
   */
  gatherCode(path){
    projectContent = this.fileManager.getProjectContent(path);
    return projectContent;
  }
  /**
   * 
   * @param {Object} projectJSON 
   * @returns {Object}
   */
  parseProject(projectJSON){
    
  }
  /**
   * 
   * @param {string} parsedCode 
   * @returns {string}
   */
  generateDiagram(parsedCode){
    this.diagramGenerator.generateDiagram(parsedCode);
  }
}

export default PlottingAction;
