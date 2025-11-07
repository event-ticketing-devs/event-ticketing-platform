import React from "react";

export default function ConfirmModal({
  open,
  title,
  description,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  showInput = false,
  inputValue = "",
  setInputValue = () => {},
  variant = "danger", // "danger", "warning", "info"
}) {
  if (!open) return null;

  // Dynamic styling based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-red-50 border border-red-200",
          iconColor: "text-red-600",
          confirmBg: "bg-red-600",
          confirmHover: "hover:bg-red-700",
          icon: (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
        };
      case "warning":
        return {
          iconBg: "bg-orange-50 border border-orange-200",
          iconColor: "text-orange-600",
          confirmBg: "bg-orange-600",
          confirmHover: "hover:bg-orange-700",
          icon: (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
        };
      default: // info
        return {
          iconBg: "bg-slate-100 border border-slate-200",
          iconColor: "text-slate-900",
          confirmBg: "bg-slate-900",
          confirmHover: "hover:bg-slate-800",
          icon: (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 ${variantStyles.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              <div className={variantStyles.iconColor}>
                {variantStyles.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        {showInput && (
          <div className="px-6 pb-4">
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <textarea
                className="w-full pl-10 pr-4 py-3 border border-slate-300 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-slate-50 transition-colors resize-none"
                rows={3}
                placeholder="Please provide a reason..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">
              This information will be recorded and may be shared with affected
              users.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 px-4 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-colors"
              type="button"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 ${variantStyles.confirmBg} ${
                variantStyles.confirmHover
              } text-white py-3 px-4 font-semibold transition-colors ${
                showInput && !inputValue.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }`}
              disabled={showInput && !inputValue.trim()}
              type="button"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
