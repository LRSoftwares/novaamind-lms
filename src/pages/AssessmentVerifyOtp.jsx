import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { verifyOtp, startAttempt, registerCandidate } from '../lib/assessmentApi';

export default function AssessmentVerifyOtp() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('candidateId');
  const assessmentId = searchParams.get('assessmentId');

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter a 6-digit OTP'); return; }
    setVerifying(true);
    setError('');

    const result = await verifyOtp(candidateId, otp);
    if (!result.verified) {
      setError(result.error || 'Invalid OTP');
      setVerifying(false);
      return;
    }

    const attResult = await startAttempt(assessmentId, candidateId);
    if (attResult.error) {
      setError(attResult.error);
      setVerifying(false);
      return;
    }

    navigate(`/assessment/${slug}/test?attemptId=${attResult.attempt.id}&assessmentId=${assessmentId}`);
  };

  const handleResend = async () => {
    const { data: candidate } = await supabase
      .from('assessment_candidates').select('*').eq('id', candidateId).single();
    if (candidate) {
      const result = await registerCandidate(assessmentId, {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone || '',
        company: candidate.company || '',
      });
      if (result.otp) {
        setToast(`New OTP: ${result.otp} (mock)`);
        setTimeout(() => setToast(''), 6000);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm max-w-sm animate-[slideIn_0.3s_ease]">
          {toast}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="flex items-center gap-2 justify-center mb-6">
          <GraduationCap className="w-7 h-7 text-blue-600" />
          <span className="font-bold text-lg text-gray-900">Novaamind LMS</span>
        </div>

        <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Verify OTP</h2>
        <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code sent to your email</p>

        <form onSubmit={handleVerify}>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full text-center text-2xl tracking-[0.5em] font-mono border border-gray-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="------"
            maxLength={6}
            autoFocus
          />

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <button type="submit" disabled={verifying || otp.length !== 6} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 mb-3">
            {verifying ? 'Verifying...' : 'Verify & Start Test'}
          </button>

          <button type="button" onClick={handleResend} className="text-sm text-blue-600 hover:underline">
            Resend OTP
          </button>
        </form>
      </div>
    </div>
  );
}
