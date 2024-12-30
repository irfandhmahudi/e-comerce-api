import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import bodyParser from "body-parser";
import cors from "cors";
import cloudinary from "cloudinary";
import productRoutes from "./routes/productRoute.js";
import cartRoutes from "./routes/cartRoute.js";
import couponRoutes from "./routes/coupunRoutes.js";
import addressRoutes from "./routes/addressRoute.js";

dotenv.config();
connectDB();

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// Konfigurasi CORS
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Jika Anda menggunakan cookies atau header khusus
  })
);
app.use(bodyParser.json());

// Menambahkan route auth
app.use("/api/auth", authRoutes);

// Menambahkan route product
app.use("/api/products", productRoutes);

// Menambahkan route cart
app.use("/api/cart", cartRoutes);

// Menambahkan route coupon
app.use("/api/coupons", couponRoutes);

// Menambahkan route address
// Use the address routes
app.use("/api/adresses", addressRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
