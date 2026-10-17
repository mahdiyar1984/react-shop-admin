import { Component } from "react";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);

        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error, errorInfo) {
        console.error(
            "React Error Boundary:",
            error
        );

        console.error(
            "Component Stack:",
            errorInfo?.componentStack
        );
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <main className="error-boundary">
                <section>
                    <h1>
                        مشکلی در برنامه رخ داده است
                    </h1>

                    <p>
                        بخشی از رابط کاربری نتوانست
                        به‌درستی اجرا شود.
                    </p>

                    {this.state.error?.message && (
                        <details>
                            <summary>
                                جزئیات خطا
                            </summary>

                            <p>
                                {
                                    this.state.error
                                        .message
                                }
                            </p>
                        </details>
                    )}

                    <div>
                        <button
                            type="button"
                            onClick={this.handleRetry}
                        >
                            تلاش مجدد
                        </button>

                        <button
                            type="button"
                            onClick={this.handleReload}
                        >
                            بارگذاری مجدد صفحه
                        </button>
                    </div>
                </section>
            </main>
        );
    }
}

export default ErrorBoundary;