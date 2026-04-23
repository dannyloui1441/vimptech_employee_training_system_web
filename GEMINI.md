GEMINI.md — System Rules for Employee Training Platform

You are an expert full-stack developer working on a production-grade training system.

The system consists of:

Next.js backend (API routes)
PostgreSQL database (Supabase currently)
Flutter mobile app
🔷 CORE PRINCIPLES
Maintain full-stack consistency
Any backend change must consider Flutter impact
Any database change must reflect in backend + frontend
Never break working features
Prefer incremental changes over rewrites
Maintain backward compatibility during migrations
Respect system architecture
module = sequence order (stored in DB)
scheduledDay = computed timeline (NEVER stored)
Do NOT mix sequence and time logic
No blind replacements
Do NOT globally rename without context
Understand usage before modifying
Handle all edge cases
null / undefined values
missing fields
invalid inputs (negative gaps, missing IDs)
🔐 AUTHENTICATION RULES (CRITICAL)
Use JWT-based authentication
Tokens must be signed using JWT_SECRET
Token payload must include:
userId
role
Password security
NEVER store plain text passwords
ALWAYS use bcrypt hashing
ALWAYS compare using bcrypt.compare()

Authorization header format

Authorization: Bearer <JWT>
Role-based access control (RBAC)
Admin, Trainer, Employee roles must be enforced via authGuard
Never rely on client-provided role without verification
No fallback authentication (production)
Do NOT use SIMULATED_ROLE in protected routes
If token is invalid or missing → return 401
🗄️ DATABASE RULES
Always verify column names
DB uses snake_case
Code uses camelCase
Never store computed fields
scheduledDay must always be computed
Data integrity
Respect unique constraints
Prevent duplicate inserts
Validate all inputs before DB operations
Password storage
Use password_hash column
Do NOT use password column after migration
🌐 BACKEND RULES (Next.js)
API consistency
Always return structured JSON
Avoid inconsistent response shapes
Error handling
Use proper status codes:
400 → bad request
401 → unauthorized
403 → forbidden
500 → server error
Logging discipline
Log useful debug info during development
Remove unnecessary logs in production
Reuse logic
Use helper functions (e.g., computeScheduledDays)
Avoid duplicating logic across routes
📱 FLUTTER RULES
Match backend exactly
Do NOT assume API fields
Always follow backend response structure
Model safety

Use null-safe parsing:

module: json['module'] ?? 1,
scheduledDay: json['scheduledDay'] ?? 1,
UI clarity

Always display:

Module X • Day Y
Do NOT compute backend logic
scheduledDay must NOT be computed in Flutter
Only display values from API
Avoid crashes
Handle null values safely
Avoid force unwraps (!)
🧠 DEVELOPMENT RULES
Think before acting
What layers are affected?
Backend? DB? Flutter?
Limit scope
Do NOT modify unrelated files
Only change what is required
Migration awareness
During transitions (e.g., auth), maintain compatibility
Do not break existing flows prematurely
Always include verification steps
After implementing changes, define how to test them
Ask when unsure
If requirements are unclear, request clarification before proceeding
🚫 STRICTLY FORBIDDEN
Storing plain text passwords
Mixing module and scheduledDay logic
Blind global replacements
Returning inconsistent API responses
Trusting client-side role without verification
✅ FINAL RULE

Every change must maintain:

Consistency + Security + Stability

If any of these are at risk, STOP and reassess before proceeding.