import { db } from "./db";
import { employees, employeeCredentials, contacts, jobs, tradePartners } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const DEFAULT_PASSWORD = "password";

const ADMIN_USERS = [
  {
    email: "jonathands43@hotmail.com",
    firstName: "Jonathan",
    lastName: "Szwandt",
    accessLevel: "owner" as const,
  },
  {
    email: "cindi_dunn@hotmail.co.uk",
    firstName: "Cindy",
    lastName: "Hoskins",
    accessLevel: "full_access" as const,
  },
];

export async function seedProductionData() {
  console.log("[seed] Ensuring all admin employees exist with correct passwords...");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const adminUser of ADMIN_USERS) {
    console.log(`[seed] Processing ${adminUser.email}...`);

    const existingEmployee = await db.select()
      .from(employees)
      .where(eq(employees.email, adminUser.email))
      .limit(1);

    let employeeId: string;

    if (existingEmployee.length === 0) {
      console.log(`[seed] Employee ${adminUser.email} not found, creating...`);

      const [newEmployee] = await db.insert(employees).values({
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        phone: "",
        accessLevel: adminUser.accessLevel,
        hourlyRate: "0",
        salary: null,
        payType: "hourly",
        isActive: true,
      }).returning();

      employeeId = newEmployee.id;
      console.log(`[seed] Employee created with ID: ${employeeId}`);
    } else {
      employeeId = existingEmployee[0].id;
      console.log(`[seed] Employee exists with ID: ${employeeId}`);
    }

    const existingCredentials = await db.select()
      .from(employeeCredentials)
      .where(eq(employeeCredentials.employeeId, employeeId))
      .limit(1);

    if (existingCredentials.length === 0) {
      console.log(`[seed] Creating credentials for ${adminUser.email}...`);

      await db.insert(employeeCredentials).values({
        employeeId: employeeId,
        passwordHash: passwordHash,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      console.log(`[seed] Credentials created`);
    } else {
      console.log(`[seed] Resetting password for ${adminUser.email}...`);
      await db.update(employeeCredentials)
        .set({
          passwordHash: passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        })
        .where(eq(employeeCredentials.employeeId, employeeId));
      console.log(`[seed] Password reset`);
    }
  }

  // Seed Dummy Client
  console.log("[seed] Checking for dummy client...");
  const dummyClientEmail = "john.doe@example.com";
  const existingContact = await db.select().from(contacts).where(eq(contacts.email, dummyClientEmail)).limit(1);

  if (existingContact.length === 0) {
    console.log("[seed] Creating dummy client John Doe...");
    const [newContact] = await db.insert(contacts).values({
      name: "John Doe",
      email: dummyClientEmail,
      phone: "01234 567 890",
      address: "123 Carpentry Way",
      postcode: "CF10 1AB",
      notes: "First dummy client for testing",
    }).returning();

    console.log("[seed] Creating dummy job for John Doe...");
    await db.insert(jobs).values({
      jobNumber: `J-${new Date().getFullYear()}-001`,
      contactId: newContact.id,
      serviceType: "Bespoke Carpentry",
      jobDescription: "Kitchen cabinets and island construction",
      status: "new_enquiry",
      deliveryType: "supply_and_fit",
      jobAddress: "123 Carpentry Way",
      jobPostcode: "CF10 1AB",
      quotedValue: "2500.00",
    });
    console.log("[seed] Dummy data created.");
  } else {
    console.log("[seed] Dummy client already exists.");
  }

  // Seed Dummy Trade Partner
  console.log("[seed] Checking for dummy trade partner...");
  const dummyPartnerEmail = "mike.spark@example.com";
  const existingPartner = await db.select().from(tradePartners).where(eq(tradePartners.email, dummyPartnerEmail)).limit(1);

  if (existingPartner.length === 0) {
    console.log("[seed] Creating dummy trade partner Mike Spark...");
    await db.insert(tradePartners).values({
      businessName: "Elite Electrical Services",
      contactName: "Mike Spark",
      email: dummyPartnerEmail,
      phone: "07700 900 123",
      tradeCategory: "Electrical",
      status: "active",
      isActive: true,
      commissionType: "percentage",
      commissionValue: "10",
      insuranceVerified: true,
      rating: 5,
      notes: " Reliable electrician for testing purposes",
    });
    console.log("[seed] Dummy trade partner created.");
  } else {
    console.log("[seed] Dummy trade partner already exists.");
  }

  console.log(`[seed] All data ready - default password: ${DEFAULT_PASSWORD}`);
}
