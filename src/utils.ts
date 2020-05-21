import { DateTime } from 'luxon';

export const parseDate = (input): Date => {
  const date = DateTime.fromISO(input);

  if (!date.isValid) {
    throw new Error(`arg '${input}' must be an ISO 8601 date format`);
  }

  return date.toUTC().toJSDate();
};
