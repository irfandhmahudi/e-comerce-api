import Coupon from "../models/coupunModels.js";

// Get All Coupons
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add New Coupon
export const createCoupon = async (req, res) => {
  const { codeName, discountPercentage, startDate, endDate } = req.body;

  // Validasi
  if (!codeName || !discountPercentage || !startDate || !endDate) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newCoupon = new Coupon({
      codeName,
      discountPercentage,
      startDate,
      endDate,
    });
    await newCoupon.save();
    res.status(201).json(newCoupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Coupon
export const deleteCoupon = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    if (!deletedCoupon)
      return res.status(404).json({ message: "Coupon not found" });
    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Apply Coupon
export const applyCoupon = async (req, res) => {
  const { codeName } = req.body;

  try {
    const coupon = await Coupon.findOne({ codeName });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    if (new Date(coupon.endDate) < new Date()) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    res.status(200).json({
      message: "Coupon applied successfully",
      discountPercentage: coupon.discountPercentage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
