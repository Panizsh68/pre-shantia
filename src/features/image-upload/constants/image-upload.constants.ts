export const IMAGE_UPLOAD_TOKEN = {
  S3_CLIENT: 'R2_S3_CLIENT',
};

export const DEFAULTS = {
  PRESIGN_EXPIRES_SECONDS: 300, // 5 minutes
  MAX_IMAGE_BYTES: 10 * 1024 * 1024, // 10 MB (increased from 100KB for real-world use)
  MAX_PRODUCT_IMAGES: 5,
  MAX_COMPANY_IMAGES: 1,
};

/**
 * Load limits from environment or use defaults.
 * Environment variable names:
 * - MAX_IMAGE_BYTES (in bytes)
 * - PRESIGN_EXPIRES_SECONDS
 * - MAX_PRODUCT_IMAGES
 * - MAX_COMPANY_IMAGES
 */
export function loadImageUploadLimits() {
  return {
    maxImageBytes: parseInt(process.env.MAX_IMAGE_BYTES || String(DEFAULTS.MAX_IMAGE_BYTES), 10),
    presignExpiresSeconds: parseInt(process.env.PRESIGN_EXPIRES_SECONDS || String(DEFAULTS.PRESIGN_EXPIRES_SECONDS), 10),
    maxProductImages: parseInt(process.env.MAX_PRODUCT_IMAGES || String(DEFAULTS.MAX_PRODUCT_IMAGES), 10),
    maxCompanyImages: parseInt(process.env.MAX_COMPANY_IMAGES || String(DEFAULTS.MAX_COMPANY_IMAGES), 10),
  };
}
