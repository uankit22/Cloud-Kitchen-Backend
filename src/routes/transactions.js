import express from "express";
import supabase from "../db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Encryption setup
const algorithm = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef"; // 32 bytes
const IV_LENGTH = 16;

// Utility functions
function encrypt(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  if (!text || typeof text !== "string" || !text.includes(":")) return text;
  try {
    const [ivHex, encryptedData] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err.message);
    return text; // fallback
  }
}

// Middleware to protect routes
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

  if (typeof amount !== "number") {
    return res.status(400).json({ error: "Amount must be a number" });
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert([
      {
        type,
        description: encrypt(description),
        category_source: encrypt(category_source),
        amount, // keep numeric
        user_id: req.user.user_id,
      },
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

  // decrypt text fields only
  const decryptedData = data.map((t) => ({
    ...t,
    description: decrypt(t.description),
    category_source: decrypt(t.category_source),
  }));

  res.json(decryptedData);
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
 * GET /items
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
