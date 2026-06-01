import { Component } from 'react';
import { AlertCircle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-300 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md shadow-xl border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <p className="text-xs text-gray-400 font-mono bg-gray-50 p-3 rounded-lg overflow-auto max-h-32">
              {this.state.error?.stack || 'No stack trace'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:brightness-110"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
