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
  <title>Your OTP Verification Code</title>
  <!-- Removed external font links as Gmail often blocks them -->
  <style>
    /* Gmail-specific responsive CSS with !important declarations */
    @media only screen and (max-width: 600px) {
      .container { 
        max-width: 100% !important; 
        width: 100% !important;
        margin: 0 !important; 
      }
      .mobile-padding { 
        padding: 20px 15px !important; 
      }
      .mobile-title { 
        font-size: 28px !important; 
        line-height: 1.3 !important; 
      }
      .mobile-subtitle { 
        font-size: 16px !important; 
      }
      .mobile-otp { 
        font-size: 36px !important; 
        letter-spacing: 4px !important; 
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
      .mobile-center {
        text-align: center !important;
      }
      .mobile-hide {
        display: none !important;
      }
    }
    
    @media only screen and (max-width: 480px) {
      .mobile-title { 
        font-size: 24px !important; 
      }
      .mobile-otp { 
        font-size: 32px !important; 
        letter-spacing: 3px !important; 
      }
      .mobile-padding { 
        padding: 15px 10px !important; 
      }
    }
  </style>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f8fafc;line-height:1.6;color:#475569;">
  
  <!-- Simplified table structure for better Gmail compatibility -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;padding:20px 0;">
    <tr>
      <td align="center">
        
        <!-- Added cellpadding/cellspacing attributes for Gmail -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="container" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          
          <!-- Header accent bar -->
          <tr>
            <td style="height:4px;background-color:#10b981;"></td>
          </tr>
          
          <!-- Header section -->
          <tr>
            <td class="mobile-padding" style="padding:40px 30px;text-align:center;background-color:#ffffff;">
              
              <!-- Security badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:20px;">
                <tr>
                  <td style="background-color:#10b981;color:#ffffff;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:bold;text-transform:uppercase;">
                    🔒 Secure Verification
                  </td>
                </tr>
              </table>
              
              <!-- Simplified title structure for Gmail -->
              <h1 class="mobile-title" style="margin:0 0 10px 0;color:#1e293b;font-family:Georgia,serif;font-size:36px;font-weight:bold;line-height:1.2;">
                Your Access Code
              </h1>
              <p class="mobile-subtitle" style="margin:0;color:#64748b;font-size:18px;line-height:1.5;">
                Enter this code to securely access your account
              </p>
            </td>
          </tr>
          
          <!-- OTP Code section -->
          <tr>
            <td class="mobile-padding" style="padding:30px;text-align:center;background-color:#ffffff;">
              
              <!-- Simplified OTP container with inline styles -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0fdf4;border:2px solid #10b981;border-radius:12px;margin-bottom:30px;">
                <tr>
                  <td style="padding:30px 20px;text-align:center;">
                    <div class="mobile-otp" style="font-family:Georgia,serif;font-size:48px;font-weight:bold;color:#059669;letter-spacing:6px;margin-bottom:15px;">
                      ${otp}
                    </div>
                    <p style="margin:0;color:#059669;font-size:14px;font-weight:bold;">
                      One-Time Verification Code
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Simplified countdown timer with table layout -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fef3c7;border:2px solid #f59e0b;border-radius:12px;margin-bottom:30px;">
                <tr>
                  <td style="padding:20px;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>
                        <td class="mobile-stack" style="padding-right:10px;vertical-align:middle;">
                          <div style="width:32px;height:32px;background-color:#f59e0b;border-radius:50%;display:inline-block;text-align:center;line-height:32px;font-size:16px;">
                            ⏰
                          </div>
                        </td>
                        <td class="mobile-stack mobile-center" style="vertical-align:middle;">
                          <p style="margin:0;color:#92400e;font-size:16px;font-weight:bold;margin-bottom:2px;">
                            Code Expires In
                          </p>
                          <p style="margin:0;color:#b45309;font-size:13px;font-weight:600;">
                            5 minutes from delivery
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Simplified security notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f1f5f9;border-radius:12px;border-left:4px solid #059669;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td class="mobile-stack" style="width:30px;vertical-align:top;padding-right:10px;">
                          <div style="width:20px;height:20px;background-color:#059669;border-radius:50%;color:#ffffff;font-size:12px;font-weight:bold;text-align:center;line-height:20px;">
                            !
                          </div>
                        </td>
                        <td class="mobile-stack mobile-center" style="vertical-align:top;">
                          <p style="margin:0 0 8px 0;color:#1e293b;font-size:14px;font-weight:bold;">
                            Security Notice
                          </p>
                          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
                            This code is single-use only and will expire automatically. Never share this code with anyone.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="mobile-padding" style="padding:30px;text-align:center;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                If you didn't request this code, please ignore this email.
              </p>
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
  from: `"Expense Tracking" <${process.env.SMTP_USER}>`,
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
