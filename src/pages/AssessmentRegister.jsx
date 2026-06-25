import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { fetchAssessmentBySlug, registerCandidate } from '../lib/assessmentApi';

export default function AssessmentRegister() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' });

  useEffect(() => {
    (async () => {
      const result = await fetchAssessmentBySlug(slug);
      if (result.error) setError(result.error);
      else setAssessment(result.assessment);
      setLoading(false);
    })();
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    setError('');

    const result = await registerCandidate(assessment.id, form);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setToast(`Your OTP is: ${result.otp} (mock — will be emailed in production)`);
    setTimeout(() => {
      navigate(`/assessment/${slug}/verify?candidateId=${result.candidate.id}&assessmentId=${assessment.id}`);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment Not Available</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg text-sm max-w-sm animate-[slideIn_0.3s_ease]">
          {toast}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-7 h-7 text-blue-600" />
          <span className="font-bold text-lg text-gray-900">Novaamind LMS</span>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">{assessment.title}</h2>
        <p className="text-sm text-gray-500 mb-6">Please register to begin the assessment</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name *</label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address *</label>
            <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="john@company.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
            <input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 9876543210" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Company / Organization</label>
            <input value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Acme Corp" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {submitting ? 'Registering...' : 'Register & Get OTP'}
          </button>
        </form>
      </div>
    </div>
  );
}
