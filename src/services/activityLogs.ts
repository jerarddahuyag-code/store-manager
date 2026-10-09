import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getTimeMs } from '../utils/formatters';
import type { ActivityAction, ActivityEntityType, ActivityLog } from '../types';

interface CreateLogParams {
  storeId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  summary: string;
  performedBy: {
    uid: string;
    fullName: string;
  };
}

/**
 * Records an immutable activity log entry in the root activity_logs collection.
 */
export async function logActivity(params: CreateLogParams): Promise<void> {
  try {
    const logsRef = collection(db, 'activity_logs');
    await addDoc(logsRef, {
      ...params,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to record activity log:', error);
  }
}

/**
 * Realtime listener for recent activity logs for a specific entity (e.g. store or product).
 */
export function subscribeEntityActivity(
  entityType: ActivityEntityType,
  entityId: string,
  limitCount = 5,
  onUpdate: (logs: ActivityLog[]) => void
): () => void {
  const logsRef = collection(db, 'activity_logs');
  const q = query(
    logsRef,
    where('entityId', '==', entityId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs: ActivityLog[] = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ActivityLog, 'id'>),
        }))
        .filter((l) => l.entityType === entityType)
        .sort((a, b) => getTimeMs(b.timestamp) - getTimeMs(a.timestamp))
        .slice(0, limitCount);
      onUpdate(logs);
    },
    (error) => {
      console.error('Error fetching activity logs:', error);
      onUpdate([]);
    }
  );
}
