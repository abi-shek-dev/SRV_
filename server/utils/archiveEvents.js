import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import { buildParentDisplayName } from './parentProfile.js';

export async function archivePastEvents() {
  try {
    const expiredEvents = await Event.findExpiredActive();

    for (const event of expiredEvents) {
      const registrations = await EventRegistration.findWithDetails({ eventId: event._id });

      event.status = 'CLOSED';
      event.archivedAt = new Date();
      event.archiveSummary = {
        registrationCount: registrations.length,
        enrolledStudents: registrations.map((reg) => ({
          studentName: reg.studentId?.name || 'Student',
          parentName: buildParentDisplayName(reg.studentId, ''),
          acknowledgedAt: reg.acknowledgedAt || reg.createdAt
        }))
      };

      await Event.save(event);

      if (registrations.length > 0) {
        await EventRegistration.deleteMany({ eventId: event._id });
      }
    }
  } catch (error) {
    console.error('[Archive Events] Error archiving past events:', error.message);
  }
}
