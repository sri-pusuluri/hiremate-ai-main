import { describe, it, expect } from 'vitest';
import { parseExperienceToRange, parseSalaryToState, formatSalaryString } from '@/components/ats/CreateJobModal';

describe('Job Seek Bars - Experience & Compensation Helpers', () => {
  it('parses experience ranges correctly', () => {
    expect(parseExperienceToRange('3-5 Years')).toEqual([3, 5]);
    expect(parseExperienceToRange('1 - 3 yrs')).toEqual([1, 3]);
    expect(parseExperienceToRange('8+ Years')).toEqual([8, 10]);
    expect(parseExperienceToRange('Fresher / Entry Level')).toEqual([0, 1]);
    expect(parseExperienceToRange(undefined)).toEqual([3, 5]);
  });

  it('parses salary and currency accurately', () => {
    const inr = parseSalaryToState('₹25-40 LPA');
    expect(inr.currency).toBe('INR');
    expect(inr.range).toEqual([25, 40]);

    const usd = parseSalaryToState('$120-180k / yr');
    expect(usd.currency).toBe('USD');
    expect(usd.range).toEqual([120, 180]);

    const eur = parseSalaryToState('€70-90k');
    expect(eur.currency).toBe('EUR');
    expect(eur.range).toEqual([70, 90]);

    const singleInr = parseSalaryToState('₹30 LPA');
    expect(singleInr.currency).toBe('INR');
    expect(singleInr.range).toEqual([30, 40]);
  });

  it('formats salary strings properly across currencies', () => {
    expect(formatSalaryString('INR', 25, 40)).toBe('₹25-40 LPA');
    expect(formatSalaryString('INR', 25, 25)).toBe('₹25 LPA');
    expect(formatSalaryString('USD', 80, 140)).toBe('$80-140k / yr');
    expect(formatSalaryString('EUR', 60, 90)).toBe('€60-90k / yr');
    expect(formatSalaryString('GBP', 50, 75)).toBe('£50-75k / yr');
  });
});
