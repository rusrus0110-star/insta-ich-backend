import { Readable } from "stream";

import cloudinary from "../config/cloudinary.js";

function upload_buffer_to_cloudinary(fileBuffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
}

export async function upload_image(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const folder = req.body.folder || "ichgram/posts";

    const result = await upload_buffer_to_cloudinary(req.file.buffer, folder);

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      image_url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload image error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
}
