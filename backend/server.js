import express from "express";
import { appRoutes } from "./src/routes/router.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

appRoutes(app);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
