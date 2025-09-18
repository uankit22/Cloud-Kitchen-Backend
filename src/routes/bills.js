import express from "express";
import supabase from "../db.js";

const router = express.Router();

/**
 * POST /api/bills
 * Add a new bill
 * Body: { bill_number: string, items: array of { item_name, quantity, price, subtotal } }
 */
router.post("/", async (req, res) => {
  const { bill_number, items } = req.body;

  if (!bill_number || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Bill number and items are required" });
  }

  const { data, error } = await supabase
    .from("bills")
    .insert([{ bill_number, items }])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

/**
 * GET /api/bills
 * Fetch all bills
 */
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

export default router;
