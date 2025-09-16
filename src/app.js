import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import transactionsRoutes from "./routes/transactions.js";
import authRoutes from "./routes/auth.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// auth routes
app.use("/api/auth", authRoutes);

// transactions routes
app.use("/api/transactions", transactionsRoutes);

export default app;
