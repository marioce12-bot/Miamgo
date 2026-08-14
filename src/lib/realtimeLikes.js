import { onValue, ref, remove, set } from "firebase/database";
import { realtimeDb } from "./firebase";

const likesRef = (postId) => ref(realtimeDb, `postLikes/${String(postId)}`);

export function subscribePostLikes(postId, userId, onChange) {
  return onValue(likesRef(postId), (snapshot) => {
    const likes = snapshot.val() || {};
    onChange({ count: Object.keys(likes).length, liked: Boolean(userId && likes[userId]) });
  });
}

export function setRealtimePostLike(postId, userId, isLiked) {
  const userLikeRef = ref(realtimeDb, `postLikes/${String(postId)}/${userId}`);
  return isLiked ? set(userLikeRef, true) : remove(userLikeRef);
}
