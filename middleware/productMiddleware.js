import multer from "multer";
import path from "path";

// Konfigurasi multer
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/products"); // Direktori penyimpanan sementara
  },

  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Filter jenis file
const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb("Images only (jpeg, jpg, png)!", false);
  }
};

// Middleware upload
const uploadS = multer({
  storage,
  fileFilter,
});

export default uploadS;
