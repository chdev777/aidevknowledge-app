import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../../lib/utils/log.js';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('ErrorBoundary caught', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (error) {
      if (this.props.fallback) return this.props.fallback(error, this.reset);
      return (
        <div className="error-fallback">
          <div className="error-fallback-card">
            <h1>予期しないエラーが発生しました</h1>
            <p className="error-fallback-message">{error.message}</p>
            <button type="button" className="btn" onClick={this.reset}>
              再試行
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => window.location.assign('/')}
            >
              ホームへ
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
