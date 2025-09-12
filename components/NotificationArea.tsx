import React from 'react';

interface NotificationAreaProps {
    notifications: { id: number; message: string }[];
    onDismiss: (id: number) => void;
}

const NotificationArea: React.FC<NotificationAreaProps> = ({ notifications, onDismiss }) => {
    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md flex flex-col items-center gap-2">
            {notifications.map(notification => (
                <div 
                    key={notification.id} 
                    className="bg-teal-600/90 text-white px-6 py-2 rounded-full shadow-lg animate-fade-in"
                    onClick={() => onDismiss(notification.id)}
                >
                    {notification.message}
                </div>
            ))}
        </div>
    );
};

export default NotificationArea;
