import { Routes, Route, useParams } from 'react-router-dom'
import CoursePlayer from '../components/CoursePlayer'

export default function CourseRouter() {
  const { slug } = useParams()
  
  // Ajouter un module Shopify spécial pour le cours ecom-starter-20
  if (slug === 'ecom-starter-20') {
    // Le CoursePlayer gérera l'ajout dynamique du module Shopify
    return <CoursePlayerWithShopify />
  }
  
  // Le CoursePlayer reçoit le slug et lessonId depuis l'URL
  return (
    <Routes>
      <Route path="lesson/:lessonId" element={<CoursePlayer />} />
      <Route path="*" element={<CoursePlayer />} />
    </Routes>
  )
}

// Composant spécial pour ecom-starter-20 avec module Shopify
function CoursePlayerWithShopify() {
  return (
    <Routes>
      <Route path="lesson/:lessonId" element={<CoursePlayer addShopifyModule={true} />} />
      <Route path="*" element={<CoursePlayer addShopifyModule={true} />} />
    </Routes>
  )
}

