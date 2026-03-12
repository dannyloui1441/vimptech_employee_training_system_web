import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const dbPath = resolve(root, 'data/db.json')
const questionsPath = resolve(root, 'assessment_questions_web.json')

const db = JSON.parse(readFileSync(dbPath, 'utf8'))
const questions = JSON.parse(readFileSync(questionsPath, 'utf8'))

// Replace assessmentQuestions entirely
db.assessmentQuestions = questions

// Build moduleAssessmentSettings for all 20 modules
db.moduleAssessmentSettings = []
for (let i = 1; i <= 20; i++) {
    const n = String(i).padStart(2, '0')
    db.moduleAssessmentSettings.push({
        moduleId: `module-day-${n}`,
        passingScore: 75,
        questionsPerAttempt: 10,
    })
}

writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8')

console.log(`✓ assessmentQuestions: ${questions.length} questions seeded`)
console.log(`✓ moduleAssessmentSettings: ${db.moduleAssessmentSettings.length} entries added`)
console.log('Done.')
