import User from "../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";
import crypto from "crypto";
// import jwt from "jsonwebtoken";
import cloudinary from "cloudinary";

// @desc Register new user
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    username,
    email,
    password,
    otp,
  });

  if (user) {
    await sendEmail(user.email, "Verify your account", `Your OTP is ${otp}`);
    res.status(201).json({
      success: true,
      message: "User registered. Check your email for OTP.",
    });
  } else {
    res.status(400).json({ success: false, message: "Invalid user data" });
  }
};

// @desc Get user profile
export const me = async (req, res) => {
  try {
    const user = req.user; // User sudah tersedia di req.user karena middleware

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// @desc Verify OTP
export const verifyOtp = async (req, res) => {
  const { otp } = req.body;

  const user = await User.findOne({ otp });

  if (user && user.otp === otp) {
    user.isVerified = true;
    user.otp = undefined;
    await user.save();
    res
      .status(200)
      .json({ success: true, data: user, message: "Account verified" });
  } else {
    res.status(400).json({ message: "Invalid OTP" });
  }
};

// @desc Login user
export const loginUser = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  });

  if (user && (await user.matchPassword(password))) {
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your account first" });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      },
      message: "Login successful",
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body.email;

  // Cari user berdasarkan email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Buat token reset password (valid hanya 1 jam)
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 3600000; // Token valid selama 1 jam
  await user.save();

  // Kirim email dengan link reset password
  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

  const message = `You have requested to reset your password. Please click the following link to reset your password:\n\n${resetUrl}`;

  try {
    await sendEmail(user.email, "Password Reset Request", message);
    res
      .status(200)
      .json({ success: true, message: "Email sent with password reset link" });
  } catch (error) {
    console.error(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.status(500).json({ message: "Error sending email, please try again" });
  }
};

export const resetPassword = async (req, res) => {
  const { resetToken } = req.params; // Mengambil token dari URL params
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // Cari user berdasarkan token reset password
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpire: { $gt: Date.now() }, // Token belum kadaluarsa
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Set password baru
    user.password = newPassword;
    user.resetPasswordToken = undefined; // Hapus token setelah reset
    user.resetPasswordExpire = undefined; // Hapus waktu kedaluwarsa
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Resend OTP
export const resendOtp = async (req, res) => {
  const { email } = req.body.email;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "Account is already verified" });
  }

  // Generate OTP baru
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Set OTP baru ke user
  user.otp = otp;
  await user.save();

  // Kirim OTP baru ke email
  try {
    await sendEmail(
      user.email,
      "Verify your account",
      `Your new OTP is ${otp}`
    );
    res.status(200).json({ message: "New OTP sent to your email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending OTP, please try again" });
  }
};

// @desc Upload avatar
export const uploadAvatar = async (req, res) => {
  try {
    // Pastikan user tersedia di req.user
    const userId = req.user._id; // Ambil userId dari req.user yang ada setelah proteksi autentikasi

    // Pastikan file ada di request
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Cari user berdasarkan userId yang ada di req.user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Tentukan public_id berdasarkan nama file asli
    const fileName = file.originalname; // Ambil nama asli file

    // Upload gambar ke Cloudinary dengan nama asli
    const result = await cloudinary.v2.uploader.upload(file.path, {
      public_id: fileName, // Gunakan nama file asli di Cloudinary
      folder: "avatars", // Folder Cloudinary
      transformation: { width: 150, height: 150, crop: "fill" }, // Transformation image size
    });

    // Simpan URL avatar ke user document
    user.avatar = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({
      message: "Server error while uploading avatar",
      error: error.message,
    });
  }
};

// @desc Get avatar URL
export const getAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ avatar: user.avatar });
  } catch (error) {
    console.error("Error getting avatar URL:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Delete avatar
export const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.avatar = null;
    await user.save();
    res.status(200).json({ message: "Avatar deleted successfully" });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Update avatar
export const updateAvatar = async (req, res) => {
  try {
    // Pastikan user tersedia di req.user
    const userId = req.user._id; // Ambil userId dari req.user yang ada setelah proteksi autentikasi

    // Pastikan file ada di request
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Cari user berdasarkan userId yang ada di req.user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hapus avatar lama jika ada di Cloudinary
    if (user.avatar) {
      const publicId = user.avatar.split("/").pop().split(".")[0]; // Ambil public_id dari URL avatar
      await cloudinary.v2.uploader.destroy(`avatars/${publicId}`); // Hapus gambar lama di Cloudinary
    }

    // Tentukan public_id berdasarkan nama file asli
    const fileName = file.originalname; // Ambil nama asli file

    // Upload gambar ke Cloudinary dengan nama asli
    const result = await cloudinary.v2.uploader.upload(file.path, {
      public_id: fileName, // Gunakan nama file asli di Cloudinary
      folder: "avatars", // Folder Cloudinary
      transformation: { width: 150, height: 150, crop: "fill" }, // Transformation image size
    });

    // Simpan URL avatar baru ke user document
    user.avatar = result.secure_url;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({
      message: "Server error while updating avatar",
      error: error.message,
    });
  }
};

// @desc update profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    // Cari pengguna berdasarkan ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Field yang diizinkan untuk diperbarui
    const allowedUpdates = ["username", "email", "firstname", "lastname"];
    const updates = Object.keys(req.body);
    const isValidUpdate = updates.every((key) => allowedUpdates.includes(key));

    if (!isValidUpdate) {
      return res.status(400).json({
        message: "Invalid updates! Only username and email are allowed.",
      });
    }

    // Lakukan update
    updates.forEach((key) => {
      user[key] = req.body[key];
    });

    await user.save();

    res
      .status(200)
      .json({ success: true, data: user, message: "Profile Updated" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc logout
export const logout = async (req, res) => {
  const { id } = req.params; // Ambil ID dari parameter URL

  try {
    // Validasi apakah ID ada dalam request
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Hapus token terkait pengguna (opsional, bergantung pada implementasi)
    // Misal: update pengguna untuk menghapus token di database
    // await UserModel.findByIdAndUpdate(id, { token: null });

    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      data: {},
      message: "User Logged Out",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
