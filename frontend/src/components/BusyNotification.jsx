// components/BusyNotification.jsx
import { useEffect } from 'react';
import useCallStore from '../store/useCallStore';

const BusyNotification = () => {
  const { busyNotification, clearBusyNotification } = useCallStore();

  useEffect(() => {
    if (busyNotification) {
      // Tự động clear notification sau 10 giây
      const timer = setTimeout(() => {
        clearBusyNotification();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [busyNotification, clearBusyNotification]);

  if (!busyNotification) {
    return null;
  }

  const { caller, timestamp } = busyNotification;
  const timeString = new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg border-l-4 border-blue-700">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-lg">📞</span>
            </div>
          </div>
          
          <div className="ml-3 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Cuộc gọi nhỡ</h4>
              <button
                onClick={clearBusyNotification}
                className="text-blue-200 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>
            
            <div className="mt-1">
              <p className="text-sm">
                <span className="font-medium">{caller.name}</span> đã gọi cho bạn
              </p>
              <p className="text-xs text-blue-200 mt-1">
                {timeString} - Bạn đang trong cuộc gọi khác
              </p>
            </div>
            
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => {
                  // Có thể thêm logic gọi lại sau
                  console.log('Gọi lại:', caller);
                  clearBusyNotification();
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Gọi lại
              </button>
              <button
                onClick={clearBusyNotification}
                className="px-3 py-1 bg-blue-400 text-white text-xs rounded hover:bg-blue-500 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusyNotification;
