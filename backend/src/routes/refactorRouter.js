import { Router } from "express";
import refactorSolidViolationsAction from "../refactoring/refactorSolidViolationsActoin.js";
import FileRefactorCoupling from "../refactoring/refactorCouplingAction.js";
import ProjectManager from "../fileManager/projectManager.js";
const RefactorRouter = Router();
// Instantiate the class
const refactorSolid = new refactorSolidViolationsAction();
const refactorCoupling = new FileRefactorCoupling();
const projectManager = new ProjectManager();
RefactorRouter.post("/solid", async (req, res) => {
  const { path: filePath, content } = req.body;
  try {
    const response = await refactorSolid.refactorMethod(req)

    res.json({ message: "All project files saved before solid refactor", data: response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

RefactorRouter.post("/undo", async (req, res) => {
  const { path, project } = req.body;
  try {
    console.log("Undoing changes for path:", path);
    // You can return lastState if needed
     await projectManager.undo(path,project);
    res.json({ message: "Undo last state fetched" });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("Error during undo operation:", error);
  }
});



RefactorRouter.post("/couplingsmells", async (req, res) => {
  const { rootDir } = req.body;

  if (!rootDir) {
    return res.status(400).json({ error: "Missing projectRoot or files" });
  }
  const response = await refactorCoupling.refactorMethod(req);
  res.json({ message: "All project files saved before solid refactor", data: response });
});

export default RefactorRouter;
