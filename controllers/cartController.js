import User from "../models/userModel.js";
import Product from "../models/productModel.js"; // Asumsi Anda punya model Product
import Coupon from "../models/coupunModels.js";

// Menambahkan item ke keranjang
export const addCart = async (req, res) => {
  const { productId, quantity, size } = req.body; // Menambahkan size di body
  if (!size) {
    return res.status(400).json({ message: "Size is required" }); // Validasi size
  }

  try {
    const user = await User.findById(req.user.id); // Mendapatkan user dari token
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Cek jika produk sudah ada di keranjang
    const existingProductIndex = user.cart.findIndex(
      (item) => item.productId.toString() === productId && item.size === size
    );

    // Ambil data produk untuk mendapatkan harga
    const product = await Product.findById(productId); // Ambil produk berdasarkan productId
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const productPrice = product.price; // Harga produk

    // Hitung total harga berdasarkan quantity
    const totalPrice = productPrice * quantity;

    if (existingProductIndex !== -1) {
      // Jika produk dan ukuran sudah ada, perbarui jumlahnya dan total harga
      user.cart[existingProductIndex].quantity += quantity;
      user.cart[existingProductIndex].totalPrice =
        productPrice * user.cart[existingProductIndex].quantity; // Perbarui total harga
    } else {
      // Jika produk belum ada, tambahkan produk baru ke keranjang
      user.cart.push({
        productId,
        quantity,
        size,
        totalPrice, // Tambahkan total harga
      });
    }

    await user.save();
    res.status(200).json({ message: "Product added to cart", cart: user.cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Menghapus semua item dalam keranjang
export const removeAllCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = []; // Kosongkan keranjang
    await user.save();
    res.status(200).json({ message: "All items removed from cart" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Menghapus item dalam keranjang
export const removeCart = async (req, res) => {
  try {
    // Mendapatkan user berdasarkan ID
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mendapatkan productId dari request body
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Cari produk di keranjang user dan hapus
    const cartIndex = user.cart.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (cartIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    user.cart.splice(cartIndex, 1); // Hapus produk dari keranjang

    // Simpan perubahan ke database
    await user.save();

    // Hitung ulang total harga setelah penghapusan
    const updatedCartDetails = await User.findById(req.user.id)
      .populate("cart.productId", "price")
      .exec();

    const total = updatedCartDetails.cart.reduce(
      (acc, item) => acc + item.productId.price * item.quantity,
      0
    );

    res.status(200).json({
      message: "Product removed from cart",
      cart: updatedCartDetails.cart,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mengambil produk dalam keranjang
export const getCartProducts = async (req, res) => {
  try {
    // Mengambil user berdasarkan ID, dan populate cart dengan data produk
    const user = await User.findById(req.user.id)
      .populate("cart.productId", "name price images sizes SKU discount") // Populate 'sizes' untuk mengakses pilihan ukuran
      .exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ambil kode kupon dari body request (jika ada)
    const { codeName } = req.body;

    // Validasi kupon jika diberikan
    let discountPercentage = 0;
    if (codeName) {
      const coupon = await Coupon.findOne({ codeName });
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      if (new Date(coupon.endDate) < new Date()) {
        return res.status(400).json({ message: "Coupon has expired" });
      }
      discountPercentage = coupon.discountPercentage; // Diskon dari kupon
    }

    // Format cart untuk menambahkan informasi gambar, harga, quantity, dan ukuran
    const cartDetails = user.cart.map((item) => {
      const product = item.productId;

      // Memastikan ada gambar yang tersedia dan mengambil gambar pertama
      const productImage =
        product.images && product.images.length > 0
          ? product.images[0].url
          : null;

      // Mendapatkan ukuran yang dipilih oleh user
      const selectedSize = item.size || "N/A"; // "N/A" jika ukuran tidak dipilih

      // Harga setelah diskon produk (jika ada diskon produk)
      const discountedPrice = product.discount
        ? product.price - (product.price * product.discount) / 100
        : product.price;

      // Total harga per item setelah diskon produk
      const itemTotalPrice = discountedPrice * item.quantity;

      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        image: productImage, // Menampilkan gambar pertama
        quantity: item.quantity, // Kuantitas produk dalam cart
        size: selectedSize, // Ukuran yang dipilih oleh user
        SKU: product.SKU,
        totalPrice: itemTotalPrice, // Total harga per item setelah diskon
        discount: product.discount, // Persentase diskon produk
        discountedPrice: discountedPrice, // Harga satuan setelah diskon produk
      };
    });

    // Hitung total harga keseluruhan sebelum diskon kupon
    const totalBeforeCoupon = cartDetails.reduce(
      (total, item) => total + item.totalPrice,
      0
    );

    // Hitung diskon dari kupon
    const couponDiscountAmount = (totalBeforeCoupon * discountPercentage) / 100;

    // Hitung total harga setelah diskon kupon
    const grandTotalPrice = totalBeforeCoupon - couponDiscountAmount;

    res.status(200).json({
      cart: cartDetails,
      subtotal: totalBeforeCoupon,
      couponDiscount: couponDiscountAmount,
      total: grandTotalPrice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Memperbarui jumlah produk dalam keranjang
export const updateCartProductQuantity = async (req, res) => {
  const { productId, quantity } = req.body;

  // Validasi input
  if (!productId || quantity === undefined) {
    return res.status(400).json({
      success: false,
      message: "Product ID and quantity are required",
    });
  }

  try {
    // Mendapatkan user berdasarkan ID dari token
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Cek apakah produk ada dalam keranjang
    const cartItem = user.cart.find(
      (item) => item.productId.toString() === productId
    );
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in cart" });
    }

    // Perbarui quantity
    cartItem.quantity = quantity;

    // Ambil harga produk dari database untuk memastikan akurasi
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in database" });
    }

    // Hitung ulang total harga item
    cartItem.totalPrice = product.price * quantity;

    // Simpan perubahan
    await user.save();

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating cart quantity",
      error: error.message,
    });
  }
};
