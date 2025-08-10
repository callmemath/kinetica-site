import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import ErrorPage from '../pages/ErrorPage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Aggiorna lo state per mostrare la UI di errore
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log dell'errore per debugging
    console.error('ErrorBoundary catturato un errore:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Qui potresti inviare l'errore a un servizio di logging
    // come Sentry, LogRocket, etc.
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage 
          error={{
            status: 500,
            message: this.state.error?.message || 'Errore JavaScript nell\'applicazione',
            type: 'generic'
          }}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
