import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer storage with Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "event-images", // Folder name in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: "fill",
        quality: "auto:good",
      },
    ],
    public_id: (req, file) => {
      // Generate unique filename
      const timestamp = Date.now();
      const filename = file.originalname.split(".")[0];
      return `event_${timestamp}_${filename}`;
    },
  },
});

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Function to delete image from Cloudinary
export const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split("/");
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = `event-images/${fileWithExtension.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
  }
};

export { cloudinary, upload };
