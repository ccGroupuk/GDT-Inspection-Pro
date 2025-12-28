import { db } from "./db";
import { employees, employeeCredentials } from "@shared/schema";
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
  
  console.log(`[seed] All admin accounts ready - default password: ${DEFAULT_PASSWORD}`);
}
