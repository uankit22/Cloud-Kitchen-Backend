import express from "express";
import cors from "cors";
import transactionsRoutes from "./routes/transactions.js";

const app = express();

app.use(cors()); // Allow all origins
app.use(express.json());

app.use("/api/transactions", transactionsRoutes);

export default app;
