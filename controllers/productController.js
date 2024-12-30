// controllers/productController.js
import Product from "../models/productModel.js";
import cloudinary from "cloudinary";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Definisikan __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add new product (Multiple Images)
// Add new product (Multiple Images)
export const addProduct = async (req, res) => {
  try {
    const { name, price, SKU, stock, category, description, size, discount } =
      req.body;
    let images = [];

    // Cek apakah ada file yang di-upload
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const originalName = file.originalname
          .replace(/\s+/g, "_")
          .toLowerCase();
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: "products",
          public_id: originalName.split(".")[0],
          overwrite: true,
          transformation: { width: 500, height: 500, crop: "fill" },
        });

        images.push({
          url: result.secure_url,
          originalName: file.originalname,
          publicId: result.public_id,
        });
      }
    }

    // Konversi size ke array jika diberikan sebagai string
    const sizeArray = Array.isArray(size)
      ? size
      : typeof size === "string"
      ? size.split(",").map((s) => s.trim())
      : [];

    // Validasi diskon (opsional, pastikan berada dalam rentang 0-100)
    const validatedDiscount = Math.min(Math.max(Number(discount) || 0, 0), 100);

    // Simpan data produk ke MongoDB
    const newProduct = new Product({
      name,
      price,
      SKU,
      stock,
      category,
      description,
      images,
      size: sizeArray,
      discount: validatedDiscount, // Tambahkan discount
    });

    await newProduct.save();
    res.status(200).json({
      success: true,
      message: "Product added successfully",
      newProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error adding product",
      error: error.message,
    });
  }
};

// Edit product by ID (Multiple Images)
export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, SKU, stock, category, description, size, discount } =
      req.body;

    // Cari produk berdasarkan ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let images = [];

    // Jika ada file baru yang diunggah
    if (req.files && req.files.length > 0) {
      for (const img of product.images) {
        await cloudinary.v2.uploader.destroy(img.publicId);
      }

      for (const file of req.files) {
        const result = await cloudinary.v2.uploader.upload(file.path, {
          folder: "products",
          public_id: path.parse(file.originalname).name,
          overwrite: true,
          transformation: { width: 500, height: 500, crop: "fill" },
        });

        images.push({
          url: result.secure_url,
          originalName: file.originalname,
          publicId: result.public_id,
        });
      }
    } else {
      images = product.images;
    }

    // Konversi size ke array jika diberikan sebagai string
    const sizeArray = Array.isArray(size)
      ? size
      : typeof size === "string"
      ? size.split(",").map((s) => s.trim())
      : [];

    // Validasi diskon (opsional, pastikan berada dalam rentang 0-100)
    const validatedDiscount = Math.min(Math.max(Number(discount) || 0, 0), 100);

    // Update produk di database
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        price,
        SKU,
        stock,
        category,
        images,
        description,
        size: sizeArray,
        discount: validatedDiscount, // Tambahkan discount
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Product edited successfully",
      updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error editing product", error });
  }
};

// Delete a product by ID
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Cari produk berdasarkan ID
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Hapus semua gambar yang terkait di Cloudinary
    for (const img of product.images) {
      await cloudinary.v2.uploader.destroy(img.publicId); // Hapus berdasarkan public_id
    }

    // Hapus produk dari database
    await Product.findByIdAndDelete(id);

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting product", error });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params; // Mengambil 'id' dari params

    // Cari produk berdasarkan _id
    const product = await Product.findOne({ _id: id }); // Cari berdasarkan _id

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Hitung harga setelah diskon
    const discountedPrice =
      product.price - (product.price * product.discount) / 100;

    // Sertakan harga diskon dalam respons
    res.json({
      ...product.toObject(),
      discountedPrice, // Tambahkan harga setelah diskon
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching product", error });
  }
};

// Get all products
export const getAllProducts = async (req, res) => {
  try {
    // Ambil semua produk
    const products = await Product.find();

    // Tambahkan properti `discountedPrice` untuk setiap produk
    const productsWithDiscount = products.map((product) => {
      const discountedPrice =
        product.price - (product.price * product.discount) / 100;
      return {
        ...product.toObject(),
        discountedPrice, // Tambahkan harga setelah diskon
      };
    });

    res.json(productsWithDiscount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching products", error });
  }
};

// Get other product
export const getOtherProducts = async (req, res) => {
  try {
    const { category } = req.query; // Ambil kategori dari query parameter

    // Gunakan aggregate untuk mengambil produk acak
    const products = await Product.aggregate([
      { $match: { category: category || { $exists: true } } }, // Filter berdasarkan kategori
      { $sample: { size: 6 } }, // Pilih 6 produk secara acak
    ]);

    res.json(products); // Kirim produk ke client
  } catch (error) {
    console.error("Error fetching other products:", error);
    res.status(500).json({ message: "Error fetching other products", error });
  }
};
