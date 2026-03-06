import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import supabaseService from '../services/supabaseService';

export default function AuthCallback({ onLogin }) {
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCallback = async () => {
    try {
      const session = await supabaseService.getSession();
      
      if (session && session.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          role: session.user.user_metadata?.role || 'buyer',
          walletAddress: session.user.user_metadata?.wallet_address || null
        };
        
        onLogin(userData);
        toast.success('Successfully logged in with Google!');
        navigate('/');
      } else {
        toast.error('Authentication failed');
        navigate('/login');
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      toast.error('Authentication error occurred');
      navigate('/login');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Completing authentication...</p>
      </div>
    </div>
  );
}
