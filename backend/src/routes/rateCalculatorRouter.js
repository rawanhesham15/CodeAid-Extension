import { Router } from "express";
import fs from "fs";
import complexityRateCalculator from "../rateCalculator/complexityRateCalculator.js";

const RateCalculatorRouter = Router();

RateCalculatorRouter.post("/complexity", (req, res) => {

  const filePath = req.body.path;

  if (!fs.existsSync(filePath) || !filePath.endsWith(".java")) {
    return res.status(400).json({ message: "Invalid Java file path" });
  }

  try {
    const calc = new complexityRateCalculator();
    const classes = calc.extractClassesAndComplexity(filePath);

    if (classes.length === 0) {
      return res.json({
        message: "No complexity violations found. All classes are within the acceptable threshold.",
        data: [],
        warning: true,
      });
    }

    const complexityData = [{ file: filePath, classes }];
    console.log(JSON.stringify(complexityData, null, 2));
    res.json({ message: "Complexity rate calculated", data: complexityData });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error calculating complexity rate",
      error: error.message,
    });
  }
});


export default RateCalculatorRouter;
