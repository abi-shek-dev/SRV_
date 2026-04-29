import EventRegistration from '../models/EventRegistration.js';
import { buildParentDisplayName } from './parentProfile.js';

export async function hydrateEvents(events, { respondentId } = {}) {
  if (!Array.isArray(events) || events.length === 0) return [];

  const eventIds = events.map(event => event._id);
  // Use the joined query that populates parent/student/faculty
  const registrations = await EventRegistration.findWithDetails({ eventId: { $in: eventIds } });

  const groupedRegistrations = registrations.reduce((acc, reg) => {
    const key = String(reg.eventId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(reg);
    return acc;
  }, {});

  return events.map((event) => {
    const eventObject = typeof event.toObject === 'function' ? event.toObject() : event;
    const liveRegistrations = groupedRegistrations[String(event._id)] || [];

    const archivedRegistrations = Array.isArray(eventObject.archiveSummary?.enrolledStudents)
      ? eventObject.archiveSummary.enrolledStudents.map((entry, index) => ({
          _id: `archived-${eventObject._id}-${index}`,
          parentDisplayName: entry.parentName || '',
          parentId: entry.parentName ? { name: entry.parentName } : null,
          studentId: { name: entry.parentName ? `${entry.parentName} • ${entry.studentName}` : entry.studentName },
          participantNames: [],
          note: '',
          acknowledgedAt: entry.acknowledgedAt,
          isArchivedSnapshot: true
        }))
      : [];

    const eventRegistrations = liveRegistrations.length > 0 ? liveRegistrations : archivedRegistrations;

    const normalizedRegistrations = eventRegistrations.map((reg) => {
      if (reg.isArchivedSnapshot) return reg;
      const parentDisplayName = buildParentDisplayName(reg.studentId, reg.parentId?.name || 'Parent');
      return {
        ...reg,
        parentDisplayName,
        parentId: reg.parentId ? { ...reg.parentId, name: parentDisplayName } : reg.parentId
      };
    });

    const myRegistration = respondentId
      ? liveRegistrations.find(r => String(r.parentId?._id || r.parentId) === String(respondentId)) || null
      : null;

    return {
      ...eventObject,
      registrationCount: eventObject.archiveSummary?.registrationCount ?? normalizedRegistrations.length,
      registrations: normalizedRegistrations,
      myRegistration,
      isArchived: Boolean(eventObject.archivedAt)
    };
  });
}
