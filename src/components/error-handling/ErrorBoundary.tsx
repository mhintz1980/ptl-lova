import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  includeStack?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * ErrorBoundary component for catching and handling errors in the component tree.
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallback={<ErrorFallback />}
 *   onError={(error, errorInfo) => console.error(error)}
 *   includeStack={true}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Log error to console
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error Info:', errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to error tracking service (placeholder for integration)
    // Example: Sentry, LogRocket, etc.
    this.logToErrorService(error, errorInfo)
  }

  /**
   * Logs error to external error tracking service.
   * Override this method to integrate with your error tracking service.
   */
  private logToErrorService(error: Error, errorInfo: ErrorInfo): void {
    // Placeholder for error tracking service integration
    // Example with Sentry:
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });

    // For now, just log to console with structured data
    const errorLog = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    }

    console.error('Error Log:', JSON.stringify(errorLog, null, 2))
  }

  /**
   * Resets the error boundary state, allowing for retry.
   */
  public resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div
          role="alert"
          style={{
            padding: '2rem',
            margin: '1rem',
            border: '2px solid #ff6b6b',
            borderRadius: '8px',
            backgroundColor: '#fff5f5',
            color: '#c53030',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            We apologize for the inconvenience. An error has occurred and this
            page could not be displayed.
          </p>

          {this.state.error && (
            <details
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: '#fff',
                borderRadius: '4px',
                border: '1px solid #fc8181',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                }}
              >
                Error Details
              </summary>
              <div style={{ marginTop: '1rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Message:
                </strong>
                <pre
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#f7fafc',
                    borderRadius: '4px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.toString()}
                </pre>

                {this.props.includeStack && this.state.error.stack && (
                  <>
                    <strong
                      style={{
                        display: 'block',
                        marginTop: '1rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      Stack Trace:
                    </strong>
                    <pre
                      style={{
                        padding: '0.5rem',
                        backgroundColor: '#f7fafc',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        maxHeight: '300px',
                      }}
                    >
                      {this.state.error.stack}
                    </pre>
                  </>
                )}

                {this.props.includeStack &&
                  this.state.errorInfo?.componentStack && (
                    <>
                      <strong
                        style={{
                          display: 'block',
                          marginTop: '1rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        Component Stack:
                      </strong>
                      <pre
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#f7fafc',
                          borderRadius: '4px',
                          overflow: 'auto',
                          fontSize: '0.875rem',
                          maxHeight: '200px',
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
              </div>
            </details>
          )}

          <button
            onClick={this.resetErrorBoundary}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2c5282'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3182ce'
            }}
          >
            Try Again
          </button>

          <p
            style={{
              marginTop: '1rem',
              fontSize: '0.875rem',
              color: '#718096',
            }}
          >
            If the problem persists, please contact support or refresh the page.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Default error fallback component for quick use.
 */
export const DefaultErrorFallback = () => (
  <div
    role="alert"
    style={{
      padding: '2rem',
      margin: '1rem',
      border: '2px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      color: '#c53030',
    }}
  >
    <h2>Something went wrong</h2>
    <p>Please refresh the page or contact support if the problem persists.</p>
  </div>
)

export default ErrorBoundary
