import { Routes, Route } from 'react-router-dom'
import CoursePlayer from '../../components/CoursePlayer'

export default function FacebookCourse() {
  // Le nouveau CoursePlayer remplace complètement l'ancien système avec sidebar
  return (
    <Routes>
      <Route path="lesson/:lessonId" element={<CoursePlayer />} />
      <Route path="*" element={<CoursePlayer />} />
    </Routes>
  )
}

