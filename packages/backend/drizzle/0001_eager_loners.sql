CREATE TABLE `monthly_contributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`household_id` integer NOT NULL,
	`month` text NOT NULL,
	`user_id` integer NOT NULL,
	`revenue_cents` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`household_id`) REFERENCES `households`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `monthly_contributions_household_id_month_user_id_unique` ON `monthly_contributions` (`household_id`,`month`,`user_id`);--> statement-breakpoint
ALTER TABLE `transactions` ADD `excluded` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `excluded_reason` text;