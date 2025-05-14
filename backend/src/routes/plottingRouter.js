import { Router } from "express";
import PlotComponentDiagram from "../diagramPlotting/plotComponentDiagram.js";
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


PlottingRouter.post("/component", async (req, res) => {
  try {
    var depPlotting = new PlotComponentDiagram();
    var returnedVal = await depPlotting.createDiagram(req);

    if (returnedVal == null) {
      return res.json({ path: req.body.path, data: req.body });
    }

    res.json({ message: returnedVal, data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default PlottingRouter;
