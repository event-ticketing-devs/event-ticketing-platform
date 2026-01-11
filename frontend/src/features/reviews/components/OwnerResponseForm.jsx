import { useState } from "react";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
import {
  addOwnerResponse,
  updateOwnerResponse,
  deleteOwnerResponse,
} from "../../../services/reviewService";

const OwnerResponseForm = ({ reviewId, existingResponse, onSuccess, onCancel }) => {
  const [response, setResponse] = useState(existingResponse || "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isEditing = !!existingResponse;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!response.trim()) {
      toast.error("Response cannot be empty");
      return;
    }

    if (response.length > 300) {
      toast.error("Response cannot exceed 300 characters");
      return;
    }

    setSubmitting(true);

    try {
      if (isEditing) {
        await updateOwnerResponse(reviewId, response);
        toast.success("Response updated successfully");
      } else {
        await addOwnerResponse(reviewId, response);
        toast.success("Response added successfully");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your response?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteOwnerResponse(reviewId);
      toast.success("Response deleted successfully");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete response");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
      <h5 className="text-sm font-semibold text-secondary mb-3">
        {isEditing ? "Edit Your Response" : "Respond to Review"}
      </h5>

      <form onSubmit={handleSubmit}>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Thank the customer or address their concerns..."
          rows={3}
          maxLength={300}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary resize-none mb-2"
          required
        />
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-text-secondary">
            {response.length}/300 characters
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-secondary text-bg-primary rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Saving..." : isEditing ? "Update Response" : "Post Response"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-bg-secondary transition-colors text-sm"
            >
              Cancel
            </button>
          )}
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="ml-auto px-4 py-2 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "Deleting..." : "Delete Response"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default OwnerResponseForm;
