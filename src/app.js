import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import transactionsRoutes from "./routes/transactions.js";
import authRoutes from "./routes/auth.js";
import itemsRoutes from "./routes/items.js";

const app = express();

// ✅ middlewares must come before routes
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// ✅ routes
app.use("/api/items", itemsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);

export default app;
