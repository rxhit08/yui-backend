import { v2 as cloudinary } from 'cloudinary';
import { DataUriParser } from 'datauri/parser.js';
import path from 'path';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const parser = new DataUriParser();

const uploadOnCloudinary = async (fileBuffer, originalName) => {
  try {
    if (!fileBuffer || !originalName) return null;

    const extName = path.extname(originalName).toString();
    const dataUri = parser.format(extName, fileBuffer);

    const response = await cloudinary.uploader.upload(dataUri.content, {
      resource_type: "auto",
    });

    console.log("File uploaded to Cloudinary:", response.secure_url);
    return response;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

export { uploadOnCloudinary };
