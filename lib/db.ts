/**
 * Database Service — Supabase Edition
 *
 * Drop-in replacement for the JSON file-based db.ts.
 * All function signatures are identical — no other file needs to change.
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from Vercel environment.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  TrainingSubject,
  TrainingModule,
  TrainingMaterial,
  EmployeeSubjectAssignment,
  AssessmentQuestion,
  AssessmentAttempt,
  ModuleAssessmentSettings,
} from './models';

// ─── Supabase client (service role — full access, server-side only) ──────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── ADMIN-SPECIFIC TYPES ────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Trainer' | 'Employee';
  department: string;
  status: 'Active' | 'Inactive';
  progress: number;
  avatar?: string;
  password?: string;
  passwordHash?: string;
  mobileNumber?: string;
  additionalMobileNumber?: string;
}

export interface Settings {
  general: {
    organizationName: string;
    logo: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    timezone: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    language: string;
    currency: string;
    trainingDefaults: {
      defaultDuration: number;
      defaultModuleDuration: number;
      autoEnrollNewEmployees: boolean;
      autoGenerateCertificates: boolean;
      reminderFrequency: 'daily' | 'weekly' | 'biweekly';
      gracePeriod: number;
      minPassingScore: number;
      allowRetakes: boolean;
      maxRetakeAttempts: number;
    };
  };
  mobileApp: {
    appName: string;
    appVersion: string;
    minimumSupportedVersion: string;
    forceUpdate: boolean;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    features: {
      offlineMode: boolean;
      darkMode: boolean;
      biometricAuth: boolean;
      pushNotifications: boolean;
      videoStreaming: boolean;
      downloadContent: boolean;
    };
    theme: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    };
  };
  notifications: any;
  security: any;
  integrations: any;
  system: any;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    dashboard: string[];
    users: string[];
    training: string[];
    schedule: string[];
    notifications: string[];
    settings: string[];
  };
}

export interface Schema {
  users: User[];
  trainingSubjects: TrainingSubject[];
  trainingModules: TrainingModule[];
  trainingMaterials: TrainingMaterial[];
  employeeSubjectAssignments: EmployeeSubjectAssignment[];
  assessmentQuestions: AssessmentQuestion[];
  assessmentAttempts: AssessmentAttempt[];
  moduleAssessmentSettings: ModuleAssessmentSettings[];
  notifications: any[];
  settings: Settings;
  roles: Role[];
}

// ─── HELPER: map DB row snake_case → camelCase ───────────────────────────────

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    department: row.department,
    status: row.status,
    progress: row.progress ?? 0,
    avatar: row.avatar,
    password: row.password,
    passwordHash: row.password_hash,
    mobileNumber: row.mobile_number,
    additionalMobileNumber: row.additional_mobile_number,
  };
}

function mapSubject(row: any): TrainingSubject {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    duration: row.duration,
    mode: row.mode ?? 'sequential',
    assignedTrainerIds: row.assigned_trainer_ids ?? [],
  };
}

function mapModule(row: any): TrainingModule {
  return {
    id: row.id,
    subjectId: row.subject_id,
    module: row.module,
    gapValue: row.gap_value ?? 0,
    gapUnit: row.gap_unit ?? 'days',
  };
}

function mapMaterial(row: any): TrainingMaterial {
  return {
    id: row.id,
    moduleId: row.module_id,
    title: row.title,
    type: row.type,
    mediaUrl: row.media_url,
  };
}

function mapAssignment(row: any): EmployeeSubjectAssignment {
  return {
    id: row.id,
    employeeId: row.employee_id,
    subjectId: row.subject_id,
    assignedAt: row.assigned_at,
    status: row.status,
  };
}

function mapQuestion(row: any): AssessmentQuestion {
  return {
    id: row.id,
    moduleId: row.module_id,
    text: row.text,
    optionA: row.option_a,
    optionB: row.option_b,
    optionC: row.option_c,
    optionD: row.option_d,
    correctAnswer: row.correct_answer,
    explanation: row.explanation,
    createdAt: row.created_at,
  };
}

function mapAttempt(row: any): AssessmentAttempt {
  return {
    id: row.id,
    employeeId: row.employee_id,
    subjectId: row.subject_id,
    moduleId: row.module_id,
    attemptNumber: row.attempt_number,
    score: row.score,
    passed: row.passed,
    submittedAt: row.submitted_at,
    answers: row.answers ?? {},
  };
}

function mapSettings(row: any): Settings {
  return row.data as Settings;
}

// ─── EXPORTED DATABASE API ───────────────────────────────────────────────────

export const db = {

  // ── USERS ──────────────────────────────────────────────────────────────────
  users: {
    async findAll(): Promise<User[]> {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return (data ?? []).map(mapUser);
    },
    async findById(id: string): Promise<User | null> {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
      if (error) return null;
      return mapUser(data);
    },
    async create(user: User): Promise<User> {
      const { data, error } = await supabase.from('users').insert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        progress: user.progress,
        avatar: user.avatar,
        mobile_number: user.mobileNumber,
        additional_mobile_number: user.additionalMobileNumber,
      }).select().single();
      if (error) throw error;
      return mapUser(data);
    },
    /** Creates a user with a bcrypt-hashed password. Use this for all new user creation. */
    async createWithHash(user: Omit<User, 'password'> & { passwordHash: string }): Promise<User> {
      const { data, error } = await supabase.from('users').insert({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
        progress: user.progress,
        avatar: user.avatar,
        password_hash: user.passwordHash,
        mobile_number: user.mobileNumber,
        additional_mobile_number: user.additionalMobileNumber,
      }).select().single();
      if (error) throw error;
      return mapUser(data);
    },
    async update(id: string, updates: Partial<User>): Promise<User | null> {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.role !== undefined) dbUpdates.role = updates.role;
      if (updates.department !== undefined) dbUpdates.department = updates.department;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.password !== undefined) dbUpdates.password = updates.password;
      if (updates.mobileNumber !== undefined) dbUpdates.mobile_number = updates.mobileNumber;
      if (updates.additionalMobileNumber !== undefined) dbUpdates.additional_mobile_number = updates.additionalMobileNumber;
      const { data, error } = await supabase.from('users').update(dbUpdates).eq('id', id).select().single();
      if (error) return null;
      return mapUser(data);
    },
    async findByEmail(email: string): Promise<User | null> {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email.trim())
        .single();
      if (error) return null;
      return mapUser(data);
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('users').delete().eq('id', id);
      return !error;
    },
  },

  // ── TRAINING SUBJECTS ──────────────────────────────────────────────────────
  subjects: {
    async findAll(): Promise<TrainingSubject[]> {
      const { data, error } = await supabase.from('training_subjects').select('*');
      if (error) throw error;
      return (data ?? []).map(mapSubject);
    },
    async findById(id: string): Promise<TrainingSubject | null> {
      const { data, error } = await supabase.from('training_subjects').select('*').eq('id', id).single();
      if (error) return null;
      return mapSubject(data);
    },
    async create(subject: TrainingSubject): Promise<TrainingSubject> {
      const { data, error } = await supabase.from('training_subjects').insert({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        duration: subject.duration,
        mode: subject.mode,
        assigned_trainer_ids: subject.assignedTrainerIds,
      }).select().single();
      if (error) throw error;
      return mapSubject(data);
    },
    async update(id: string, updates: Partial<TrainingSubject>): Promise<TrainingSubject | null> {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
      if (updates.mode !== undefined) dbUpdates.mode = updates.mode;
      if (updates.assignedTrainerIds !== undefined) dbUpdates.assigned_trainer_ids = updates.assignedTrainerIds;
      const { data, error } = await supabase.from('training_subjects').update(dbUpdates).eq('id', id).select().single();
      if (error) return null;
      return mapSubject(data);
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('training_subjects').delete().eq('id', id);
      return !error;
    },
  },

  // ── TRAINING MODULES ───────────────────────────────────────────────────────
  modules: {
    async findAll(): Promise<TrainingModule[]> {
      const { data, error } = await supabase.from('training_modules').select('*');
      if (error) throw error;
      return (data ?? []).map(mapModule);
    },
    async findBySubjectId(subjectId: string): Promise<TrainingModule[]> {
      const { data, error } = await supabase.from('training_modules').select('*').eq('subject_id', subjectId).order('module');
      if (error) throw error;
      return (data ?? []).map(mapModule);
    },
    async findById(id: string): Promise<TrainingModule | null> {
      const { data, error } = await supabase.from('training_modules').select('*').eq('id', id).single();
      if (error) return null;
      return mapModule(data);
    },
    async create(module: TrainingModule): Promise<TrainingModule> {
      const { data, error } = await supabase.from('training_modules').insert({
        id: module.id,
        subject_id: module.subjectId,
        module: module.module,
        gap_value: module.gapValue,
        gap_unit: module.gapUnit,
      }).select().single();
      if (error) throw error;
      return mapModule(data);
    },
    async update(id: string, updates: Partial<TrainingModule>): Promise<TrainingModule | null> {
      const dbUpdates: any = {};
      if (updates.module !== undefined) dbUpdates.module = updates.module;
      if (updates.gapValue !== undefined) dbUpdates.gap_value = updates.gapValue;
      if (updates.gapUnit !== undefined) dbUpdates.gap_unit = updates.gapUnit;
      const { data, error } = await supabase.from('training_modules').update(dbUpdates).eq('id', id).select().single();
      if (error) return null;
      return mapModule(data);
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('training_modules').delete().eq('id', id);
      return !error;
    },
  },

  // ── TRAINING MATERIALS ─────────────────────────────────────────────────────
  materials: {
    async findAll(): Promise<TrainingMaterial[]> {
      const { data, error } = await supabase.from('training_materials').select('*');
      if (error) throw error;
      return (data ?? []).map(mapMaterial);
    },
    async findByModuleId(moduleId: string): Promise<TrainingMaterial[]> {
      const { data, error } = await supabase.from('training_materials').select('*').eq('module_id', moduleId);
      if (error) throw error;
      return (data ?? []).map(mapMaterial);
    },
    async findById(id: string): Promise<TrainingMaterial | null> {
      const { data, error } = await supabase.from('training_materials').select('*').eq('id', id).single();
      if (error) return null;
      return mapMaterial(data);
    },
    async create(material: TrainingMaterial): Promise<TrainingMaterial> {
      const { data, error } = await supabase.from('training_materials').insert({
        id: material.id,
        module_id: material.moduleId,
        title: material.title,
        type: material.type,
        media_url: material.mediaUrl,
      }).select().single();
      if (error) throw error;
      return mapMaterial(data);
    },
    async update(id: string, updates: Partial<TrainingMaterial>): Promise<TrainingMaterial | null> {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.mediaUrl !== undefined) dbUpdates.media_url = updates.mediaUrl;
      const { data, error } = await supabase.from('training_materials').update(dbUpdates).eq('id', id).select().single();
      if (error) return null;
      return mapMaterial(data);
    },
    async delete(id: string): Promise<boolean> {
      const { error } = await supabase.from('training_materials').delete().eq('id', id);
      return !error;
    },
  },

  // ── SETTINGS ───────────────────────────────────────────────────────────────
  settings: {
    async find(): Promise<Settings> {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (error) throw error;
      return mapSettings(data);
    },
    async update(updates: Partial<Settings>): Promise<Settings> {
      const current = await db.settings.find();
      const merged = {
        ...current,
        ...updates,
        general: { ...current.general, ...(updates.general ?? {}) },
        mobileApp: { ...current.mobileApp, ...(updates.mobileApp ?? {}) },
      };
      const { data, error } = await supabase.from('settings').update({ data: merged }).eq('id', 1).select().single();
      if (error) throw error;
      return mapSettings(data);
    },
  },

  // ── ROLES ──────────────────────────────────────────────────────────────────
  roles: {
    async findAll(): Promise<Role[]> {
      const { data, error } = await supabase.from('roles').select('*');
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: r.permissions,
      }));
    },
    async update(id: string, updates: Partial<Role>): Promise<Role | null> {
      const { data, error } = await supabase.from('roles').update(updates).eq('id', id).select().single();
      if (error) return null;
      return data;
    },
    async create(role: Role): Promise<Role> {
      const { data, error } = await supabase.from('roles').insert(role).select().single();
      if (error) throw error;
      return data;
    },
  },

  // ── LEGACY ─────────────────────────────────────────────────────────────────
  training: {
    async findAll(): Promise<TrainingSubject[]> {
      return db.subjects.findAll();
    },
  },

  // ── EMPLOYEE-SUBJECT ASSIGNMENTS ───────────────────────────────────────────
  assignments: {
    async getByEmployee(employeeId: string): Promise<EmployeeSubjectAssignment[]> {
      const { data, error } = await supabase.from('employee_subject_assignments').select('*').eq('employee_id', employeeId);
      if (error) throw error;
      return (data ?? []).map(mapAssignment);
    },
    async getBySubject(subjectId: string): Promise<EmployeeSubjectAssignment[]> {
      const { data, error } = await supabase.from('employee_subject_assignments').select('*').eq('subject_id', subjectId);
      if (error) throw error;
      return (data ?? []).map(mapAssignment);
    },
    async findAll(): Promise<EmployeeSubjectAssignment[]> {
      const { data, error } = await supabase
        .from('employee_subject_assignments')
        .select('*');
      if (error) throw error;
      return (data ?? []).map(mapAssignment);
    },
    async assign(employeeId: string, subjectId: string): Promise<EmployeeSubjectAssignment> {
      const now = new Date().toISOString();
      const { data: existing } = await supabase
        .from('employee_subject_assignments')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('subject_id', subjectId)
        .single();

      if (existing) {
        if (existing.status === 'active') return mapAssignment(existing);
        const { data, error } = await supabase
          .from('employee_subject_assignments')
          .update({ status: 'active', assigned_at: now })
          .eq('id', existing.id)
          .select().single();
        if (error) throw error;
        return mapAssignment(data);
      }

      const newAssignment = {
        id: `esa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        employee_id: employeeId,
        subject_id: subjectId,
        assigned_at: now,
        status: 'active',
      };
      const { data, error } = await supabase
        .from('employee_subject_assignments')
        .insert(newAssignment).select().single();
      if (error) throw error;
      return mapAssignment(data);
    },
    async updateStatus(id: string, status: EmployeeSubjectAssignment['status']): Promise<EmployeeSubjectAssignment | null> {
      const { data, error } = await supabase
        .from('employee_subject_assignments')
        .update({ status })
        .eq('id', id).select().single();
      if (error) return null;
      return mapAssignment(data);
    },
    async remove(id: string): Promise<boolean> {
      const { error } = await supabase.from('employee_subject_assignments').delete().eq('id', id);
      return !error;
    },
  },

  // ── ASSESSMENTS ────────────────────────────────────────────────────────────
  assessments: {
    questions: {
      async findByModule(moduleId: string): Promise<AssessmentQuestion[]> {
        const { data, error } = await supabase.from('assessment_questions').select('*').eq('module_id', moduleId);
        if (error) throw error;
        return (data ?? []).map(mapQuestion);
      },
      async findById(id: string): Promise<AssessmentQuestion | null> {
        const { data, error } = await supabase.from('assessment_questions').select('*').eq('id', id).single();
        if (error) return null;
        return mapQuestion(data);
      },
      async create(question: AssessmentQuestion): Promise<AssessmentQuestion> {
        const { data, error } = await supabase.from('assessment_questions').insert({
          id: question.id,
          module_id: question.moduleId,
          text: question.text,
          option_a: question.optionA,
          option_b: question.optionB,
          option_c: question.optionC,
          option_d: question.optionD,
          correct_answer: question.correctAnswer,
          explanation: question.explanation,
          created_at: question.createdAt,
        }).select().single();
        if (error) throw error;
        return mapQuestion(data);
      },
      async update(id: string, updates: Partial<AssessmentQuestion>): Promise<AssessmentQuestion | null> {
        const dbUpdates: any = {};
        if (updates.text !== undefined) dbUpdates.text = updates.text;
        if (updates.optionA !== undefined) dbUpdates.option_a = updates.optionA;
        if (updates.optionB !== undefined) dbUpdates.option_b = updates.optionB;
        if (updates.optionC !== undefined) dbUpdates.option_c = updates.optionC;
        if (updates.optionD !== undefined) dbUpdates.option_d = updates.optionD;
        if (updates.correctAnswer !== undefined) dbUpdates.correct_answer = updates.correctAnswer;
        if (updates.explanation !== undefined) dbUpdates.explanation = updates.explanation;
        const { data, error } = await supabase.from('assessment_questions').update(dbUpdates).eq('id', id).select().single();
        if (error) return null;
        return mapQuestion(data);
      },
      async delete(id: string): Promise<boolean> {
        const { error } = await supabase.from('assessment_questions').delete().eq('id', id);
        return !error;
      },
      async deleteByModule(moduleId: string): Promise<void> {
        await supabase.from('assessment_questions').delete().eq('module_id', moduleId);
      },
    },

    attempts: {
      async create(attempt: AssessmentAttempt): Promise<AssessmentAttempt> {
        const { data, error } = await supabase.from('assessment_attempts').insert({
          id: attempt.id,
          employee_id: attempt.employeeId,
          subject_id: attempt.subjectId,
          module_id: attempt.moduleId,
          attempt_number: attempt.attemptNumber,
          score: attempt.score,
          passed: attempt.passed,
          submitted_at: attempt.submittedAt,
          answers: attempt.answers,
        }).select().single();
        if (error) throw error;
        return mapAttempt(data);
      },
      async findByEmployee(employeeId: string): Promise<AssessmentAttempt[]> {
        const { data, error } = await supabase.from('assessment_attempts').select('*').eq('employee_id', employeeId);
        if (error) throw error;
        return (data ?? []).map(mapAttempt);
      },
      async findByModule(moduleId: string): Promise<AssessmentAttempt[]> {
        const { data, error } = await supabase.from('assessment_attempts').select('*').eq('module_id', moduleId);
        if (error) throw error;
        return (data ?? []).map(mapAttempt);
      },
      async findByEmployeeAndModule(employeeId: string, moduleId: string): Promise<AssessmentAttempt[]> {
        const { data, error } = await supabase
          .from('assessment_attempts')
          .select('*')
          .eq('employee_id', employeeId)
          .eq('module_id', moduleId);
        if (error) throw error;
        return (data ?? []).map(mapAttempt);
      },
    },

    settings: {
      async findByModule(moduleId: string): Promise<ModuleAssessmentSettings | null> {
        const { data, error } = await supabase.from('module_assessment_settings').select('*').eq('module_id', moduleId).single();
        if (error) return null;
        return {
          moduleId: data.module_id,
          passingScore: data.passing_score,
          questionsPerAttempt: data.questions_per_attempt,
        };
      },
      async upsert(settings: ModuleAssessmentSettings): Promise<ModuleAssessmentSettings> {
        const { data, error } = await supabase.from('module_assessment_settings').upsert({
          module_id: settings.moduleId,
          passing_score: settings.passingScore,
          questions_per_attempt: settings.questionsPerAttempt,
        }).select().single();
        if (error) throw error;
        return {
          moduleId: data.module_id,
          passingScore: data.passing_score,
          questionsPerAttempt: data.questions_per_attempt,
        };
      },
    },
  },

  // ── LEGACY read/write (kept for any old references) ────────────────────────
  read: async (): Promise<Schema> => { throw new Error('db.read() is not supported in Supabase mode. Use db.* methods directly.'); },
  write: async (data: Schema): Promise<void> => { throw new Error('db.write() is not supported in Supabase mode. Use db.* methods directly.'); },
};
