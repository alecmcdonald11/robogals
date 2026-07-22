CREATE TABLE `trained_volunteers` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`training_title` text NOT NULL,
	`full_name` text NOT NULL,
	`student_number` text NOT NULL,
	`email` text,
	`marked_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trained_session_student_unique` ON `trained_volunteers` (`session_id`,`student_number`);--> statement-breakpoint
ALTER TABLE `training_sessions` ADD `session_type` text DEFAULT 'training' NOT NULL;