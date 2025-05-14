import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BranchAutocomplete from './BranchAutoComplete';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullname: '',
    branch: '', 
    role: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:8000/api/users/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullname: formData.fullname,
          email: formData.email,
          role: formData.role,
          branch: formData.branch,
          password: formData.password
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Registration failed');
      }

      setSuccess(true);
      setFormData({
        email: '',
        password: '',
        fullname: '',
        branch: '',
        role: ''
      });
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  console.log('Submitting:', JSON.stringify({
    fullname: formData.fullname,
    email: formData.email,
    role: formData.role,
    branch: formData.branch,
    password: '[redacted]' // Don't log actual passwords
  }));

  return (
    <div className="h-2/5 flex items-center justify-center bg-white py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-2">
        <form className="mt-2 space-y-2" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-2">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="fullname" className="sr-only">Full Name</label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.fullname}
                onChange={handleChange}
              />
            </div>
            <div className="js-enabled">
              <BranchAutocomplete
                value={formData.branch}
                onChange={(branch) => setFormData({...formData, branch})}
                required
              />
            </div>
            {/* Fallback for non-JavaScript clients */}
            <noscript>
              <label htmlFor="branch" className="sr-only">Branch</label>
              <select
                id="branch"
                name="branch"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={formData.branch}
                onChange={handleChange}
              >
                <option value="Asankragua">Asankragua</option>
                <option value="Ayiem">Ayiem</option>
                <option value="Assin Fosu">Assin Fosu</option>
                <option value="Atta ne Atta">Atta ne Atta</option>
                <option value="Atebubu">Atebubu</option>
                <option value="Bepong">Bepong</option>
                <option value="Bongo">Bongo</option>
                <option value="Camp 15">Camp 15</option>
                <option value="Dadieso">Dadieso</option>
                <option value="Damango">Damango</option>
                <option value="Dormaa">Dormaa</option>
                <option value="Dunkwa">Dunkwa</option>
                <option value="Feyiase">Feyiase</option>
                <option value="Mamaso">Mamaso</option>
                <option value="Medie">Medie</option>
                <option value="Nkruma Nkwanta">Nkruma Nkwanta</option>
                <option value="Obuasi">Obuasi</option>
                <option value="Oseikrom">Oseikrom</option>
                <option value="Suma Ahenkro">Suma Ahenkro</option>
                <option value="Tarkwa">Tarkwa</option>
                <option value="Tema">Tema</option>
                <option value="Tepa">Tepa</option>
                <option value="Tinga">Tinga</option>
                <option value="Tumu">Tumu</option>
                <option value="Tutuka">Tutuka</option>
                <option value="Wa">Wa</option>
              </select>
            </noscript>
            <div>
              <label htmlFor="role" className="sr-only">Role</label>
              <select
                id="role"
                name="role"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="station_supervisor">Station Supervisor</option>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {success && (
            <div className="text-green-600 text-sm text-center">
              Registration successful! You can now login.
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}