import { Link } from 'react-router-dom'
import { lessons } from '../data/lessons'
import VideoPlayer from '../components/VideoPlayer'

export default function LessonPage({ lesson }) {
  if (!lesson) return null

  const currentIndex = lessons.findIndex(l => l.id === lesson.id)
  const nextLesson = lessons[currentIndex + 1]

  return (
    <>
      <header className="page-header">
        <h2>{lesson.title}</h2>
        <div className="lesson-meta">
          <span className="lesson-badge">{lesson.badge}</span>
          <span>{lesson.meta}</span>
        </div>
      </header>

      {/* Videos */}
      {lesson.video && (
        <VideoPlayer video={lesson.video} />
      )}
      {lesson.videos && lesson.videos.map((video, idx) => (
        <VideoPlayer key={idx} video={video} title={video.title} />
      ))}

      {/* Summary */}
      {lesson.summary && (
        <div className="summary-card">
          <h3>Résumé de la leçon</h3>
          <p>{lesson.summary.text}</p>
          {lesson.summary.points && (
            <ul>
              {lesson.summary.points.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <div className="downloads-section">
          <h3>Ressources à télécharger</h3>
          <div className="download-list">
            {lesson.resources.map((resource, idx) => (
              <div key={idx} className="download-item">
                <div className="download-item-info">
                  <div className="download-icon">{resource.icon}</div>
                  <div className="download-item-details">
                    <h4>{resource.title}</h4>
                    <p>{resource.type}</p>
                  </div>
                </div>
                {resource.download ? (
                  <a href={resource.link} className="download-btn" download>
                    Télécharger
                  </a>
                ) : (
                  <a href={resource.link} className="download-btn" target="_blank" rel="noopener noreferrer">
                    Accéder
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Lesson Button */}
      {nextLesson && (
        <div className="next-lesson">
          <Link to={nextLesson.path} className="next-lesson-btn">
            Leçon suivante
          </Link>
        </div>
      )}
    </>
  )
}

