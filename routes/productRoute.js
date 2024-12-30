// routes/productRoutes.js
import express from "express";
import {
  addProduct,
  editProduct,
  deleteProduct,
  getProductById,
  getAllProducts,
  getOtherProducts,
} from "../controllers/productController.js";
import uploads from "../middleware/productMiddleware.js";

const router = express.Router();

// Route definitions
// Route untuk menambah produk dengan multiple image upload
router.post("/add", uploads.array("images", 5), addProduct);

// Route untuk mengedit produk dengan multiple image upload
router.patch("/edit/:id", uploads.array("images", 5), editProduct);

router.delete("/delete/:id", deleteProduct);

router.get("/get/:id", getProductById);

router.get("/get-all", getAllProducts);

router.get("/get-other", getOtherProducts);

export default router;
