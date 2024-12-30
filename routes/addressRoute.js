import express from "express";
import {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import protect from "../middleware/protect.js";

const router = express.Router();

router.use(protect);

// Rute untuk membuat alamat baru
router.post("/add", createAddress);

// Rute untuk mendapatkan semua alamat pengguna
router.get("/get", getUserAddresses);

// Rute untuk mendapatkan alamat tertentu berdasarkan ID
router.get("/get/:id", getAddressById);

// Rute untuk memperbarui alamat berdasarkan ID
router.patch("/update/:id", updateAddress);

// Rute untuk menghapus alamat berdasarkan ID
router.delete("/delete/:id", deleteAddress);

export default router;
