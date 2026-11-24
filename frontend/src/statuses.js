// The four statuses the backend knows, with the words the page shows for them.
export const STATUS_LABELS = {
  NOT_STARTED: "Not started",
  LEARNING: "Learning",
  DONE: "Done",
  STUCK: "Stuck",
};

// "Where you are" only moves forward: where each status may go next. Nothing goes back to
// Not started, and Done is final.
export const NEXT_STATUSES = {
  NOT_STARTED: ["LEARNING", "STUCK", "DONE"],
  LEARNING: ["STUCK", "DONE"],
  STUCK: ["LEARNING", "DONE"],
  DONE: [],
};
