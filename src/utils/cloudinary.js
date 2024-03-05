import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

const fileUploadTOCloudinary = async (localFilePath,tags,publicId) => {
  try {
    if(!localFilePath) return null;
    // Object to store additional options for the upload
    const uploadOptions = {
      resource_type: "auto",
    };
    
    if (tags) {
      uploadOptions.tags = tags;
    }

    // Add public_id to options if provided
    if (publicId) {
      uploadOptions.public_id = publicId;
    }
    // upload file to cloudinary
    const response = await cloudinary.uploader.upload(localFilePath,uploadOptions)
    // unlink after upload
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //removes temp file from server
    return null;
  }
}

export {fileUploadTOCloudinary}
  