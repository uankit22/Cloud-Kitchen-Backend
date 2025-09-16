import express from "express";
import supabase from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { user_id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

router.use(authMiddleware);

// Add transaction
router.post("/", async (req, res) => {
  const { type, description, category_source, amount } = req.body;

  if (!["Revenue", "Expense"].includes(type)) {
    return res.status(400).json({ error: "Type must be Revenue or Expense" });
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert([
      { type, description, category_source, amount, user_id: req.user.user_id },
    ]);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get all transactions
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", req.user.user_id)
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get profit/loss summary
router.get("/summary", async (req, res) => {
  const { data: allData, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", req.user.user_id);

  if (error) return res.status(400).json({ error: error.message });

  const revenue = allData
    .filter((t) => t.type === "Revenue")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = allData
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const profit_loss = revenue - expense;
  res.json({ revenue, expense, profit_loss });
});

// Delete transaction by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.user_id);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Transaction deleted successfully" });
});

export default router;
