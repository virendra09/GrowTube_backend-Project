import {V2 as cloudinary} from 'cloudinary';

/**
 * Deletes an image from Cloudinary by its public_id
 * @param {String} publicId - The public_id of the image in Cloudinary
 * @returns {Promise}
 */
const deleteAvatar = async (publicId) => {
  if (!publicId) {
    throw new Error('Public ID is required to delete an avatar.');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error('Failed to delete image from Cloudinary.');
  }
};

export  {deleteAvatar} ;
