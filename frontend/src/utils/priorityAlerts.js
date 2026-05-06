import toast from 'react-hot-toast';

export const showPriorityAlert = (message, priority) => {
  switch (priority) {
    case 'high':
      toast.error(message, { duration: 5000 });
      break;
    case 'medium':
      toast(message, { icon: '⚠️', duration: 4000 });
      break;
    case 'low':
      toast.success(message, { duration: 3000 });
      break;
    default:
      toast(message);
  }
};
