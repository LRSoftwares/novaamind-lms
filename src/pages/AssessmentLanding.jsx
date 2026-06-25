import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GraduationCap, Clock, Target, Award, AlertCircle } from 'lucide-react';
import { fetchAssessmentBySlug } from '../lib/assessmentApi';

export default function AssessmentLanding() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const result = await fetchAssessmentBySlug(slug);
      if (result.error) setError(result.error);
      else setData(result);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment Not Available</h2>
          <p className="text-gray-500 text-sm">{error || 'This assessment link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  const { assessment, questions } = data;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <div className="flex items-center gap-2 mb-6">
          <GraduationCap className="w-7 h-7 text-blue-600" />
          <span className="font-bold text-lg text-gray-900">Novaamind LMS</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{assessment.title}</h1>
        {assessment.description && <p className="text-gray-600 text-sm mb-5">{assessment.description}</p>}

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm">
            <Clock className="w-4 h-4" /> {assessment.durationMinutes} minutes
          </span>
          <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full text-sm">
            <Target className="w-4 h-4" /> {questions.length} questions
          </span>
          <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm">
            <Award className="w-4 h-4" /> Pass: {assessment.passPercentage}%
          </span>
        </div>

        {assessment.instructions && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">Instructions</h3>
            <p className="text-sm text-amber-700 whitespace-pre-wrap">{assessment.instructions}</p>
          </div>
        )}

        <button
          onClick={() => navigate(`/assessment/${slug}/register`)}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors text-base"
        >
          Start Assessment
        </button>
      </div>
    </div>
  );
}
