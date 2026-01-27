export async function geocodeAddress(address: string, postcode: string): Promise<{ latitude: string; longitude: string } | null> {
    try {
        const query = `${address}, ${postcode}`;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

        // User-Agent is required by Nominatim usage policy
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'TradeVaultAi/1.0 (internal-testing)'
            }
        });

        if (!response.ok) {
            console.error(`Geocoding failed for ${query}: ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                latitude: data[0].lat,
                longitude: data[0].lon
            };
        }

        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}
