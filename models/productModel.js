import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    SKU: {
      type: String,
      required: true,
      unique: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        originalName: { type: String, required: true },
        publicId: { type: String, required: true }, // Simpan public_id dari Cloudinary
      },
    ],
    size: {
      type: [String], // Array of strings to define available sizes (e.g., ["S", "M", "L", "XL"])
      required: false, // Set to `true` if sizes are mandatory
      default: [], // Default to an empty array if no sizes are provided
    },
    discount: {
      type: Number, // Diskon dalam persentase, misalnya 10 untuk 10%
      required: false,
      default: 0, // Default tidak ada diskon
      min: 0, // Tidak boleh diskon negatif
      max: 100, // Diskon maksimal 100%
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
