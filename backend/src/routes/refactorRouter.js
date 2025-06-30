import { Router } from "express";
import refactorSolidViolationsAction from "../refactoring/refactorSolidViolationsActoin.js";
import FileRefactorCoupling from "../refactoring/refactorCouplingAction.js";
import dbManager from "../dbManager/dbManager.js";
import FileManager from '../fileManager/fileManager.js';



const RefactorRouter = Router();


// Instantiate the class
const db = new dbManager();
const refactorSolid = new refactorSolidViolationsAction();
const refactorCoupling = new FileRefactorCoupling();
const fm = new FileManager();


RefactorRouter.post("/solid", async (req, res) => {
  const { path: filePath, content } = req.body;

  try {
    await db.storeAllBeforeRefactor(filePath);

    const response = await refactorSolid.refactorMethod(req)

    res.json({ message: "All project files saved before solid refactor", data: response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

RefactorRouter.post("/undo", async (req, res) => {
  const { path, projectPath } = req.body;
  try {
    console.log("Undoing changes for path:", path);
    // You can return lastState if needed
     await fm.undo(path,projectPath);
    res.json({ message: "Undo last state fetched" });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
