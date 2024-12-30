import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const cartItemSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, default: 1 },
    size: { type: String, required: true }, // Menambahkan ukuran
  },
  {
    timestamps: true,
  }
);

const userSchema = mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    avatar: { type: String }, // URL gambar di Cloudinary
    otp: { type: String },

    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    cart: [cartItemSchema], // Keranjang pengguna dengan properti size
    firstname: { type: String, default: "" },
    lastname: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Enkripsi password sebelum disimpan ke database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// Verifikasi password yang dimasukkan saat login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
