import { Component } from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

const isChunkError = (error) =>
  /Loading chunk|dynamically imported module|import\(\) failed/i.test(error?.message || '');

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isChunkLoad: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error, isChunkLoad: isChunkError(error) };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isChunkLoad: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkLoad) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl p-8 max-w-md w-full shadow-xl border border-border text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/15 to-amber-500/15 flex items-center justify-center mx-auto mb-5">
                <WifiOff className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-xl font-semibold text-card-foreground mb-2">Connection Lost</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Failed to load part of the application. Please check your internet connection and try again.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <RefreshCw className="w-4 h-4" /> Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-8 max-w-md w-full shadow-xl border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Something went wrong</h2>
                <p className="text-xs text-muted-foreground">An unexpected error occurred</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <p className="text-xs text-muted-foreground/70 font-mono bg-muted p-3 rounded-lg overflow-auto max-h-28 mb-5">
              {this.state.error?.stack || 'No stack trace'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" /> Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
