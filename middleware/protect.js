import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const protect = async (req, res, next) => {
  let token;

  // Periksa apakah ada header Authorization dengan skema Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Mendapatkan token setelah "Bearer"

      // Verifikasi token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Cari user berdasarkan ID dari token dan tambahkan ke req.user
      req.user = await User.findById(decoded.id).select("-password");
      // console.log("User from token:", req.user);
      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }

      next(); // Lanjutkan ke middleware berikutnya
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ message: "Unauthorized, invalid token" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized, token missing" });
  }
};

export default protect;
