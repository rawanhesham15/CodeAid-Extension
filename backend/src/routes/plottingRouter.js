import { Router } from "express";
import PlotArchDiagram from "../diagramPlotting/plotArchDiagram.js";
import PlotDependencyDiagram from "../diagramPlotting/plotDependencyDiagram.js";
import PlotClassDiagram from "../diagramPlotting/plotClassDiagram.js";

const PlottingRouter = Router();

PlottingRouter.post("/class", (req, res) => {
  var classPlotting = new PlotClassDiagram();
  var filePath = classPlotting.createDiagram(req);
  if (filePath == null) {
    res.json({ message: "Failed to generate diagram", data: req.body });
  }
  res.json({ path: filePath, data: req.body });
});

PlottingRouter.post("/architecture", (req, res) => {
  var archPlotting = new PlotArchDiagram();
  var filePath = archPlotting.createDiagram(req);
  if (filePath == null) {
    res.json({ message: "Failed to generate diagram", data: req.body });
  }
  res.json({ path: filePath, data: req.body });
});

PlottingRouter.post("/dependency", (req, res) => {
  var depPlotting = new PlotDependencyDiagram();
  var returnedVal = depPlotting.createDiagram(req);
  if (returnedVal == null) {
    res.json({ path: req.body.path, data: req.body });
  }
  res.json({ message: returnedVal, data: req.body });
});

export default PlottingRouter;
