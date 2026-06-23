export const KPI_TEMPLATES = {
  'Marketing': [
    { metricName: 'Leads generated/month', pillar: 'S', unit: 'count', direction: 'higher_better' },
    { metricName: 'Campaign creation time', pillar: 'O', unit: 'days', direction: 'lower_better' },
    { metricName: 'Campaign ROI', pillar: 'S', unit: 'x', direction: 'higher_better' },
    { metricName: 'Lead quality satisfaction', pillar: 'E', unit: 'NPS', direction: 'higher_better' },
  ],
  'Business Development': [
    { metricName: 'New franchises signed/quarter', pillar: 'S', unit: 'count', direction: 'higher_better' },
    { metricName: 'Deal closure time', pillar: 'O', unit: 'days', direction: 'lower_better' },
    { metricName: 'Partner satisfaction NPS', pillar: 'E', unit: 'NPS', direction: 'higher_better' },
  ],
  'Retail Operations': [
    { metricName: 'Services per stylist/day', pillar: 'S', unit: 'count', direction: 'higher_better' },
    { metricName: 'Complaint resolution time', pillar: 'O', unit: 'hours', direction: 'lower_better' },
    { metricName: 'Customer satisfaction NPS', pillar: 'E', unit: 'NPS', direction: 'higher_better' },
    { metricName: 'Product wastage %', pillar: 'O', unit: '%', direction: 'lower_better' },
  ],
  'HR': [
    { metricName: 'Time to hire', pillar: 'O', unit: 'days', direction: 'lower_better' },
    { metricName: 'Hiring volume/month', pillar: 'S', unit: 'count', direction: 'higher_better' },
    { metricName: 'Employee attrition %', pillar: 'E', unit: '%', direction: 'lower_better' },
    { metricName: 'Cost per hire', pillar: 'O', unit: 'INR', direction: 'lower_better' },
  ],
  'Training & Academy': [
    { metricName: 'Employees certified/month', pillar: 'S', unit: 'count', direction: 'higher_better' },
    { metricName: 'Course development time', pillar: 'O', unit: 'days', direction: 'lower_better' },
    { metricName: 'Course completion rate', pillar: 'E', unit: '%', direction: 'higher_better' },
  ],
  'Leadership': [
    { metricName: 'Decision turnaround time', pillar: 'O', unit: 'days', direction: 'lower_better' },
    { metricName: 'Revenue forecast accuracy', pillar: 'S', unit: '%', direction: 'higher_better' },
    { metricName: 'Team engagement score', pillar: 'E', unit: 'score', direction: 'higher_better' },
  ],
  'Cross-Functional': [
    { metricName: 'Cross-org projects completed', pillar: 'S', unit: 'count', direction: 'higher_better' },
    { metricName: 'Collaboration effectiveness', pillar: 'E', unit: 'score', direction: 'higher_better' },
    { metricName: 'Project launch speed', pillar: 'O', unit: 'days', direction: 'lower_better' },
  ],
  'AI Champions': [
    { metricName: 'Daily AI users (% of workforce)', pillar: 'S', unit: '%', direction: 'higher_better' },
    { metricName: 'Champion satisfaction', pillar: 'E', unit: 'NPS', direction: 'higher_better' },
    { metricName: 'Time to resolve AI questions', pillar: 'O', unit: 'hours', direction: 'lower_better' },
  ],
};

export const PILLAR_INFO = {
  S: { name: 'Scaling', color: '#3b82f6', bgColor: '#eff6ff', icon: 'TrendingUp', description: 'Revenue and growth metrics' },
  E: { name: 'Experience', color: '#10b981', bgColor: '#ecfdf5', icon: 'Heart', description: 'Satisfaction and engagement' },
  O: { name: 'Optimization', color: '#f59e0b', bgColor: '#fffbeb', icon: 'Zap', description: 'Speed and efficiency' },
};

export function calcProgress(baseline, current, target, direction) {
  if (baseline == null || target == null || current == null) return null;
  if (baseline === target) return current >= target ? 100 : 0;
  let progress;
  if (direction === 'lower_better') {
    progress = ((baseline - current) / (baseline - target)) * 100;
  } else {
    progress = ((current - baseline) / (target - baseline)) * 100;
  }
  return Math.max(0, Math.min(100, Math.round(progress)));
}

export function getHealthColor(progress) {
  if (progress == null) return 'gray';
  if (progress >= 70) return 'green';
  if (progress >= 40) return 'amber';
  return 'red';
}

export function getHealthLabel(progress) {
  if (progress == null) return 'No Data';
  if (progress >= 70) return 'On Track';
  if (progress >= 40) return 'Caution';
  return 'At Risk';
}
