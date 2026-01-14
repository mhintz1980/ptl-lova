import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from './ErrorBoundary';

// Mock console.error to avoid cluttering test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  // Component that throws an error
  const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Renders children when no error', () => {
    it('should render children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child">Child Component</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Component')).toBeInTheDocument();
    });

    it('should render multiple children without error', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child1">First Child</div>
          <div data-testid="child2">Second Child</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
    });
  });

  describe('2. Catches errors and shows fallback UI', () => {
    it('should catch error and show default fallback UI', () => {
      // Suppress the expected error boundary logging
      const spy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      spy.mockRestore();
    });

    it('should use custom fallback when provided', () => {
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });

    it('should display error message in details', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Open details element to see error details
      const details = screen.getByText('Error Details').closest('details');
      expect(details).toBeInTheDocument();

      spy.mockRestore();
    });
  });

  describe('3. Calls onError callback', () => {
    it('should call onError callback with error and errorInfo', () => {
      const onError = jest.fn();
      const spy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );

      spy.mockRestore();
    });

    it('should not call onError when no error occurs', () => {
      const onError = jest.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('4. Shows/hides stack trace based on includeStack prop', () => {
    it('should show stack trace when includeStack is true', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary includeStack={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Open details to see stack traces
      const details = screen.getByText('Error Details').closest('details');
      if (details) {
        act(() => {
          details.setAttribute('open', '');
        });
      }

      expect(screen.getByText(/Stack Trace/i)).toBeInTheDocument();
      expect(screen.getByText(/Component Stack/i)).toBeInTheDocument();

      spy.mockRestore();
    });

    it('should hide stack trace when includeStack is false or undefined', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary includeStack={false}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Open details to check content
      const details = screen.getByText('Error Details').closest('details');
      if (details) {
        act(() => {
          details.setAttribute('open', '');
        });
      }

      expect(screen.queryByText(/Stack Trace/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Component Stack/i)).not.toBeInTheDocument();

      spy.mockRestore();
    });

    it('should hide stack trace by default (includeStack undefined)', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const details = screen.getByText('Error Details').closest('details');
      if (details) {
        act(() => {
          details.setAttribute('open', '');
        });
      }

      expect(screen.queryByText(/Stack Trace/i)).not.toBeInTheDocument();

      spy.mockRestore();
    });
  });

  describe('5. Reset functionality works', () => {
    it('should reset error boundary and re-render children', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify error state
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Click Try Again button
      const resetButton = screen.getByText('Try Again');
      act(() => {
        resetButton.click();
      });

      // Rerender with non-throwing component
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Verify children are rendered again
      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      spy.mockRestore();
    });

    it('should clear error state after reset', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      const TestComponent = () => {
        const [shouldThrow, setShouldThrow] = React.useState(true);

        return (
          <ErrorBoundary>
            {shouldThrow ? (
              <button onClick={() => setShouldThrow(false)}>Trigger Error</button>
            ) : (
              <div data-testid="recovered">Recovered</div>
            )}
          </ErrorBoundary>
        );
      };

      render(<TestComponent />);

      // After error, click Try Again
      const resetButton = screen.getByText('Try Again');
      act(() => {
        resetButton.click();
      });

      // Error state should be cleared
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      spy.mockRestore();
    });

    it('should be able to catch new errors after reset', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();

      const TestComponent = ({ throwCount }: { throwCount: number }) => (
        <ErrorBoundary>
          <ThrowError shouldThrow={throwCount > 0} />
        </ErrorBoundary>
      );

      const { rerender } = render(<TestComponent throwCount={1} />);

      // First error caught
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // Reset and rerender without error
      const resetButton = screen.getByText('Try Again');
      act(() => {
        resetButton.click();
      });
      rerender(<TestComponent throwCount={0} />);
      expect(screen.getByText('No error')).toBeInTheDocument();

      // Cause another error
      rerender(<TestComponent throwCount={2} />);

      // Should catch error again
      expect(screen.getByRole('alert')).toBeInTheDocument();

      spy.mockRestore();
    });
  });
});
