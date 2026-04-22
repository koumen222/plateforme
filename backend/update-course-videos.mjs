import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const MONGO_URI = process.env.MONGO_URI
const COURSE_SLUG = 'ecom-starter-30-la-formation-complte-en-e-commerce-en-afrique-'
const VIDEO_URL = 'https://tempfile.aiquickdraw.com/v/5281b73cd3ea2c6e6c55381647547c2a_1776878892.mp4'

await mongoose.connect(MONGO_URI)
console.log('✅ Connecté à MongoDB')

const Course = mongoose.model('Course', new mongoose.Schema({ slug: String }, { strict: false }))
const Module = mongoose.model('Module', new mongoose.Schema({ courseId: mongoose.Schema.Types.ObjectId }, { strict: false }))
const Lesson = mongoose.model('Lesson', new mongoose.Schema({ moduleId: mongoose.Schema.Types.ObjectId, videoId: String, videoType: String }, { strict: false }))

const course = await Course.findOne({ slug: COURSE_SLUG })
if (!course) { console.error('❌ Cours non trouvé:', COURSE_SLUG); process.exit(1) }
console.log('✅ Cours trouvé:', course._id)

const modules = await Module.find({ courseId: course._id })
console.log(`📦 ${modules.length} modules trouvés`)

const moduleIds = modules.map(m => m._id)
const result = await Lesson.updateMany(
  { moduleId: { $in: moduleIds } },
  { $set: { videoId: VIDEO_URL, videoType: 'mp4' } }
)

console.log(`✅ ${result.modifiedCount} leçons mises à jour avec la vidéo MP4`)
await mongoose.disconnect()
