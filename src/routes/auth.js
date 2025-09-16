import express from "express";
import supabase from "../db.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// send OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // delete old OTP
  await supabase.from("otps").delete().eq("email", email);

  // store new OTP
  const { error } = await supabase.from("otps").insert([{ email, otp }]);
  if (error) return res.status(400).json({ error: error.message });

  // configure nodemailer
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // send OTP with HTML template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OTP Code</title>
    </head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif;background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%);line-height:1.6;">
      <table role="presentation" style="width:100%;border-collapse:collapse;background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%);padding:60px 20px;">
        <tr>
          <td align="center">
            <table role="presentation" style="max-width:520px;width:100%;border-collapse:collapse;background-color:white;border-radius:20px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04);overflow:hidden;border:1px solid rgba(255,255,255,0.8);">
              <tr>
                <td style="background:linear-gradient(135deg,#367aff 0%,#2563eb 100%);padding:50px 40px 40px 40px;text-align:center;">
                  <h1 style="margin:0;color:white;font-size:32px;font-weight:700;">Verification Code</h1>
                  <p style="margin:12px 0 0 0;color:rgba(255,255,255,0.9);font-size:16px;font-weight:400;">Secure access to your account</p>
                </td>
              </tr>
              <tr>
                <td style="padding:50px 40px;text-align:center;">
                  <div style="font-size:42px;font-weight:800;color:#367aff;letter-spacing:12px;font-family:'SF Mono','Monaco','Inconsolata','Roboto Mono',monospace;">
                    ${otp}
                  </div>
                  <p style="margin-top:30px;color:#64748b;font-size:15px;">Code expires in 10 minutes. Single-use verification only.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Your OTP Code",
    html: htmlTemplate,
  });

  res.json({ message: "OTP sent successfully" });
});


// verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const { data: otpData } = await supabase
    .from("otps")
    .select("*")
    .eq("email", email)
    .eq("otp", otp)
    .single();

  if (!otpData) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  await supabase.from("otps").delete().eq("email", email);

  let { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) {
    const { data: newUser } = await supabase
      .from("users")
      .insert([{ email }])
      .select()
      .single();
    user = newUser;
  }

  const token = jwt.sign({ user_id: user.id, email: user.email }, JWT_SECRET);

  res.json({ token });
});

// middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ✅ set restaurant API
router.post("/set-restaurant", authMiddleware, async (req, res) => {
  const { restaurant_name } = req.body;
  if (!restaurant_name) {
    return res.status(400).json({ error: "Restaurant name required" });
  }

  const { error } = await supabase
    .from("users")
    .update({ restaurant_name })
    .eq("id", req.user.user_id);

  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Restaurant name set successfully" });
});

// ✅ get restaurant API
router.get("/get-restaurant", authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("restaurant_name")
    .eq("id", req.user.user_id)
    .single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ restaurant_name: data?.restaurant_name || null });
});


export default router;
