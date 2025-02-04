class PlottingAction{
  constructor(diagramGenerator){
    this.diagramGenerator = diagramGenerator
    if(new.target === PlottingAction) {
      throw new Error("Can't instantiate an abstract class directly");
    }
  }
  createDiagram(){
    projectJSON = this.gatherCode();
    parsedProject = this.parseProject(projectJSON);
    returnedVal = this.generateDiagram();
    if(returnedVal == null){
      
    }else{

    }
  }
  gatherCode(){

  }
  parseProject(){

  }
  parseCode(){

  }
  generateDiagram(parsedCode){
    this.diagramGenerator.generateDiagram(parsedCode);
  }
}