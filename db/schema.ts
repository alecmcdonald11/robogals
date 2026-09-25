import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const trainingSessions = sqliteTable("training_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sessionType: text("session_type").notNull().default("training"),
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

export const trainedVolunteers = sqliteTable("trained_volunteers", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  trainingTitle: text("training_title").notNull(),
  fullName: text("full_name").notNull(),
  studentNumber: text("student_number").notNull(),
  email: text("email"),
  markedAt: text("marked_at").notNull(),
}, (table) => [
  uniqueIndex("trained_session_student_unique").on(table.sessionId, table.studentNumber),
]);

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

export const trainingModules = sqliteTable("training_modules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  videoKey: text("video_key").notNull(),
  status: text("status").notNull().default("published"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const moduleQuestions = sqliteTable("module_questions", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => trainingModules.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  questionType: text("question_type").notNull(),
  optionsJson: text("options_json").notNull(),
  correctJson: text("correct_json").notNull(),
  imageKey: text("image_key"),
  position: integer("position").notNull(),
  createdAt: text("created_at").notNull(),
});

export const moduleProgress = sqliteTable("module_progress", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => trainingModules.id, { onDelete: "cascade" }),
  questionId: text("question_id").notNull().references(() => moduleQuestions.id, { onDelete: "cascade" }),
  studentNumber: text("student_number").notNull(),
  fullName: text("full_name").notNull(),
  answeredAt: text("answered_at").notNull(),
}, (table) => [
  uniqueIndex("module_progress_student_question_unique").on(table.moduleId, table.studentNumber, table.questionId),
]);

export const moduleCompletions = sqliteTable("module_completions", {
  id: text("id").primaryKey(),
  moduleId: text("module_id").notNull().references(() => trainingModules.id, { onDelete: "cascade" }),
  studentNumber: text("student_number").notNull(),
  fullName: text("full_name").notNull(),
  completedAt: text("completed_at").notNull(),
}, (table) => [
  uniqueIndex("module_completion_student_unique").on(table.moduleId, table.studentNumber),
]);
