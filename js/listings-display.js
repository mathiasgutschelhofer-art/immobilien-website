// Script to dynamically load approved listings onto category pages and index.html
document.addEventListener('DOMContentLoaded', async () => {
    
    // Finde alle Container (entweder den Hauptcontainer auf Kategorieseiten oder die mehreren Container auf der Startseite)
    const containers = document.querySelectorAll('#listings-category-container, .dynamic-category-grid');
    if (containers.length === 0) return;

    if (!window.supabase) {
        containers.forEach(c => c.innerHTML = `<p style="color:red">Datenbankverbindung nicht möglich.</p>`);
        return;
    }

    const SUPABASE_URL = 'https://ncvxdpammwbgybhdlnwd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnhkcGFtbXdiZ3liaGRsbndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTA1MjgsImV4cCI6MjA5MDM2NjUyOH0.oo1x1YTel9rK-9lFKmrKcHOmHZLQ--bXq6n4iBubBdQ';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Da es auf der Startseite mehrere Container geben kann, iterieren wir durch alle
    for (const container of containers) {
        const categoryName = container.getAttribute('data-category');
        if (!categoryName) continue;

        // Fetch active listings for this Category
        const { data: listings, error } = await supabase
            .from('listings')
            .select('*')
            .eq('status', 'active')
            .eq('category', categoryName)
            .order('created_at', { ascending: false });

        if (error) {
            container.innerHTML = `<div style="grid-column: 1 / -1; padding: 1rem;"><p style="color:red">Fehler beim Laden: ${error.message}</p></div>`;
            continue;
        }

        if (!listings || listings.length === 0) {
            // Wenn wir auf einer der großen Kategorie-Unterseiten sind, fette Warnung anzeigen
            if (container.id === 'listings-category-container') {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--white); border-radius: var(--border-radius); box-shadow: var(--box-shadow);">
                        <p style="font-size: 3rem; margin-bottom: 1rem;">📭</p>
                        <h2>Noch keine Inserate in dieser Kategorie!</h2>
                        <p style="color: var(--text-secondary); max-width: 600px; margin: 1rem auto;">
                            Hier ist Platz für Ihre Anzeigen! Registrieren Sie sich völlig kostenlos und stellen Sie das erste Inserat für ${categoryName} online.
                        </p>
                        <a href="register.html" class="btn btn-primary" style="margin-top: 1rem;">Jetzt kostenlos registrieren</a>
                    </div>
                `;
            } else {
                // Auf der Startseite eine kleinere Warnung anzeigen
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; background: rgba(0,0,0,0.03); border-radius: var(--border-radius);">
                        <p style="color: var(--text-secondary);">Aktuell keine Inserate in <b>${categoryName}</b> verfügbar.</p>
                        <a href="register.html" style="font-size: 0.9rem; margin-top: 0.5rem; display: inline-block;">Jetzt als Erster inserieren!</a>
                    </div>
                `;
            }
            continue;
        }

        // Dummy-Kacheln durch echte Kacheln ersetzen
        container.innerHTML = '';
        
        // Navigation Buttons finden (falls vorhanden)
        const wrapper = container.closest('.carousel-wrapper');
        const prevBtn = wrapper ? wrapper.querySelector('.carousel-btn.prev') : null;
        const nextBtn = wrapper ? wrapper.querySelector('.carousel-btn.next') : null;

        if (listings.length > 3 && prevBtn && nextBtn) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            
            // Event Listener für Scroll-Buttons (nur einmal hinzufügen)
            if (!prevBtn.dataset.listener) {
                prevBtn.addEventListener('click', () => {
                    if (container.scrollLeft <= 5) {
                        // Springe zum Ende
                        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
                    } else {
                        container.scrollBy({ left: -container.offsetWidth * 0.8, behavior: 'smooth' });
                    }
                });
                nextBtn.addEventListener('click', () => {
                    if (container.scrollLeft + container.offsetWidth >= container.scrollWidth - 10) {
                        // Springe zum Anfang
                        container.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                        container.scrollBy({ left: container.offsetWidth * 0.8, behavior: 'smooth' });
                    }
                });
                prevBtn.dataset.listener = 'true';
            }
        }

        listings.forEach(item => {
            const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&q=80&w=800';
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
            
            const cardHtml = `
                <div class="property-card" style="position: relative; cursor: pointer; transition: var(--transition); height: 100%;" onclick="window.location.href='${exposeUrl}'">
                    ${daysBadge}
                    <div class="property-img-wrapper" style="overflow: hidden; height: 220px;">
                        <img src="${imgUrl}" alt="${item.title}" class="property-img" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;">
                    </div>
                    <div class="property-content">
                        <div class="property-price">${item.price} € / ${item.price_interval}</div>
                        <h3 class="property-title" style="font-size: 1.1rem; margin-bottom: 0.8rem; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${item.title}</h3>
                        <div class="property-details" style="margin-bottom: 1rem; padding: 0.5rem 0;">
                            <div class="detail-item" style="font-size: 0.75rem;">📍 ${item.zip} ${item.city}</div>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.8em;">
                            ${item.description}
                        </p>
                        <a href="${exposeUrl}" class="btn btn-primary" style="display: block; width: 100%; text-align: center; padding: 0.6rem; font-size: 0.9rem;">Details</a>
                    </div>
                </div>
            `;

            if (container.classList.contains('carousel-track')) {
                const carouselItem = document.createElement('div');
                carouselItem.className = 'carousel-item';
                carouselItem.innerHTML = cardHtml;
                container.appendChild(carouselItem);
            } else {
                container.innerHTML += cardHtml;
            }
        });
    }
});
