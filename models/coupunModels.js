import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  codeName: { type: String, required: true, unique: true },
  discountPercentage: { type: Number, required: true, min: 0, max: 100 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

export default mongoose.model("Coupon", couponSchema);
