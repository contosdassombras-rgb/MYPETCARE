export interface WeightAlert {
  alert: boolean;
  percentage?: number;
  direction?: 'increase' | 'decrease';
}

/**
 * Checks if a weight change is significant enough to warrant an alert.
 * A change of 10% or more is considered significant.
 */
export const checkWeightVulnerability = (currentWeight: number, lastWeight: number): WeightAlert => {
  if (!lastWeight || lastWeight === 0 || !currentWeight || currentWeight === 0) {
    return { alert: false };
  }

  const diff = Math.abs(currentWeight - lastWeight);
  const percentage = (diff / lastWeight) * 100;

  if (percentage >= 10) {
    return {
      alert: true,
      percentage: Math.round(percentage),
      direction: currentWeight > lastWeight ? 'increase' : 'decrease'
    };
  }

  return { alert: false };
};
