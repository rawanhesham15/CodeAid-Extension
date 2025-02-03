import { Router } from "express";

const DetectRouter = Router();

DetectRouter.post("/solid", (req, res) => {
  res.json({ message: "SOLID violations detected", data: req.body });
});

DetectRouter.post("/couplingsmells", (req, res) => {
  res.json({ message: "Coupling smells detected", data: req.body });
});

export default DetectRouter;
