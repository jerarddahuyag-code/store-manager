import { useEffect, useState } from 'react';
import { History, Loader2 } from 'lucide-react';
import { subscribeEntityActivity } from '../../services/activityLogs';
import { formatDate } from '../../utils/formatters';
import type { ActivityEntityType, ActivityLog } from '../../types';
import styles from './ActivityTimeline.module.css';

interface ActivityTimelineProps {
  entityType: ActivityEntityType;
  entityId: string;
  limitCount?: number;
}

export default function ActivityTimeline({
  entityType,
  entityId,
  limitCount = 5,
}: ActivityTimelineProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeEntityActivity(entityType, entityId, limitCount, (newLogs) => {
      setLogs(newLogs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [entityType, entityId, limitCount]);

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <History size={16} />
        <span>Recent Activity</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Loading logs...
        </div>
      ) : logs.length === 0 ? (
        <div className={styles.empty}>No activity recorded yet.</div>
      ) : (
        <div className={styles.timeline}>
          {logs.map((log) => (
            <div key={log.id} className={styles.item}>
              <div className={styles.bullet} />
              <div className={styles.content}>
                <span className={styles.summary}>{log.summary}</span>
                <span className={styles.meta}>
                  {log.performedBy?.fullName || 'User'} · {formatDate(log.timestamp)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
