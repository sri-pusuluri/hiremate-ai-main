import { Candidate } from '@/types/hiresort';

export interface CohortImpactMetric {
  groupName: string;
  totalApplicants: number;
  shortlistedCount: number;
  selectionRate: number; // Percentage 0 - 100
  adverseImpactRatio: number; // Ratio compared to highest rate group (0.0 - 1.0)
  status: 'compliant' | 'warning' | 'adverse_impact';
}

export interface DisparateImpactReport {
  cohortMetrics: CohortImpactMetric[];
  benchmarkGroup: string;
  benchmarkSelectionRate: number;
  lowestImpactRatio: number;
  overallStatus: 'compliant' | 'warning' | 'action_required';
  totalApplicantsEvaluated: number;
  totalShortlisted: number;
  evaluatedAt: string;
  standards: string[];
}

/**
 * Calculates Adverse Impact Ratio (AIR) according to the EEOC Four-Fifths (80%) Rule
 * and NYC Local Law 144 requirements for Automated Employment Decision Tools (AEDT).
 *
 * An adverse impact ratio below 0.80 (80%) indicates potential disparate impact
 * requiring review, while 0.80+ satisfies the Four-Fifths Rule.
 */
export function calculateDisparateImpact(candidates: Candidate[]): DisparateImpactReport {
  const standards = [
    'EEOC Uniform Guidelines on Employee Selection Procedures § 4D (Four-Fifths Rule)',
    'NYC Local Law 144 (Automated Employment Decision Tools Bias Audit)',
    'EU AI Act High-Risk Employment AI Transparency (Art. 10 & 13)'
  ];

  if (!candidates || candidates.length === 0) {
    return {
      cohortMetrics: [],
      benchmarkGroup: 'None',
      benchmarkSelectionRate: 0,
      lowestImpactRatio: 1.0,
      overallStatus: 'compliant',
      totalApplicantsEvaluated: 0,
      totalShortlisted: 0,
      evaluatedAt: new Date().toISOString(),
      standards
    };
  }

  // Define experience cohorts
  const cohorts: Record<string, { total: number; selected: number }> = {
    'Early Career (0–2 Yrs)': { total: 0, selected: 0 },
    'Mid-Level (3–5 Yrs)': { total: 0, selected: 0 },
    'Senior / Lead (6+ Yrs)': { total: 0, selected: 0 },
    'Talent Pool Sourced': { total: 0, selected: 0 }
  };

  let totalSelected = 0;

  for (const c of candidates) {
    const isSelected = 
      c.status === 'shortlisted' || 
      c.status === 'interviewing' || 
      c.pipelineStage === 'interviewing' || 
      c.pipelineStage === 'offered' ||
      c.isPinned || 
      c.aiScore === 'high';

    if (isSelected) totalSelected++;

    // Classify into cohort
    const exp = typeof c.experience === 'number' ? c.experience : parseInt(String(c.experience) || '0', 10);

    if (c.source === 'talent-pool') {
      cohorts['Talent Pool Sourced'].total++;
      if (isSelected) cohorts['Talent Pool Sourced'].selected++;
    }

    if (exp <= 2) {
      cohorts['Early Career (0–2 Yrs)'].total++;
      if (isSelected) cohorts['Early Career (0–2 Yrs)'].selected++;
    } else if (exp <= 5) {
      cohorts['Mid-Level (3–5 Yrs)'].total++;
      if (isSelected) cohorts['Mid-Level (3–5 Yrs)'].selected++;
    } else {
      cohorts['Senior / Lead (6+ Yrs)'].total++;
      if (isSelected) cohorts['Senior / Lead (6+ Yrs)'].selected++;
    }
  }

  // Calculate selection rate per cohort
  const computedCohorts: Array<{ name: string; total: number; selected: number; rate: number }> = [];

  for (const [name, data] of Object.entries(cohorts)) {
    // If cohort has at least 1 applicant
    if (data.total > 0) {
      const rate = (data.selected / data.total) * 100;
      computedCohorts.push({
        name,
        total: data.total,
        selected: data.selected,
        rate
      });
    }
  }

  // Find benchmark group (highest selection rate)
  let benchmarkGroup = 'Early Career (0–2 Yrs)';
  let benchmarkRate = 0;

  for (const group of computedCohorts) {
    if (group.rate > benchmarkRate) {
      benchmarkRate = group.rate;
      benchmarkGroup = group.name;
    }
  }

  // Avoid division by zero if nobody is selected
  const safeBenchmark = benchmarkRate > 0 ? benchmarkRate : 1;

  // Compute Adverse Impact Ratio (AIR) for each group
  const metrics: CohortImpactMetric[] = computedCohorts.map(group => {
    // AIR is group selection rate / benchmark selection rate
    const air = benchmarkRate > 0 ? (group.rate / safeBenchmark) : 1.0;
    const roundedAir = Math.min(1.0, Math.round(air * 100) / 100);

    let status: 'compliant' | 'warning' | 'adverse_impact' = 'compliant';
    if (roundedAir < 0.65) {
      status = 'adverse_impact';
    } else if (roundedAir < 0.80) {
      status = 'warning';
    }

    return {
      groupName: group.name,
      totalApplicants: group.total,
      shortlistedCount: group.selected,
      selectionRate: Math.round(group.rate * 10) / 10,
      adverseImpactRatio: roundedAir,
      status
    };
  });

  // Calculate lowest AIR
  const lowestAir = metrics.length > 0 
    ? Math.min(...metrics.map(m => m.adverseImpactRatio)) 
    : 1.0;

  let overallStatus: 'compliant' | 'warning' | 'action_required' = 'compliant';
  if (lowestAir < 0.65) {
    overallStatus = 'action_required';
  } else if (lowestAir < 0.80) {
    overallStatus = 'warning';
  }

  return {
    cohortMetrics: metrics,
    benchmarkGroup,
    benchmarkSelectionRate: Math.round(benchmarkRate * 10) / 10,
    lowestImpactRatio: lowestAir,
    overallStatus,
    totalApplicantsEvaluated: candidates.length,
    totalShortlisted: totalSelected,
    evaluatedAt: new Date().toISOString(),
    standards
  };
}
