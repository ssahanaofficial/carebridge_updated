import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import type { UserRole } from '../types';

export interface FeedbackItem {
  id: string;
  role: UserRole | 'visitor';
  roleLabel: string;
  rating: number; // 1 to 5
  category: string;
  subject: string;
  message: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  urgency: 'low' | 'medium' | 'high';
  userUid?: string;
  userName?: string;
  userEmail?: string;
  facilityName?: string;
  metadata?: {
    userAgent?: string;
    platform?: string;
    screen?: string;
    resolved?: boolean;
  };
  createdAt: string;
}

const LOCAL_STORAGE_KEY = 'carebridge_feedbacks';

const getLocalFeedbacks = (): FeedbackItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalFeedbacks = (items: FeedbackItem[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota issues
  }
};

type FeedbackListener = (items: FeedbackItem[]) => void;
const listeners = new Set<FeedbackListener>();

const notifyListeners = (items: FeedbackItem[]) => {
  listeners.forEach((listener) => {
    try {
      listener(items);
    } catch (err) {
      console.error('[FeedbackService] Error in listener callback:', err);
    }
  });
};

export const saveFeedback = async (
  payload: Omit<FeedbackItem, 'id' | 'createdAt'>
): Promise<FeedbackItem> => {
  const id = `FB-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const createdAt = new Date().toISOString();

  const feedbackRecord: FeedbackItem = {
    ...payload,
    id,
    createdAt
  };

  // 1. Always update local storage and notify listeners
  const current = getLocalFeedbacks();
  const updated = [feedbackRecord, ...current];
  saveLocalFeedbacks(updated);
  notifyListeners(updated);

  // 2. Persist to live Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const feedbackRef = doc(collection(db, 'feedbacks'), id);
      await setDoc(feedbackRef, feedbackRecord);
    } catch (error) {
      console.warn('[FeedbackService] Failed to write feedback to Firestore, using local backup:', error);
    }
  }

  return feedbackRecord;
};

export const fetchFeedbacks = async (): Promise<FeedbackItem[]> => {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items: FeedbackItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as FeedbackItem);
      });
      if (items.length > 0) {
        saveLocalFeedbacks(items);
        return items;
      }
    } catch (error) {
      console.warn('[FeedbackService] Error fetching from Firestore, falling back to local storage:', error);
    }
  }
  return getLocalFeedbacks();
};

export const subscribeFeedbacks = (callback: FeedbackListener): (() => void) => {
  listeners.add(callback);
  // Initial callback with local items
  callback(getLocalFeedbacks());

  let unsubscribeFirestore: (() => void) | null = null;
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
      unsubscribeFirestore = onSnapshot(
        q,
        (snapshot) => {
          const items: FeedbackItem[] = [];
          snapshot.forEach((docSnap) => {
            items.push(docSnap.data() as FeedbackItem);
          });
          saveLocalFeedbacks(items);
          notifyListeners(items);
        },
        (error) => {
          console.warn('[FeedbackService] Firestore subscription warning:', error);
        }
      );
    } catch {
      // Ignore
    }
  }

  return () => {
    listeners.delete(callback);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
};

