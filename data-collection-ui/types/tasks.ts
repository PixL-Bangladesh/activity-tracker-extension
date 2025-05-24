import type { eventWithTime } from "rrweb";
import type { Session } from "./Session";

export type TaskEventBucketType = {
  session: Session;
  events: eventWithTime[];
  taskId: string;
  userId: string;
};
