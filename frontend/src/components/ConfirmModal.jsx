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
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border max-w-md w-full p-8 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-2 text-blue-700">{title}</h2>
        <p className="mb-4 text-slate-700 whitespace-pre-line">{description}</p>
        {showInput && (
          <textarea
            className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-400 bg-slate-50 resize-none"
            rows={3}
            placeholder="Enter reason..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
        )}
        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-all"
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow hover:from-red-600 hover:to-pink-600 transition-all ${
              showInput && !inputValue.trim()
                ? "opacity-60 cursor-not-allowed"
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
  );
}
