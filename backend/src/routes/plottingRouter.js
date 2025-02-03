import { Router } from "express";

const PlottingRouter = Router();

PlottingRouter.post("/class", (req, res) => {
  res.json({ path: "...", data: req.body });
});

PlottingRouter.post("/architecture", (req, res) => {
  res.json({ path: "...", data: req.body });
});

PlottingRouter.post("/dependency", (req, res) => {
  res.json({ path: "...", data: req.body });
});

export default PlottingRouter;
