import React, { useEffect, useState } from 'react';
import { ShieldAlert, Lock, Database, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

interface LoginProps {
  onLoginSuccess: (userEmail: string, accessToken: string) => void;
  clientId: string;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, clientId }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Poll for the Google script to be loaded
    const initGoogle = () => {
      if (window.google && window.google.accounts) {
        setIsLoaded(true);
      } else {
        setTimeout(initGoogle, 100);
      }
    };
    initGoogle();
  }, []);

  const handleGoogleSignIn = () => {
    if (!window.google) return;

    try {
      // Use OAuth2 Token Client for Scopes (Spreadsheets)
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly email profile',
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            // Fetch user profile to get email
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            })
            .then(res => res.json())
            .then(userInfo => {
               // Strict Domain Validation
               if (userInfo.email && userInfo.email.endsWith('@vangardegroup.com')) {
                  onLoginSuccess(userInfo.email, tokenResponse.access_token);
               } else {
                  setError('Access Denied: You must use a @vangardegroup.com email address.');
               }
            })
            .catch(err => {
               console.error(err);
               setError('Failed to retrieve user profile. Please try again.');
            });
          } else {
             setError('Failed to get authorization token.');
          }
        },
        error_callback: (err: any) => {
            console.error("Token Client Error:", err);
            setError("Authorization failed. Please check console.");
        }
      });

      // Trigger the popup
      client.requestAccessToken();

    } catch (e) {
      console.error("Google Auth Error", e);
      setError("Failed to initialize Google Sign-In.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#4f46e5] to-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] overflow-hidden relative">
        {/* Header Graphic */}
        <div className="h-32 bg-[#4f46e5] relative overflow-hidden flex items-center justify-center">
           <div className="absolute inset-0 bg-white/10 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
           <div className="z-10 text-center">
              <h1 className="font-extrabold text-white tracking-tight font-inter text-3xl drop-shadow-md">VANGARDE</h1>
              <p className="text-indigo-200 text-xs font-bold tracking-widest uppercase mt-1">Internal Performance Portal</p>
           </div>
        </div>

        <div className="p-8 pb-10">
          <div className="flex flex-col items-center space-y-6">
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-slate-800">Welcome Back</h2>
              <p className="text-slate-500 text-sm">Please sign in with your corporate account to access the live dashboard.</p>
            </div>

            {/* Security Notice */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-3 w-full">
              <Lock size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-slate-500 leading-snug">
                This system connects to the <strong>Live Production Database</strong>. All access is logged and restricted to <span className="font-bold text-slate-700">@vangardegroup.com</span>.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-3 w-full animate-in fade-in slide-in-from-top-2">
                <ShieldAlert size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-bold text-rose-600 leading-snug">{error}</p>
              </div>
            )}

            {/* Custom Google Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={!isLoaded}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-full transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {!isLoaded ? (
                 <span className="text-xs">Loading Security...</span>
              ) : (
                 <>
                   <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                     <svg className="w-full h-full" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                   </div>
                   <span>Sign in with Google</span>
                 </>
              )}
            </button>
            
            {/* 400 Error Helper */}
            <div className="text-[10px] text-slate-400 text-center px-4">
               <p className="mb-1 flex items-center justify-center gap-1"><AlertCircle size={10} /> Seeing Error 400: invalid_request?</p>
               <p className="opacity-70">Ensure this URL is whitelisted in Google Cloud Console "Authorized JavaScript origins".</p>
            </div>

          </div>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100 flex justify-center items-center gap-2">
           <Database size={12} className="text-slate-400" />
           <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Secure Database Connection</p>
        </div>
      </div>
    </div>
  );
};

export default Login;