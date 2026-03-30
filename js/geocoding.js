/**
 * Geocoding & Distanz-Berechnung für G-Immobilien (DACH-Raum)
 */

window.Geocoding = {
    cache: JSON.parse(localStorage.getItem('plz_coord_cache') || '{}'),

    /**
     * Ermittelt Koordinaten für eine PLZ (DE, AT, CH)
     * @param {string} zip 
     * @returns {Promise<{lat: number, lng: number} | null>}
     */
    async getCoordinates(zip) {
        const cleanZip = zip.trim();
        if (this.cache[cleanZip]) return this.cache[cleanZip];

        let countries = [];
        if (cleanZip.length === 5) {
            countries = ['de'];
        } else if (cleanZip.length === 4) {
            countries = ['at', 'ch'];
        } else {
            return null;
        }

        for (const country of countries) {
            try {
                const response = await fetch(`https://api.zippopotam.us/${country}/${cleanZip}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.places && data.places.length > 0) {
                        const coords = {
                            lat: parseFloat(data.places[0].latitude),
                            lng: parseFloat(data.places[0].longitude)
                        };
                        this.saveToCache(cleanZip, coords);
                        return coords;
                    }
                }
            } catch (err) {
                console.error(`Geocoding failed for ${country}/${cleanZip}:`, err);
            }
        }

        return null;
    },

    /**
     * Berechnet die Entfernung zwischen zwei Punkten in Kilometern (Haversine)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Erdradius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    saveToCache(zip, coords) {
        this.cache[zip] = coords;
        localStorage.setItem('plz_coord_cache', JSON.stringify(this.cache));
    }
};
