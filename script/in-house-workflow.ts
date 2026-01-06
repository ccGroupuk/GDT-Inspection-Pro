
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
    console.log("🚀 Starting In-House Job Workflow Simulation");

    // 1. Login
    console.log("\n🔑 Logging in...");
    try {
        await api("POST", "/api/employee/login", {
            email: "jonathands43@hotmail.com",
            password: "password",
        });
        console.log("✅ Logged in");
    } catch (e) {
        console.error("❌ Login failed:", e);
        process.exit(1);
    }

    // 2. Create Contact
    console.log("\n👤 Creating Client...");
    const contact = await api("POST", "/api/contacts", {
        name: "Automation Test Client",
        email: `test-${Date.now()}@example.com`,
        phone: "07000 000000",
        address: "1 Test Lane",
        postcode: "TE1 1ST",
        notes: "Created by automated workflow test"
    });
    console.log(`✅ Client created: ${contact.id}`);

    // 3. Create Job
    console.log("\nabc Creating Job...");
    const jobConfig = {
        contactId: contact.id,
        serviceType: "Bespoke Carpentry",
        description: "Full in-house workflow test",
        clientTimeframe: "asap",
        jobAddress: "1 Test Lane",
        jobPostcode: "TE1 1ST",
        deliveryType: "in_house",
        status: "new_enquiry",
        leadSource: "Referral"
    };

    const job = await api("POST", "/api/jobs", jobConfig);
    console.log(`✅ Job created: ${job.jobNumber} (${job.id})`);
    console.log(`   Status: ${job.status}`);

    // 4. Move to Quoting
    console.log("\n📝 Moving to Quoting...");
    await api("PATCH", `/api/jobs/${job.id}`, { status: "quoting" });
    console.log("✅ Status updated to 'quoting'");

    // 5. Add Quote Items
    console.log("\n💰 Adding Quote Items...");
    await api("PUT", `/api/jobs/${job.id}/quote-items`, {
        items: [
            { description: "Labor", quantity: "10", unitPrice: "50", lineTotal: "500" },
            { description: "Materials", quantity: "1", unitPrice: "200", lineTotal: "200" }
        ]
    });
    // Update job total manually as API might not auto-calc it based on items (normally frontend does this)
    await api("PATCH", `/api/jobs/${job.id}`, { quotedValue: "700.00" });
    console.log("✅ Quote items added & value updated");

    // 6. Check Readiness for Acceptance
    console.log("\n🔍 Checking Stage Readiness...");
    const readiness = await api("GET", `/api/jobs/${job.id}/stage-readiness`);
    const acceptanceStage = readiness.stages.find((s: any) => s.stage === "quote_accepted");
    if (acceptanceStage?.canProgress) {
        console.log("✅ Ready for acceptance");
    } else {
        console.log("⚠️ Not ready for acceptance:", acceptanceStage?.prerequisites);
    }

    // 7. Client Accepts
    console.log("\n🤝 Client Accepts Quote (Simulating)...");
    // Logic requires quoteResponse to be set first due to validation checking DB state
    await api("PATCH", `/api/jobs/${job.id}`, {
        quoteResponse: "accepted",
        quoteRespondedAt: new Date().toISOString()
    });
    console.log("✅ Quote marked as accepted in system");

    await api("PATCH", `/api/jobs/${job.id}`, { status: "quote_accepted" });
    console.log("✅ Status updated to 'quote_accepted'");

    // 8. Schedule
    console.log("\n📅 Scheduling Work...");
    // Need to create a calendar event
    // NOTE: This might be tricky if the API requires specific complex objects.
    // Using generic "project_start" event
    try {
        const events = await api("POST", "/api/calendar-events", {
            jobId: job.id,
            title: "Project Start",
            description: "Start of work",
            eventType: "project_start",
            startDate: new Date(Date.now() + 86400000).toISOString(),
            endDate: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            allDay: false
        });
        console.log("✅ Work scheduled");
    } catch (e: any) {
        if (e.message.includes("404")) console.log("⚠️ Calendar API missing or different path");
        else console.log(`⚠️ Scheduling failed: ${e.message}`);
    }

    // 9. In Progress
    console.log("\n🔨 Moving to In Progress...");
    try {
        await api("PATCH", `/api/jobs/${job.id}`, { status: "in_progress" });
        console.log("✅ Status updated to 'in_progress'");
    } catch (e: any) {
        console.log(`❌ Failed to move to in_progress: ${e.message}`);
    }

    // 10. Complete
    console.log("\n✅ Completing Job...");
    try {
        await api("PATCH", `/api/jobs/${job.id}`, { status: "completed" });
        console.log("✅ Status updated to 'completed'");
    } catch (e: any) {
        console.log(`❌ Failed to complete: ${e.message}`);
    }

    console.log("\n🎉 Simulation Finished");
}

run().catch(console.error);
