import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
//import bookRoutes from "./routes/book.js";
import authRoutes from "./routes/auth.js";
import quizRoutes from "./routes/quiz.js";
import dashboardRoutes from "./routes/dashboard.js";
import syllabusRoutes from "./routes/syllabus.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
//app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/syllabus", syllabusRoutes);

app.use(errorHandler);

export default app;
