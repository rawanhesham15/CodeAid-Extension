import { Router } from "express";

const RateCalculatorRouter = Router();

RateCalculatorRouter.post("/complexity", (req, res) => {
  res.json({ message: "Complexity rate calculated", data: req.body });
});

export default RateCalculatorRouter