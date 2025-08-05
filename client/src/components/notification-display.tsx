import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NotificationLog {
  id: string;
  type: 'email' | 'push';
  recipient: string;
  subject: string;
  status: 'sent' | 'simulated' | 'failed';
  timestamp: Date;
}

export default function NotificationDisplay() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);

  useEffect(() => {
    // Load notification logs from localStorage
    const savedLogs = localStorage.getItem('notificationLogs');
    if (savedLogs) {
      const logs = JSON.parse(savedLogs).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
      setNotifications(logs.slice(-10)); // Show last 10 notifications
    }
  }, []);

  const addNotificationLog = (notification: Omit<NotificationLog, 'id' | 'timestamp'>) => {
    const newNotification: NotificationLog = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    const updatedNotifications = [newNotification, ...notifications].slice(0, 10);
    setNotifications(updatedNotifications);
    
    // Save to localStorage
    localStorage.setItem('notificationLogs', JSON.stringify(updatedNotifications));
  };

  // Expose function to window for testing
  useEffect(() => {
    (window as any).addNotificationLog = addNotificationLog;
  }, [notifications]);

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications
          </CardTitle>
          <CardDescription>
            Notification activity will appear here when leads are created or updated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No notifications sent yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Recent Notifications
        </CardTitle>
        <CardDescription>
          Last {notifications.length} notification(s) sent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => (
          <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              {notification.type === 'email' ? (
                <Mail className="h-4 w-4 text-blue-500" />
              ) : (
                <Smartphone className="h-4 w-4 text-green-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium truncate">{notification.subject}</p>
                <Badge
                  variant={
                    notification.status === 'sent' ? 'default' :
                    notification.status === 'simulated' ? 'secondary' : 'destructive'
                  }
                  className="text-xs"
                >
                  {notification.status === 'sent' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {notification.status === 'sent' ? 'Sent' : 
                   notification.status === 'simulated' ? 'Simulated' : 'Failed'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                To: {notification.recipient}
              </p>
              <p className="text-xs text-muted-foreground">
                {notification.timestamp.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}