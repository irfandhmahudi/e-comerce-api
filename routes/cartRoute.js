import express from "express";
import {
  addCart,
  removeAllCart,
  getCartProducts,
  removeCart,
  updateCartProductQuantity,
} from "../controllers/cartController.js";
import protect from "../middleware/protect.js"; // Middleware untuk melindungi route

const router = express.Router();

// Route untuk menambahkan item ke keranjang
router.post("/add", protect, addCart);

// Route untuk menghapus semua item dalam keranjang
router.delete("/remove-all", protect, removeAllCart);

// Route untuk menghapus item dalam keranjang
router.delete("/remove", protect, removeCart);

// Route untuk mendapatkan semua produk di keranjang
router.get("/products", protect, getCartProducts);

// Route untuk update quantity produk di keranjang
router.post("/update-quantity", protect, updateCartProductQuantity);

export default router;
