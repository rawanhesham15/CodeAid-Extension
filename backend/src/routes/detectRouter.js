import { Router } from "express";
import FileSOLIDViolationDetection from "../detection/fileSolidViolationsDetection.js";
import ProjectSOLIDViolationDetection from "../detection/projectSolidViolationDetection.js";
import FileCOUPLINGViolationDetection from "../detection/fileCouplingViolationsDetection.js";
import ProjectCOUPLINGViolationDetection from "../detection/projectCouplingViolationDetection.js";
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
    res.json({ message: returnedVal, data: req.body });
  } 
  catch (error) {
    // res.json({ message: "Java syntax error in the provided files" });
    res.status(500).json({ error: error.message });
  }
});

DetectRouter.post("/couplingsmells", async (req, res) => {
  try {
    let context = req.body.context;
    let couplingDetector;
    console.log(context);
    if (context === "file") {
      couplingDetector = new FileCOUPLINGViolationDetection();
    } else {
      couplingDetector = new ProjectCOUPLINGViolationDetection();
    }
    var returnedVal = await couplingDetector.detectionMethod(req);
    res.json({ message: returnedVal, data: req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
    // res.json({ message: "Java syntax error in the provided files" });

  }
});

export default DetectRouter;
