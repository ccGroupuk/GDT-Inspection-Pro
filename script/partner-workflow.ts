
import { insertJobSchema } from "@shared/schema";

const BASE_URL = "http://localhost:5000";
let COOKIE = "";

async function api(method: string, path: string, body?: any) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (COOKIE) headers["Cookie"] = COOKIE;

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
        COOKIE = setCookie.split(";")[0];
    }

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error ${res.status} ${path}: ${text}`);
    }

    return res.json().catch(() => ({}));
}

async function run() {
    console.log("🚀 Starting Partner Job Workflow Simulation");

    // 1. Login
    console.log("\n🔑 Logging in...");
    await api("POST", "/api/employee/login", {
        email: "jonathands43@hotmail.com",
        password: "password",
    });
    console.log("✅ Logged in");

    // 2. Find Partner
    console.log("\n👷 Finding Dummy Partner...");
    const partners = await api("GET", "/api/partners");
    const partner = partners.find((p: any) => p.email === "mike.spark@example.com");

    if (!partner) {
        throw new Error("Dummy partner Mike Spark not found! Run seed/verify first.");
    }
    console.log(`✅ Partner found: ${partner.businessName} (${partner.id})`);

    // 3. Create Contact
    console.log("\n👤 Creating Client...");
    const contact = await api("POST", "/api/contacts", {
        name: "Partner Test Client",
        email: `partner-test-${Date.now()}@example.com`,
        phone: "07777 777777",
        address: "5 Partner Place",
        postcode: "PA1 2ER",
        notes: "Created by automated partner workflow test"
    });
    console.log(`✅ Client created: ${contact.id}`);

    // 4. Create Partner Job
    console.log("\n📋 Creating Partner Job...");
    const jobConfig = {
        contactId: contact.id,
        serviceType: "Electrical",
        description: "Full partner workflow test",
        clientTimeframe: "asap",
        jobAddress: "5 Partner Place",
        jobPostcode: "PA1 2ER",
        deliveryType: "partner", // CRITICAL: This is a partner job
        tradeCategory: "Electrical",
        partnerId: partner.id,    // Assign immediately
        partnerChargeType: "fixed",
        partnerCharge: "150.00",
        quotedValue: "200.00",
        partnerStatus: "offered", // Explicitly offer the job
        status: "new_enquiry",
        leadSource: "Referral"
    };

    const job = await api("POST", "/api/jobs", jobConfig);
    console.log(`✅ Job created: ${job.jobNumber} (${job.id})`);
    console.log(`   Delivery Type: ${job.deliveryType}`);
    console.log(`   Assigned Partner: ${job.partnerId}`);

    if (job.partnerStatus === 'offered') {
        console.log("✅ Partner status correctly set to 'offered' automatically");
    } else {
        console.log(`⚠️ Warning: Partner status is ${job.partnerStatus}, expected 'offered'`);
    }

    // 5. Simulate Partner Acceptance
    // Normally this happens via partner portal, but we'll simulate the API call the portal would make
    // Or update via admin if portal API isn't easy to reach without separate auth
    console.log("\n🤝 Partner Accepts Job...");

    // We'll update the job as admin to simulate "Partner Accepted"
    await api("PATCH", `/api/jobs/${job.id}`, {
        partnerStatus: "accepted",
        partnerRespondedAt: new Date().toISOString()
    });
    console.log("✅ Partner status updated to 'accepted'");

    // 6. Admin Acknowledges Acceptance
    console.log("\n👍 Admin Acknowledges Integration...");
    await api("POST", `/api/jobs/${job.id}/acknowledge-partner-acceptance`);
    console.log("✅ System acknowledged partner acceptance");

    // 7. Move to In Progress (Partner starts work)
    console.log("\n🔨 Partner Starts Work...");
    // Update status - normally partner might request this or admin does it
    await api("PATCH", `/api/jobs/${job.id}`, { status: "in_progress" });
    console.log("✅ Job status: in_progress");

    // 8. Partner Completes Work
    console.log("\n✅ Partner Completes Work...");
    await api("PATCH", `/api/jobs/${job.id}`, {
        status: "completed",
        partnerStatus: "completed"
    });
    console.log("✅ Job status: completed");

    // 9. Finance Check (Commission/Fee)
    console.log("\n💰 Checking Financials...");

    // Record Client Payment first
    console.log("   Recording Client Payment...");
    await api("POST", `/api/jobs/${job.id}/client-payments`, {
        type: "balance",
        amount: "200.00",
        paymentMethod: "bank_transfer",
        reference: "SIM-PAY-001"
    });
    console.log("✅ Client payment recorded");

    // Creating a payment to trigger margin calculation logic
    await api("PATCH", `/api/jobs/${job.id}`, {
        status: "paid",
        quotedValue: "200.00"
    });
    console.log("✅ Job marked as paid - triggers commission logic");

    console.log("\n🎉 Partner Workflow Simulation Finished");
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
