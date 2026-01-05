import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import '../styles/login.css'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState('+237') // Cameroun par défaut
  const { login, register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Vérifier si on doit afficher le mode inscription depuis l'état
  useEffect(() => {
    if (location.state?.register) {
      setIsLogin(false)
    }
  }, [location.state])

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let result
      if (isLogin) {
        // Connexion : utiliser emailOrPhone
        if (!emailOrPhone || !password) {
          setError('Email/téléphone et mot de passe requis')
          setLoading(false)
          return
        }
        result = await login(emailOrPhone, password)
      } else {
        // Inscription : utiliser name, email, phoneNumber, password
        if (!name || !email || !phoneNumber || !password) {
          setError('Tous les champs sont requis')
          setLoading(false)
          return
        }
        // Ajouter le préfixe du pays sélectionné si pas déjà présent
        const formattedPhone = phoneNumber.trim().startsWith('+') 
          ? phoneNumber.trim() 
          : `${selectedCountry}${phoneNumber.trim()}`
        result = await register(name, email, formattedPhone, password)
      }

      if (result.success) {
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        setError(result.error || 'Une erreur est survenue')
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 {isLogin ? 'Connexion' : 'Inscription'}</h1>
          <p>
            {isLogin 
              ? 'Connectez-vous pour accéder aux vidéos de formation'
              : 'Créez votre compte pour commencer votre formation'}
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Nom complet</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Votre nom complet"
                disabled={loading}
                minLength={2}
              />
            </div>
          )}

          {isLogin ? (
            <div className="form-group">
              <label htmlFor="emailOrPhone">Email ou numéro de téléphone</label>
              <input
                type="text"
                id="emailOrPhone"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                placeholder="votre@email.com ou +237 6 76 77 83 77"
                disabled={loading}
              />
              <small className="form-help">
                Vous pouvez vous connecter avec votre email ou votre numéro de téléphone
              </small>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Numéro de téléphone</label>
                <div className="phone-input-wrapper">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="phone-country-select"
                    disabled={loading}
                  >
                    <option value="+237">🇨🇲 +237 (CM)</option>
                    <option value="+33">🇫🇷 +33 (FR)</option>
                    <option value="+1">🇺🇸 +1 (US/CA)</option>
                    <option value="+44">🇬🇧 +44 (UK)</option>
                    <option value="+32">🇧🇪 +32 (BE)</option>
                    <option value="+41">🇨🇭 +41 (CH)</option>
                    <option value="+212">🇲🇦 +212 (MA)</option>
                    <option value="+225">🇨🇮 +225 (CI)</option>
                    <option value="+221">🇸🇳 +221 (SN)</option>
                    <option value="+229">🇧🇯 +229 (BJ)</option>
                    <option value="+226">🇧🇫 +226 (BF)</option>
                    <option value="+228">🇹🇬 +228 (TG)</option>
                    <option value="+240">🇬🇶 +240 (GQ)</option>
                    <option value="+242">🇨🇬 +242 (CG)</option>
                    <option value="+243">🇨🇩 +243 (CD)</option>
                    <option value="+234">🇳🇬 +234 (NG)</option>
                    <option value="+233">🇬🇭 +233 (GH)</option>
                    <option value="+254">🇰🇪 +254 (KE)</option>
                    <option value="+255">🇹🇿 +255 (TZ)</option>
                    <option value="+256">🇺🇬 +256 (UG)</option>
                    <option value="+250">🇷🇼 +250 (RW)</option>
                    <option value="+27">🇿🇦 +27 (ZA)</option>
                    <option value="+213">🇩🇿 +213 (DZ)</option>
                    <option value="+216">🇹🇳 +216 (TN)</option>
                    <option value="+20">🇪🇬 +20 (EG)</option>
                    <option value="+234">🇳🇬 +234 (NG)</option>
                    <option value="+251">🇪🇹 +251 (ET)</option>
                    <option value="+260">🇿🇲 +260 (ZM)</option>
                    <option value="+261">🇲🇬 +261 (MG)</option>
                    <option value="+264">🇳🇦 +264 (NA)</option>
                    <option value="+265">🇲🇼 +265 (MW)</option>
                    <option value="+267">🇧🇼 +267 (BW)</option>
                    <option value="+268">🇸🇿 +268 (SZ)</option>
                    <option value="+269">🇰🇲 +269 (KM)</option>
                    <option value="+236">🇨🇫 +236 (CF)</option>
                    <option value="+235">🇹🇩 +235 (TD)</option>
                    <option value="+227">🇳🇪 +227 (NE)</option>
                    <option value="+223">🇲🇱 +223 (ML)</option>
                    <option value="+224">🇬🇳 +224 (GN)</option>
                    <option value="+220">🇬🇲 +220 (GM)</option>
                    <option value="+222">🇲🇷 +222 (MR)</option>
                    <option value="+231">🇱🇷 +231 (LR)</option>
                    <option value="+232">🇸🇱 +232 (SL)</option>
                    <option value="+238">🇨🇻 +238 (CV)</option>
                    <option value="+239">🇸🇹 +239 (ST)</option>
                    <option value="+240">🇬🇶 +240 (GQ)</option>
                    <option value="+241">🇬🇦 +241 (GA)</option>
                    <option value="+242">🇨🇬 +242 (CG)</option>
                    <option value="+243">🇨🇩 +243 (CD)</option>
                    <option value="+244">🇦🇴 +244 (AO)</option>
                    <option value="+245">🇬🇼 +245 (GW)</option>
                    <option value="+248">🇸🇨 +248 (SC)</option>
                    <option value="+249">🇸🇩 +249 (SD)</option>
                    <option value="+250">🇷🇼 +250 (RW)</option>
                    <option value="+251">🇪🇹 +251 (ET)</option>
                    <option value="+252">🇸🇴 +252 (SO)</option>
                    <option value="+253">🇩🇯 +253 (DJ)</option>
                    <option value="+254">🇰🇪 +254 (KE)</option>
                    <option value="+255">🇹🇿 +255 (TZ)</option>
                    <option value="+256">🇺🇬 +256 (UG)</option>
                    <option value="+257">🇧🇮 +257 (BI)</option>
                    <option value="+258">🇲🇿 +258 (MZ)</option>
                    <option value="+260">🇿🇲 +260 (ZM)</option>
                    <option value="+261">🇲🇬 +261 (MG)</option>
                    <option value="+262">🇷🇪 +262 (RE)</option>
                    <option value="+263">🇿🇼 +263 (ZW)</option>
                    <option value="+264">🇳🇦 +264 (NA)</option>
                    <option value="+265">🇲🇼 +265 (MW)</option>
                    <option value="+266">🇱🇸 +266 (LS)</option>
                    <option value="+267">🇧🇼 +267 (BW)</option>
                    <option value="+268">🇸🇿 +268 (SZ)</option>
                    <option value="+269">🇰🇲 +269 (KM)</option>
                    <option value="+211">🇸🇸 +211 (SS)</option>
                    <option value="+218">🇱🇾 +218 (LY)</option>
                    <option value="+230">🇲🇺 +230 (MU)</option>
                    <option value="+231">🇱🇷 +231 (LR)</option>
                    <option value="+232">🇸🇱 +232 (SL)</option>
                    <option value="+233">🇬🇭 +233 (GH)</option>
                    <option value="+234">🇳🇬 +234 (NG)</option>
                    <option value="+235">🇹🇩 +235 (TD)</option>
                    <option value="+236">🇨🇫 +236 (CF)</option>
                    <option value="+238">🇨🇻 +238 (CV)</option>
                    <option value="+239">🇸🇹 +239 (ST)</option>
                    <option value="+241">🇬🇦 +241 (GA)</option>
                    <option value="+242">🇨🇬 +242 (CG)</option>
                    <option value="+243">🇨🇩 +243 (CD)</option>
                    <option value="+244">🇦🇴 +244 (AO)</option>
                    <option value="+245">🇬🇼 +245 (GW)</option>
                    <option value="+248">🇸🇨 +248 (SC)</option>
                    <option value="+249">🇸🇩 +249 (SD)</option>
                    <option value="+30">🇬🇷 +30 (GR)</option>
                    <option value="+31">🇳🇱 +31 (NL)</option>
                    <option value="+32">🇧🇪 +32 (BE)</option>
                    <option value="+34">🇪🇸 +34 (ES)</option>
                    <option value="+39">🇮🇹 +39 (IT)</option>
                    <option value="+40">🇷🇴 +40 (RO)</option>
                    <option value="+41">🇨🇭 +41 (CH)</option>
                    <option value="+43">🇦🇹 +43 (AT)</option>
                    <option value="+44">🇬🇧 +44 (UK)</option>
                    <option value="+45">🇩🇰 +45 (DK)</option>
                    <option value="+46">🇸🇪 +46 (SE)</option>
                    <option value="+47">🇳🇴 +47 (NO)</option>
                    <option value="+48">🇵🇱 +48 (PL)</option>
                    <option value="+49">🇩🇪 +49 (DE)</option>
                    <option value="+51">🇵🇪 +51 (PE)</option>
                    <option value="+52">🇲🇽 +52 (MX)</option>
                    <option value="+55">🇧🇷 +55 (BR)</option>
                    <option value="+60">🇲🇾 +60 (MY)</option>
                    <option value="+61">🇦🇺 +61 (AU)</option>
                    <option value="+62">🇮🇩 +62 (ID)</option>
                    <option value="+63">🇵🇭 +63 (PH)</option>
                    <option value="+64">🇳🇿 +64 (NZ)</option>
                    <option value="+65">🇸🇬 +65 (SG)</option>
                    <option value="+66">🇹🇭 +66 (TH)</option>
                    <option value="+81">🇯🇵 +81 (JP)</option>
                    <option value="+82">🇰🇷 +82 (KR)</option>
                    <option value="+84">🇻🇳 +84 (VN)</option>
                    <option value="+86">🇨🇳 +86 (CN)</option>
                    <option value="+90">🇹🇷 +90 (TR)</option>
                    <option value="+91">🇮🇳 +91 (IN)</option>
                    <option value="+92">🇵🇰 +92 (PK)</option>
                    <option value="+93">🇦🇫 +93 (AF)</option>
                    <option value="+94">🇱🇰 +94 (LK)</option>
                    <option value="+95">🇲🇲 +95 (MM)</option>
                    <option value="+98">🇮🇷 +98 (IR)</option>
                    <option value="+212">🇲🇦 +212 (MA)</option>
                    <option value="+213">🇩🇿 +213 (DZ)</option>
                    <option value="+216">🇹🇳 +216 (TN)</option>
                    <option value="+218">🇱🇾 +218 (LY)</option>
                    <option value="+220">🇬🇲 +220 (GM)</option>
                    <option value="+221">🇸🇳 +221 (SN)</option>
                    <option value="+222">🇲🇷 +222 (MR)</option>
                    <option value="+223">🇲🇱 +223 (ML)</option>
                    <option value="+224">🇬🇳 +224 (GN)</option>
                    <option value="+225">🇨🇮 +225 (CI)</option>
                    <option value="+226">🇧🇫 +226 (BF)</option>
                    <option value="+227">🇳🇪 +227 (NE)</option>
                    <option value="+228">🇹🇬 +228 (TG)</option>
                    <option value="+229">🇧🇯 +229 (BJ)</option>
                    <option value="+230">🇲🇺 +230 (MU)</option>
                    <option value="+231">🇱🇷 +231 (LR)</option>
                    <option value="+232">🇸🇱 +232 (SL)</option>
                    <option value="+233">🇬🇭 +233 (GH)</option>
                    <option value="+234">🇳🇬 +234 (NG)</option>
                    <option value="+235">🇹🇩 +235 (TD)</option>
                    <option value="+236">🇨🇫 +236 (CF)</option>
                    <option value="+238">🇨🇻 +238 (CV)</option>
                    <option value="+239">🇸🇹 +239 (ST)</option>
                    <option value="+240">🇬🇶 +240 (GQ)</option>
                    <option value="+241">🇬🇦 +241 (GA)</option>
                    <option value="+242">🇨🇬 +242 (CG)</option>
                    <option value="+243">🇨🇩 +243 (CD)</option>
                    <option value="+244">🇦🇴 +244 (AO)</option>
                    <option value="+245">🇬🇼 +245 (GW)</option>
                    <option value="+248">🇸🇨 +248 (SC)</option>
                    <option value="+249">🇸🇩 +249 (SD)</option>
                    <option value="+250">🇷🇼 +250 (RW)</option>
                    <option value="+251">🇪🇹 +251 (ET)</option>
                    <option value="+252">🇸🇴 +252 (SO)</option>
                    <option value="+253">🇩🇯 +253 (DJ)</option>
                    <option value="+254">🇰🇪 +254 (KE)</option>
                    <option value="+255">🇹🇿 +255 (TZ)</option>
                    <option value="+256">🇺🇬 +256 (UG)</option>
                    <option value="+257">🇧🇮 +257 (BI)</option>
                    <option value="+258">🇲🇿 +258 (MZ)</option>
                    <option value="+260">🇿🇲 +260 (ZM)</option>
                    <option value="+261">🇲🇬 +261 (MG)</option>
                    <option value="+262">🇷🇪 +262 (RE)</option>
                    <option value="+263">🇿🇼 +263 (ZW)</option>
                    <option value="+264">🇳🇦 +264 (NA)</option>
                    <option value="+265">🇲🇼 +265 (MW)</option>
                    <option value="+266">🇱🇸 +266 (LS)</option>
                    <option value="+267">🇧🇼 +267 (BW)</option>
                    <option value="+268">🇸🇿 +268 (SZ)</option>
                    <option value="+269">🇰🇲 +269 (KM)</option>
                    <option value="+27">🇿🇦 +27 (ZA)</option>
                    <option value="+20">🇪🇬 +20 (EG)</option>
                    <option value="+211">🇸🇸 +211 (SS)</option>
                    <option value="+351">🇵🇹 +351 (PT)</option>
                    <option value="+352">🇱🇺 +352 (LU)</option>
                    <option value="+353">🇮🇪 +353 (IE)</option>
                    <option value="+354">🇮🇸 +354 (IS)</option>
                    <option value="+355">🇦🇱 +355 (AL)</option>
                    <option value="+356">🇲🇹 +356 (MT)</option>
                    <option value="+357">🇨🇾 +357 (CY)</option>
                    <option value="+358">🇫🇮 +358 (FI)</option>
                    <option value="+359">🇧🇬 +359 (BG)</option>
                    <option value="+370">🇱🇹 +370 (LT)</option>
                    <option value="+371">🇱🇻 +371 (LV)</option>
                    <option value="+372">🇪🇪 +372 (EE)</option>
                    <option value="+373">🇲🇩 +373 (MD)</option>
                    <option value="+374">🇦🇲 +374 (AM)</option>
                    <option value="+375">🇧🇾 +375 (BY)</option>
                    <option value="+376">🇦🇩 +376 (AD)</option>
                    <option value="+377">🇲🇨 +377 (MC)</option>
                    <option value="+378">🇸🇲 +378 (SM)</option>
                    <option value="+380">🇺🇦 +380 (UA)</option>
                    <option value="+381">🇷🇸 +381 (RS)</option>
                    <option value="+382">🇲🇪 +382 (ME)</option>
                    <option value="+383">🇽🇰 +383 (XK)</option>
                    <option value="+385">🇭🇷 +385 (HR)</option>
                    <option value="+386">🇸🇮 +386 (SI)</option>
                    <option value="+387">🇧🇦 +387 (BA)</option>
                    <option value="+389">🇲🇰 +389 (MK)</option>
                    <option value="+420">🇨🇿 +420 (CZ)</option>
                    <option value="+421">🇸🇰 +421 (SK)</option>
                    <option value="+423">🇱🇮 +423 (LI)</option>
                    <option value="+880">🇧🇩 +880 (BD)</option>
                    <option value="+886">🇹🇼 +886 (TW)</option>
                    <option value="+960">🇲🇻 +960 (MV)</option>
                    <option value="+961">🇱🇧 +961 (LB)</option>
                    <option value="+962">🇯🇴 +962 (JO)</option>
                    <option value="+963">🇸🇾 +963 (SY)</option>
                    <option value="+964">🇮🇶 +964 (IQ)</option>
                    <option value="+965">🇰🇼 +965 (KW)</option>
                    <option value="+966">🇸🇦 +966 (SA)</option>
                    <option value="+967">🇾🇪 +967 (YE)</option>
                    <option value="+968">🇴🇲 +968 (OM)</option>
                    <option value="+970">🇵🇸 +970 (PS)</option>
                    <option value="+971">🇦🇪 +971 (AE)</option>
                    <option value="+972">🇮🇱 +972 (IL)</option>
                    <option value="+973">🇧🇭 +973 (BH)</option>
                    <option value="+974">🇶🇦 +974 (QA)</option>
                    <option value="+975">🇧🇹 +975 (BT)</option>
                    <option value="+976">🇲🇳 +976 (MN)</option>
                    <option value="+977">🇳🇵 +977 (NP)</option>
                    <option value="+992">🇹🇯 +992 (TJ)</option>
                    <option value="+993">🇹🇲 +993 (TM)</option>
                    <option value="+994">🇦🇿 +994 (AZ)</option>
                    <option value="+995">🇬🇪 +995 (GE)</option>
                    <option value="+996">🇰🇬 +996 (KG)</option>
                    <option value="+998">🇺🇿 +998 (UZ)</option>
                  </select>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    placeholder="6 76 77 83 77"
                    disabled={loading}
                    className="phone-input"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              disabled={loading}
            />
            {!isLogin && (
              <small className="form-help">
                Minimum 6 caractères
              </small>
            )}
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              // Réinitialiser les champs lors du changement de mode
              setName('')
              setEmail('')
              setPhoneNumber('')
              setEmailOrPhone('')
              setPassword('')
            }}
            className="toggle-mode-btn"
            disabled={loading}
          >
            {isLogin 
              ? 'Pas encore de compte ? S\'inscrire'
              : 'Déjà un compte ? Se connecter'}
          </button>
        </div>

        {!isLogin && (
          <div className="register-note">
            <p>ℹ️ Après l'inscription, votre compte sera en attente de validation par l'administrateur.</p>
          </div>
        )}
      </div>
    </div>
  )
}

