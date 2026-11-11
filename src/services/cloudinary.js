import { CLOUDINARY_CLOUD, CLOUDINARY_PRESET } from '../firebase'

/**
 * Uploads an image or video file to Cloudinary using an unsigned upload preset.
 * @param {File} file 
 * @returns {Promise<string>} Secure URL of the uploaded media
 */
export async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_PRESET)

  // Use 'auto/upload' so Cloudinary handles both images and videos automatically
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || 'Failed to upload media to Cloudinary')
  }

  const data = await response.json()
  return data.secure_url
}
