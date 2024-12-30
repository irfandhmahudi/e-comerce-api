import Address from "../models/addressModels.js";

// Membuat alamat baru
export const createAddress = async (req, res) => {
  const {
    firstname,
    lastname,
    address,
    city,
    zipCode,
    country,
    phoneNumber,
    email,
  } = req.body;
  const userId = req.user.id; // Menggunakan userId yang didapat dari middleware autentikasi

  try {
    const newAddress = new Address({
      firstname,
      lastname,
      address,
      city,
      zipCode,
      country,
      phoneNumber,
      email,
      userId,
    });

    const savedAddress = await newAddress.save();
    res.status(201).json(savedAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mendapatkan semua alamat milik pengguna
export const getUserAddresses = async (req, res) => {
  const userId = req.user.id; // Menggunakan userId yang didapat dari middleware autentikasi

  try {
    const addresses = await Address.find({ userId });
    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mendapatkan alamat berdasarkan ID
export const getAddressById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Menggunakan userId yang didapat dari middleware autentikasi

  try {
    const address = await Address.findOne({ _id: id, userId });

    if (!address) {
      return res.status(404).json({ message: "Alamat tidak ditemukan" });
    }
    res.status(200).json(address);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Memperbarui alamat berdasarkan ID
export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const {
    firstname,
    lastname,
    address,
    city,
    zipCode,
    country,
    phoneNumber,
    email,
  } = req.body;
  const userId = req.user.id; // Menggunakan userId yang didapat dari middleware autentikasi

  try {
    const updatedAddress = await Address.findOneAndUpdate(
      { _id: id, userId }, // Pastikan alamat yang diperbarui milik user yang sesuai
      {
        firstname,
        lastname,
        address,
        city,
        zipCode,
        country,
        phoneNumber,
        email,
      },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({
        message: "Alamat tidak ditemukan atau tidak milik pengguna ini",
      });
    }

    res.status(200).json(updatedAddress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Menghapus alamat berdasarkan ID
export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Menggunakan userId yang didapat dari middleware autentikasi

  try {
    const deletedAddress = await Address.findOneAndDelete({ _id: id, userId });

    if (!deletedAddress) {
      return res.status(404).json({
        message: "Alamat tidak ditemukan atau tidak milik pengguna ini",
      });
    }

    res.status(200).json({ message: "Alamat berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
