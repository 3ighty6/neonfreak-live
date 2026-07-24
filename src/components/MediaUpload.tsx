import { useState } from 'react'
import { Upload, X, Image, Video } from 'lucide-react'

interface MediaUploadProps {
  userId: string
  type: 'photo' | 'video'
  onUploadComplete?: (url: string) => void
}

export default function MediaUpload({ userId, type, onUploadComplete }: MediaUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setError('')

    // Validate file type
    if (type === 'photo' && !selected.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (type === 'video' && !selected.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }

    // Validate file size
    const maxSize = type === 'video' ? 500 * 1024 * 1024 : 10 * 1024 * 1024 // 500MB video, 10MB photo
    if (selected.size > maxSize) {
      setError(`File too large (max ${type === 'video' ? '500MB' : '10MB'})`)
      return
    }

    setFile(selected)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(selected)
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)
      formData.append('type', type)

      const response = await fetch('/api/upload-media', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      onUploadComplete?.(data.url)

      // Reset
      setFile(null)
      setPreview('')
      setProgress(0)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        {type === 'photo' ? (
          <Image className="text-cyan-400" size={24} />
        ) : (
          <Video className="text-cyan-400" size={24} />
        )}
        <h3 className="text-xl font-semibold">
          {type === 'photo' ? 'Upload Photo' : 'Upload Video'}
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      {!preview ? (
        <div>
          <label className="block">
            <div className="border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-lg p-8 text-center cursor-pointer transition">
              <Upload className="mx-auto text-gray-400 mb-3" size={32} />
              <p className="text-gray-400 mb-1">
                Click to select or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                {type === 'photo'
                  ? 'PNG, JPG, GIF up to 10MB'
                  : 'MP4, WebM up to 500MB'}
              </p>
              <input
                type="file"
                accept={type === 'photo' ? 'image/*' : 'video/*'}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </label>
        </div>
      ) : (
        <div>
          <div className="relative mb-4 rounded-lg overflow-hidden bg-black">
            {type === 'photo' ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
            ) : (
              <video
                src={preview}
                className="w-full h-48 object-cover"
                controls
              />
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">
              {file?.name} • {(file!.size / 1024 / 1024).toFixed(1)}MB
            </p>
            {progress > 0 && (
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-cyan-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setFile(null)
                setPreview('')
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-semibold transition flex items-center justify-center gap-2"
            >
              <X size={18} />
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
