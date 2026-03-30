document.addEventListener('DOMContentLoaded', async () => {
    const SUPABASE_URL = 'https://ncvxdpammwbgybhdlnwd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnhkcGFtbXdiZ3liaGRsbndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTA1MjgsImV4cCI6MjA5MDM2NjUyOH0.oo1x1YTel9rK-9lFKmrKcHOmHZLQ--bXq6n4iBubBdQ';
    
    if (!window.supabase) return;
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const urlParams = new URLSearchParams(window.location.search);
    const searchOrt = urlParams.get('ort') || '';
    const searchKat = urlParams.get('kategorie') || '';

    // Fülle Suchformulare wieder aus
    const locInput = document.getElementById('search-location');
    const katSelect = document.getElementById('search-category');
    if (locInput) locInput.value = searchOrt;
    if (katSelect) katSelect.value = searchKat;

    const container = document.getElementById('search-results-container');
    if (!container) return;

    try {
        let query = supabase
            .from('listings')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (searchKat) {
            query = query.eq('category', searchKat);
        }

        if (searchOrt) {
            // Sucht in city oder zip (Groß/Kleinschreibung egalisiert mit ilike)
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

        container.innerHTML = '';
        
        listings.forEach(item => {
            const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : 'https://placehold.co/600x400/0d47a1/ffffff?text=G-Immobilien';
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
            
            container.innerHTML += `
                <div class="property-card" style="position: relative; cursor: pointer; transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 10px 20px rgba(0,0,0,0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--box-shadow)';" onclick="window.location.href='${exposeUrl}'">
                    ${daysBadge}
                    <img src="${imgUrl}" alt="${item.title}" class="property-img">
                    <div class="property-content">
                        <div class="property-price">${item.price} € / ${item.price_interval}</div>
                        <h3 class="property-title">${item.title}</h3>
                        <div class="property-details">
                            <div class="detail-item" style="font-size: 0.8rem; font-weight: bold;">📍 ${item.zip} ${item.city}</div>
                            <div class="detail-item" style="font-size: 0.8rem;">🏷️ ${item.category}</div>
                        </div>
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
