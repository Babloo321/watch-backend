import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET 
// });

export const uploadOnCloudinary = async (localFilePath) => {
   cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });
  
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        // console.log(`file is uploaded on cloudinary url:\n ${response.url}\n====================================\ntotla response from cloudinary:\n${response}`);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export const deleteOnCloudinary = async (public_id) => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
      });
      
  try {
  
    if(!public_id) return null
    await cloudinary.uploader.destroy(public_id);
    console.log("Assest deleted successfully on Cloudinary");
    return true;
  } catch (error) {
    console.error("Error deleting assest on Cloudinary:", error);
    return error;
  }
};
