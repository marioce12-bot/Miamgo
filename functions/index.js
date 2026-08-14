const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");

initializeApp();

const db = getFirestore();

exports.cleanupExpiredStories = onSchedule({
  region: "europe-west1",
  schedule: "every 15 minutes",
  timeZone: "Africa/Porto-Novo",
  timeoutSeconds: 120,
  memory: "256MiB",
}, async () => {
  const snapshot = await db.collection("stories")
    .where("expiresAt", "<=", Timestamp.now())
    .limit(100)
    .get();

  await Promise.all(snapshot.docs.map((story) => db.recursiveDelete(story.ref)));
  console.log(`Deleted ${snapshot.size} expired stories.`);
});
