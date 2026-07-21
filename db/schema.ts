import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const trainingSessions = sqliteTable("training_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  sessionDate: text("session_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  location: text("location").notNull(),
  capacity: integer("capacity").notNull(),
  registrationDeadline: text("registration_deadline"),
  status: text("status").notNull().default("available"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const registrations = sqliteTable("registrations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => trainingSessions.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  studentNumber: text("student_number").notNull(),
  email: text("email"),
  bookingReference: text("booking_reference").notNull().unique(),
  status: text("status").notNull().default("confirmed"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("registration_session_student_unique").on(table.sessionId, table.studentNumber),
]);
