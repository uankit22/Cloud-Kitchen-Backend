import express from "express";
import supabase from "../db.js";

const router = express.Router();

/**
 * POST /api/items
 * Add a new menu item
 * Body: { item_name: string, price: number }
 */
router.post("/", async (req, res) => {
  const { item_name, price } = req.body;

  if (!item_name || typeof price !== "number") {
    return res.status(400).json({ error: "Item name and price are required" });
  }

  const { data, error } = await supabase
    .from("items")
    .insert([{ item_name, price }])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data[0]);
});

/**
 * GET /api/items
 * Fetch all items
 */
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

export default router;
