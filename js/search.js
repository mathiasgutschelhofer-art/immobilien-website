document.addEventListener('DOMContentLoaded', async () => {
    const SUPABASE_URL = 'https://ncvxdpammwbgybhdlnwd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnhkcGFtbXdiZ3liaGRsbndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTA1MjgsImV4cCI6MjA5MDM2NjUyOH0.oo1x1YTel9rK-9lFKmrKcHOmHZLQ--bXq6n4iBubBdQ';
    
    if (!window.supabase) return;
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const urlParams = new URLSearchParams(window.location.search);
    const searchOrt = urlParams.get('ort') || '';
    const searchHauptgruppe = urlParams.get('hauptgruppe') || '';
    const searchKat = urlParams.get('kategorie') || '';
    const searchTransaktion = urlParams.get('transaktion') || '';
    const minL = urlParams.get('min_l') || '';
    const minB = urlParams.get('min_b') || '';
    const minH = urlParams.get('min_h') || '';

    // Fülle Suchformulare wieder aus
    const locInput = document.getElementById('search-location');
    const mainSelect = document.getElementById('search-main-category');
    const katSelect = document.getElementById('search-category');
    const transSelect = document.getElementById('search-transaction');
    
    if (locInput) locInput.value = searchOrt;
    if (transSelect) transSelect.value = searchTransaktion;

    const mainCategoryMap = {
        "Plätze": [
            "Fahrzeugplätze",
            "Lagerflächen",
            "Tierplätze",
            "Hobbyräume & Werkstätten",
            "Freiflächen & Garten"
        ],
        "Fahrzeuge": [
            "PKW",
            "Motorräder",
            "Wohnmobile",
            "Anhänger",
            "Tiertransporter",
            "Wohnwagen",
            "Sonstige"
        ],
        "Kleinanzeigen": ["Sonstige"]
    };

    function updateSearchCategories(selectedMain, selectedKat) {
        if (!katSelect) return;
        katSelect.innerHTML = '<option value="">Kategorien...</option>';
        if (selectedMain && mainCategoryMap[selectedMain]) {
            mainCategoryMap[selectedMain].forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                if (cat === selectedKat) opt.selected = true;
                katSelect.appendChild(opt);
            });
        }
    }

    if (mainSelect) {
        mainSelect.value = searchHauptgruppe;
        updateSearchCategories(searchHauptgruppe, searchKat);
        mainSelect.addEventListener('change', () => {
            updateSearchCategories(mainSelect.value, '');
        });
    }

    // Advanced Filters befüllen
    const minLInput = document.getElementById('search-min-l');
    const minBInput = document.getElementById('search-min-b');
    const minHInput = document.getElementById('search-min-h');
    const advFilters = document.getElementById('advanced-filters');
    const toggleBtn = document.getElementById('toggle-filters-btn');

    if (minLInput) minLInput.value = minL;
    if (minBInput) minBInput.value = minB;
    if (minHInput) minHInput.value = minH;

    // Wenn Maße im URL sind, Filter direkt einblenden
    if (minL || minB || minH) {
        if (advFilters) advFilters.style.display = 'block';
        if (toggleBtn) toggleBtn.textContent = '- Filter ausblenden';
    }

    if (toggleBtn && advFilters) {
        toggleBtn.addEventListener('click', () => {
            if (advFilters.style.display === 'none') {
                advFilters.style.display = 'block';
                toggleBtn.textContent = '- Filter ausblenden';
            } else {
                advFilters.style.display = 'none';
                toggleBtn.textContent = '+ Maße-Filter (Länge/Breite/Höhe) einblenden';
            }
        });
    }

    const container = document.getElementById('search-results-container');
    if (!container) return;

    try {
        let query = supabase
            .from('listings')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        const isPlz = /^\d{4,5}$/.test(searchOrt.trim());

        if (searchHauptgruppe) {
            query = query.eq('main_category', searchHauptgruppe);
        }

        if (searchKat) {
            // Wir filtern entweder auf Parent Category oder Subcategory
            query = query.or(`parent_category.eq."${searchKat}",category.eq."${searchKat}"`);
        }

        // --- MAẞE FILTER ---
        if (minL) {
            query = query.gte('length', parseFloat(minL));
        }
        if (minB) {
            query = query.gte('width', parseFloat(minB));
        }
        if (minH) {
            query = query.gte('height', parseFloat(minH));
        }

        if (searchTransaktion === 'Mieten') {
            query = query.in('price_interval', ['Monat', 'Jahr']);
        } else if (searchTransaktion === 'Kaufen') {
            query = query.eq('price_interval', 'Einmalig');
        } else if (searchTransaktion === 'Verschenken') {
            query = query.eq('price_interval', 'Zu verschenken');
        }

        if (searchOrt && !isPlz) {
            // Nur wenn es KEINE PLZ ist, filtern wir strikt auf den Textwert (Stadt/PLZ-Teil)
            query = query.or(`city.ilike.%${searchOrt}%,zip.ilike.%${searchOrt}%`);
        }

        const { data: listings, error } = await query;

        if (error) throw error;

        if (!listings || listings.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--white); border-radius: var(--border-radius); box-shadow: var(--box-shadow);">
                    <p style="font-size: 3rem; margin-bottom: 1rem;">🔍</p>
                    <h2>Leider nichts gefunden!</h2>
                    <p style="color: var(--text-secondary); max-width: 600px; margin: 1rem auto;">
                        Zu Ihrer Suchanfrage <b>${searchOrt ? searchOrt : ''} ${searchKat ? '('+searchKat+')' : ''}</b> gibt es derzeit keine aktiven Inserate.
                    </p>
                    <a href="index.html" class="btn btn-primary" style="margin-top: 1rem;">Zurück zur Startseite</a>
                </div>
            `;
            return;
        }

        // --- DISTANZ-LOGIK ---
        let sortedListings = [...listings];
        let searchCoords = null;

        if (isPlz && window.Geocoding) {
            searchCoords = await window.Geocoding.getCoordinates(searchOrt);
            
            if (searchCoords) {
                // Berechne Distanz für jedes Inserat
                for (let item of sortedListings) {
                    const itemCoords = await window.Geocoding.getCoordinates(item.zip);
                    if (itemCoords) {
                        item.distance = window.Geocoding.calculateDistance(
                            searchCoords.lat, searchCoords.lng,
                            itemCoords.lat, itemCoords.lng
                        );
                    } else {
                        item.distance = 99999;
                    }
                }
                // Sortieren nach Distanz
                sortedListings.sort((a, b) => a.distance - b.distance);
            } else {
                // FALLBACK: PLZ wurde geografisch nicht gefunden -> Filtere manuell nach Text
                sortedListings = listings.filter(item => 
                    item.zip.includes(searchOrt.trim()) || 
                    item.city.toLowerCase().includes(searchOrt.toLowerCase().trim())
                );
            }
        }

        container.innerHTML = '';
        
        sortedListings.forEach(item => {
            const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : 'assets/no-preview.svg';
            const exposeUrl = `expose.html?id=${item.id}`;
            
            const currentDate = new Date();
            const createdDate = new Date(item.created_at);
            const expiryDate = new Date(createdDate.getTime() + (90 * 24 * 60 * 60 * 1000));
            const diffTime = expiryDate - currentDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let daysBadge = '';
            if (diffDays > 0) {
                daysBadge = `<div style="position: absolute; top: 10px; right: 10px; background: rgba(13, 71, 161, 0.9); color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2); z-index: 10;">Noch ${diffDays} Tage aktiv</div>`;
            } else {
                daysBadge = `<div style="position: absolute; top: 10px; right: 10px; background: rgba(200, 0, 0, 0.9); color: white; padding: 5px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.2); z-index: 10;">Läuft ab</div>`;
            }

            // Distanz-Badge erstellen
            let distanceHtml = '';
            if (item.distance !== undefined && item.distance < 9999) {
                distanceHtml = `<div class="distance-badge">📍 ${item.distance.toFixed(1)} km entfernt</div>`;
            }
            
            let priceDisplay = item.price_interval === 'Zu verschenken' ? 'Zu verschenken' : `${item.price} € / ${item.price_interval}`;

            container.innerHTML += `
                <div class="property-card" style="position: relative; cursor: pointer; transition: all 0.2s ease;" onclick="window.location.href='${exposeUrl}'">
                    ${daysBadge}
                    <img src="${imgUrl}" alt="${item.title}" class="property-img">
                    <div class="property-content">
                        ${distanceHtml}
                        <div class="property-price">${priceDisplay}</div>
                        <h3 class="property-title">${item.title}</h3>
                        <div class="property-details">
                            <div class="detail-item" style="font-size: 0.8rem; font-weight: bold;">📍 ${item.zip} ${item.city}</div>
                            <div class="detail-item" style="font-size: 0.8rem;">🏷️ ${item.subcategory || item.parent_category || item.category}</div>
                        </div>

                        <!-- Maße Anzeige in der Karte -->
                        ${(item.length || item.width || item.height) ? `
                        <div style="background: #f0f4f8; padding: 10px; border-radius: 8px; margin-bottom: 1rem; display: flex; gap: 15px; font-size: 0.85rem; border: 1px solid #e1e8ed;">
                            ${item.length ? `<span><b>L:</b> ${item.length}m</span>` : ''}
                            ${item.width ? `<span><b>B:</b> ${item.width}m</span>` : ''}
                            ${item.height ? `<span><b>H:</b> ${item.height}m</span>` : ''}
                        </div>` : ''}

                        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; height: 3.8em;">
                            ${item.description}
                        </p>
                        <a href="${exposeUrl}" class="btn btn-primary" style="display: block; width: 100%; text-align: center;">Details ansehen</a>
                    </div>
                </div>
            `;
        });

    } catch (err) {
        container.innerHTML = `<p style="color:red">Ein Fehler ist aufgetreten: ${err.message}</p>`;
    }
});
