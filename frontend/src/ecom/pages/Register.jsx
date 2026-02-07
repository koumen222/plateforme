import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEcomAuth } from '../hooks/useEcomAuth';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useEcomAuth();
  const [mode, setMode] = useState('create'); // 'create' ou 'join'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    workspaceName: '',
    inviteCode: '',
    selectedRole: 'ecom_closeuse'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    if (mode === 'create' && (!formData.workspaceName || formData.workspaceName.trim().length < 2)) {
      setError('Le nom de votre espace doit contenir au moins 2 caractères');
      setLoading(false);
      return;
    }

    if (mode === 'join' && !formData.inviteCode.trim()) {
      setError('Le code d\'invitation est requis');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        email: formData.email,
        password: formData.password
      };

      if (mode === 'create') {
        payload.workspaceName = formData.workspaceName.trim();
      } else {
        payload.inviteCode = formData.inviteCode.trim();
        payload.selectedRole = formData.selectedRole;
      }

      await register(payload);
      navigate('/ecom/dashboard');
    } catch (error) {
      setError(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-8 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/ecom')}
            className="inline-flex items-center gap-2.5 mb-6 group"
          >
            <img src="/img/ecom-logo.png" alt="Ecom Cockpit" className="h-16 group-hover:opacity-80 transition" />
          </button>
          <h1 className="text-2xl font-bold text-white">Créer votre compte</h1>
          <p className="mt-1.5 text-gray-400 text-sm">Lancez votre espace ou rejoignez une équipe</p>
        </div>

        {/* Form card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Mode selector */}
          <div className="flex rounded-xl bg-gray-800 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('create'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
                mode === 'create' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Créer un espace
            </button>
            <button
              type="button"
              onClick={() => { setMode('join'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition ${
                mode === 'join' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Rejoindre
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {mode === 'create' && (
              <div>
                <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nom de votre espace
                </label>
                <input
                  id="workspaceName"
                  name="workspaceName"
                  type="text"
                  required
                  placeholder="Ex: Ma Boutique, Mon Business..."
                  value={formData.workspaceName}
                  onChange={handleInputChange}
                  className="block w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                />
                <p className="mt-1.5 text-xs text-gray-500">Vous pourrez inviter votre équipe ensuite</p>
              </div>
            )}

            {mode === 'join' && (
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Code d'invitation
                </label>
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  required
                  placeholder="Collez le code reçu de votre admin"
                  value={formData.inviteCode}
                  onChange={handleInputChange}
                  className="block w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono tracking-wider transition"
                />
                <p className="mt-1.5 text-xs text-gray-500">Demandez le code à l'administrateur de l'espace</p>
              </div>
            )}

            {mode === 'join' && (
              <div>
                <label htmlFor="selectedRole" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Votre rôle
                </label>
                <select
                  id="selectedRole"
                  name="selectedRole"
                  value={formData.selectedRole}
                  onChange={handleInputChange}
                  className="block w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
                >
                  <option value="ecom_closeuse">Closeuse</option>
                  <option value="ecom_compta">Comptable</option>
                  <option value="ecom_livreur">Livreur</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Min. 6 caractères"
                value={formData.password}
                onChange={handleInputChange}
                className="block w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Retapez votre mot de passe"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="block w-full px-3.5 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-600/20 mt-1"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {mode === 'create' ? 'Création de l\'espace...' : 'Inscription...'}
                </span>
              ) : (
                mode === 'create' ? 'Créer mon espace' : 'Rejoindre l\'équipe'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-800"></div>
            <span className="text-xs text-gray-500">déjà un compte ?</span>
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

          <button
            onClick={() => navigate('/ecom/login')}
            className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl text-sm font-medium text-gray-300 transition text-center"
          >
            Se connecter
          </button>
        </div>

        {/* Info box */}
        <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          {mode === 'create' ? (
            <>
              <h3 className="text-sm font-medium text-gray-300 mb-2.5">Comment ça marche</h3>
              <ul className="space-y-2">
                {[
                  'Créez votre espace de travail en tant qu\'admin',
                  'Invitez vos closeuses et comptables avec un code',
                  'Gérez vos produits, rapports et finances'
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-gray-400">
                    <span className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                    {text}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-300 mb-2.5">Rejoindre une équipe</h3>
              <ul className="space-y-2">
                {[
                  'Demandez le code d\'invitation à votre admin',
                  'Choisissez votre rôle : Closeuse, Comptable ou Livreur',
                  'Vous aurez accès aux fonctionnalités de votre rôle'
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-gray-400">
                    <span className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                    {text}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Ecom Cockpit · Tous droits réservés
        </p>
      </div>
    </div>
  );
};

export default Register;
