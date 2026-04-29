import User from '../models/User.js';
import { buildParentDisplayName } from './parentProfile.js';

export const normalizeParentMobileNumber = (value) => (
  String(value ?? '').replace(/\D/g, '').slice(0, 15)
);

export const hasParentMobileNumber = (value) => Boolean(normalizeParentMobileNumber(value));

export const syncParentAccountDetails = async (student, fallbackName) => {
  if (!student?._id) return null;

  const parentName = buildParentDisplayName(student, fallbackName || `Parent of ${student.name || 'Student'}`);
  const mobileNumber = normalizeParentMobileNumber(student.parentMobileNumber);

  // Find parent user and update name + mobileNumber
  const parentUser = await User.findOne({ role: 'parent', student_id: student._id });
  if (parentUser) {
    await User.updateById(parentUser._id, { name: parentName, mobileNumber });
  }

  return { parentName, mobileNumber };
};
