import { Router } from "express";
import RefactorStorage from "../refactoring/refactorStorage.js"; // Capitalized, not refactorStorage

const RefactorRouter = Router();

// ✅ Instantiate the class
const store = new RefactorStorage();


RefactorRouter.post("/solid", async (req, res) => {
  const { path, content } = req.body;

  try {
    await store.save(path, content);
    res.json({ message: "Solid violations refactored and state saved", data: req.body });
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
RefactorRouter.post("/couplingsmells", (req, res) => {
  res.json({ message: "Coupling smells refactored", data: req.body });
});

export default RefactorRouter;
