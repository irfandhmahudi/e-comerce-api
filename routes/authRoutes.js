import express from "express";
import {
  registerUser,
  verifyOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  resendOtp,
  me,
  uploadAvatar,
  getAvatar,
  updateProfile,
  updateAvatar,
  logout,
} from "../controllers/authController.js";
import protect from "../middleware/protect.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);

// Endpoint untuk mendapatkan informasi pengguna saat ini
router.get("/me", protect, me);

// Endpoint untuk mengirim ulang OTP
router.post("/resend-otp", resendOtp);

// Endpoint untuk forgot password
router.post("/forgot-password", forgotPassword);

// Endpoint untuk reset password
router.post("/reset-password/:resetToken", resetPassword);

// Endpoint untuk upload avatar
router.post(
  "/upload-avatar",
  protect, // Middleware autentikasi
  upload.single("avatar"), // Middleware untuk menangani file upload
  uploadAvatar // Controller untuk upload avatar
);

// Endpoint untuk mendapatkan URL avatar
router.get("/avatar/:id", getAvatar);

// Endpoint update profile
router.patch("/update-profile/:id", updateProfile);

// Endpoint update avatar
router.patch(
  "/update-avatar/:id",
  upload.single("avatar"),
  protect,
  updateAvatar
);

//Endpoint logout
router.post("/logout/:id", logout);

export default router;
