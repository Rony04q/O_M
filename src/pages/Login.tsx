import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; // <-- 1. IMPORT SUPABASE

export function Login() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '', // This will be 'full_name' for Supabase
  });
  const [loading, setLoading] = useState(false); // <-- 2. ADD LOADING STATE
  const [errorMsg, setErrorMsg] = useState(''); // State for showing errors

  // --- 3. UPDATED handleSubmit ---
  const handleSubmit = async (e: React.FormEvent) => { // <-- Make async
    e.preventDefault();
    setLoading(true);
    setErrorMsg(''); // Clear previous errors

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (formData.password.length < 6) { // Supabase default min length
          throw new Error("Password must be at least 6 characters long.");
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            // Data passed to your DB trigger
            data: {
              full_name: formData.name, // Map 'name' from form to 'full_name'
              role: 'customer'         // Default role for new signups
            }
          }
        });

        if (error) throw error; // Handle Supabase specific errors

        // Sign up successful
        alert('Sign up successful! Please check your email for confirmation if required.');
        setIsSignUp(false); // Switch back to Sign In mode
        // Clear form fields after successful signup (optional)
        setFormData({ email: '', password: '', confirmPassword: '', name: ''});

      } else {
        // --- SIGN IN LOGIC ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error; // Handle Supabase specific errors

        // Sign in successful
        console.log('Sign in successful:', data);
        navigate('/'); // Navigate to home page
      }
    } catch (error: any) {
      console.error('Authentication error:', error.message);
      setErrorMsg(error.message); // Set error message to display in the UI
    } finally {
      setLoading(false); // Stop loading indicator in all cases
    }
  };
  // --- END OF UPDATED handleSubmit ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --- JSX (Added loading state, error display, disabled attributes) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingCart className="w-10 h-10 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">MarketPlace</h1>
          </div>
          <p className="text-gray-600">
            {isSignUp ? 'Create your account to get started' : 'Welcome back! Please sign in'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Sign In / Sign Up Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {setIsSignUp(false); setErrorMsg('');}} // Clear error on toggle
              disabled={loading} // Disable during loading
              className={`flex-1 py-2 rounded-lg font-medium transition-all disabled:opacity-75 ${
                !isSignUp
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {setIsSignUp(true); setErrorMsg('');}} // Clear error on toggle
              disabled={loading} // Disable during loading
              className={`flex-1 py-2 rounded-lg font-medium transition-all disabled:opacity-75 ${
                isSignUp
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* --- Display Error Message --- */}
            {errorMsg && (
              <p className="text-red-600 text-sm text-center bg-red-100 p-2 rounded-md">{errorMsg}</p>
            )}

            {/* Full Name (Sign Up only) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-100"
                  placeholder="John Doe" required={isSignUp} disabled={loading}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email" name="email" value={formData.email} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-100"
                  placeholder="you@example.com" required disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-100"
                  placeholder="••••••••" required disabled={loading} minLength={isSignUp ? 6 : undefined} // Add minLength for signup
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)} disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up only) */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-100"
                    placeholder="••••••••" required={isSignUp} disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Remember Me / Forgot Password (Sign In only) */}
            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"/>
                  <span className="ml-2 text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading} // Disable when loading
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors active:scale-98 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Social Login Separator */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
            </div>
            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-75">
                {/* Google SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="text-sm font-medium text-gray-700">Google</span>
              </button>
              <button disabled={loading} className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-75">
                {/* Facebook SVG */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                <span className="text-sm font-medium text-gray-700">Facebook</span>
              </button>
            </div>
          </div>
        </div>

        {/* Continue as Guest Button */}
        <div className="text-center mt-6">
          <button onClick={() => navigate('/')} disabled={loading} className="text-gray-600 hover:text-gray-900 font-medium disabled:opacity-75">
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

// Ensure you have a default export if your router expects it
export default Login;