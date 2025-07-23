import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/stores/useAuth';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function LoginForm({ onSuccess, onClose }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, register, isLoading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      return;
    }

    const success = isLogin 
      ? await login(username.trim(), password)
      : await register(username.trim(), password);

    if (success) {
      onSuccess();
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setUsername('');
    setPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Login to Game' : 'Create Account'}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {isLogin 
              ? 'Login to save your scores across devices' 
              : 'Create an account to track your progress globally'
            }
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-center"
                maxLength={20}
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-center"
                minLength={6}
                required
                disabled={isLoading}
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3"
                disabled={isLoading || !username.trim() || !password.trim()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isLogin ? 'Logging in...' : 'Creating account...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isLogin ? 'Login' : 'Create Account'}
                  </div>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={switchMode}
                disabled={isLoading}
              >
                {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-gray-500"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}