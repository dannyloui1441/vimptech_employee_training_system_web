/**
 * Database Service
 *
 * Single source of truth for all data access.
 * Uses JSON file storage (mock backend style).
 * Models align with shared Flutter app contract.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { TrainingSubject, TrainingModule, TrainingMaterial, EmployeeSubjectAssignment, AssessmentQuestion, AssessmentAttempt, ModuleAssessmentSettings } from './models';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// ============================================
// ADMIN-SPECIFIC TYPES (not in shared contract)
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Trainer' | 'Employee';
  department: string;
  status: 'Active' | 'Inactive';
  progress: number;
  avatar?: string;
  /** Auto-generated login password stored in plain text for admin visibility. */
  password?: string;
  /** Primary mobile / phone number */
  mobileNumber?: string;
  /** Secondary / additional mobile number */
  additionalMobileNumber?: string;
}

export interface Settings {
  general: {
    organizationName: string
    logo: string | null
    primaryColor: string
    secondaryColor: string
    accentColor: string
    timezone: string
    dateFormat: string
    timeFormat: '12h' | '24h'
    language: string
    currency: string
    trainingDefaults: {
      defaultDuration: number
      defaultModuleDuration: number
      autoEnrollNewEmployees: boolean
      autoGenerateCertificates: boolean
      reminderFrequency: 'daily' | 'weekly' | 'biweekly'
      gracePeriod: number
      minPassingScore: number
      allowRetakes: boolean
      maxRetakeAttempts: number
    }
  }
  mobileApp: {
    appName: string
    appVersion: string
    minimumSupportedVersion: string
    forceUpdate: boolean
    maintenanceMode: boolean
    maintenanceMessage: string
    features: {
      offlineMode: boolean
      darkMode: boolean
      biometricAuth: boolean
      pushNotifications: boolean
      videoStreaming: boolean
      downloadContent: boolean
    }
    theme: {
      primaryColor: string
      secondaryColor: string
      accentColor: string
    }
  }
  notifications: {
    email: {
      trainingAssignment: boolean
      deadlineReminders: boolean
      deadlineReminderDays: number[]
      completionNotifications: boolean
      welcomeEmail: boolean
      weeklyReports: boolean
      weeklyReportDay: string
      monthlyReports: boolean
    }
    inApp: {
      trainingUpdates: boolean
      comments: boolean
      announcements: boolean
      achievements: boolean
    }
    recipients: {
      adminEmail: string
      ccEmails: string[]
    }
  }
  security: {
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireNumbers: boolean
      requireSpecialChars: boolean
      expiryDays: number
      historyCount: number
    }
    session: {
      timeout: number
      rememberMeDuration: number
      maxConcurrentSessions: number
      forceLogoutOnPasswordChange: boolean
    }
    twoFactor: {
      enabledForAll: boolean
      requiredForAdmins: boolean
      method: 'app' | 'sms' | 'email'
    }
    accessControl: {
      ipWhitelist: string[]
      loginAttemptLimit: number
      lockoutDuration: number
      allowMultipleDevices: boolean
    }
    audit: {
      enableLogs: boolean
      retentionDays: number
    }
  }
  integrations: {
    email: {
      provider: string
      config: Record<string, any>
      fromEmail: string
      fromName: string
    }
    sso: {
      enabled: boolean
      provider: string
      clientId: string
      clientSecret: string
    }
    api: {
      enabled: boolean
      key: string
      rateLimit: number
      webhookUrl: string
      webhookEvents: string[]
    }
    calendar: {
      google: boolean
      outlook: boolean
      syncSchedules: boolean
    }
  }
  system: {
    backup: {
      enabled: boolean
      frequency: 'daily' | 'weekly' | 'monthly'
      time: string
      lastBackup: string | null
    }
    dataRetention: number
    maintenanceMode: boolean
    debugMode: boolean
    errorLoggingLevel: string
  }
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: {
    dashboard: string[]
    users: string[]
    training: string[]
    schedule: string[]
    notifications: string[]
    settings: string[]
  }
}

// ============================================
// DATABASE SCHEMA
// ============================================

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

// ============================================
// DEFAULT DATA
// ============================================

const defaultSettings: Settings = {
  general: {
    organizationName: "Acme Corp Training",
    logo: null,
    primaryColor: "#3b82f6",
    secondaryColor: "#1e293b",
    accentColor: "#f59e0b",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    language: "English",
    currency: "USD",
    trainingDefaults: {
      defaultDuration: 4,
      defaultModuleDuration: 1,
      autoEnrollNewEmployees: true,
      autoGenerateCertificates: true,
      reminderFrequency: "weekly",
      gracePeriod: 7,
      minPassingScore: 70,
      allowRetakes: true,
      maxRetakeAttempts: 3
    }
  },
  mobileApp: {
    appName: "Acme Learning",
    appVersion: "1.0.0",
    minimumSupportedVersion: "1.0.0",
    forceUpdate: false,
    maintenanceMode: false,
    maintenanceMessage: "The mobile app is currently undergoing scheduled maintenance.",
    features: {
      offlineMode: true,
      darkMode: true,
      biometricAuth: true,
      pushNotifications: true,
      videoStreaming: true,
      downloadContent: true
    },
    theme: {
      primaryColor: "#3b82f6",
      secondaryColor: "#1e293b",
      accentColor: "#f59e0b"
    }
  },
  notifications: {
    email: {
      trainingAssignment: true,
      deadlineReminders: true,
      deadlineReminderDays: [7, 3, 1],
      completionNotifications: true,
      welcomeEmail: true,
      weeklyReports: true,
      weeklyReportDay: "Monday",
      monthlyReports: true
    },
    inApp: {
      trainingUpdates: true,
      comments: true,
      announcements: true,
      achievements: true
    },
    recipients: {
      adminEmail: "admin@acme-corp.com",
      ccEmails: []
    }
  },
  security: {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expiryDays: 90,
      historyCount: 5
    },
    session: {
      timeout: 30,
      rememberMeDuration: 30,
      maxConcurrentSessions: 3,
      forceLogoutOnPasswordChange: true
    },
    twoFactor: {
      enabledForAll: false,
      requiredForAdmins: true,
      method: "app"
    },
    accessControl: {
      ipWhitelist: [],
      loginAttemptLimit: 5,
      lockoutDuration: 15,
      allowMultipleDevices: true
    },
    audit: {
      enableLogs: true,
      retentionDays: 90
    }
  },
  integrations: {
    email: {
      provider: "SMTP",
      config: {},
      fromEmail: "training@acme-corp.com",
      fromName: "Acme Training"
    },
    sso: {
      enabled: false,
      provider: "Google",
      clientId: "",
      clientSecret: ""
    },
    api: {
      enabled: true,
      key: "atp_" + Math.random().toString(36).substring(2, 15),
      rateLimit: 1000,
      webhookUrl: "",
      webhookEvents: ["user.created", "training.assigned"]
    },
    calendar: {
      google: false,
      outlook: false,
      syncSchedules: true
    }
  },
  system: {
    backup: {
      enabled: true,
      frequency: "daily",
      time: "02:00",
      lastBackup: null
    },
    dataRetention: 24,
    maintenanceMode: false,
    debugMode: false,
    errorLoggingLevel: "Errors Only"
  }
};

const defaultRoles: Role[] = [
  {
    id: "admin",
    name: "Admin",
    description: "Full system access",
    permissions: {
      dashboard: ["view", "analytics", "export"],
      users: ["view", "create", "edit", "delete", "roles", "passwords"],
      training: ["view", "create", "edit", "delete", "assign", "track", "grade"],
      schedule: ["view", "create", "edit", "delete"],
      notifications: ["send", "manage"],
      settings: ["view", "modify", "integrations"]
    }
  },
  {
    id: "trainer",
    name: "Trainer",
    description: "Training and content management",
    permissions: {
      dashboard: ["view", "analytics"],
      users: ["view"],
      training: ["view", "create", "edit", "delete", "assign", "track", "grade"],
      schedule: ["view", "create", "edit", "delete"],
      notifications: ["send"],
      settings: ["view"]
    }
  },
  {
    id: "employee",
    name: "Employee",
    description: "Standard learning access",
    permissions: {
      dashboard: ["view"],
      users: [],
      training: ["view", "track"],
      schedule: ["view"],
      notifications: [],
      settings: []
    }
  }
];

const initialData: Schema = {
  users: [],
  trainingSubjects: [],
  trainingModules: [],
  trainingMaterials: [],
  employeeSubjectAssignments: [],
  assessmentQuestions: [],
  assessmentAttempts: [],
  moduleAssessmentSettings: [],
  notifications: [],
  settings: defaultSettings,
  roles: defaultRoles
};

// ============================================
// DATABASE OPERATIONS
// ============================================

async function ensureDb() {
  try {
    const dir = path.dirname(DB_PATH);
    await fs.mkdir(dir, { recursive: true });

    try {
      await fs.access(DB_PATH);
    } catch {
      await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

async function readDb(): Promise<Schema> {
  await ensureDb();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  const parsed = JSON.parse(data);

  // Backward-compat: support old db.json that used 'trainingPrograms' key
  if (!parsed.trainingSubjects && parsed.trainingPrograms) {
    parsed.trainingSubjects = parsed.trainingPrograms;
    delete parsed.trainingPrograms;
  }
  if (!parsed.trainingSubjects) {
    parsed.trainingSubjects = [];
  }

  // Backward-compat: ensure trainingModules array exists
  if (!parsed.trainingModules) {
    parsed.trainingModules = [];
  }

  // Backward-compat: ensure trainingMaterials array exists
  if (!parsed.trainingMaterials) {
    parsed.trainingMaterials = [];
  }

  // Backward-compat: ensure employeeSubjectAssignments array exists
  if (!parsed.employeeSubjectAssignments) {
    parsed.employeeSubjectAssignments = [];
  }

  // Backward-compat: ensure assessment collections exist
  if (!parsed.assessmentQuestions) parsed.assessmentQuestions = [];
  if (!parsed.assessmentAttempts) parsed.assessmentAttempts = [];
  if (!parsed.moduleAssessmentSettings) parsed.moduleAssessmentSettings = [];

  // Backward-compat: ensure mode field exists on all subjects
  parsed.trainingSubjects = parsed.trainingSubjects.map((p: any) => ({
    mode: 'sequential',
    ...p,
  }));

  // Backward-compat: support old modules that used 'programId' key
  // Also migrate old modules that had title/type/mediaUrl embedded —
  // extract those fields into new TrainingMaterial records.
  const migratedMaterials: TrainingMaterial[] = [...parsed.trainingMaterials];
  const existingMaterialModuleIds = new Set(migratedMaterials.map((mat: any) => mat.moduleId));

  parsed.trainingModules = parsed.trainingModules.map((m: any) => {
    const moduleId = m.programId ? m.programId : m.id;
    const subjectId = m.programId ?? m.subjectId;

    // If this module had embedded media AND we haven't already migrated it
    if (m.title && m.type && m.mediaUrl && !existingMaterialModuleIds.has(m.id)) {
      migratedMaterials.push({
        id: `mat-${m.id}`,
        moduleId: m.id,
        title: m.title,
        type: m.type,
        mediaUrl: m.mediaUrl,
      });
      existingMaterialModuleIds.add(m.id);
    }

    // Return clean module (strip legacy media fields)
    const { title, type, mediaUrl, order, programId, ...cleanModule } = m;
    return {
      gapValue: 0,
      gapUnit: 'days',
      ...cleanModule,
      id: m.id,
      subjectId,
    };
  });

  parsed.trainingMaterials = migratedMaterials;

  return parsed;
}

async function writeDb(data: Schema) {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// ============================================
// EXPORTED DATABASE API
// ============================================

export const db = {
  read: readDb,
  write: writeDb,

  // ----------------------------------------
  // USERS
  // ----------------------------------------
  users: {
    async findAll() {
      const data = await readDb();
      return data.users;
    },
    async findById(id: string) {
      const data = await readDb();
      return data.users.find(u => u.id === id) || null;
    },
    async create(user: User) {
      const data = await readDb();
      data.users.push(user);
      await writeDb(data);
      return user;
    },
    async update(id: string, updates: Partial<User>) {
      const data = await readDb();
      const index = data.users.findIndex(u => u.id === id);
      if (index === -1) return null;

      data.users[index] = { ...data.users[index], ...updates };
      await writeDb(data);
      return data.users[index];
    },
    async delete(id: string) {
      const data = await readDb();
      data.users = data.users.filter(u => u.id !== id);
      await writeDb(data);
      return true;
    }
  },

  // ----------------------------------------
  // TRAINING SUBJECTS (shared contract)
  // ----------------------------------------
  subjects: {
    async findAll(): Promise<TrainingSubject[]> {
      const data = await readDb();
      return data.trainingSubjects;
    },
    async findById(id: string): Promise<TrainingSubject | null> {
      const data = await readDb();
      return data.trainingSubjects.find(p => p.id === id) || null;
    },
    async create(subject: TrainingSubject): Promise<TrainingSubject> {
      const data = await readDb();
      data.trainingSubjects.push(subject);
      await writeDb(data);
      return subject;
    },
    async update(id: string, updates: Partial<TrainingSubject>): Promise<TrainingSubject | null> {
      const data = await readDb();
      const index = data.trainingSubjects.findIndex(p => p.id === id);
      if (index === -1) return null;

      data.trainingSubjects[index] = { ...data.trainingSubjects[index], ...updates };
      await writeDb(data);
      return data.trainingSubjects[index];
    },
    async delete(id: string): Promise<boolean> {
      const data = await readDb();
      // Find all modules for this subject
      const moduleIds = data.trainingModules
        .filter(m => m.subjectId === id)
        .map(m => m.id);

      data.trainingSubjects = data.trainingSubjects.filter(p => p.id !== id);
      data.trainingModules = data.trainingModules.filter(m => m.subjectId !== id);
      // Cascade delete materials for those modules
      data.trainingMaterials = data.trainingMaterials.filter(
        mat => !moduleIds.includes(mat.moduleId)
      );
      await writeDb(data);
      return true;
    }
  },

  // ----------------------------------------
  // TRAINING MODULES (shared contract)
  // ----------------------------------------
  modules: {
    async findAll(): Promise<TrainingModule[]> {
      const data = await readDb();
      return data.trainingModules;
    },
    async findBySubjectId(subjectId: string): Promise<TrainingModule[]> {
      const data = await readDb();
      return data.trainingModules.filter(m => m.subjectId === subjectId);
    },
    async findById(id: string): Promise<TrainingModule | null> {
      const data = await readDb();
      return data.trainingModules.find(m => m.id === id) || null;
    },
    async create(module: TrainingModule): Promise<TrainingModule> {
      const data = await readDb();
      data.trainingModules.push(module);
      await writeDb(data);
      return module;
    },
    async update(id: string, updates: Partial<TrainingModule>): Promise<TrainingModule | null> {
      const data = await readDb();
      const index = data.trainingModules.findIndex(m => m.id === id);
      if (index === -1) return null;

      data.trainingModules[index] = { ...data.trainingModules[index], ...updates };
      await writeDb(data);
      return data.trainingModules[index];
    },
    async delete(id: string): Promise<boolean> {
      const data = await readDb();
      data.trainingModules = data.trainingModules.filter(m => m.id !== id);
      // Cascade delete materials
      data.trainingMaterials = data.trainingMaterials.filter(mat => mat.moduleId !== id);
      await writeDb(data);
      return true;
    }
  },

  // ----------------------------------------
  // TRAINING MATERIALS
  // ----------------------------------------
  materials: {
    async findAll(): Promise<TrainingMaterial[]> {
      const data = await readDb();
      return data.trainingMaterials;
    },
    async findByModuleId(moduleId: string): Promise<TrainingMaterial[]> {
      const data = await readDb();
      return data.trainingMaterials.filter(mat => mat.moduleId === moduleId);
    },
    async findById(id: string): Promise<TrainingMaterial | null> {
      const data = await readDb();
      return data.trainingMaterials.find(mat => mat.id === id) || null;
    },
    async create(material: TrainingMaterial): Promise<TrainingMaterial> {
      const data = await readDb();
      data.trainingMaterials.push(material);
      await writeDb(data);
      return material;
    },
    async update(id: string, updates: Partial<TrainingMaterial>): Promise<TrainingMaterial | null> {
      const data = await readDb();
      const index = data.trainingMaterials.findIndex(mat => mat.id === id);
      if (index === -1) return null;

      data.trainingMaterials[index] = { ...data.trainingMaterials[index], ...updates };
      await writeDb(data);
      return data.trainingMaterials[index];
    },
    async delete(id: string): Promise<boolean> {
      const data = await readDb();
      data.trainingMaterials = data.trainingMaterials.filter(mat => mat.id !== id);
      await writeDb(data);
      return true;
    }
  },

  // ----------------------------------------
  // SETTINGS
  // ----------------------------------------
  settings: {
    async find() {
      const data = await readDb();
      return data.settings;
    },
    async update(updates: Partial<Settings>) {
      const data = await readDb();
      if (updates.general) data.settings.general = { ...data.settings.general, ...updates.general };
      if (updates.notifications) data.settings.notifications = { ...data.settings.notifications, ...updates.notifications };
      if (updates.security) data.settings.security = { ...data.settings.security, ...updates.security };
      if (updates.integrations) data.settings.integrations = { ...data.settings.integrations, ...updates.integrations };
      if (updates.system) data.settings.system = { ...data.settings.system, ...updates.system };

      await writeDb(data);
      return data.settings;
    }
  },

  // ----------------------------------------
  // ROLES
  // ----------------------------------------
  roles: {
    async findAll() {
      const data = await readDb();
      return data.roles;
    },
    async update(id: string, updates: Partial<Role>) {
      const data = await readDb();
      const index = data.roles.findIndex(r => r.id === id);
      if (index === -1) return null;

      data.roles[index] = { ...data.roles[index], ...updates };
      await writeDb(data);
      return data.roles[index];
    },
    async create(role: Role) {
      const data = await readDb();
      data.roles.push(role);
      await writeDb(data);
      return role;
    }
  },

  // ----------------------------------------
  // LEGACY: training (for backwards compatibility with analytics route)
  // ----------------------------------------
  training: {
    async findAll() {
      const data = await readDb();
      return data.trainingSubjects;
    }
  },

  // ----------------------------------------
  // EMPLOYEE–SUBJECT ASSIGNMENTS
  // ----------------------------------------
  assignments: {
    async getByEmployee(employeeId: string): Promise<EmployeeSubjectAssignment[]> {
      const data = await readDb();
      return data.employeeSubjectAssignments.filter(a => a.employeeId === employeeId);
    },

    async getBySubject(subjectId: string): Promise<EmployeeSubjectAssignment[]> {
      const data = await readDb();
      return data.employeeSubjectAssignments.filter(a => a.subjectId === subjectId);
    },

    async assign(employeeId: string, subjectId: string): Promise<EmployeeSubjectAssignment> {
      const data = await readDb();
      const now = new Date().toISOString();

      // Find the most-recent existing assignment for this employee+subject pair
      const existing = data.employeeSubjectAssignments.find(
        a => a.employeeId === employeeId && a.subjectId === subjectId
      );

      if (existing) {
        if (existing.status === 'active') {
          // Already active — return as-is, no duplicate
          return existing;
        }

        if (existing.status === 'paused') {
          // Re-activate: update status + assignedAt timestamp
          const idx = data.employeeSubjectAssignments.findIndex(a => a.id === existing.id);
          data.employeeSubjectAssignments[idx] = {
            ...existing,
            status: 'active',
            assignedAt: now,
          };
          await writeDb(data);
          return data.employeeSubjectAssignments[idx];
        }

        // status === 'completed' → retake: fall through to create a fresh record
      }

      // Create a new assignment record
      const newAssignment: EmployeeSubjectAssignment = {
        id: `esa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        employeeId,
        subjectId,
        assignedAt: now,
        status: 'active',
      };
      data.employeeSubjectAssignments.push(newAssignment);
      await writeDb(data);
      return newAssignment;
    },

    async updateStatus(
      id: string,
      status: EmployeeSubjectAssignment['status']
    ): Promise<EmployeeSubjectAssignment | null> {
      const data = await readDb();
      const idx = data.employeeSubjectAssignments.findIndex(a => a.id === id);
      if (idx === -1) return null;

      data.employeeSubjectAssignments[idx] = {
        ...data.employeeSubjectAssignments[idx],
        status,
      };
      await writeDb(data);
      return data.employeeSubjectAssignments[idx];
    },

    async remove(id: string): Promise<boolean> {
      const data = await readDb();
      const before = data.employeeSubjectAssignments.length;
      data.employeeSubjectAssignments = data.employeeSubjectAssignments.filter(a => a.id !== id);
      await writeDb(data);
      return data.employeeSubjectAssignments.length < before;
    },
  },

  // ----------------------------------------
  // ASSESSMENTS
  // ----------------------------------------
  assessments: {
    questions: {
      async findByModule(moduleId: string): Promise<AssessmentQuestion[]> {
        const data = await readDb();
        return data.assessmentQuestions.filter(q => q.moduleId === moduleId);
      },
      async findById(id: string): Promise<AssessmentQuestion | null> {
        const data = await readDb();
        return data.assessmentQuestions.find(q => q.id === id) ?? null;
      },
      async create(question: AssessmentQuestion): Promise<AssessmentQuestion> {
        const data = await readDb();
        data.assessmentQuestions.push(question);
        await writeDb(data);
        return question;
      },
      async update(id: string, updates: Partial<AssessmentQuestion>): Promise<AssessmentQuestion | null> {
        const data = await readDb();
        const idx = data.assessmentQuestions.findIndex(q => q.id === id);
        if (idx === -1) return null;
        data.assessmentQuestions[idx] = { ...data.assessmentQuestions[idx], ...updates };
        await writeDb(data);
        return data.assessmentQuestions[idx];
      },
      async delete(id: string): Promise<boolean> {
        const data = await readDb();
        const before = data.assessmentQuestions.length;
        data.assessmentQuestions = data.assessmentQuestions.filter(q => q.id !== id);
        await writeDb(data);
        return data.assessmentQuestions.length < before;
      },
      async deleteByModule(moduleId: string): Promise<void> {
        const data = await readDb();
        data.assessmentQuestions = data.assessmentQuestions.filter(q => q.moduleId !== moduleId);
        await writeDb(data);
      },
    },

    attempts: {
      async create(attempt: AssessmentAttempt): Promise<AssessmentAttempt> {
        const data = await readDb();
        data.assessmentAttempts.push(attempt);
        await writeDb(data);
        return attempt;
      },
      async findByEmployee(employeeId: string): Promise<AssessmentAttempt[]> {
        const data = await readDb();
        return data.assessmentAttempts.filter(a => a.employeeId === employeeId);
      },
      async findByModule(moduleId: string): Promise<AssessmentAttempt[]> {
        const data = await readDb();
        return data.assessmentAttempts.filter(a => a.moduleId === moduleId);
      },
      async findByEmployeeAndModule(employeeId: string, moduleId: string): Promise<AssessmentAttempt[]> {
        const data = await readDb();
        return data.assessmentAttempts.filter(
          a => a.employeeId === employeeId && a.moduleId === moduleId
        );
      },
    },

    settings: {
      async findByModule(moduleId: string): Promise<ModuleAssessmentSettings | null> {
        const data = await readDb();
        return data.moduleAssessmentSettings.find(s => s.moduleId === moduleId) ?? null;
      },
      async upsert(settings: ModuleAssessmentSettings): Promise<ModuleAssessmentSettings> {
        const data = await readDb();
        const idx = data.moduleAssessmentSettings.findIndex(s => s.moduleId === settings.moduleId);
        if (idx === -1) {
          data.moduleAssessmentSettings.push(settings);
        } else {
          data.moduleAssessmentSettings[idx] = settings;
        }
        await writeDb(data);
        return settings;
      },
    },
  },
};
