// Status order controls board columns; all existing tickets can move both ways.
export const statusNames = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Tested', 'Closed', 'Reopened'];
export const states = Object.fromEntries(statusNames.map(status => [status, statusNames.filter(target => target !== status)]));
export const canMove = (from, to) => states[from]?.includes(to) ?? false;
