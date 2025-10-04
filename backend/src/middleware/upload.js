import multer from 'multer';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Configure multer to use memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only image files and PDFs
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

/**
 * Middleware for single file upload
 */
export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const multerSingle = upload.single(fieldName);
    
    multerSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          let message = 'File upload error';
          
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              message = 'File too large. Maximum size is 10MB.';
              break;
            case 'LIMIT_FILE_COUNT':
              message = 'Too many files. Maximum is 5 files.';
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              message = 'Unexpected file field.';
              break;
          }
          
          return res.status(400).json({
            success: false,
            message,
            error: err.message
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      next();
    });
  };
};

/**
 * Middleware for multiple file upload
 */
export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const multerArray = upload.array(fieldName, maxCount);
    
    multerArray(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          let message = 'File upload error';
          
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              message = 'File too large. Maximum size is 10MB per file.';
              break;
            case 'LIMIT_FILE_COUNT':
              message = `Too many files. Maximum is ${maxCount} files.`;
              break;
            case 'LIMIT_UNEXPECTED_FILE':
              message = 'Unexpected file field.';
              break;
          }
          
          return res.status(400).json({
            success: false,
            message,
            error: err.message
          });
        }
        
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      next();
    });
  };
};

/**
 * Process uploaded files and upload to Cloudinary
 */
export const processFileUploads = async (req, res, next) => {
  try {
    if (!req.files && !req.file) {
      return next();
    }

    const files = req.files || [req.file];
    const uploadPromises = files.map(async (file) => {
      const uploadResult = await uploadToCloudinary(file.buffer, {
        folder: `expense-receipts/${req.user.company}`,
        public_id: `${Date.now()}-${file.originalname.split('.')[0]}`
      });
      
      return {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        filename: uploadResult.filename || file.originalname,
        size: uploadResult.size,
        mimetype: uploadResult.mimetype || file.mimetype
      };
    });

    req.uploadedFiles = await Promise.all(uploadPromises);
    next();
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading files',
      error: error.message
    });
  }
};

/**
 * Middleware for receipt upload (multiple files)
 */
export const uploadReceipts = [
  uploadMultiple('receipts', 5),
  processFileUploads
];

/**
 * Middleware for avatar upload (single file)
 */
export const uploadAvatar = [
  uploadSingle('avatar'),
  processFileUploads
];