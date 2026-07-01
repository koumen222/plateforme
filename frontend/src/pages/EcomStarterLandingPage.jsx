import { useNavigate } from 'react-router-dom'
import './EcomStarterLandingPage.css'

export default function EcomStarterLandingPage() {
  const navigate = useNavigate()

  return (
    <div className="es-root">
      <main className="es-main">

        <h1 className="es-title">
          Ecom Starter 3.0 — La méthode étape par étape pour générer tes premières ventes en ligne depuis l'Afrique.
        </h1>

        <div className="es-video">
          <iframe
            src="https://www.youtube.com/embed/r2sgLD8TatE?rel=0"
            title="Ecom Starter 3.0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <button className="es-btn" onClick={() => navigate('/paiement-formation')}>
          Je rejoins +300 e-commerçants rentables →
        </button>

        <p className="es-note">À partir de 10 000 FCFA/mois</p>
      </main>
    </div>
  )
}
