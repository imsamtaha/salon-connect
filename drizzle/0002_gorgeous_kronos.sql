ALTER TABLE `customer_profiles` ADD `lastAppointmentId` varchar(128);--> statement-breakpoint
ALTER TABLE `customer_profiles` ADD `lastAppointmentStatus` enum('pending','approved','rejected','rescheduled','cancelled');--> statement-breakpoint
ALTER TABLE `customer_profiles` ADD `lastAppointmentAt` timestamp;--> statement-breakpoint
ALTER TABLE `customer_profiles` ADD `lastReminderAt` timestamp;--> statement-breakpoint
ALTER TABLE `customer_profiles` ADD `reminderStatus` enum('not_scheduled','scheduled','sent','cancelled','failed') DEFAULT 'not_scheduled' NOT NULL;