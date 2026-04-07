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
CREATE TABLE `debts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`debtorName` varchar(255) NOT NULL,
	`amountUSD` decimal(15,2) DEFAULT '0',
	`amountIQD` decimal(15,0) DEFAULT '0',
	`description` text,
	`date` varchar(20),
	`status` enum('pending','partial','paid') NOT NULL DEFAULT 'pending',
	`paidAmountUSD` decimal(15,2) DEFAULT '0',
	`paidAmountIQD` decimal(15,0) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debts_id` PRIMARY KEY(`id`)
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
	`type` int NOT NULL,
	`accountId` int NOT NULL,
	`accountName` varchar(255),
	`portId` varchar(50) NOT NULL,
	`accountType` varchar(50) NOT NULL,
	`date` varchar(20) NOT NULL,
	`amountUSD` decimal(15,2) DEFAULT '0',
	`amountIQD` decimal(15,0) DEFAULT '0',
	`description` text,
	`goodsType` varchar(255),
	`truckNumber` varchar(100),
	`driverName` varchar(255),
	`manifestNumber` varchar(100),
	`containerNumber` varchar(100),
	`governorate` varchar(100),
	`notes` text,
	`receiptNumber` varchar(100),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
