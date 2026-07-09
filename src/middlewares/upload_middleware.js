import multer from "multer";

const storage = multer.memoryStorage();

function file_filter(req, file, callback) {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    callback(new Error("Only JPEG, PNG and WEBP images are allowed"), false);
    return;
  }

  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter: file_filter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
