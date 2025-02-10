import { Router } from "express";
import CouplingDetection from "../detection/couplingDetection.js";
import FileSOLIDViolationDetection from "../detection/fileSolidViolationsDetection.js";
import ProjectSOLIDViolationDetection from "../detection/projectSolidViolationDetection.js";

const DetectRouter = Router();

DetectRouter.post("/solid", async (req, res) => {
  try {
    let context = req.body.context;
    let SOLIDDetector;
    if (context === "file") {
      SOLIDDetector = new FileSOLIDViolationDetection();
    } else {
      SOLIDDetector = new ProjectSOLIDViolationDetection();
    }
    var returnedVal = await SOLIDDetector.detectionMethod(req);
    console.log(returnedVal)
    res.json({ message: returnedVal, data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

DetectRouter.post("/couplingsmells", async (req, res) => {
  try {
    var couplingSmellsDetector = new CouplingDetection();
    var returnedVal = await couplingSmellsDetector.detectionMethod(req);
    res.json({ message: returnedVal, data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default DetectRouter;
