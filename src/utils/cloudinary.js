import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

// Cloudinary configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

/**
 * Uploads a file to Cloudinary
 * @param {string} localFilePath - The path of the file
 * @param {string} resourceType - "video" or "image"
 * @returns {object|null} - Cloudinary response or null on failure
 */
export const uploadOnCloudinary = async (localFilePath, resourceType) => {
  try {
    if (!localFilePath) return null;

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: resourceType,
    });

    // Remove local file after successful upload
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    // Remove local file if upload fails
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return null;
  }
};

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - The Cloudinary public ID
 * @param {string} resourceType - "video" or "image"
 * @returns {object|null} - Cloudinary response or null on failure
 */
export const deleteOnCloudinary = async (publicId, resourceType) => {
  try {
    if (!publicId) {
      console.error("❌ Public ID is missing");
      return null;
    }

    let response;
    
    if (resourceType === "video") {
      // Use delete_resources() for videos
      response = await cloudinary.api.delete_resources([publicId], {
        resource_type: "video",
      });
    } else {
      // Use destroy() for images
      response = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
    }
    return response;
  } catch (error) {
    console.error("❌ Cloudinary Deletion Error:", error);
    return null;
  }
};

