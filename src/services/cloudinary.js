import { CLOUDINARY_CLOUD, CLOUDINARY_PRESET } from '../firebase'

/**
 * Uploads an image file to Cloudinary using an unsigned upload preset.
 * @param {File} file 
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
export async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_PRESET)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary')
  }

  const data = await response.json()
  return data.secure_url
}
