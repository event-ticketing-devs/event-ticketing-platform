import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer storage for Event images
const eventStorage = new CloudinaryStorage({
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

// Configure Multer storage for Venue images
const venueStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "venue-images",
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
      const timestamp = Date.now();
      const filename = file.originalname.split(".")[0];
      return `venue_${timestamp}_${filename}`;
    },
  },
});

// Configure Multer storage for Space images
const spaceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "space-images",
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
      const timestamp = Date.now();
      const filename = file.originalname.split(".")[0];
      return `space_${timestamp}_${filename}`;
    },
  },
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Create multer instances
const upload = multer({
  storage: eventStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFileFilter,
});

const venueUpload = multer({
  storage: venueStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFileFilter,
});

const spaceUpload = multer({
  storage: spaceStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
  },
  fileFilter: imageFileFilter,
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

// Function to delete venue image from Cloudinary
export const deleteVenueImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    const urlParts = imageUrl.split("/");
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = `venue-images/${fileWithExtension.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting venue image from Cloudinary:", error);
  }
};

// Function to delete space image from Cloudinary
export const deleteSpaceImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    const urlParts = imageUrl.split("/");
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = `space-images/${fileWithExtension.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Error deleting space image from Cloudinary:", error);
  }
};

export { cloudinary, upload, venueUpload, spaceUpload };
