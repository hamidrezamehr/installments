import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          dir="rtl"
          className="flex min-h-[50vh] flex-col items-center justify-center px-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-200/60 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              مشکلی پیش آمد
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              بخشی از برنامه با خطا مواجه شد. لطفاً دوباره تلاش کنید یا به
              صفحه اصلی بازگردید.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-right">
                <summary className="cursor-pointer text-xs font-medium text-gray-400 hover:text-gray-600">
                  جزئیات خطا (فقط در حالت توسعه)
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-gray-50 p-3 text-left text-[11px] leading-relaxed text-red-600 ltr">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                <RefreshCcw className="h-4 w-4" />
                تلاش دوباره
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-linear-to-l from-indigo-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-violet-700"
              >
                <Home className="h-4 w-4" />
                صفحه اصلی
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
