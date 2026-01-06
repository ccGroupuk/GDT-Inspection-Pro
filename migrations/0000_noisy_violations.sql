CREATE TABLE "activity_report_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_type" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"metrics" text NOT NULL,
	"highlights" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"code_snippet" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "asset_faults" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" varchar NOT NULL,
	"reported_by_id" varchar NOT NULL,
	"assigned_to_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"task_id" varchar,
	"resolution" text,
	"resolved_at" timestamp,
	"resolved_by_id" varchar,
	"cleared_at" timestamp,
	"cleared_by_id" varchar,
	"repair_cost" numeric(10, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "asset_reminders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" varchar NOT NULL,
	"reminder_type" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"notified" boolean DEFAULT false,
	"notified_at" timestamp,
	"notify_owner" boolean DEFAULT true,
	"notify_admin" boolean DEFAULT true,
	"notify_assignee" boolean DEFAULT true,
	"acknowledged" boolean DEFAULT false,
	"acknowledged_by_id" varchar,
	"acknowledged_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_number" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"serial_number" text,
	"owner" text DEFAULT 'company' NOT NULL,
	"assigned_to_id" varchar,
	"purchase_date" timestamp,
	"purchase_price" numeric(10, 2),
	"supplier" text,
	"warranty_expiry" timestamp,
	"warranty_notes" text,
	"last_service_date" timestamp,
	"next_service_date" timestamp,
	"service_interval_days" integer,
	"mot_date" timestamp,
	"insurance_expiry" timestamp,
	"current_mileage" integer,
	"registration_number" text,
	"status" text DEFAULT 'active' NOT NULL,
	"location" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "assets_asset_number_unique" UNIQUE("asset_number")
);
--> statement-breakpoint
CREATE TABLE "build_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"filename" text,
	"description" text,
	"language" text,
	"status" text DEFAULT 'pending',
	"conversation_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" varchar,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar,
	"partner_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"all_day" boolean DEFAULT true,
	"event_type" text DEFAULT 'general' NOT NULL,
	"team_type" text DEFAULT 'in_house' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"confirmed_by_admin" boolean DEFAULT false,
	"confirmed_by_partner" boolean DEFAULT false,
	"confirmed_at" timestamp,
	"confirmed_by_client" boolean DEFAULT false,
	"client_confirmed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "captured_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar,
	"supplier_name" text,
	"product_title" text NOT NULL,
	"sku" text,
	"price" numeric(10, 2),
	"unit" text DEFAULT 'each',
	"product_url" text,
	"image_url" text,
	"captured_at" timestamp DEFAULT now(),
	"captured_by" varchar,
	"status" text DEFAULT 'pending',
	"job_id" varchar,
	"catalog_item_id" varchar,
	"markup_percent" numeric(5, 2) DEFAULT '20',
	"quantity" numeric(10, 2) DEFAULT '1'
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar,
	"type" text DEFAULT 'product' NOT NULL,
	"sku" text,
	"name" text NOT NULL,
	"description" text,
	"unit_of_measure" text DEFAULT 'each',
	"default_quantity" numeric(10, 2) DEFAULT '1',
	"unit_price" numeric(10, 2) NOT NULL,
	"cost_price" numeric(10, 2),
	"taxable" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"is_favorite" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "change_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"change_order_id" varchar NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "change_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"reference_number" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"reason" text,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_enabled" boolean DEFAULT false,
	"tax_rate" numeric(5, 2) DEFAULT '20',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"grand_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"client_response" text,
	"client_responded_at" timestamp,
	"show_in_portal" boolean DEFAULT false,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "change_orders_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "checklist_audit_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" varchar NOT NULL,
	"action" text NOT NULL,
	"actor_id" varchar,
	"actor_name" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_instances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"target_type" text NOT NULL,
	"target_id" varchar,
	"assigned_to_id" varchar,
	"status" text DEFAULT 'pending',
	"due_date" timestamp,
	"completed_at" timestamp,
	"completed_by_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"item_order" integer DEFAULT 0 NOT NULL,
	"is_required" boolean DEFAULT true,
	"requires_note" boolean DEFAULT false,
	"requires_photo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" varchar NOT NULL,
	"item_id" varchar NOT NULL,
	"value" boolean DEFAULT false,
	"text_value" text,
	"number_value" numeric(15, 4),
	"signature_data" text,
	"note" text,
	"photo_url" text,
	"completed_by_id" varchar,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"target_type" text NOT NULL,
	"is_mandatory" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "checklist_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "client_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" varchar NOT NULL,
	"invite_token" text NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "client_invites_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "client_portal_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" varchar NOT NULL,
	"user_id" varchar,
	"access_token" text,
	"token_expiry" timestamp,
	"password_hash" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "client_portal_access_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "company_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "connection_links" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"job_id" varchar NOT NULL,
	"party_type" text NOT NULL,
	"party_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"connected_at" timestamp,
	"declined_at" timestamp,
	"last_accessed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "connection_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"address" text,
	"postcode" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_type" text NOT NULL,
	"direction" text DEFAULT 'outbound',
	"contact_id" varchar,
	"job_id" varchar,
	"contact_name" text,
	"contact_phone" text,
	"notes" text,
	"outcome" text,
	"follow_up_date" timestamp,
	"follow_up_notes" text,
	"duration_minutes" integer,
	"linked_lead" boolean DEFAULT false,
	"lead_source" text,
	"employee_id" varchar,
	"activity_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_focus_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"focus_date" timestamp NOT NULL,
	"task_id" varchar,
	"job_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"priority" integer DEFAULT 1 NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emergency_callout_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"callout_id" varchar NOT NULL,
	"partner_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"acknowledged_at" timestamp,
	"responded_at" timestamp,
	"proposed_arrival_minutes" integer,
	"proposed_arrival_time" timestamp,
	"response_notes" text,
	"declined_at" timestamp,
	"decline_reason" text,
	"selected_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "emergency_callouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar,
	"client_name" text,
	"client_phone" text,
	"client_address" text,
	"client_postcode" text,
	"incident_type" text NOT NULL,
	"priority" text DEFAULT 'high' NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"broadcast_at" timestamp,
	"assigned_partner_id" varchar,
	"assigned_at" timestamp,
	"resolved_at" timestamp,
	"resolution_notes" text,
	"completed_at" timestamp,
	"completed_by_partner_id" varchar,
	"total_collected" numeric(10, 2),
	"callout_fee_percent" numeric(5, 2) DEFAULT '20.00',
	"callout_fee_amount" numeric(10, 2),
	"fee_paid" boolean DEFAULT false,
	"fee_paid_at" timestamp,
	"fee_transaction_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "employee_credentials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"password_hash" text NOT NULL,
	"must_change_password" boolean DEFAULT true,
	"last_password_change" timestamp,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employee_credentials_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "employee_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text,
	"file_size" integer,
	"expiry_date" timestamp,
	"notes" text,
	"uploaded_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"session_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"last_active_at" timestamp DEFAULT now(),
	CONSTRAINT "employee_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"postcode" text,
	"date_of_birth" timestamp,
	"role" text DEFAULT 'fitting' NOT NULL,
	"employment_type" text DEFAULT 'full_time',
	"start_date" timestamp,
	"end_date" timestamp,
	"hourly_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"pay_schedule" text DEFAULT 'weekly',
	"national_insurance" text,
	"tax_code" text,
	"bank_account_name" text,
	"bank_sort_code" text,
	"bank_account_number" text,
	"is_active" boolean DEFAULT true,
	"access_level" text DEFAULT 'standard' NOT NULL,
	"access_areas" text[],
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "financial_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"is_system" boolean DEFAULT false,
	"description" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"category_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"job_id" varchar,
	"partner_id" varchar,
	"invoice_id" varchar,
	"source_type" text NOT NULL,
	"gross_amount" numeric(10, 2),
	"partner_cost" numeric(10, 2),
	"profit_amount" numeric(10, 2),
	"receipt_url" text,
	"vendor" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "help_articles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" varchar,
	"title" text NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"audience" text DEFAULT 'all' NOT NULL,
	"video_url" text,
	"sort_order" integer DEFAULT 0,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "help_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"audience" text DEFAULT 'all' NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "internal_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"job_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"reference_number" text NOT NULL,
	"type" text DEFAULT 'quote' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_type" text,
	"discount_value" numeric(10, 2),
	"discount_amount" numeric(10, 2),
	"tax_enabled" boolean DEFAULT false,
	"tax_rate" numeric(5, 2),
	"tax_amount" numeric(10, 2),
	"grand_total" numeric(10, 2) NOT NULL,
	"deposit_required" boolean DEFAULT false,
	"deposit_type" text,
	"deposit_amount" numeric(10, 2),
	"deposit_calculated" numeric(10, 2),
	"due_date" timestamp,
	"payment_terms" text,
	"notes" text,
	"show_in_portal" boolean DEFAULT false,
	"sent_at" timestamp,
	"viewed_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "invoices_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "job_chat_message_reads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"read_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'message',
	"is_pinned" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_client_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text,
	"reference" text,
	"received_at" timestamp DEFAULT now(),
	"recorded_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_fund_allocations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"client_payment_id" varchar,
	"partner_id" varchar,
	"job_partner_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"purpose" text,
	"status" text DEFAULT 'pending',
	"paid_at" timestamp,
	"confirmed_at" timestamp,
	"allocated_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_note_attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"mime_type" text,
	"file_size" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"content" text NOT NULL,
	"visibility" text DEFAULT 'internal' NOT NULL,
	"author_name" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_partners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"partner_id" varchar NOT NULL,
	"charge_type" text DEFAULT 'fixed',
	"charge_amount" numeric(10, 2),
	"subcontract_fee_type" text,
	"subcontract_fee_value" numeric(10, 2),
	"subcontract_agreed" boolean DEFAULT false,
	"deposit_required" boolean DEFAULT false,
	"deposit_amount" numeric(10, 2),
	"notes" text,
	"status" text DEFAULT 'assigned',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_schedule_proposals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"proposed_start_date" timestamp NOT NULL,
	"proposed_end_date" timestamp,
	"status" text DEFAULT 'pending_client' NOT NULL,
	"proposed_by_role" text DEFAULT 'admin' NOT NULL,
	"proposed_by_partner_id" varchar,
	"client_response" text,
	"counter_proposed_date" timestamp,
	"counter_reason" text,
	"responded_at" timestamp,
	"linked_calendar_event_id" varchar,
	"admin_notes" text,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_surveys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"partner_id" varchar,
	"status" text DEFAULT 'requested' NOT NULL,
	"assigned_by" varchar,
	"proposed_date" timestamp,
	"proposed_time" text,
	"booking_status" text,
	"client_proposed_date" timestamp,
	"client_proposed_time" text,
	"client_notes" text,
	"client_responded_at" timestamp,
	"scheduled_date" timestamp,
	"scheduled_time" text,
	"admin_notes" text,
	"partner_notes" text,
	"survey_details" text,
	"decline_reason" text,
	"requested_at" timestamp DEFAULT now(),
	"accepted_at" timestamp,
	"declined_at" timestamp,
	"proposed_at" timestamp,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_number" text NOT NULL,
	"contact_id" varchar NOT NULL,
	"service_type" text NOT NULL,
	"description" text,
	"client_timeframe" text,
	"client_budget" text,
	"job_address" text NOT NULL,
	"job_postcode" text NOT NULL,
	"lead_source" text,
	"delivery_type" text DEFAULT 'in_house' NOT NULL,
	"trade_category" text,
	"partner_id" varchar,
	"status" text DEFAULT 'new_enquiry' NOT NULL,
	"quote_type" text DEFAULT 'fixed',
	"quoted_value" numeric(10, 2),
	"deposit_required" boolean DEFAULT false,
	"deposit_type" text DEFAULT 'fixed',
	"deposit_amount" numeric(10, 2),
	"deposit_received" boolean DEFAULT false,
	"partner_charge_type" text DEFAULT 'fixed',
	"partner_charge" numeric(10, 2),
	"ccc_margin" numeric(10, 2),
	"partner_invoice_received" boolean DEFAULT false,
	"partner_paid" boolean DEFAULT false,
	"partner_status" text,
	"partner_responded_at" timestamp,
	"partner_decline_reason" text,
	"partner_acceptance_acknowledged" boolean DEFAULT false,
	"share_quote_with_partner" boolean DEFAULT false,
	"share_notes_with_partner" boolean DEFAULT false,
	"tax_enabled" boolean DEFAULT false,
	"tax_rate" numeric(5, 2) DEFAULT '20',
	"discount_type" text,
	"discount_value" numeric(10, 2),
	"quote_response" text,
	"quote_responded_at" timestamp,
	"use_default_markup" boolean DEFAULT true,
	"custom_markup_percent" numeric(5, 2),
	"hide_client_cost_breakdown" boolean DEFAULT true,
	"cad_drawing_link" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "jobs_job_number_unique" UNIQUE("job_number")
);
--> statement-breakpoint
CREATE TABLE "owner_wellbeing_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"water_reminder_enabled" boolean DEFAULT true,
	"water_reminder_interval_minutes" integer DEFAULT 60,
	"stretch_reminder_enabled" boolean DEFAULT true,
	"stretch_reminder_interval_minutes" integer DEFAULT 90,
	"meal_reminder_enabled" boolean DEFAULT true,
	"meal_reminder_times" text DEFAULT '12:00,18:00',
	"work_cutoff_enabled" boolean DEFAULT true,
	"work_cutoff_time" text DEFAULT '18:30',
	"work_cutoff_message" text DEFAULT 'Time to switch to family mode!',
	"session_tracking_enabled" boolean DEFAULT true,
	"session_warning_minutes" integer DEFAULT 120,
	"daily_top3_enabled" boolean DEFAULT true,
	"morning_routine_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "owner_wellbeing_settings_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "partner_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" text DEFAULT 'unavailable' NOT NULL,
	"reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_fee_accruals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" varchar NOT NULL,
	"job_id" varchar NOT NULL,
	"fee_type" text DEFAULT 'percentage' NOT NULL,
	"fee_value" numeric(10, 2) NOT NULL,
	"job_value" numeric(10, 2) NOT NULL,
	"fee_amount" numeric(10, 2) NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"invoice_id" varchar,
	"accrual_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_invites" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" varchar NOT NULL,
	"invite_token" text NOT NULL,
	"email" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "partner_invites_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
CREATE TABLE "partner_invoice_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" varchar NOT NULL,
	"partner_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text,
	"payment_reference" text,
	"financial_transaction_id" varchar,
	"notes" text,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_invoices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"partner_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount_due" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"issue_date" timestamp,
	"due_date" timestamp,
	"paid_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "partner_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "partner_portal_access" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" varchar NOT NULL,
	"access_token" text,
	"token_expiry" timestamp,
	"password_hash" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "partner_portal_access_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "partner_quote_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" varchar NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"partner_id" varchar NOT NULL,
	"survey_id" varchar,
	"status" text DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_enabled" boolean DEFAULT false,
	"tax_rate" numeric(5, 2) DEFAULT '20',
	"tax_amount" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"valid_until" timestamp,
	"admin_notes" text,
	"responded_at" timestamp,
	"responded_by" varchar,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pay_periods" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"pay_date" timestamp NOT NULL,
	"period_type" text NOT NULL,
	"status" text DEFAULT 'open',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"due_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"paid_at" timestamp,
	"show_in_portal" boolean DEFAULT true,
	"audience" text DEFAULT 'client',
	"requested_by_role" text,
	"requested_by_id" varchar,
	"approval_status" text DEFAULT 'pending',
	"confirmed_by_id" varchar,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_adjustments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" varchar NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pay_period_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"regular_hours" numeric(10, 2) DEFAULT '0',
	"overtime_hours" numeric(10, 2) DEFAULT '0',
	"hourly_rate" numeric(10, 2) NOT NULL,
	"overtime_rate" numeric(10, 2),
	"gross_pay" numeric(10, 2) NOT NULL,
	"total_bonuses" numeric(10, 2) DEFAULT '0',
	"total_deductions" numeric(10, 2) DEFAULT '0',
	"net_pay" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'draft',
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "personal_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"task_type" text DEFAULT 'personal',
	"due_date" timestamp,
	"due_time" text,
	"reminder_minutes_before" integer DEFAULT 15,
	"location" text,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"is_morning_task" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portal_message_reads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" varchar NOT NULL,
	"read_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "portal_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"audience_type" text NOT NULL,
	"audience_id" varchar NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"message_type" text DEFAULT 'announcement' NOT NULL,
	"urgency" text DEFAULT 'normal' NOT NULL,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_price_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"store_name" text NOT NULL,
	"checked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_name" text NOT NULL,
	"brand" text,
	"store_name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'GBP',
	"size_value" integer,
	"size_unit" text,
	"size_label" text,
	"product_url" text,
	"external_sku" text,
	"price_source" text,
	"in_stock" boolean,
	"last_checked_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"catalog_item_id" varchar,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"line_total" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_template_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" varchar NOT NULL,
	"catalog_item_id" varchar,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quote_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category_id" varchar,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repo_knowledge" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"key" text NOT NULL,
	"content" text NOT NULL,
	"metadata" text,
	"branch" text DEFAULT 'main',
	"priority" integer DEFAULT 0,
	"token_count" integer,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "repo_knowledge_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" text NOT NULL,
	"commit_sha" text,
	"commit_message" text,
	"branch" text DEFAULT 'main',
	"files_changed" text,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "review_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"contact_id" varchar NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"facebook_clicked" boolean DEFAULT false,
	"google_clicked" boolean DEFAULT false,
	"trustpilot_clicked" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "seo_autopilot_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ran_at" timestamp DEFAULT now(),
	"slots_generated" integer DEFAULT 0,
	"posts_created" integer DEFAULT 0,
	"status" text DEFAULT 'success' NOT NULL,
	"error_message" text,
	"details" text
);
--> statement-breakpoint
CREATE TABLE "seo_autopilot_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enabled" boolean DEFAULT false,
	"facebook_enabled" boolean DEFAULT true,
	"facebook_posts_per_week" integer DEFAULT 3,
	"facebook_preferred_days" text[],
	"facebook_preferred_time" text DEFAULT '09:00',
	"instagram_enabled" boolean DEFAULT true,
	"instagram_posts_per_week" integer DEFAULT 3,
	"instagram_preferred_days" text[],
	"instagram_preferred_time" text DEFAULT '18:00',
	"google_enabled" boolean DEFAULT true,
	"google_posts_per_week" integer DEFAULT 2,
	"google_preferred_days" text[],
	"google_preferred_time" text DEFAULT '12:00',
	"project_showcase_weight" integer DEFAULT 40,
	"before_after_weight" integer DEFAULT 20,
	"tips_weight" integer DEFAULT 15,
	"testimonial_weight" integer DEFAULT 15,
	"seasonal_weight" integer DEFAULT 10,
	"auto_generate_ahead" integer DEFAULT 7,
	"require_approval" boolean DEFAULT true,
	"use_weekly_focus_images" boolean DEFAULT true,
	"notify_on_generation" boolean DEFAULT true,
	"notify_before_post" boolean DEFAULT true,
	"notify_before_post_hours" integer DEFAULT 2,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_autopilot_slots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"content_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"content_post_id" varchar,
	"weekly_focus_id" varchar,
	"approved_at" timestamp,
	"approved_by" text,
	"posted_at" timestamp,
	"post_error" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_brand_voice" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"custom_phrases" text[],
	"blacklisted_phrases" text[],
	"preferred_ctas" text[],
	"emoji_style" text DEFAULT 'moderate',
	"hashtag_preferences" text[],
	"location_keywords" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_business_profile" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"trade_type" text NOT NULL,
	"services_offered" text[],
	"service_locations" text[],
	"brand_tone" text DEFAULT 'professional' NOT NULL,
	"primary_goals" text[],
	"contact_phone" text,
	"contact_email" text,
	"website_url" text,
	"facebook_url" text,
	"instagram_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_content_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"weekly_focus_id" varchar,
	"job_id" varchar,
	"platform" text NOT NULL,
	"post_type" text DEFAULT 'update' NOT NULL,
	"target_location_id" varchar,
	"content" text NOT NULL,
	"hashtags" text,
	"call_to_action" text,
	"media_urls" text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"source" text DEFAULT 'manual',
	"scheduled_for" timestamp,
	"published_at" timestamp,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"review_notes" text,
	"views" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"engagement" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_google_business_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"google_business_url" text NOT NULL,
	"address" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_job_media" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"media_url" text NOT NULL,
	"media_type" text DEFAULT 'photo' NOT NULL,
	"caption" text,
	"is_before" boolean DEFAULT false,
	"is_approved_for_seo" boolean DEFAULT true,
	"tags" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_media_library" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"title" text,
	"description" text,
	"tags" text[],
	"is_ai_generated" boolean DEFAULT false,
	"ai_prompt" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "seo_weekly_focus" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start_date" timestamp NOT NULL,
	"week_end_date" timestamp NOT NULL,
	"primary_service" text NOT NULL,
	"primary_location" text NOT NULL,
	"supporting_keywords" text[],
	"seasonal_theme" text,
	"focus_image_url" text,
	"focus_image_caption" text,
	"recommended_post_count" integer DEFAULT 6,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_catalog_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"catalog_item_id" varchar NOT NULL,
	"supplier_sku" text,
	"supplier_price" numeric(10, 2),
	"min_order_qty" numeric(10, 2),
	"lead_time_days" integer,
	"is_preferred" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"account_number" text,
	"website" text,
	"lead_time_days" integer,
	"notes" text,
	"is_preferred" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp,
	"priority" text DEFAULT 'medium',
	"status" text DEFAULT 'pending',
	"assigned_to" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar,
	"activity_type" text NOT NULL,
	"entity_type" text,
	"entity_id" varchar,
	"description" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"clock_in" timestamp NOT NULL,
	"clock_out" timestamp,
	"break_minutes" integer DEFAULT 0,
	"entry_type" text DEFAULT 'work' NOT NULL,
	"job_id" varchar,
	"location" text,
	"notes" text,
	"total_hours" numeric(10, 2),
	"status" text DEFAULT 'pending',
	"approved_by" varchar,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trade_partners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"trade_category" text NOT NULL,
	"coverage_areas" text,
	"payment_terms" text,
	"commission_type" text DEFAULT 'percentage',
	"commission_value" numeric(10, 2) DEFAULT '10',
	"insurance_verified" boolean DEFAULT false,
	"rating" integer DEFAULT 5,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"emergency_available" boolean DEFAULT false,
	"emergency_note" text,
	"emergency_callout_fee" numeric(10, 2)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wellbeing_nudge_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"nudge_type" text NOT NULL,
	"action" text NOT NULL,
	"snoozed_until" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "asset_faults" ADD CONSTRAINT "asset_faults_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_faults" ADD CONSTRAINT "asset_faults_reported_by_id_employees_id_fk" FOREIGN KEY ("reported_by_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_faults" ADD CONSTRAINT "asset_faults_assigned_to_id_employees_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_faults" ADD CONSTRAINT "asset_faults_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_faults" ADD CONSTRAINT "asset_faults_resolved_by_id_employees_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_faults" ADD CONSTRAINT "asset_faults_cleared_by_id_employees_id_fk" FOREIGN KEY ("cleared_by_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_reminders" ADD CONSTRAINT "asset_reminders_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_reminders" ADD CONSTRAINT "asset_reminders_acknowledged_by_id_employees_id_fk" FOREIGN KEY ("acknowledged_by_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_assigned_to_id_employees_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_requests" ADD CONSTRAINT "build_requests_reviewed_by_employees_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_products" ADD CONSTRAINT "captured_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_products" ADD CONSTRAINT "captured_products_captured_by_employees_id_fk" FOREIGN KEY ("captured_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_products" ADD CONSTRAINT "captured_products_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "captured_products" ADD CONSTRAINT "captured_products_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_order_items" ADD CONSTRAINT "change_order_items_change_order_id_change_orders_id_fk" FOREIGN KEY ("change_order_id") REFERENCES "public"."change_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_orders" ADD CONSTRAINT "change_orders_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_audit_events" ADD CONSTRAINT "checklist_audit_events_instance_id_checklist_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."checklist_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_audit_events" ADD CONSTRAINT "checklist_audit_events_actor_id_employees_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_assigned_to_id_employees_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_completed_by_id_employees_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_template_id_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_instance_id_checklist_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."checklist_instances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_item_id_checklist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."checklist_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_responses" ADD CONSTRAINT "checklist_responses_completed_by_id_employees_id_fk" FOREIGN KEY ("completed_by_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_invites" ADD CONSTRAINT "client_invites_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_portal_access" ADD CONSTRAINT "client_portal_access_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_portal_access" ADD CONSTRAINT "client_portal_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_links" ADD CONSTRAINT "connection_links_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_focus_tasks" ADD CONSTRAINT "daily_focus_tasks_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_focus_tasks" ADD CONSTRAINT "daily_focus_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_focus_tasks" ADD CONSTRAINT "daily_focus_tasks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_callout_responses" ADD CONSTRAINT "emergency_callout_responses_callout_id_emergency_callouts_id_fk" FOREIGN KEY ("callout_id") REFERENCES "public"."emergency_callouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_callout_responses" ADD CONSTRAINT "emergency_callout_responses_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_callouts" ADD CONSTRAINT "emergency_callouts_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_callouts" ADD CONSTRAINT "emergency_callouts_assigned_partner_id_trade_partners_id_fk" FOREIGN KEY ("assigned_partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_callouts" ADD CONSTRAINT "emergency_callouts_completed_by_partner_id_trade_partners_id_fk" FOREIGN KEY ("completed_by_partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_callouts" ADD CONSTRAINT "emergency_callouts_fee_transaction_id_financial_transactions_id_fk" FOREIGN KEY ("fee_transaction_id") REFERENCES "public"."financial_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_credentials" ADD CONSTRAINT "employee_credentials_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_sessions" ADD CONSTRAINT "employee_sessions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_category_id_financial_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."financial_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_articles" ADD CONSTRAINT "help_articles_category_id_help_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."help_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_messages" ADD CONSTRAINT "internal_messages_sender_id_employees_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_messages" ADD CONSTRAINT "internal_messages_recipient_id_employees_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_messages" ADD CONSTRAINT "internal_messages_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_chat_message_reads" ADD CONSTRAINT "job_chat_message_reads_message_id_job_chat_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."job_chat_messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_chat_message_reads" ADD CONSTRAINT "job_chat_message_reads_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_chat_messages" ADD CONSTRAINT "job_chat_messages_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_chat_messages" ADD CONSTRAINT "job_chat_messages_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_client_payments" ADD CONSTRAINT "job_client_payments_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_client_payments" ADD CONSTRAINT "job_client_payments_recorded_by_employees_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_fund_allocations" ADD CONSTRAINT "job_fund_allocations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_fund_allocations" ADD CONSTRAINT "job_fund_allocations_client_payment_id_job_client_payments_id_fk" FOREIGN KEY ("client_payment_id") REFERENCES "public"."job_client_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_fund_allocations" ADD CONSTRAINT "job_fund_allocations_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_fund_allocations" ADD CONSTRAINT "job_fund_allocations_job_partner_id_job_partners_id_fk" FOREIGN KEY ("job_partner_id") REFERENCES "public"."job_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_fund_allocations" ADD CONSTRAINT "job_fund_allocations_allocated_by_employees_id_fk" FOREIGN KEY ("allocated_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_note_attachments" ADD CONSTRAINT "job_note_attachments_note_id_job_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."job_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_notes" ADD CONSTRAINT "job_notes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_partners" ADD CONSTRAINT "job_partners_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_partners" ADD CONSTRAINT "job_partners_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_schedule_proposals" ADD CONSTRAINT "job_schedule_proposals_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_schedule_proposals" ADD CONSTRAINT "job_schedule_proposals_proposed_by_partner_id_trade_partners_id_fk" FOREIGN KEY ("proposed_by_partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_schedule_proposals" ADD CONSTRAINT "job_schedule_proposals_linked_calendar_event_id_calendar_events_id_fk" FOREIGN KEY ("linked_calendar_event_id") REFERENCES "public"."calendar_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_surveys" ADD CONSTRAINT "job_surveys_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_surveys" ADD CONSTRAINT "job_surveys_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "owner_wellbeing_settings" ADD CONSTRAINT "owner_wellbeing_settings_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_availability" ADD CONSTRAINT "partner_availability_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_fee_accruals" ADD CONSTRAINT "partner_fee_accruals_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_fee_accruals" ADD CONSTRAINT "partner_fee_accruals_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_fee_accruals" ADD CONSTRAINT "partner_fee_accruals_invoice_id_partner_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."partner_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_invites" ADD CONSTRAINT "partner_invites_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_invoice_payments" ADD CONSTRAINT "partner_invoice_payments_invoice_id_partner_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."partner_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_invoice_payments" ADD CONSTRAINT "partner_invoice_payments_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_invoice_payments" ADD CONSTRAINT "partner_invoice_payments_financial_transaction_id_financial_transactions_id_fk" FOREIGN KEY ("financial_transaction_id") REFERENCES "public"."financial_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_invoices" ADD CONSTRAINT "partner_invoices_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_portal_access" ADD CONSTRAINT "partner_portal_access_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_quote_items" ADD CONSTRAINT "partner_quote_items_quote_id_partner_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."partner_quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_quotes" ADD CONSTRAINT "partner_quotes_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_quotes" ADD CONSTRAINT "partner_quotes_partner_id_trade_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."trade_partners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_quotes" ADD CONSTRAINT "partner_quotes_survey_id_job_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."job_surveys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_pay_period_id_pay_periods_id_fk" FOREIGN KEY ("pay_period_id") REFERENCES "public"."pay_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personal_tasks" ADD CONSTRAINT "personal_tasks_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_message_reads" ADD CONSTRAINT "portal_message_reads_message_id_portal_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."portal_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price_history" ADD CONSTRAINT "product_price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_template_items" ADD CONSTRAINT "quote_template_items_template_id_quote_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."quote_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_template_items" ADD CONSTRAINT "quote_template_items_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_templates" ADD CONSTRAINT "quote_templates_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_requests" ADD CONSTRAINT "review_requests_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_autopilot_slots" ADD CONSTRAINT "seo_autopilot_slots_content_post_id_seo_content_posts_id_fk" FOREIGN KEY ("content_post_id") REFERENCES "public"."seo_content_posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_autopilot_slots" ADD CONSTRAINT "seo_autopilot_slots_weekly_focus_id_seo_weekly_focus_id_fk" FOREIGN KEY ("weekly_focus_id") REFERENCES "public"."seo_weekly_focus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_content_posts" ADD CONSTRAINT "seo_content_posts_weekly_focus_id_seo_weekly_focus_id_fk" FOREIGN KEY ("weekly_focus_id") REFERENCES "public"."seo_weekly_focus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_content_posts" ADD CONSTRAINT "seo_content_posts_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_content_posts" ADD CONSTRAINT "seo_content_posts_target_location_id_seo_google_business_locations_id_fk" FOREIGN KEY ("target_location_id") REFERENCES "public"."seo_google_business_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seo_job_media" ADD CONSTRAINT "seo_job_media_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_catalog_items" ADD CONSTRAINT "supplier_catalog_items_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_catalog_items" ADD CONSTRAINT "supplier_catalog_items_catalog_item_id_catalog_items_id_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_activity_log" ADD CONSTRAINT "team_activity_log_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wellbeing_nudge_logs" ADD CONSTRAINT "wellbeing_nudge_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");