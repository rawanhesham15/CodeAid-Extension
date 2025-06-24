import { Router } from "express";
import RefactorStorage from "../refactoring/refactorStorage.js"; // Capitalized, not refactorStorage
import path from "path";
import fs from "fs/promises";
import refactorSolidViolationsAction from "../refactoring/refactorSolidViolationsActoin.js";
const RefactorRouter = Router();

// ✅ Instantiate the class
const store = new RefactorStorage();
const refactorSolid = new refactorSolidViolationsAction();

// RefactorRouter.post("/solid", async (req, res) => {
//   const { path, content } = req.body;

//   try {
//     await store.save(path, content);
//     res.json({ message: "Solid violations refactored and state saved", data: req.body });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

RefactorRouter.post("/solid", async (req, res) => {
  const { path: filePath, content } = req.body;

  try {
    const projectDir = path.dirname(filePath);
    const allJavaFiles = await store.getAllJavaFiles(projectDir);

    for (const file of allJavaFiles) {
      const fileContent = await fs.readFile(file, "utf-8");
      await store.save(file, fileContent);
    }

    refactorSolid.refactorMethod(req)

    res.json({ message: "All project files saved before solid refactor" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

RefactorRouter.post("/undo", async (req, res) => {
  const { path } = req.body;

  try {
    console.log("Undoing changes for path:", path);
    const lastState = await store.undo(path);
    // You can return lastState if needed
    res.json({ message: "Undo last state fetched", lastState });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function refactorCouplingCode(code) {
  // Apply your coupling smell refactoring logic here
  return code.replace(/System\.out\.println/g, "// Refactored println");
}

RefactorRouter.post("/couplingsmells", async (req, res) => {
  const { projectRoot, files } = req.body;

  if (!projectRoot || !files) {
    return res.status(400).json({ error: "Missing projectRoot or files" });
  }

  try {
    const refactoredFiles = {};
    const processedPaths = new Set();

    const filePaths = Object.keys(files);
    console.log("Received file paths:", filePaths);

    for (const [rawPath, content] of Object.entries(files)) {
      // Normalize path
      const relativePath = rawPath.replace(/\\/g, "/");

      // Avoid processing the same file twice
      if (processedPaths.has(relativePath)) {
        console.log(`Skipping duplicate file: ${relativePath}`);
        continue;
      }
      processedPaths.add(relativePath);

      console.log("Processing file:", relativePath);

      // Placeholder for actual refactoring logic
      const refactoredCode = content;

      const fullPath = path.join(projectRoot, relativePath);
      console.log("Saving to:", fullPath);

      // Save refactored code
      await store.save(fullPath, refactoredCode);
      refactoredFiles[relativePath] = refactoredCode;
    }

    res.json({
      message: "Coupling smells refactored and saved.",
      refactoredFiles,
    });
  } catch (err) {
    console.error("Error during coupling smell refactoring:", err);
    res.status(500).json({ error: err.message });
  }
});

export default RefactorRouter;
