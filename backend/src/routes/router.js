import DetectRouter from "./detectRouter.js";
import RefactorRouter from "./refactorRouter.js";
import PlottingRouter from "./plottingRouter.js";
import RateCalculatorRouter from "./rateCalculatorRouter.js";
import DBRouter from "./dbRouter.js";

export const appRoutes = (app) => {
  app.use("/detect", DetectRouter);
  app.use("/refactor", RefactorRouter);
  app.use("/plot", PlottingRouter);
  app.use("/rateCalc", RateCalculatorRouter);
  app.use("/db", DBRouter);
};
