import { Router } from "express";
import fs from "fs";
import path from "path";

const RateCalculatorRouter = Router();

const extractClassesAndComplexity = (filePath) => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const classMatches = fileContent.match(/class\s+(\w+)/g); // Match class declarations
    let classes = [];

    if (classMatches) {
      classes = classMatches.map((match) => {
        const className = match.split(" ")[1]; // Extract class name
        return { name: className, rate: (Math.random() * 5).toFixed(2) }; // Dummy complexity rate
      });
    }
    return classes;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
};

// Recursive function to scan directories
const scanDirectory = (dirPath) => {
  let complexityData = [];

  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      // Recursively scan subdirectories
      complexityData = complexityData.concat(scanDirectory(fullPath));
    } else if (item.isFile() && item.name.endsWith(".java")) {
      const classes = extractClassesAndComplexity(fullPath);
      if (classes.length > 0) {
        complexityData.push({ file: fullPath, classes });
      }
    }
  }

  return complexityData;
};

RateCalculatorRouter.post("/complexity", (req, res) => {
  const dirPath = req.body.path;
  if (!fs.existsSync(dirPath)) {
    return res.status(400).json({ message: "Invalid directory path" });
  }

  try {
    const complexityData = scanDirectory(dirPath);
    complexityData.map((data) => {
      console.log(data);
    });
    res.json({ message: "Complexity rate calculated", data: complexityData });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Error calculating complexity rates",
        error: error.message,
      });
  }
});

export default RateCalculatorRouter;
