
import { storage } from "../server/storage";

async function main() {
    try {
        console.log("Fetching contacts from storage...");
        const contacts = await storage.getContacts();
        console.log(`Found ${contacts.length} contacts.`);
        if (contacts.length > 0) {
            console.log("First contact:", contacts[0]);
        }
    } catch (error) {
        console.error("Error fetching contacts:", error);
    }
}

main();
