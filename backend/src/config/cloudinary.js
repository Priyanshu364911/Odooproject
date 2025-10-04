import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Check if Cloudinary is properly configured
 */
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && 
         process.env.CLOUDINARY_CLOUD_NAME !== 'PROJECT' &&
         process.env.CLOUDINARY_API_KEY && 
         process.env.CLOUDINARY_API_SECRET;
};

/**
 * Upload file to Cloudinary
 */
export const uploadToCloudinary = async (fileBuffer, options = {}) => {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.warn('Cloudinary not configured, skipping file upload');
      // Return a mock response for development
      return {
        url: `data:${options.mimetype || 'application/octet-stream'};base64,${fileBuffer.toString('base64')}`,
        publicId: `local-${Date.now()}`,
        filename: options.filename || 'receipt',
        size: fileBuffer.length,
        mimetype: options.mimetype || 'application/octet-stream'
      };
    }

    const uploadOptions = {
      resource_type: 'auto',
      folder: options.folder || 'expense-receipts',
      quality: 'auto:good',
      fetch_format: 'auto',
      ...options
    };

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              filename: result.original_filename,
              size: result.bytes,
              mimetype: result.format,
              width: result.width,
              height: result.height
            });
          }
        }
      ).end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Cloudinary upload error: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete error: ${error.message}`);
  }
};

/**
 * Get optimized image URL
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
  try {
    return cloudinary.url(publicId, {
      quality: 'auto:good',
      fetch_format: 'auto',
      ...options
    });
  } catch (error) {
    throw new Error(`Cloudinary URL generation error: ${error.message}`);
  }
};

export default cloudinary;