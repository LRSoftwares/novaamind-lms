export function scoreResponse(question, answer) {
  if (answer === null || answer === undefined || answer === '') {
    return { isCorrect: false, pointsAwarded: 0 };
  }

  const { questionType, correctAnswer, points = 1 } = question;

  switch (questionType) {
    case 'MCQ':
    case 'TrueFalse': {
      const correct = String(answer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
      return { isCorrect: correct, pointsAwarded: correct ? points : 0 };
    }
    case 'FillBlank': {
      const correct = String(answer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
      return { isCorrect: correct, pointsAwarded: correct ? points : 0 };
    }
    case 'MultiSelect': {
      const given = Array.isArray(answer) ? [...answer].sort() : [];
      const expected = Array.isArray(correctAnswer) ? [...correctAnswer].sort() : [];
      const correct = given.length === expected.length && given.every((v, i) => v === expected[i]);
      return { isCorrect: correct, pointsAwarded: correct ? points : 0 };
    }
    case 'Subjective':
      return { isCorrect: null, pointsAwarded: 0, pending: true };
    default:
      return { isCorrect: false, pointsAwarded: 0 };
  }
}

export function calculateTotals(scoredResponses, questions, passPercentage = 50) {
  let autoScore = 0;
  let manualScore = 0;
  let maxPossible = 0;

  for (const q of questions) {
    maxPossible += (q.points || 1);
  }

  for (const r of scoredResponses) {
    if (r.pending) continue;
    if (r.isCorrect !== null) {
      autoScore += r.pointsAwarded;
    } else {
      manualScore += (r.pointsAwarded || 0);
    }
  }

  const totalScore = autoScore + manualScore;
  const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 10000) / 100 : 0;
  const passed = percentage >= passPercentage;

  return { autoScore, manualScore, totalScore, maxPossible, percentage, passed };
}
