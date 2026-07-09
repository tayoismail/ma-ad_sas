import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { Button } from '../components/ui/button';

export default function NotFound() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-6xl font-extrabold text-card-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-card-foreground mb-2">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
          <Button className="gradient-accent text-white border-0" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" /> Home
          </Button>
        </div>
        <button
          onClick={toggleTheme}
          className="mt-6 p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
