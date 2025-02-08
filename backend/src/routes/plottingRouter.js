import { Router } from "express";
import PlotArchDiagram from "../diagramPlotting/plotArchDiagram.js";
import PlotDependencyDiagram from "../diagramPlotting/plotDependencyDiagram.js";
import PlotClassDiagram from "../diagramPlotting/plotClassDiagram.js";

const PlottingRouter = Router();

PlottingRouter.post("/class",async (req, res) => {
  try {
  var classPlotting = new PlotClassDiagram();
  var returnedVal = await classPlotting.createDiagram(req);
  if (returnedVal == null) {
    return res.json({ path: req.body.path, data: req.body });
  }
  res.json({ message: returnedVal, data: req.body });
  }
  catch (error) {
    res.status(500).json({ error: error.message });
  }
});

PlottingRouter.post("/dependency", async (req, res) => {
  try {
    var depPlotting = new PlotDependencyDiagram();
    var returnedVal = await depPlotting.createDiagram(req);

    if (returnedVal == null) {
      return res.json({ path: req.body.path, data: req.body });
    }

    res.json({ message: returnedVal, data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


PlottingRouter.post("/architecture", (req, res) => {
  var archPlotting = new PlotArchDiagram();
  var filePath = archPlotting.createDiagram(req);
  if (filePath == null) {
    res.json({ message: "Failed to generate diagram", data: req.body });
  }
  res.json({ path: filePath, data: req.body });
});

export default PlottingRouter;
