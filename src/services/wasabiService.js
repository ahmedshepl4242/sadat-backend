const AWS = require('aws-sdk');
require('dotenv').config();

class WasabiService {
  constructor() {
    const region = process.env.WASABI_REGION || 'us-east-1';
    // Use the regional endpoint directly to avoid redirect + presigned URL signature mismatch
    const endpoint = `https://s3.${region}.wasabisys.com`;
    this.s3 = new AWS.S3({
      accessKeyId: process.env.WASABI_ACCESS_KEY,
      secretAccessKey: process.env.WASABI_SECRET_KEY,
      endpoint,
      region,
      s3ForcePathStyle: true
    });
    this.bucketName = process.env.WASABI_BUCKET_NAME;
  }

  async uploadImage(imageBuffer, fileName, contentType = 'image/jpeg') {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileName,
        Body: imageBuffer,
        ContentType: contentType,
        ACL: 'private'
      };

      const result = await this.s3.upload(params).promise();
      return result.Location;
    } catch (error) {
      console.error('Error uploading to Wasabi:', error);
      throw new Error('Failed to upload image to Wasabi storage');
    }
  }

  async deleteImage(fileName) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileName
      };

      await this.s3.deleteObject(params).promise();
      return true;
    } catch (error) {
      console.error('Error deleting from Wasabi:', error);
      throw new Error('Failed to delete image from Wasabi storage');
    }
  }

  generateFileName(prefix, fileExtension = 'jpg') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `${prefix}/${timestamp}_${randomString}.${fileExtension}`;
  }

  extractFileNameFromUrl(url) {
    try {
      // Extract the full path after the bucket name from the URL
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.bucketName);
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        // Return the path after the bucket name
        return urlParts.slice(bucketIndex + 1).join('/');
      }
      // Fallback: just return the filename
      return urlParts[urlParts.length - 1];
    } catch (error) {
      console.error('Error extracting filename from URL:', error);
      return null;
    }
  }

  generatePreSignedUrl(fileName, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileName,
        Expires: expiresIn // Default 1 hour
      };

      return this.s3.getSignedUrl('getObject', params);
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      throw new Error('Failed to generate pre-signed URL');
    }
  }

  extractFileKeyFromUrl(url) {
    try {
      // For stored URLs, extract the key (filename with path)
      if (url && url.includes(this.bucketName)) {
        const urlParts = url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === this.bucketName);
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          return urlParts.slice(bucketIndex + 1).join('/');
        }
      }
      // If it's already a key or null, return as-is
      return url;
    } catch (error) {
      console.error('Error extracting file key from URL:', error);
      return url;
    }
  }

  async uploadVendorProfileImage(imageBuffer, vendorId) {
    const fileName = this.generateFileName(`vendor-profiles/${vendorId}`);
    // Store the key (filename) instead of the full URL for private access
    await this.uploadImage(imageBuffer, fileName);
    return fileName;
  }

  async uploadMenuImage(imageBuffer, vendorId) {
    const fileName = this.generateFileName(`menu-images/${vendorId}`);
    // Store the key (filename) instead of the full URL for private access
    await this.uploadImage(imageBuffer, fileName);
    return fileName;
  }

  async uploadCaptainPhoto(imageBuffer, captainId) {
    const fileName = this.generateFileName(`captain-profile/${captainId}`);
    await this.uploadImage(imageBuffer, fileName);
    return fileName;
  }
  
  async uploadItemImage(imageBuffer, vendorId) {
    const fileName = this.generateFileName(`item-images/${vendorId}`);
    // Store the key (filename) instead of the full URL for private access
    await this.uploadImage(imageBuffer, fileName);
    return fileName;
  }
}

module.exports = new WasabiService();