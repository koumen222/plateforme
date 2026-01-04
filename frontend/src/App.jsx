import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LessonPage from './pages/LessonPage'
import CoachingPage from './pages/CoachingPage'
import { lessons } from './data/lessons'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LessonPage lesson={lessons[0]} />} />
          <Route path="/jour-2" element={<LessonPage lesson={lessons[1]} />} />
          <Route path="/jour-3" element={<LessonPage lesson={lessons[2]} />} />
          <Route path="/jour-4" element={<LessonPage lesson={lessons[3]} />} />
          <Route path="/jour-5" element={<LessonPage lesson={lessons[4]} />} />
          <Route path="/jour-6" element={<LessonPage lesson={lessons[5]} />} />
          <Route path="/jour-7" element={<LessonPage lesson={lessons[6]} />} />
          <Route path="/jour-8" element={<CoachingPage lesson={lessons[7]} />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

