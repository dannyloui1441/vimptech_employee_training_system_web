/**
 * Shared Data Contract Models
 *
 * Core types are compatible with the Flutter mobile app contract.
 * Fields marked [Admin-only] are ignored by Flutter and only used
 * by the admin web panel for access control and management.
 */

// ============================================
// TRAINING SUBJECT (a.k.a. Training Program — renamed)
// ============================================
export interface TrainingSubject {
  id: string;
  name: string;
  description: string;
  /** Optional display duration (e.g. "4 weeks") */
  duration?: string;
  /** [Admin-only] Trainer user IDs who are authorised to manage this subject's modules. */
  assignedTrainerIds: string[];
  /**
   * Release mode for modules in this subject.
   * - "sequential": modules unlock one after the other with no gap.
   * - "scheduled":  each module has an explicit gap (gapValue + gapUnit) before it unlocks.
   * Defaults to "sequential" for backward-compatibility.
   */
  mode: "sequential" | "scheduled";
}

// ============================================
// TRAINING MODULE  (1 Module = 1 Day container)
// ============================================
export interface TrainingModule {
  id: string;
  subjectId: string;
  /** Day number within the subject. Must be unique per subject. */
  day: number;
  /**
   * Gap before this module becomes available (used only when subject.mode === "scheduled").
   * Defaults to 0 / "days" for backward-compatibility and sequential subjects.
   */
  gapValue: number;
  gapUnit: "days" | "weeks";
}

// ============================================
// TRAINING MATERIAL  (content inside a Module)
// ============================================
export interface TrainingMaterial {
  id: string;
  moduleId: string;
  title: string;
  type: "video" | "pdf" | "audio";
  mediaUrl: string;
}

// ============================================
// EMPLOYEE (read-only in Admin Web)
// ============================================
export interface Employee {
  id: string;
  email: string;
  assignedSubjectId: string;
}

// ============================================
// ASSESSMENT (read-only in Admin Web)
// ============================================
export interface Assessment {
  id: string;
  moduleId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
}

// ============================================
// EMPLOYEE–SUBJECT ASSIGNMENT  [Admin-only]
// ============================================
export interface EmployeeSubjectAssignment {
  id: string;
  employeeId: string;
  subjectId: string;
  /** ISO 8601 date-time string — when this assignment record was created / last activated. */
  assignedAt: string;
  status: 'active' | 'paused' | 'completed';
}

// ============================================
// ASSESSMENT QUESTION  [Admin-only]
// ============================================
export interface AssessmentQuestion {
  id: string;
  moduleId: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  createdAt: string;
}

// ============================================
// ASSESSMENT ATTEMPT  [Admin-only]
// ============================================
export interface AssessmentAttempt {
  id: string;
  employeeId: string;
  subjectId: string;
  moduleId: string;
  attemptNumber: number;
  score: number;        // 0–100
  passed: boolean;
  submittedAt: string;
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
}

// ============================================
// MODULE ASSESSMENT SETTINGS  [Admin-only]
// ============================================
export interface ModuleAssessmentSettings {
  moduleId: string;
  passingScore: number;        // default 70
  questionsPerAttempt: number; // default 10
}
