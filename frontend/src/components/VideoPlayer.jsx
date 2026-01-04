export default function VideoPlayer({ video, title }) {
  if (!video) return null

  const { type, url } = video

  return (
    <div className="video-container">
      {title && (
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      <div className="video-wrapper">
        <iframe
          src={url}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={title || 'Video player'}
        ></iframe>
      </div>
    </div>
  )
}

