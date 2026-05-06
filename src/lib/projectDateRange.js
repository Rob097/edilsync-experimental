export function hasInvalidProjectDateRange(startDate, endDate) {
  return Boolean(startDate && endDate && endDate < startDate);
}