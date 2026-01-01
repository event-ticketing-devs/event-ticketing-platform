import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import apiClient from "../../../api/apiClient";
import ConfirmModal from "../../../common/components/ConfirmModal";
import { Plus, Edit, Trash2, X, Check, AlertCircle } from "lucide-react";

const VenueOptionsManagement = () => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("amenity");
  const [showModal, setShowModal] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, option: null });
  const [formData, setFormData] = useState({
    type: "amenity",
    label: "",
    description: "",
  });

  const types = [
    { value: "amenity", label: "Amenities", singular: "Amenity", description: "Standard amenities for venues" },
    { value: "eventType", label: "Event Types", singular: "Event Type", description: "Supported event types for spaces" },
    { value: "policyItem", label: "Policy Items", singular: "Policy Item", description: "Allowed/Banned items" },
  ];

  useEffect(() => {
    fetchOptions();
  }, [selectedType]);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/venue-options?type=${selectedType}&includeInactive=true`);
      setOptions(response.data);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Failed to fetch options");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingOption(null);
    setFormData({
      type: selectedType,
      label: "",
      description: "",
    });
    setShowModal(true);
  };

  const handleEdit = (option) => {
    setEditingOption(option);
    setFormData({
      type: option.type,
      label: option.label,
      description: option.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingOption) {
        await apiClient.patch(`/venue-options/${editingOption._id}`, {
          label: formData.label,
          description: formData.description,
        });
        toast.success("Option updated successfully");
      } else {
        await apiClient.post("/venue-options", formData);
        toast.success("Option created successfully");
      }
      
      setShowModal(false);
      fetchOptions();
    } catch (error) {
      console.error("Error saving option:", error);
      toast.error(error.response?.data?.message || "Failed to save option");
    }
  };

  const handleToggleActive = async (option) => {
    try {
      await apiClient.patch(`/venue-options/${option._id}`, {
        isActive: !option.isActive,
      });
      toast.success(`Option ${!option.isActive ? 'activated' : 'deactivated'}`);
      fetchOptions();
    } catch (error) {
      console.error("Error toggling option:", error);
      toast.error("Failed to update option");
    }
  };

  const handleDelete = (option) => {
    setDeleteConfirm({ open: true, option });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.option) return;
    
    try {
      await apiClient.delete(`/venue-options/${deleteConfirm.option._id}`);
      toast.success("Option deleted successfully");
      fetchOptions();
    } catch (error) {
      console.error("Error deleting option:", error);
      toast.error("Failed to delete option");
    } finally {
      setDeleteConfirm({ open: false, option: null });
    }
  };

  const getTypeInfo = (typeValue) => types.find(t => t.value === typeValue);

  return (
    <div className="min-h-screen bg-bg-secondary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">Venue Options Management</h1>
          <p className="text-text-secondary">
            Manage amenities, event types, and policy items for venues and spaces
          </p>
        </div>

        {/* Type Tabs */}
        <div className="bg-bg-primary border border-border rounded-lg mb-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row border-b border-border">
            {types.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-colors cursor-pointer ${
                  selectedType === type.value
                    ? "text-text-primary border-b-2 border-primary bg-bg-secondary"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-secondary"
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">{type.label}</div>
                  <div className="text-xs text-text-secondary mt-0.5 hidden sm:block">
                    {type.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Stats and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-bg-primary border border-border rounded-lg px-4 py-2">
              <span className="text-sm text-text-secondary">Total: </span>
              <span className="text-lg font-bold text-text-primary">{options.length}</span>
            </div>
            <div className="bg-success/10 border border-success/20 rounded-lg px-4 py-2">
              <span className="text-sm text-success">Active: </span>
              <span className="text-lg font-bold text-success">
                {options.filter(o => o.isActive).length}
              </span>
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="inline-flex items-center justify-center gap-2 bg-primary text-bg-primary px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add New {getTypeInfo(selectedType)?.singular || 'Option'}
          </button>
        </div>

        {/* Options List */}
        <div className="bg-bg-primary border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No options found</h3>
              <p className="text-text-secondary mb-4">
                Get started by adding your first {getTypeInfo(selectedType)?.label.toLowerCase()}
              </p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 bg-primary text-bg-primary px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary border-b border-border">
                  <tr>
                    <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Label
                    </th>
                    <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">
                      Value
                    </th>
                    <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 sm:px-6 text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {options.map((option) => (
                    <tr
                      key={option._id}
                      className={`hover:bg-bg-secondary transition-colors ${
                        !option.isActive ? "opacity-60" : ""
                      }`}
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-medium text-text-primary">{option.label}</div>
                        <div className="text-sm text-text-secondary md:hidden">
                          {option.value}
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6 hidden md:table-cell">
                        <code className="text-xs bg-bg-secondary px-2 py-1 rounded text-text-primary">
                          {option.value}
                        </code>
                      </td>
                      <td className="py-4 px-4 sm:px-6 hidden lg:table-cell">
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {option.description || "—"}
                        </p>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <button
                          onClick={() => handleToggleActive(option)}
                          className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            option.isActive
                              ? "bg-success/10 text-success border border-success/20 hover:bg-success/20"
                              : "bg-error/10 text-error border border-error/20 hover:bg-error/20"
                          }`}
                        >
                          {option.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(option)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(option)}
                            className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-bg-primary rounded-lg border border-border max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-text-primary">
                    {editingOption ? "Edit" : "Add New"} {getTypeInfo(selectedType)?.singular}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Display Label *
                    </label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder={
                        selectedType === 'amenity' ? 'e.g., Sound System' :
                        selectedType === 'eventType' ? 'e.g., Exhibition' :
                        'e.g., Sharp Objects'
                      }
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description..."
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-bg-secondary resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 bg-bg-secondary text-text-primary rounded-lg hover:bg-border transition-colors cursor-pointer font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary text-bg-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer font-semibold"
                    >
                      {editingOption ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, option: null })}
        onConfirm={confirmDelete}
        title="Delete Venue Option"
        message={`Are you sure you want to delete "${deleteConfirm.option?.label}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default VenueOptionsManagement;
