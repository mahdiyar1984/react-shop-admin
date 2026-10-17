function ApiError({
    error,
    onRetry,
    title = "خطا در دریافت اطلاعات",
}) {
    if (!error) {
        return null;
    }

    const status = error.status;

    let message =
        error.message ||
        "ارتباط با سرور با مشکل مواجه شد.";

    if (status === 400) {
        message =
            "اطلاعات ارسال‌شده معتبر نیست.";
    } else if (status === 401) {
        message =
            "برای ادامه باید وارد حساب کاربری شوید.";
    } else if (status === 403) {
        message =
            "شما اجازه انجام این عملیات را ندارید.";
    } else if (status === 404) {
        message =
            "اطلاعات موردنظر پیدا نشد.";
    } else if (status >= 500) {
        message =
            "سرور با مشکل مواجه شده است. لطفاً دوباره تلاش کنید.";
    }

    return (
        <section
            className="api-error"
            role="alert"
        >
            <h2>{title}</h2>

            <p>{message}</p>

            {typeof onRetry === "function" && (
                <button
                    type="button"
                    onClick={onRetry}
                >
                    تلاش مجدد
                </button>
            )}
        </section>
    );
}

export default ApiError;