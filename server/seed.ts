import { db } from "./db";
import { employees, employeeCredentials } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedProductionData() {
  console.log("[seed] Ensuring admin employee exists with correct password...");
  
  const adminEmail = "jonathands43@hotmail.com";
  const adminPassword = "password";
  
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  const existingEmployee = await db.select().from(employees).where(eq(employees.email, adminEmail)).limit(1);
  
  if (existingEmployee.length === 0) {
    console.log("[seed] Admin employee not found, creating...");
    
    const [newEmployee] = await db.insert(employees).values({
      firstName: "Jonathan",
      lastName: "Szwandt",
      email: adminEmail,
      phone: "",
      accessLevel: "owner",
      hourlyRate: "0",
      salary: null,
      payType: "hourly",
      isActive: true,
    }).returning();
    
    await db.insert(employeeCredentials).values({
      employeeId: newEmployee.id,
      passwordHash: passwordHash,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    
    console.log("[seed] Admin employee and credentials created successfully");
  } else {
    console.log("[seed] Admin employee exists, resetting password...");
    
    const existingCredentials = await db.select()
      .from(employeeCredentials)
      .where(eq(employeeCredentials.employeeId, existingEmployee[0].id))
      .limit(1);
    
    if (existingCredentials.length === 0) {
      console.log("[seed] Admin credentials not found, creating...");
      
      await db.insert(employeeCredentials).values({
        employeeId: existingEmployee[0].id,
        passwordHash: passwordHash,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
      console.log("[seed] Admin credentials created");
    } else {
      console.log("[seed] Updating admin credentials with known password...");
      await db.update(employeeCredentials)
        .set({ 
          passwordHash: passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        })
        .where(eq(employeeCredentials.employeeId, existingEmployee[0].id));
      console.log("[seed] Admin credentials updated");
    }
  }
  
  console.log("[seed] Admin setup complete - email: " + adminEmail + ", password: " + adminPassword);
}
