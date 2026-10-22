import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

export interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const Icon = type === 'success' ? FaCheckCircle : FaExclamationCircle;

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50 max-w-md animate-slide-in`}
    >
      <Icon className="text-2xl flex-shrink-0" />
      <p className="flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors"
      >
        <FaTimes />
      </button>
    </div>
  );
};
