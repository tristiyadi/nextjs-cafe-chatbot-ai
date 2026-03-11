CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"role" text DEFAULT 'customer',
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"icon" text,
	CONSTRAINT "category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "customize_option" (
	"id" text PRIMARY KEY NOT NULL,
	"menu_item_id" text,
	"group_name" text NOT NULL,
	"option_name" text NOT NULL,
	"extra_price" numeric(12, 2) DEFAULT '0.00',
	"is_default" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "menu_item" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"image_url" text,
	"is_available" boolean DEFAULT true,
	"is_popular" boolean DEFAULT false,
	"embedding_text" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "item_customization" (
	"id" text PRIMARY KEY NOT NULL,
	"order_item_id" text,
	"customize_option_id" text,
	"option_value" text,
	"extra_price" numeric(12, 2) DEFAULT '0.00'
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"menu_item_id" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"customer_name" text,
	"table_number" text,
	"status" text DEFAULT 'pending',
	"notes" text,
	"total_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"title" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customize_option" ADD CONSTRAINT "customize_option_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_customization" ADD CONSTRAINT "item_customization_order_item_id_order_item_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_customization" ADD CONSTRAINT "item_customization_customize_option_id_customize_option_id_fk" FOREIGN KEY ("customize_option_id") REFERENCES "public"."customize_option"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_session_id_chat_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;