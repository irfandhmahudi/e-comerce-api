import express from "express";
import {
  getCoupons,
  createCoupon,
  deleteCoupon,
  applyCoupon,
} from "../controllers/coupunController.js";

const router = express.Router();

// Routes
router.get("/", getCoupons); // GET all coupons
router.post("/", createCoupon); // POST create a new coupon
router.delete("/:id", deleteCoupon); // DELETE a coupon by ID
router.post("/apply", applyCoupon); // POST apply a coupon

export default router;
