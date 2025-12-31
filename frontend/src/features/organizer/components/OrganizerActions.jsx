import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

const OrganizerActions = ({ organizer }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Navigate directly to the organizer details page
    navigate(`/admin/organizer/${organizer._id}`);
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors cursor-pointer"
      title="View organizer details and actions"
    >
      <Settings className="w-4 h-4" />
    </button>
  );
};

export default OrganizerActions;
