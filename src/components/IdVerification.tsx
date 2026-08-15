import { useState, useEffect, useRef } from 'react'
import { ShieldCheck, ShieldAlert, Upload, Loader2, Clock } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function IdVerification({ userId }: { userId: string }) {
  const [status, setStatus] = useState<string>('unverified')
  const [note, setNote] = useState<string | null>(null)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const { data } = await supabase
      .from('users')
      .select('id_verification_status, id_verification_note')
      .eq('id', userId)
      .single()
    if (data) {
      setStatus(data.id_verification_status || 'unverified')
      setNote(data.id_verification_note)
    }
  }

  useEffect(() => {
    load()
  }, [userId])

  const submit = async () => {
    setError('')
    if (!idFile || !selfieFile) {
      setError('Upload both your ID and a selfie')
      return
    }
    setSubmitting(true)
    try {
      const idPath = `${userId}/id-${Date.now()}.${idFile.name.split('.').pop()}`
      const selfiePath = `${userId}/selfie-${Date.now()}.${selfieFile.name.split('.').pop()}`

      const [{ error: idErr }, { error: selfieErr }] = await Promise.all([
        supabase.storage.from('id-verification').upload(idPath, idFile),
        supabase.storage.from('id-verification').upload(selfiePath, selfieFile),
      ])
      if (idErr) throw idErr
      if (selfieErr) throw selfieErr

      const { error: insertError } = await supabase.from('id_verification_submissions').insert({
        user_id: userId,
        id_document_path: idPath,
        selfie_path: selfiePath,
      })
      if (insertError) throw insertError

      await supabase.from('users').update({ id_verification_status: 'pending' }).eq('id', userId)
      setStatus('pending')
      setSuccess(true)
      setIdFile(null)
      setSelfieFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        {status === 'approved' ? (
          <ShieldCheck size={18} className="text-green-400" />
        ) : (
          <ShieldAlert size={18} className="text-yellow-400" />
        )}
        Identity Verification
      </h2>

      {status === 'approved' && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-green-300 text-sm">
          ✅ Verified. You can go live and sell content.
        </div>
      )}

      {status === 'pending' && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300 text-sm flex items-center gap-2">
          <Clock size={16} /> Submitted — under review. This usually takes a day or two.
        </div>
      )}

      {(status === 'unverified' || status === 'rejected') && (
        <>
          {status === 'rejected' && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm mb-4">
              Your last submission was rejected{note ? `: ${note}` : '.'} Please resubmit.
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-green-300 text-sm mb-4">
              ✅ Submitted for review.
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-sm mb-4">{error}</div>
          )}

          <p className="text-sm text-gray-400 mb-4">
            Required before you can go live or sell content — confirms you're a real, verified adult and protects both you and
            the platform. Reviewed by a human, never shown publicly.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Government-issued ID (front)</label>
              <input ref={idInputRef} type="file" accept="image/*" onChange={(e) => setIdFile(e.target.files?.[0] || null)} className="hidden" />
              <button
                onClick={() => idInputRef.current?.click()}
                className="w-full bg-gray-800 border border-gray-700 hover:border-cyan-500 rounded px-3 py-2 text-left text-sm text-gray-300 flex items-center gap-2 transition"
              >
                <Upload size={16} /> {idFile ? idFile.name : 'Choose file'}
              </button>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">Selfie holding your ID</label>
              <input ref={selfieInputRef} type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} className="hidden" />
              <button
                onClick={() => selfieInputRef.current?.click()}
                className="w-full bg-gray-800 border border-gray-700 hover:border-cyan-500 rounded px-3 py-2 text-left text-sm text-gray-300 flex items-center gap-2 transition"
              >
                <Upload size={16} /> {selfieFile ? selfieFile.name : 'Choose file'}
              </button>
            </div>
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded font-semibold transition flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
