CREATE TABLE `module_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`student_number` text NOT NULL,
	`full_name` text NOT NULL,
	`completed_at` text NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `training_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `module_completion_student_unique` ON `module_completions` (`module_id`,`student_number`);--> statement-breakpoint
CREATE TABLE `module_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`question_id` text NOT NULL,
	`student_number` text NOT NULL,
	`full_name` text NOT NULL,
	`answered_at` text NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `training_modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `module_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `module_progress_student_question_unique` ON `module_progress` (`module_id`,`student_number`,`question_id`);--> statement-breakpoint
CREATE TABLE `module_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`prompt` text NOT NULL,
	`question_type` text NOT NULL,
	`options_json` text NOT NULL,
	`correct_json` text NOT NULL,
	`image_key` text,
	`position` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `training_modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `training_modules` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`video_key` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
