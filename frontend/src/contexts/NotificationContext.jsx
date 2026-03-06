import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

/**
 * Notification Context - Manages notifications for both buyers and sellers
 * Supports bidirectional notifications with payment flow
 */
const NotificationContext = createContext();

export function NotificationProvider({ children, user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Check for new notifications from localStorage (simulates real-time updates)
  const checkForNewNotifications = useCallback(() => {
    if (!user) return;

    // Check localStorage for pending notifications (works for both buyers and sellers)
    const notificationKey = user.role === 'seller' 
      ? `seller_notifications_${user.email}`
      : `buyer_notifications_${user.email}`;
    
    const pendingNotifications = localStorage.getItem(notificationKey);
    
    if (pendingNotifications) {
      try {
        const notificationData = JSON.parse(pendingNotifications);
        
        // IMPORTANT: Only show success notifications, not error notifications
        // Error notifications should be shown immediately via toast, not stored
        const isErrorNotification = notificationData.type?.includes('error') || 
                                    notificationData.type?.includes('failed') ||
                                    notificationData.title?.includes('failed') ||
                                    notificationData.title?.includes('Failed');
        
        if (isErrorNotification) {
          // Clear error notifications immediately without showing
          localStorage.removeItem(notificationKey);
          console.log('🧹 Cleared old error notification:', notificationData.type);
          return;
        }
        
        // Check if we haven't already shown this notification
        const alreadyShown = notifications.some(n => 
          n.orderId === notificationData.orderId && 
          n.type === notificationData.type
        );
        
        if (!alreadyShown) {
          // Add the notification based on type
          addNotification({
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            orderId: notificationData.orderId,
            productName: notificationData.productName,
            amount: notificationData.amount,
            buyerName: notificationData.buyerName,
            icon: notificationData.icon || '🔔'
          });
          
          // Clear the notification from localStorage after showing
          localStorage.removeItem(notificationKey);
        }
      } catch (error) {
        console.error('Error parsing notification:', error);
        // Clear corrupted notification
        localStorage.removeItem(notificationKey);
      }
    }
  }, [user, notifications]);

  // useEffect to set up polling and cleanup
  useEffect(() => {
    if (!user) return;

    // CLEANUP: Clear any old error notifications on mount
    const cleanupOldErrorNotifications = () => {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('notifications')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsed = JSON.parse(data);
              // Remove if it's an error notification
              if (parsed.type?.includes('error') || 
                  parsed.type?.includes('failed') ||
                  parsed.title?.includes('failed') ||
                  parsed.title?.includes('Failed')) {
                localStorage.removeItem(key);
                console.log('🧹 Cleaned up old error notification:', key);
              }
            }
          } catch (e) {
            // Remove corrupted data
            localStorage.removeItem(key);
          }
        }
      });
    };

    // Clean up on mount
    cleanupOldErrorNotifications();

    // Check for notifications every 2 seconds (works for both buyers and sellers)
    const interval = setInterval(() => {
      checkForNewNotifications();
    }, 2000);

    // Check immediately on mount
    checkForNewNotifications();

    return () => clearInterval(interval);
  }, [user, checkForNewNotifications]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    toast.success(notification.title, {
      description: notification.message,
      duration: 8000,
      action: {
        label: 'View Order',
        onClick: () => {
          if (notification.orderId) {
            window.location.href = '/orders';
          }
        }
      }
    });

    // Trigger confetti for positive notifications
    if (notification.type === 'order_approved' || 
        notification.type === 'new_order' || 
        notification.type === 'payment_received' ||
        notification.type === 'payment_released' ||
        notification.type === 'payment_released_seller') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: notification.type === 'new_order' 
          ? ['#3b82f6', '#60a5fa', '#93c5fd']  // Blue for new orders
          : ['#10b981', '#34d399', '#6ee7b7']  // Green for approvals/payments
      });
    }

    // Trigger different confetti for refunds (yellow/orange)
    if (notification.type === 'order_rejected_refund') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fcd34d']  // Orange/yellow for refunds
      });
    }

    // Show notification modal
    setShowNotificationModal(true);

    // Auto-hide modal after 10 seconds
    setTimeout(() => {
      setShowNotificationModal(false);
    }, 10000);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Simulate order approval notification (for demo)
  const simulateOrderApproval = (orderData) => {
    addNotification({
      type: 'order_approved',
      title: '🎉 Order Approved!',
      message: `Your order for ${orderData.productName} has been approved by the seller. You can now proceed with payment.`,
      orderId: orderData.orderId,
      productName: orderData.productName,
      amount: orderData.amount,
      icon: '✅'
    });
  };

  const value = {
    notifications,
    unreadCount,
    showNotificationModal,
    setShowNotificationModal,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    simulateOrderApproval
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
