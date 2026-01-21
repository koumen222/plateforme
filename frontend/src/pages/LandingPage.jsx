import { Link } from 'react-router-dom'

const PrimaryCta = ({ className = '' }) => (
  <Link
    to="/login"
    className={`btn-primary bg-white text-slate-900 hover:bg-slate-100 text-base md:text-lg px-6 md:px-8 py-3 md:py-4 ${className}`}
  >
    Réserver mon accompagnement maintenant
  </Link>
)

const SecondaryCta = ({ className = '' }) => (
  <a
    href="https://wa.me/237600000000"
    className={`btn-secondary border border-white/30 text-white hover:bg-white/10 px-6 md:px-8 py-3 md:py-4 ${className}`}
  >
    Parler sur WhatsApp
  </a>
)

const ImageSlot = ({ label, className = '' }) => (
  <div
    className={`rounded-2xl border border-white/15 bg-white/5 text-white/90 p-6 text-center text-sm md:text-base ${className}`}
  >
    <div className="text-4xl mb-3">📸</div>
    <div className="font-semibold mb-1">Zone image / vidéo</div>
    <div className="text-white/70">{label}</div>
  </div>
)

const LightImageSlot = ({ label, className = '' }) => (
  <div
    className={`rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 p-6 text-center text-sm md:text-base ${className}`}
  >
    <div className="text-4xl mb-3">📸</div>
    <div className="font-semibold mb-1">Zone image / vidéo</div>
    <div className="text-slate-500">{label}</div>
  </div>
)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-slate-950 to-slate-950"></div>
        <div className="container-startup relative z-10 py-16 md:py-20 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs md:text-sm font-semibold text-white/80 mb-6">
                🔥 Accompagnement Facebook Ads Premium
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5">
                Obtenez des ventes régulières grâce à Facebook Ads,{' '}
                <span className="text-blue-300">même si votre marché africain est exigeant</span>
              </h1>
              <p className="text-base md:text-xl text-white/80 mb-6">
                Une stratégie claire, un suivi humain et des campagnes rentables.
                Vous gardez le contrôle, nous faisons la performance ensemble.
              </p>
              <ul className="space-y-3 text-white/90 mb-8">
                <li className="flex items-start gap-3">
                  <span>✅</span>
                  <span>Un plan d’attaque personnalisé pour votre business local</span>
                </li>
                <li className="flex items-start gap-3">
                  <span>🎯</span>
                  <span>Des pubs qui attirent des clients, pas juste des clics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span>🔥</span>
                  <span>Un accompagnement réel, pas des vidéos oubliées</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-4">
                <PrimaryCta />
                <SecondaryCta />
              </div>
            </div>
            <div className="grid gap-6">
              <ImageSlot label="Image / vidéo du coach en action" />
              <ImageSlot label="Capture de résultats publicitaires (ROAS, ventes)" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Problème / Frustration */}
      <section className="bg-white text-slate-900">
        <div className="container-startup py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Vous dépensez en pub, mais les ventes ne suivent pas ?
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                Beaucoup d’entrepreneurs au Cameroun, en Côte d’Ivoire, au Sénégal, au Gabon et en RDC
                vivent la même frustration : des visites sans achats, du budget qui part en fumée,
                et aucune stratégie claire.
              </p>
              <div className="space-y-3 text-slate-700">
                <div className="flex items-start gap-3">
                  <span>❌</span>
                  <span>Des clics qui ne convertissent pas</span>
                </div>
                <div className="flex items-start gap-3">
                  <span>❌</span>
                  <span>Des campagnes lancées “au hasard”</span>
                </div>
                <div className="flex items-start gap-3">
                  <span>❌</span>
                  <span>Un manque total de suivi et d’optimisation</span>
                </div>
              </div>
            </div>
            <LightImageSlot label="Illustration frustration / stats rouges / pub qui ne convertit pas" />
          </div>
        </div>
      </section>

      {/* 3. Solution */}
      <section className="bg-slate-900 text-white">
        <div className="container-startup py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                L’accompagnement Facebook Ads qui remet votre business sur les rails
              </h2>
              <p className="text-lg text-white/80 mb-6">
                On ne vend pas du rêve. On construit un système de publicité rentable, adapté aux réalités
                locales, avec des décisions basées sur vos chiffres et vos objectifs.
              </p>
              <p className="text-base text-white/70">
                Vous n’êtes pas seul : vous avez un coach qui suit vos campagnes, corrige et optimise
                avec vous, semaine après semaine.
              </p>
            </div>
            <ImageSlot label="Mockup du programme / visuel coaching / call Zoom" />
          </div>
        </div>
      </section>

      {/* 4. À qui c'est destiné */}
      <section className="bg-white text-slate-900">
        <div className="container-startup py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ce programme est pour vous si…
              </h2>
              <div className="grid gap-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="font-semibold mb-2">✅ Vous êtes prêt à investir sérieusement</div>
                  <div className="text-slate-600">
                    Vous avez un produit/service validé et souhaitez passer à un niveau supérieur.
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="font-semibold mb-2">✅ Vous cherchez un suivi humain</div>
                  <div className="text-slate-600">
                    Vous voulez un coach présent, pas un simple cours.
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="font-semibold mb-2">❌ Ce n’est pas pour vous si…</div>
                  <div className="text-slate-600">
                    Vous cherchez une solution magique sans effort ni budget.
                  </div>
                </div>
              </div>
            </div>
            <LightImageSlot label="Entrepreneurs africains, laptop, téléphone, business en ligne" />
          </div>
        </div>
      </section>

      {/* 5. Bénéfices */}
      <section className="bg-slate-950 text-white">
        <div className="container-startup py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ce que vous allez obtenir concrètement
              </h2>
              <div className="space-y-4 text-white/85">
                <div className="flex items-start gap-3">
                  <span>✅</span>
                  <span>Une stratégie claire adaptée à votre pays et à votre cible</span>
                </div>
                <div className="flex items-start gap-3">
                  <span>✅</span>
                  <span>Des publicités qui génèrent des messages, des appels et des ventes</span>
                </div>
                <div className="flex items-start gap-3">
                  <span>✅</span>
                  <span>Des optimisations pour améliorer la rentabilité, pas le “buzz”</span>
                </div>
                <div className="flex items-start gap-3">
                  <span>✅</span>
                  <span>Zéro blabla inutile : que des actions qui payent</span>
                </div>
              </div>
            </div>
            <ImageSlot label="Avant / après, graphiques positifs" />
          </div>
        </div>
      </section>

      {/* 6. Contenu détaillé */}
      <section className="bg-white text-slate-900">
        <div className="container-startup py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            Contenu détaillé de l’accompagnement
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { title: 'Analyse complète du business', text: 'Audit de votre offre, cible, marge et pipeline de vente.' },
              { title: 'Stratégie Facebook Ads claire', text: 'Objectifs, budget, angles publicitaires et messages.' },
              { title: 'Création des pubs', text: 'Scripts, visuels, hooks et copies adaptés au marché local.' },
              { title: 'Optimisation & scaling', text: 'Lecture des métriques, décisions de pause ou d’augmentation.' },
              { title: 'Suivi personnalisé', text: 'Coaching hebdo + retours rapides sur vos performances.' }
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 p-6 bg-slate-50">
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <LightImageSlot label="Process étape par étape / schéma" />
          </div>
        </div>
      </section>

      {/* 7. Preuve sociale */}
      <section className="bg-slate-900 text-white">
        <div className="container-startup py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Des résultats concrets, pas des promesses
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                name: 'Aïcha – Abidjan',
                text: '“Avant, je dépensais 150k sans retour. Après 2 semaines, j’ai eu mes 1res ventes stables.”'
              },
              {
                name: 'Junior – Douala',
                text: '“Le coach répond vite. On a réglé mes pubs et mes messages ont doublé.”'
              },
              {
                name: 'Fatou – Dakar',
                text: '“Ce n’est pas du blabla. On voit les chiffres évoluer.”'
              }
            ].map((item) => (
              <div key={item.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="font-semibold mb-2">{item.name}</div>
                <div className="text-white/80">{item.text}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2 mt-8">
            <ImageSlot label="Screenshots WhatsApp / avis clients" />
            <ImageSlot label="Avant / après ventes + photos clients africains" />
          </div>
        </div>
      </section>

      {/* 8. Autorité */}
      <section className="bg-white text-slate-900">
        <div className="container-startup py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Une expertise terrain, pas juste théorique
              </h2>
              <div className="space-y-3 text-slate-700">
                <div className="flex items-start gap-3">
                  <span>✅</span>
                  <span>+6 ans d’expérience sur Facebook Ads en Afrique francophone</span>
                </div>
                <div className="flex items-start gap-3">
                  <span>✅</span>
                  <span>Marchés maîtrisés : Cameroun, Côte d’Ivoire, Sénégal, Gabon, RDC</span>
                </div>
                <div className="flex items-start gap-3">
                  <span>✅</span>
                  <span>Des campagnes rentables pour services, e-commerce et infoproduits</span>
                </div>
              </div>
            </div>
            <LightImageSlot label="Toi en action / laptop / call clients" />
          </div>
        </div>
      </section>

      {/* 9. Offre & Prix */}
      <section className="bg-slate-950 text-white">
        <div className="container-startup py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Offre premium – places limitées
              </h2>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
                <div className="font-semibold mb-3">Ce qui est inclus</div>
                <ul className="space-y-2 text-white/80">
                  <li>✅ Audit complet + plan d’action</li>
                  <li>✅ Stratégie publicitaire personnalisée</li>
                  <li>✅ Création / optimisation des pubs</li>
                  <li>✅ Suivi hebdomadaire + support WhatsApp</li>
                </ul>
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-3">Prix : 250 000 FCFA</div>
              <div className="text-white/70 mb-6">
                Valeur réelle : 450 000 FCFA. Ouverture pour 10 entrepreneurs par mois.
              </div>
              <div className="flex flex-wrap gap-4">
                <PrimaryCta />
                <SecondaryCta />
              </div>
            </div>
            <ImageSlot label="Badge offre limitée / prix" />
          </div>
        </div>
      </section>

      {/* 10. FAQ */}
      <section className="bg-white text-slate-900">
        <div className="container-startup py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">FAQ</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              {
                q: 'Est-ce pour débutant ?',
                a: 'Oui, si vous êtes motivé et prêt à appliquer. On part de votre niveau.'
              },
              {
                q: 'Et si je n’ai pas un gros budget ?',
                a: 'On adapte la stratégie. L’important est d’avoir un budget réaliste pour tester.'
              },
              {
                q: 'Est-ce adapté à l’Afrique ?',
                a: 'Oui, l’accompagnement est construit pour les réalités locales et les habitudes d’achat.'
              },
              {
                q: 'Combien de temps avant les résultats ?',
                a: 'En général, 2 à 4 semaines pour stabiliser les premières ventes.'
              }
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 p-6 bg-slate-50">
                <div className="font-semibold mb-2">{item.q}</div>
                <div className="text-slate-600">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. CTA Final */}
      <section className="bg-blue-900 text-white">
        <div className="container-startup py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Prêt à arrêter de gaspiller et commencer à vendre ?
              </h2>
              <p className="text-white/80 mb-6">
                Les places sont limitées pour garantir un suivi de qualité. Réservez maintenant.
              </p>
              <div className="flex flex-wrap gap-4">
                <PrimaryCta />
                <SecondaryCta />
              </div>
            </div>
            <ImageSlot label="Visuel motivation / succès" />
          </div>
        </div>
      </section>

      {/* 12. Footer */}
      <footer className="bg-slate-950 text-white/80 border-t border-white/10">
        <div className="container-startup py-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="font-semibold text-white mb-2">Contact WhatsApp</div>
              <div className="text-white/70">+237 600 000 000</div>
              <div className="text-white/70">Douala / Yaoundé</div>
            </div>
            <div>
              <div className="font-semibold text-white mb-2">Mentions rassurantes</div>
              <div className="text-white/70">Accompagnement individuel • Paiement sécurisé</div>
              <div className="text-white/70">© 2026 Andromeda Ads. Tous droits réservés.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
