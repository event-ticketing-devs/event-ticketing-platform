import React, { useState } from "react";
import apiClient from "../../../api/apiClient";
import { toast } from "react-hot-toast";
import { X, Flag, AlertCircle, Send, AlertTriangle, Loader2 } from 'lucide-react';

const REPORT_REASONS = [
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "spam", label: "Spam" },
  { value: "scam_or_fraud", label: "Scam or Fraud" },
  { value: "misleading_information", label: "Misleading Information" },
  { value: "offensive_language", label: "Offensive Language" },
  { value: "copyright_violation", label: "Copyright Violation" },
  { value: "other", label: "Other" },
];

export default function ReportEventModal({ open, eventId, eventTitle, onClose }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error("Please select a reason for reporting");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/reports", {
        eventId,
        reason,
        description: description.trim(),
      });
      
      toast.success("Report submitted successfully. Thank you for helping keep our platform safe.");
      onClose();
      setReason("");
      setDescription("");
    } catch (error) {
      if (error.response?.data?.message === "You have already reported this event") {
        toast.error("You have already reported this event");
      } else {
        toast.error("Failed to submit report. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setDescription("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary border border-border rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Report Event</h3>
            <button
              onClick={handleClose}
              className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-text-secondary">
              You are reporting: <span className="font-medium text-text-primary">{eventTitle}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Reason for reporting *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                required
              >
                <option value="">Select a reason</option>
                {REPORT_REASONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Additional details (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide any additional information about this report..."
                className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                rows={4}
                maxLength={500}
              />
              <div className="text-right text-sm text-text-secondary mt-1">
                {description.length}/500
              </div>
            </div>

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5 mr-2" />
                <div>
                  <p className="text-sm text-text-primary font-medium">Important</p>
                  <p className="text-sm text-text-secondary">
                    Please only report events that violate our community guidelines.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-text-primary bg-bg-secondary rounded-lg hover:bg-bg-secondary/80 font-medium transition-colors border border-border cursor-pointer"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason}
                className="flex-1 px-4 py-2 bg-error rounded-lg hover:bg-error/90 disabled:bg-error/40 text-bg-primary font-medium transition-colors flex items-center justify-center cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
