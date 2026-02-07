import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      title: 'Gestion Produits',
      desc: 'Suivez vos produits, statuts (test, stable, winner), stock et marges en temps réel.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Rapports Quotidiens',
      desc: 'Rapports de vente journaliers avec commandes reçues, livrées, dépenses pub et plus.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Suivi Financier',
      desc: 'Revenus, dépenses, bénéfice net, ROAS et taux de livraison calculés automatiquement.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      title: 'Gestion de Stock',
      desc: 'Commandes fournisseurs, suivi des arrivages, alertes de stock bas automatiques.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: 'Multi-Utilisateurs',
      desc: 'Invitez vos closeuses et comptables. Chaque rôle a son propre dashboard adapté.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      title: 'Espaces de Travail',
      desc: 'Chaque business a son espace isolé. Données séparées, équipe dédiée.'
    }
  ];

  const roles = [
    {
      name: 'Admin',
      color: 'from-purple-500 to-purple-700',
      items: ['Dashboard complet', 'Gestion produits & stock', 'Rapports & finances', 'Gestion équipe']
    },
    {
      name: 'Closeuse',
      color: 'from-blue-500 to-blue-700',
      items: ['Rapports de vente', 'Suivi des commandes', 'Vue produits', 'Dashboard simplifié']
    },
    {
      name: 'Comptable',
      color: 'from-green-500 to-green-700',
      items: ['Transactions', 'Résumé financier', 'Rapports détaillés', 'Export des données']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/img/ecom-logo.png" alt="Ecom Cockpit" className="h-12" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/ecom/login')}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
            >
              Connexion
            </button>
            <button
              onClick={() => navigate('/ecom/register')}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Commencer
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <img src="/img/ecom-logo.png" alt="Ecom Cockpit" className="h-24 mx-auto mb-4" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
              Plateforme de gestion e-commerce
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Gérez votre business
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              e-commerce en équipe
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Produits, rapports, finances, stock — tout centralisé dans un cockpit pensé pour les équipes e-commerce. Admin, closeuses et comptables, chacun son dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/ecom/register')}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-base transition shadow-lg shadow-blue-600/25"
            >
              Créer mon espace gratuitement
            </button>
            <button
              onClick={() => navigate('/ecom/login')}
              className="w-full sm:w-auto px-8 py-3.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium text-base transition border border-gray-700"
            >
              J'ai déjà un compte
            </button>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="pb-16 sm:pb-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-3 text-xs text-gray-500">ecom-cockpit.app/dashboard</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 uppercase font-medium">Produits actifs</p>
                <p className="text-2xl font-bold text-white mt-1">12</p>
                <p className="text-[10px] text-green-400 mt-1">+3 ce mois</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 uppercase font-medium">Bénéfice net</p>
                <p className="text-2xl font-bold text-green-400 mt-1">847K</p>
                <p className="text-[10px] text-green-400 mt-1">FCFA ce mois</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 uppercase font-medium">Taux livraison</p>
                <p className="text-2xl font-bold text-blue-400 mt-1">67%</p>
                <p className="text-[10px] text-gray-400 mt-1">+5% vs mois dernier</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 uppercase font-medium">ROAS</p>
                <p className="text-2xl font-bold text-purple-400 mt-1">3.2x</p>
                <p className="text-[10px] text-gray-400 mt-1">Retour sur pub</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {['Gummies Nintime', 'Sérum Visage', 'Ceinture Minceur'].map((name, i) => (
                <div key={i} className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    i === 0 ? 'bg-green-500/20 text-green-400' : i === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-200">{name}</p>
                    <p className={`text-[10px] ${i === 0 ? 'text-green-400' : i === 1 ? 'text-blue-400' : 'text-yellow-400'}`}>
                      {i === 0 ? 'Winner' : i === 1 ? 'Stable' : 'Test'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-16 sm:pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tout ce qu'il faut pour piloter</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Un outil complet pour gérer votre activité e-commerce du produit à la comptabilité.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition group">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500/20 transition">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="pb-16 sm:pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Un dashboard par rôle</h2>
            <p className="text-gray-400 max-w-xl mx-auto">Chaque membre de l'équipe voit exactement ce dont il a besoin. Pas plus, pas moins.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {roles.map((r, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className={`bg-gradient-to-r ${r.color} px-5 py-4`}>
                  <h3 className="font-bold text-lg">{r.name}</h3>
                </div>
                <ul className="p-5 space-y-3">
                  {r.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-16 sm:pb-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">En 3 étapes</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Créez votre espace', desc: 'Inscrivez-vous et créez votre espace de travail en 30 secondes.' },
              { step: '2', title: 'Invitez votre équipe', desc: 'Partagez le code d\'invitation. Closeuses et comptables rejoignent en un clic.' },
              { step: '3', title: 'Pilotez votre business', desc: 'Ajoutez vos produits, remplissez vos rapports, suivez vos finances.' }
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-base mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 sm:pb-28 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Prêt à organiser votre business ?</h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">Créez votre espace gratuitement et commencez à piloter votre e-commerce comme un pro.</p>
            <button
              onClick={() => navigate('/ecom/register')}
              className="px-8 py-3.5 bg-white text-blue-700 rounded-xl font-semibold text-base hover:bg-blue-50 transition shadow-lg"
            >
              Commencer maintenant
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/img/ecom-logo.png" alt="Ecom Cockpit" className="h-10" />
          </div>
          <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Ecom Cockpit. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
