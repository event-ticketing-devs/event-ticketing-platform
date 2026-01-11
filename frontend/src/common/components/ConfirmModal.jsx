import { AlertCircle, Info, AlertTriangle, X, Edit } from "lucide-react";

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
  inputPlaceholder = "Please provide a reason...",
  variant = "danger", // "danger", "warning", "info", "success"
}) {
  if (!open) return null;

  // Dynamic styling based on variant
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-error/10 border border-error/20",
          iconColor: "text-error",
          confirmBg: "bg-error",
          confirmHover: "hover:bg-error/90",
          icon: <AlertTriangle className="w-6 h-6" />,
        };
      case "warning":
        return {
          iconBg: "bg-warning/10 border border-warning/20",
          iconColor: "text-warning",
          confirmBg: "bg-warning",
          confirmHover: "hover:bg-warning/90",
          icon: <AlertCircle className="w-6 h-6" />,
        };
      case "success":
        return {
          iconBg: "bg-success/10 border border-success/20",
          iconColor: "text-success",
          confirmBg: "bg-success",
          confirmHover: "hover:bg-success/90",
          icon: <Info className="w-6 h-6" />,
        };
      default: // info
        return {
          iconBg: "bg-bg-secondary border border-border",
          iconColor: "text-text-primary",
          confirmBg: "bg-primary",
          confirmHover: "hover:bg-primary/90",
          icon: <Info className="w-6 h-6" />,
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
      <div className="bg-bg-primary border border-border rounded-lg max-w-md w-full overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-bg-secondary hover:bg-border text-text-secondary hover:text-text-primary rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 ${variantStyles.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <div className={variantStyles.iconColor}>
                {variantStyles.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
              <p className="text-text-secondary leading-relaxed whitespace-pre-line">
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
                <Edit className="w-5 h-5 text-text-secondary" />
              </div>
              <textarea
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary transition-colors resize-none"
                rows={3}
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </div>
            <p className="text-sm text-text-secondary mt-2">
              This information will be recorded and may be shared with affected
              users.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 bg-bg-secondary border-t border-border">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-bg-primary border border-border text-text-primary py-3 px-4 rounded-lg font-semibold hover:bg-bg-secondary hover:border-text-secondary transition-colors cursor-pointer"
              type="button"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 ${variantStyles.confirmBg} ${
                variantStyles.confirmHover
              } text-white py-3 px-4 rounded-lg font-semibold transition-colors ${
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
