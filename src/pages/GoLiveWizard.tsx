import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { Copy, Check, ArrowRight, ArrowLeft, Video, DollarSign, Sparkles, Radio } from 'lucide-react'
import { supabase } from '../supabaseClient'
import TipMenuEditor from '../components/TipMenuEditor'
import StreamSetupPage from './StreamSetupPage'

type Step = 'welcome' | 'tipmenu' | 'overlay' | 'stream'
const WIZARD_DONE_KEY = 'neonlights_golive_wizard_done'

export default function GoLiveWizard({ session }: { session: Session }) {
  const [step, setStep] = useState<Step>(() =>
    localStorage.getItem(WIZARD_DONE_KEY) === 'true' ? 'stream' : 'welcome'
  )
  const [overlayToken, setOverlayToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadOverlay = async () => {
      const { data } = await supabase
        .from('overlay_settings')
        .select('overlay_token')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (data) {
        setOverlayToken(data.overlay_token)
      } else {
        const { data: created } = await supabase
          .from('overlay_settings')
          .insert({ user_id: session.user.id })
          .select('overlay_token')
          .single()
        if (created) setOverlayToken(created.overlay_token)
      }
    }
    loadOverlay()
  }, [session.user.id])

  const overlayUrl = overlayToken ? `${window.location.origin}/overlay/${overlayToken}` : ''

  const finishWizard = () => {
    localStorage.setItem(WIZARD_DONE_KEY, 'true')
    setStep('stream')
  }

  const copyOverlayUrl = () => {
    navigator.clipboard.writeText(overlayUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'stream') {
    return <StreamSetupPage session={session} />
  }

  const steps: Step[] = ['welcome', 'tipmenu', 'overlay']
  const stepIndex = steps.indexOf(step)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-cyan-500' : 'bg-gray-800'}`} />
          ))}
        </div>

        {step === 'welcome' && (
          <div className="text-center">
            <Radio className="mx-auto text-cyan-400 mb-4" size={48} />
            <h1 className="text-3xl font-bold mb-3">Let's get you set up to go live</h1>
            <p className="text-gray-400 mb-8">
              A quick 3-step setup — tip menu, on-screen alerts, then your stream details. Takes about a minute.
            </p>

            <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold mb-3">What you'll need</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• A camera and mic — your laptop's built-in ones work fine</li>
                <li>• <strong className="text-gray-300">Optional:</strong> OBS Studio, if you want scenes/overlays beyond the browser option</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-lg p-4 text-left mb-8">
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-yellow-300">Streaming is just one of your income streams here.</span>{' '}
                Once you're set up, check your Profile for perks & extras, private shows, and video/photo sales too — most
                creators do best combining a few.
              </p>
            </div>

            <button
              onClick={() => setStep('tipmenu')}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 mx-auto hover:opacity-90 transition"
            >
              Get Started <ArrowRight size={18} />
            </button>
            <button onClick={finishWizard} className="text-sm text-gray-500 hover:text-gray-400 mt-4 transition">
              Skip setup, go live now
            </button>
          </div>
        )}

        {step === 'tipmenu' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-cyan-400" size={24} />
              <h1 className="text-2xl font-bold">Set up your tip menu</h1>
            </div>
            <p className="text-gray-400 mb-6">
              Viewers see these as quick-tip buttons in your chat. Customize the labels and prices, or start with the standard set.
            </p>

            <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
              <TipMenuEditor userId={session.user.id} />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('welcome')}
                className="text-gray-400 hover:text-white flex items-center gap-2 transition"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                onClick={() => setStep('overlay')}
                className="bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
              >
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 'overlay' && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-cyan-400" size={24} />
              <h1 className="text-2xl font-bold">On-screen tip & follow alerts</h1>
            </div>
            <p className="text-gray-400 mb-6">
              Add this as a Browser Source in OBS to show animated alerts over your stream when someone tips or follows.
            </p>

            {/* Static preview of what an alert looks like */}
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-8 mb-6 flex items-end justify-center h-40 relative overflow-hidden">
              <div className="text-xs text-gray-600 absolute top-2 left-2">Preview</div>
              <div className="bg-gradient-to-r from-purple-600/95 to-pink-600/95 border-2 border-purple-300 px-6 py-3 rounded-2xl text-white font-bold flex items-center gap-2">
                <span className="text-xl">🎉</span>
                <span>Someone tipped 25 tokens!</span>
              </div>
            </div>

            <div className="bg-gray-900 border border-cyan-500/20 rounded-lg p-6 mb-6">
              <label className="text-sm text-gray-400 block mb-2">Your Overlay URL (keep this private)</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={overlayUrl || 'Generating...'}
                  readOnly
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-gray-300 font-mono text-xs"
                />
                <button
                  onClick={copyOverlayUrl}
                  disabled={!overlayUrl}
                  className="bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-50 px-4 py-2 rounded flex items-center gap-2 transition"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <div className="bg-gray-950 rounded p-4 text-sm text-gray-300 space-y-1">
                <div className="text-cyan-400 font-semibold mb-2">In OBS:</div>
                <div>1. Sources → + → Browser Source</div>
                <div>2. Paste the URL above</div>
                <div>3. Set width/height to your canvas size (e.g. 1920×1080)</div>
                <div>4. Check "Shutdown source when not visible" off</div>
                <div>5. Layer it above your camera in the scene</div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Using the browser camera instead of OBS? Alerts show right in your Go Live chat panel — no overlay needed.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep('tipmenu')}
                className="text-gray-400 hover:text-white flex items-center gap-2 transition"
              >
                <ArrowLeft size={18} /> Back
              </button>
              <button
                onClick={finishWizard}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition"
              >
                <Video size={18} /> Continue to Go Live
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
