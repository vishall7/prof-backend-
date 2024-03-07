import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
  });

const fileUploadTOCloudinary = async (localFilePath,tags) => {
  try {
    if(!localFilePath) return null;
    // Object to store additional options for the upload
    const uploadOptions = {
      resource_type: "auto",
    };
    
    if (tags) {
      uploadOptions.tags = tags;
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

const fileUpadateToCloudinary = async (localFilePath,publicUrl) => {
  try {
    if(!localFilePath) return null;
    
    const uploadOptions = {
      resource_type: "auto",
    };
    
    const publicId = publicUrl.match(/\/upload\/v([^/]+)\/([\w\d]+)/)[2];

    uploadOptions.public_id = publicId;

    const response = await cloudinary.uploader.upload(localFilePath,uploadOptions)
   
    fs.unlinkSync(localFilePath);

    return response;

  } catch (error) {

    fs.unlinkSync(localFilePath); 

    return null;
  }
  


}



const fileDeleteToCloudinary = async (publicUrl,resourceType) => {
  try {

    if(!publicUrl) return null;

    const publicId = publicUrl.match(/\/upload\/v([^/]+)\/([\w\d]+)/)[2];
    
    const response = await cloudinary.uploader.destroy(publicId,resourceType);

    return response;

  } catch (error) {
      return error.message;
  }
}

export {
  fileUploadTOCloudinary,
  fileUpadateToCloudinary,
  fileDeleteToCloudinary
}
  