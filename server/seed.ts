import { db } from "./db";
import { employees, employeeCredentials } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function seedProductionData() {
  console.log("[seed] Checking if admin employee exists...");
  
  const adminEmail = "jonathands43@hotmail.com";
  
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
    
    const passwordHash = await bcrypt.hash("password", 10);
    
    await db.insert(employeeCredentials).values({
      employeeId: newEmployee.id,
      passwordHash: passwordHash,
      mustChangePassword: false,
    });
    
    console.log("[seed] Admin employee and credentials created successfully");
  } else {
    console.log("[seed] Admin employee already exists, checking credentials...");
    
    const existingCredentials = await db.select()
      .from(employeeCredentials)
      .where(eq(employeeCredentials.employeeId, existingEmployee[0].id))
      .limit(1);
    
    if (existingCredentials.length === 0) {
      console.log("[seed] Admin credentials not found, creating...");
      const passwordHash = await bcrypt.hash("password", 10);
      
      await db.insert(employeeCredentials).values({
        employeeId: existingEmployee[0].id,
        passwordHash: passwordHash,
        mustChangePassword: false,
      });
      console.log("[seed] Admin credentials created");
    } else {
      console.log("[seed] Admin credentials already exist");
    }
  }
}
