import express from "express";
import supabase from "../db.js";

const router = express.Router();

// Add transaction
router.post("/", async (req, res) => {
  const { type, description, category_source, amount } = req.body;

  if (!["Revenue", "Expense"].includes(type)) {
    return res.status(400).json({ error: "Type must be Revenue or Expense" });
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert([{ type, description, category_source, amount }]);

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get all transactions
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Get profit/loss summary
router.get("/summary", async (req, res) => {
  const { data: allData, error } = await supabase.from("transactions").select("*");
  if (error) return res.status(400).json({ error: error.message });

  const revenue = allData
    .filter(t => t.type === "Revenue")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = allData
    .filter(t => t.type === "Expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const profit_loss = revenue - expense;
  res.json({ revenue, expense, profit_loss });
});
// Delete transaction by ID
// Delete transaction by ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) return res.status(400).json({ error: error.message });

  if (!data || data.length === 0) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  res.json({ message: "Transaction deleted successfully", data });
});

export default router;
