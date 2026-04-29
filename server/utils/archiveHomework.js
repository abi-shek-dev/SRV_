import Homework from '../models/Homework.js';

/**
 * Auto-archive homework older than 14 days.
 */
export async function archiveOldHomework() {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const result = await Homework.updateMany(
      { createdAt: { $lt: fourteenDaysAgo }, archived: { $ne: true } },
      { $set: { archived: true } }
    );

    if (result?.modifiedCount > 0) {
      console.log(`[Archive] Archived ${result.modifiedCount} homework record(s) older than 14 days.`);
    }
    return result;
  } catch (error) {
    console.error('[Archive] Error archiving old homework:', error.message);
    return null;
  }
}
