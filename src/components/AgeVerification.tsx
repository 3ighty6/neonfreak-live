import { useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface AgeVerificationProps {
  onVerificationComplete?: (verified: boolean) => void
  onClose?: () => void
}

export default function AgeVerification({
  onVerificationComplete,
  onClose,
}: AgeVerificationProps) {
  const [step, setStep] = useState<'dob' | 'selfie' | 'complete'>('dob')
  const [dob, setDob] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--
    }

    return age
  }

  const handleDobSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!dob) {
      setError('Please enter your date of birth')
      return
    }

    const age = calculateAge(dob)

    if (age < 18) {
      setError('You must be at least 18 years old to use this platform')
      return
    }

    // Verify DOB with backend
    setLoading(true)
    try {
      const response = await fetch('/api/verify-age-dob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob }),
      })

      if (!response.ok) {
        throw new Error('Age verification failed')
      }

      setStep('selfie')
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    setSelfieFile(file)
  }

  const handleSelfieSubmit = async () => {
    if (!selfieFile) {
      setError('Please upload a selfie')
      return
    }

    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('selfie', selfieFile)
      formData.append('dob', dob)

      const response = await fetch('/api/verify-age-selfie', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Selfie verification failed')
      }

      setVerified(true)
      setStep('complete')
      onVerificationComplete?.(true)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="text-yellow-400" size={24} />
        <h2 className="text-2xl font-bold text-cyan-400">Age Verification</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      {step === 'dob' && (
        <form onSubmit={handleDobSubmit} className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">
            This platform is for users 18+. We need to verify your age.
          </p>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none transition"
            />
            <p className="text-xs text-gray-500 mt-2">
              You must be 18 or older to continue
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition"
          >
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </form>
      )}

      {step === 'selfie' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            For enhanced verification, please upload a selfie. This helps us confirm your age.
          </p>

          <div>
            <label htmlFor="selfie-upload" className="block">
              <div className="border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-lg p-6 text-center cursor-pointer transition">
                <p className="text-gray-400 mb-1">Click to select or drag and drop</p>
                <p className="text-xs text-gray-500">JPG, PNG up to 10MB</p>
              </div>
              <input
                id="selfie-upload"
                type="file"
                accept="image/*"
                onChange={handleSelfieUpload}
                className="hidden"
              />
            </label>
          </div>

          {selfieFile && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-green-300 text-sm">
              ✓ {selfieFile.name} selected
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('dob')}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-semibold transition"
            >
              Back
            </button>
            <button
              onClick={handleSelfieSubmit}
              disabled={loading || !selfieFile}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your selfie is processed securely and deleted after verification
          </p>
        </div>
      )}

      {step === 'complete' && verified && (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="text-green-400" size={48} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              Verified!
            </h3>
            <p className="text-gray-400 text-sm">
              Your age has been verified. You can now access the platform.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded font-semibold transition"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}
