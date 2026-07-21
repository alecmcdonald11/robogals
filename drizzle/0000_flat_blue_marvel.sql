CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`full_name` text NOT NULL,
	`student_number` text NOT NULL,
	`email` text,
	`booking_reference` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `training_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_booking_reference_unique` ON `registrations` (`booking_reference`);--> statement-breakpoint
CREATE UNIQUE INDEX `registration_session_student_unique` ON `registrations` (`session_id`,`student_number`);--> statement-breakpoint
CREATE TABLE `training_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`session_date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`location` text NOT NULL,
	`capacity` integer NOT NULL,
	`registration_deadline` text,
	`status` text DEFAULT 'available' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
