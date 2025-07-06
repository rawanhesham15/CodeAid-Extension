import { Router } from "express";
import fs from "fs";
import path from "path";
import complexityRateCalculator from "../rateCalculator/complexityRateCalculator.js";
import FileManager from "../filesManagement/fileManager.js";

const RateCalculatorRouter = Router();

RateCalculatorRouter.post("/complexity", async (req, res) => {
  const filePath = req.body.path;
  const projectDir = req.body.projectDir

  if (!fs.existsSync(filePath) || !filePath.endsWith(".java")) {
    return res.status(400).json({ message: "Invalid Java file path" });
  }

  try {
    // const projectDir = path.dirname(filePath);
    const fileManager = new FileManager();

    const javaFiles = await fileManager.getAllJavaFilePaths(projectDir);
    console.log(javaFiles)

    const { isValid, errorMessage } = await fileManager.checkProjectJavaSyntax(javaFiles);

    if (!isValid) {
      console.error("❌ Java syntax error:\n", errorMessage);
      return res.send("Java syntax error in the provided file");
    }

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
