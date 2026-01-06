CREATE TABLE "sales_commissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"commission_type" text DEFAULT 'sales_onboarding' NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"job_value_snapshot" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payroll_run_id" varchar,
	"financial_transaction_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "default_commission_rate" numeric(5, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "sales_rep_id" varchar;--> statement-breakpoint
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_commissions" ADD CONSTRAINT "sales_commissions_financial_transaction_id_financial_transactions_id_fk" FOREIGN KEY ("financial_transaction_id") REFERENCES "public"."financial_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_sales_rep_id_employees_id_fk" FOREIGN KEY ("sales_rep_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;