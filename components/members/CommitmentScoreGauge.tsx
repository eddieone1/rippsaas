"use client";

interface CommitmentScoreGaugeProps {
  score: number;
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Commitment Score Gauge
 * 
 * Visual gauge showing commitment score (0-100)
 * Color-coded: Green (high), Blue (good), Yellow (moderate), Red (low)
 */
export default function CommitmentScoreGauge({
  score,
  label,
  size = 'medium',
}: CommitmentScoreGaugeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-lime-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-lime-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-lime-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };


  const sizeTextClasses = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-5xl',
  };

  return (
    <div className="flex flex-col items-center">
      {/* Score Display */}
      <div className={`${sizeTextClasses[size]} font-bold ${getScoreColor(score)}`}>
        {score}
        <span className="text-2xl text-gray-400">/100</span>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4 w-full max-w-xs">
        <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getProgressBarColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {label && (
        <div className={`mt-3 text-sm font-medium ${getScoreColor(score)}`}>
          {label}
        </div>
      )}
      <div className={`mt-2 rounded-full px-3 py-1 text-xs font-semibold ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
        {getScoreLabel(score)} Commitment
      </div>
    </div>
  );
}
