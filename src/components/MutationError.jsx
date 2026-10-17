function MutationError({
    error,
    onRetry,
    onDismiss,
}) {
    if (!error) {
        return null;
    }

    return (
        <div
            className="mutation-error"
            role="alert"
        >
            <div>
                <strong>
                    عملیات ناموفق بود
                </strong>

                <p>
                    {error.message ||
                        "خطایی رخ داده است."}
                </p>
            </div>

            <div>
                {onRetry && (
                    <button
                        type="button"
                        onClick={onRetry}
                    >
                        تلاش مجدد
                    </button>
                )}

                {onDismiss && (
                    <button
                        type="button"
                        onClick={onDismiss}
                    >
                        بستن
                    </button>
                )}
            </div>
        </div>
    );
}

export default MutationError;