import { Mark } from '../types';
import { GRADE_SCALE, MAX_MARKS } from '../constants';

export const calculateTotal = (mark: Mark | null): number => {
  if (!mark) return 0;
  return (mark.cats || 0) + (mark.coursework || 0) + (mark.finalExam || 0);
};

export const calculateGrade = (total: number): string => {
  const gradeInfo = GRADE_SCALE.find(g => total >= g.min && total <= g.max);
  return gradeInfo ? gradeInfo.grade : 'N/A';
};

export const calculateComponentGrade = (score: number | null, maxScore: number): string => {
  if (score === null || score < 0 || maxScore <= 0) return 'N/A';
  // Convert the component score to a percentage before grading
  const percentage = (score / maxScore) * 100;
  return calculateGrade(percentage);
};


export const validateMarks = (marks: { cats: number; coursework: number; finalExam: number }): string | null => {
  if (marks.cats < 0 || marks.cats > MAX_MARKS.cats) {
    return `CATs must be between 0 and ${MAX_MARKS.cats}.`;
  }
  if (marks.coursework < 0 || marks.coursework > MAX_MARKS.coursework) {
    return `Course Work must be between 0 and ${MAX_MARKS.coursework}.`;
  }
  if (marks.finalExam < 0 || marks.finalExam > MAX_MARKS.finalExam) {
    return `Final Exam must be between 0 and ${MAX_MARKS.finalExam}.`;
  }
  return null;
};