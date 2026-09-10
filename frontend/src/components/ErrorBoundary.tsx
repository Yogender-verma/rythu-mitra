import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F8F2] flex items-center justify-center p-4 text-black font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-[#B7C9B3] shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] text-3xl flex items-center justify-center mx-auto border-2 border-[#C8E6C9]">
              🌿
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1B5E20]">రైతు మిత్ర AI</h2>
              <p className="text-sm font-bold text-gray-700 mt-2">
                పేజీని లోడ్ చేయడంలో తాత్కాలిక సమస్య ఏర్పడింది. దయచేసి రీఫ్రెష్ చేయండి.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                A temporary issue occurred while rendering. Please refresh or return to Dashboard.
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="w-full bg-[#1B5E20] hover:bg-[#2E7D32] text-white py-3.5 px-4 rounded-2xl font-black text-sm shadow-md transition-all"
              >
                🔄 పేజీని రీఫ్రెష్ చేయండి / Refresh Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/dashboard';
                }}
                className="w-full bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] py-3.5 px-4 rounded-2xl font-black text-sm border-2 border-[#B7C9B3] transition-all"
              >
                🌾 డ్యాష్‌బోర్డ్‌కి వెళ్లండి / Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
