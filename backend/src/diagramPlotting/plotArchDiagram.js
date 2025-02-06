import PlottingAction from "./plottingAction.js";
class PlotArchDiagram extends PlottingAction {
  constructor() {
    super();
  }
  parseProject(projectJSON) {
    super.parseProject();
    console.log("jjjj");
  }
}

export default PlotArchDiagram;