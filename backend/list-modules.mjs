import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

await mongoose.connect(process.env.MONGO_URI)

const Course = mongoose.model('Course', new mongoose.Schema({ slug: String, title: String }, { strict: false }))
const Module = mongoose.model('Module', new mongoose.Schema({ courseId: mongoose.Schema.Types.ObjectId, title: String, order: Number }, { strict: false }))

const course = await Course.findOne({ slug: /ecom-starter-30/ })
if (!course) { console.log('Course not found'); process.exit(1) }
console.log('Course:', course.title, '|', course.slug)

const modules = await Module.find({ courseId: course._id }).sort({ order: 1 })
modules.forEach(m => console.log(m.order, '|', m._id, '|', m.title))

await mongoose.disconnect()
