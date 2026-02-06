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
    inviteCode: ''
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">EC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ecom Cockpit</h1>
          <p className="mt-2 text-gray-500 text-sm">Gérez votre business e-commerce</p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 shadow-lg sm:rounded-xl sm:px-8">
          {/* Mode selector */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('create'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition ${
                mode === 'create' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Créer un espace
            </button>
            <button
              type="button"
              onClick={() => { setMode('join'); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition ${
                mode === 'join' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rejoindre une équipe
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {mode === 'create' && (
              <div>
                <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">Vous pourrez inviter votre équipe ensuite</p>
              </div>
            )}

            {mode === 'join' && (
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono tracking-wider"
                />
                <p className="mt-1 text-xs text-gray-400">Demandez le code à l'administrateur de l'espace</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition mt-2"
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

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{' '}
              <button
                onClick={() => navigate('/ecom/login')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Se connecter
              </button>
            </p>
          </div>

          {/* Info box */}
          <div className="mt-6 p-4 rounded-lg bg-gray-50">
            {mode === 'create' ? (
              <>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Créer votre espace</h3>
                <ul className="space-y-1.5 text-xs text-gray-500">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">1.</span>
                    <span>Créez votre espace de travail en tant qu'admin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">2.</span>
                    <span>Invitez vos closeuses et comptables avec un code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">3.</span>
                    <span>Gérez vos produits, rapports et finances</span>
                  </li>
                </ul>
              </>
            ) : (
              <>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Rejoindre une équipe</h3>
                <ul className="space-y-1.5 text-xs text-gray-500">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">1.</span>
                    <span>Demandez le code d'invitation à votre admin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">2.</span>
                    <span>Vous serez ajouté(e) comme closeuse par défaut</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">3.</span>
                    <span>L'admin pourra changer votre rôle ensuite</span>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
