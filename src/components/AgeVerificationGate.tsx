import React, { useState, useEffect } from 'react';

interface AgeVerificationGateProps {
  onVerified: () => void;
}

const AgeVerificationGate: React.FC<AgeVerificationGateProps> = ({ onVerified }) => {
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Check if already verified (persistent flag)
  useEffect(() => {
    const verified = localStorage.getItem('ageVerified') === 'true';
    if (verified) {
      setIsVerified(true);
      onVerified();
    }
  }, [onVerified]);

  const handleVerify = () => {
    setError('');

    // Validate input
    if (!birthMonth || !birthDay || !birthYear) {
      setError('Please enter your complete date of birth');
      return;
    }

    const month = parseInt(birthMonth, 10);
    const day = parseInt(birthDay, 10);
    const year = parseInt(birthYear, 10);

    // Validate date ranges
    if (month < 1 || month > 12) {
      setError('Invalid month. Please enter 1-12');
      return;
    }

    if (day < 1 || day > 31) {
      setError('Invalid day. Please enter 1-31');
      return;
    }

    const currentYear = new Date().getFullYear();
    if (year < 1920 || year > currentYear) {
      setError(`Invalid year. Please enter between 1920 and ${currentYear}`);
      return;
    }

    // Check if 18+
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      actualAge = age - 1;
    }

    if (actualAge < 18) {
      setError('You must be at least 18 years old to access this platform');
      return;
    }

    // Verified! Save flag and proceed
    localStorage.setItem('ageVerified', 'true');
    setIsVerified(true);
    onVerified();
  };

  if (isVerified) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-lg p-8 border border-pink-500/50">
        
        {/* Warning Icon */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500">
            Age Verification Required
          </h1>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <p className="text-gray-200 text-center">
              NeonLights is an adult-only platform. You must be <strong className="text-pink-400">18 years or older</strong> to access this content.
            </p>
          </div>

          <p className="text-gray-300 text-sm">
            Please enter your date of birth to verify your age:
          </p>

          {/* Date Input */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Month</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  placeholder="MM"
                  value={birthMonth}
                  onChange={(e) => setBirthMonth(e.target.value)}
                  className="w-full bg-slate-800 border border-cyan-500/30 rounded px-3 py-2 text-white text-center focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Day</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="DD"
                  value={birthDay}
                  onChange={(e) => setBirthDay(e.target.value)}
                  className="w-full bg-slate-800 border border-cyan-500/30 rounded px-3 py-2 text-white text-center focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Year</label>
                <input
                  type="number"
                  min="1920"
                  max={new Date().getFullYear()}
                  placeholder="YYYY"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full bg-slate-800 border border-cyan-500/30 rounded px-3 py-2 text-white text-center focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              className="w-full bg-gradient-to-r from-pink-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-white font-bold py-3 rounded transition-all duration-200 transform hover:scale-105"
            >
              Verify Age & Continue
            </button>
          </div>

          {/* Legal Notice */}
          <div className="border-t border-gray-700 pt-4">
            <p className="text-xs text-gray-400 text-center mb-3">
              By continuing, you confirm that you are 18+ and agree to our
            </p>
            <div className="flex gap-2 justify-center text-xs">
              <a href="/terms" className="text-cyan-400 hover:text-cyan-300">
                Terms of Service
              </a>
              <span className="text-gray-500">•</span>
              <a href="/privacy" className="text-cyan-400 hover:text-cyan-300">
                Privacy Policy
              </a>
            </div>
          </div>

          {/* Content Warning */}
          <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3">
            <p className="text-xs text-pink-300 text-center">
              ⚠️ This platform contains sexually explicit material. If you are not of legal age in your jurisdiction, please leave immediately.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AgeVerificationGate;
