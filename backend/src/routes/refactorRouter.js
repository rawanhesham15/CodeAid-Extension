import { Router } from "express";

const RefactorRouter = Router();

RefactorRouter.post("/solid", (req, res) => {
  res.json({ message: "Solid violations refactored", data: req.body });
});

RefactorRouter.post("/couplingsmells", (req, res) => {
  res.json({ message: "Coupling smells refactored", data: req.body });
});

export default RefactorRouter;
