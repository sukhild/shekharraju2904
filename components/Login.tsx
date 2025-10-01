import React, { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (email: string, password: string, role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('requestor'); // default role
  const [error, setError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegisterMode) {
      onRegister(email, password, role);
    } else {
      const success = await onLogin(email, password);
      if (!success) {
        setError('Invalid email or password.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Expense Approval System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isRegisterMode ? 'Create a new account' : 'Sign in to your account'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            {isRegisterMode && (
              <div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="admin">Admin</option>
                  <option value="requestor">Requestor</option>
                  <option value="verifier">Verifier</option>
                  <option value="approver">Approver</option>
                </select>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {isRegisterMode ? 'Register' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-gray-600">
          {isRegisterMode ? (
            <p>
              Already have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setIsRegisterMode(false)}>
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don’t have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setIsRegisterMode(true)}>
                Register
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
