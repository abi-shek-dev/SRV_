import PollResponse from '../models/PollResponse.js';
import { buildPollAnalytics } from './pollUtils.js';

export async function hydratePolls(polls, { respondentId } = {}) {
  if (!Array.isArray(polls) || polls.length === 0) return [];

  const pollIds = polls.map(poll => poll._id);
  const responses = await PollResponse.find({ pollId: { $in: pollIds } });

  const groupedResponses = responses.reduce((acc, response) => {
    const key = String(response.pollId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(response);
    return acc;
  }, {});

  return polls.map((poll) => {
    const pollObject = typeof poll.toObject === 'function' ? poll.toObject() : poll;
    const pollResponses = groupedResponses[String(poll._id)] || [];
    const myResponse = respondentId
      ? pollResponses.find(r => String(r.respondentId) === String(respondentId)) || null
      : null;

    return {
      ...pollObject,
      totalResponses: pollResponses.length,
      analytics: buildPollAnalytics(pollObject, pollResponses),
      myResponse
    };
  });
}
