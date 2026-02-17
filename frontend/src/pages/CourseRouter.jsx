import { useParams } from 'react-router-dom'
import FacebookCourse from './courses/FacebookCourse'

export default function CourseRouter() {
  const { slug } = useParams()

  // Cours dynamique: on réutilise le composant existant (il fetch via /api/courses/slug/:slug)
  // et fonctionne pour n'importe quel cours créé en admin.
  return <FacebookCourse key={slug} />
}

