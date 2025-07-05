import express from "express";
import { appRoutes } from "./src/routes/router.js";
import mongoose from 'mongoose';
import project from './src/Models/ProjectModel.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

appRoutes(app);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

mongoose.connect('mongodb+srv://marwamostafa322:1gwmaEDbuTS13uYU@codeaid.sa1dhpx.mongodb.net/codeAid?retryWrites=true&w=majority&appName=codeAid', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ Connection error:', err));
