import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Publication, PublicationComment } from "@/lib/firestore/models";

function database() {
  if (!db) throw new Error("Firebase n'est pas configuré.");
  return db;
}

export function subscribePublications(callback: (posts: Publication[]) => void): Unsubscribe {
  return onSnapshot(collection(database(), "publications"), (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Publication).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)));
  });
}

export async function createPublication(restaurantId: string, imageUrl: string, text: string): Promise<void> {
  const reference = doc(collection(database(), "publications"));
  await setDoc(reference, { restaurantId, imageUrl, text: text.trim(), likeCount: 0, commentCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export function subscribePostLikes(postId: string, userId: string, callback: (count: number, liked: boolean) => void): Unsubscribe {
  return onSnapshot(collection(database(), "publications", postId, "likes"), (snapshot) => callback(snapshot.size, snapshot.docs.some((item) => item.id === userId)));
}

export async function togglePostLike(postId: string, userId: string, liked: boolean): Promise<void> {
  const reference = doc(database(), "publications", postId, "likes", userId);
  if (liked) await deleteDoc(reference);
  else await setDoc(reference, { userId, createdAt: serverTimestamp() });
}

export function subscribePostComments(postId: string, callback: (comments: PublicationComment[]) => void): Unsubscribe {
  return onSnapshot(collection(database(), "publications", postId, "comments"), (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as PublicationComment).sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))));
}

export async function addPostComment(postId: string, userId: string, text: string): Promise<void> {
  const reference = doc(collection(database(), "publications", postId, "comments"));
  await setDoc(reference, { userId, text: text.trim(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function saveSearchHistory(userId: string, value: string): Promise<void> {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return;
  await updateDoc(doc(database(), "users", userId), { searchHistory: [normalized], updatedAt: serverTimestamp() });
}
