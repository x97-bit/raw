CREATE TABLE `account_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`typeId` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `account_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `account_types_typeId_unique` UNIQUE(`typeId`)
);
--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`accountType` varchar(50) NOT NULL,
	`portId` varchar(50),
	`currency` varchar(10),
	`merchantReport` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(100) NOT NULL,
	`password` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('admin','user') NOT NULL DEFAULT 'user',
	`permissions` json DEFAULT ('[]'),
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `app_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `cash_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`state` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cash_state_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_field_values` (
	`id` int AUTO_INCREMENT NOT NULL,
	`custom_field_id` int NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` int NOT NULL,
	`value` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `custom_field_values_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `custom_fields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`field_key` varchar(100) NOT NULL,
	`label` varchar(255) NOT NULL,
	`field_type` varchar(50) NOT NULL,
	`options` json,
	`default_value` varchar(255),
	`formula` json,
	`placement` varchar(50) DEFAULT 'transaction',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_fields_id` PRIMARY KEY(`id`),
	CONSTRAINT `custom_fields_field_key_unique` UNIQUE(`field_key`)
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debtorName` varchar(255) NOT NULL,
	`amountUSD` decimal(15,2) DEFAULT '0',
	`amountIQD` decimal(15,0) DEFAULT '0',
	`feeUSD` decimal(15,2) DEFAULT '0',
	`feeIQD` decimal(15,0) DEFAULT '0',
	`transType` varchar(100),
	`fxRate` decimal(15,2),
	`driverName` varchar(255),
	`carNumber` varchar(100),
	`goodType` varchar(255),
	`weight` decimal(15,2),
	`meters` decimal(15,2),
	`description` text,
	`date` varchar(20),
	`status` enum('pending','partial','paid') NOT NULL DEFAULT 'pending',
	`paidAmountUSD` decimal(15,2) DEFAULT '0',
	`paidAmountIQD` decimal(15,0) DEFAULT '0',
	`state` varchar(100),
	`fxNote` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expense_date` varchar(20) NOT NULL,
	`amount_usd` decimal(15,2) DEFAULT '0',
	`amount_iqd` decimal(15,0) DEFAULT '0',
	`description` text,
	`port_id` varchar(50) NOT NULL,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `field_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`section_key` varchar(100) NOT NULL,
	`field_key` varchar(100) NOT NULL,
	`visible` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `field_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goods_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `goods_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governorates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`trance_price` decimal(15,0),
	CONSTRAINT `governorates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_matching` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`paymentId` int NOT NULL,
	`amountUSD` decimal(15,2) DEFAULT '0',
	`amountIQD` decimal(15,0) DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_matching_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portId` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`section` varchar(50) NOT NULL,
	CONSTRAINT `ports_id` PRIMARY KEY(`id`),
	CONSTRAINT `ports_portId_unique` UNIQUE(`portId`)
);
--> statement-breakpoint
CREATE TABLE `special_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`amountUSD` decimal(15,2) DEFAULT '0',
	`amountIQD` decimal(15,0) DEFAULT '0',
	`description` text,
	`date` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `special_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ref_no` varchar(50),
	`direction` varchar(5) NOT NULL,
	`trans_date` varchar(20) NOT NULL,
	`account_id` int NOT NULL,
	`currency` varchar(10) DEFAULT 'BOTH',
	`driver_id` int,
	`vehicle_id` int,
	`good_type_id` int,
	`weight` decimal(15,2),
	`meters` decimal(15,2),
	`qty` int,
	`cost_usd` decimal(15,2) DEFAULT '0',
	`amount_usd` decimal(15,2) DEFAULT '0',
	`cost_iqd` decimal(15,0) DEFAULT '0',
	`amount_iqd` decimal(15,0) DEFAULT '0',
	`amount_iqd2` decimal(15,0),
	`fee_usd` decimal(15,2) DEFAULT '0',
	`car_qty` int,
	`trans_price` decimal(15,0),
	`company_name` varchar(255),
	`meal_no` int,
	`gov_id` int,
	`notes` text,
	`trader_note` text,
	`record_type` varchar(20) DEFAULT 'shipment',
	`port_id` varchar(50) NOT NULL,
	`account_type` varchar(50) NOT NULL,
	`created_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plateNumber` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`)
);
