document.addEventListener('DOMContentLoaded', async () => {
    const SUPABASE_URL = 'https://ncvxdpammwbgybhdlnwd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnhkcGFtbXdiZ3liaGRsbndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTA1MjgsImV4cCI6MjA5MDM2NjUyOH0.oo1x1YTel9rK-9lFKmrKcHOmHZLQ--bXq6n4iBubBdQ';
    
    if (!window.supabase) return;
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const urlParams = new URLSearchParams(window.location.search);
    const exposeId = urlParams.get('id');

    const loadingDiv = document.getElementById('expose-loading');
    const contentDiv = document.getElementById('expose-content');
    
    if(!exposeId) {
        loadingDiv.innerHTML = '<h2>Ungültiger Link. Kein Inserat gefunden.</h2><a href="index.html">Zurück zur Startseite</a>';
        return;
    }

    // Hole das Inserat
    const { data: listing, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', exposeId)
        .single();
    
    if(error || !listing) {
        loadingDiv.innerHTML = '<h2>Inserat nicht gefunden oder nicht mehr aktiv.</h2><a href="index.html">Zurück</a>';
        return;
    }

    // Fülle Meta-Daten ab
    document.title = listing.title + ' | Platz-Börse';
    loadingDiv.style.display = 'none';
    contentDiv.style.display = 'block';

    document.getElementById('expose-title').textContent = listing.title;
    document.getElementById('expose-desc').textContent = listing.description;
    if (listing.price_interval === 'Zu verschenken') {
        document.getElementById('expose-price').parentNode.innerHTML = '<span id="expose-price">Zu verschenken</span>';
        document.getElementById('expose-interval').parentNode.style.display = 'none';
    } else {
        document.getElementById('expose-price').textContent = listing.price;
        document.getElementById('expose-interval').textContent = listing.price_interval;
    }
    document.getElementById('expose-cat').textContent = listing.category;
    document.getElementById('expose-zip').textContent = listing.zip;
    document.getElementById('expose-city').textContent = listing.city;
    document.getElementById('expose-country').textContent = listing.country || '-';
    document.getElementById('expose-id').textContent = listing.id;

    // Galerie
    const mainImg = document.getElementById('main-image');
    const thumbsContainer = document.getElementById('thumbnails');
    
    if(listing.images && listing.images.length > 0) {
        mainImg.src = listing.images[0];
        
        listing.images.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            if(index === 0) thumb.classList.add('active');
            
            thumb.addEventListener('click', () => {
                mainImg.src = imgSrc;
                document.querySelectorAll('.gallery-thumbs img').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });
            thumbsContainer.appendChild(thumb);
        });
    } else {
        thumbsContainer.style.display = 'none'; // Keine Thumbs
    }

    // Session für Kontaktformular / Favoriten
    const { data: { session } } = await supabase.auth.getSession();
    
    // Favoriten Logik
    const favBtn = document.getElementById('btn-favorite');
    const favIcon = document.getElementById('fav-icon');
    const favText = document.getElementById('fav-text');
    let isFav = false;

    if (session) {
        // Prüfe ob bereits favorisiert
        const { data: favData } = await supabase.from('favorites').select('id').eq('user_id', session.user.id).eq('listing_id', exposeId);
        if(favData && favData.length > 0) {
            isFav = true;
            favIcon.textContent = '💙';
            favText.textContent = 'Auf Merkliste';
        }

        favBtn.addEventListener('click', async () => {
            favBtn.disabled = true;
            if(!isFav) {
                // Hinzufügen
                const { error: fErr } = await supabase.from('favorites').insert([{ user_id: session.user.id, listing_id: exposeId }]);
                if(!fErr) { isFav = true; favIcon.textContent = '💙'; favText.textContent = 'Auf Merkliste'; }
            } else {
                // Entfernen
                const { error: fErr } = await supabase.from('favorites').delete().eq('user_id', session.user.id).eq('listing_id', exposeId);
                if(!fErr) { isFav = false; favIcon.textContent = '🤍'; favText.textContent = 'Merken'; }
            }
            favBtn.disabled = false;
        });

        // Felder automatisch ausfüllen
        document.getElementById('contact-name').value = session.user.user_metadata?.name || '';
        document.getElementById('contact-email').value = session.user.email || '';
    } else {
        favBtn.addEventListener('click', () => {
            alert('Bitte loggen Sie sich ein, um Inserate zu merken.');
            window.location.href = 'login.html';
        });
    }

    // Modal Kontakt Logik (Edge Function Variante)
    const modal = document.getElementById('contact-modal');
    document.getElementById('open-contact-btn').addEventListener('click', () => {
        modal.style.display = 'flex';
        // Wenn nicht eingeloggt, vielleicht trotzdem erlauben, aber Daten manuell eingeben
    });
    
    document.getElementById('close-contact-btn').addEventListener('click', () => { modal.style.display = 'none'; });
    
    const contactForm = document.getElementById('contact-form');
    const contactFeedback = document.getElementById('contact-feedback');
    const submitBtn = document.getElementById('submit-contact-btn');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Sende Nachricht...";
        contactFeedback.style.display = 'none';

        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const tel = document.getElementById('contact-phone').value;
        const msg = document.getElementById('contact-message').value;

        try {
            // Wir fügen die Kontaktanfrage als neuen Eintrag in die Tabelle "contact_requests" ein.
            // Ein SQL-Database-Trigger schickt dann die E-Mail über Resend los!
            const { error: dbError } = await supabase.from('contact_requests').insert([{
                listing_id: exposeId,
                listing_title: listing.title,
                contact_email: listing.contact_email,
                sender_name: name,
                sender_email: email,
                sender_phone: tel,
                message: msg
            }]);

            if (dbError) throw new Error("Fehler beim Speichern der Anfrage: " + dbError.message);

            contactFeedback.style.display = 'block';
            contactFeedback.style.color = "white";
            contactFeedback.style.backgroundColor = "green";
            contactFeedback.textContent = "Erfolg! Ihre Nachricht wurde sicher und anonym weitergeleitet.";
            
            contactForm.reset();
            setTimeout(() => { modal.style.display = 'none'; }, 3000);

        } catch (err) {
            contactFeedback.style.display = 'block';
            contactFeedback.style.color = "red";
            contactFeedback.style.backgroundColor = "#fff";
            contactFeedback.textContent = err.message;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Nachricht an Anbieter schreiben";
        }
    });

    // --- Melden Logik ---
    const reportBtn = document.getElementById('btn-report');
    const reportModal = document.getElementById('report-modal');
    const closeReportBtn = document.getElementById('close-report-btn');
    const reportForm = document.getElementById('report-form');
    const reportReason = document.getElementById('report-reason');
    const reportCharCount = document.getElementById('report-char-count');
    const reportFeedback = document.getElementById('report-feedback');
    const submitReportBtn = document.getElementById('submit-report-btn');

    if(reportBtn) {
        reportBtn.addEventListener('click', () => {
            reportModal.style.display = 'flex';
        });

        closeReportBtn.addEventListener('click', () => {
            reportModal.style.display = 'none';
        });

        reportReason.addEventListener('input', () => {
            reportCharCount.textContent = `${reportReason.value.length} / 200`;
        });

        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            submitReportBtn.disabled = true;
            submitReportBtn.textContent = "Sende...";
            reportFeedback.style.display = 'none';

            try {
                // Get current user if available
                const { data: { session: curSession } } = await supabase.auth.getSession();
                const userId = curSession ? curSession.user.id : null;

                const { error: rErr } = await supabase.from('reports').insert([{
                    listing_id: exposeId,
                    reporter_id: userId,
                    reason: reportReason.value
                }]);

                if (rErr) throw new Error("Fehler beim Senden der Meldung: " + rErr.message);

                reportFeedback.style.display = 'block';
                reportFeedback.style.color = "white";
                reportFeedback.style.backgroundColor = "green";
                reportFeedback.textContent = "Anzeige wurde gemeldet. Vielen Dank.";
                
                reportForm.reset();
                reportCharCount.textContent = "0 / 200";
                setTimeout(() => { reportModal.style.display = 'none'; }, 2000);

            } catch (err) {
                reportFeedback.style.display = 'block';
                reportFeedback.style.color = "white";
                reportFeedback.style.backgroundColor = "darkred";
                reportFeedback.textContent = err.message;
            } finally {
                submitReportBtn.disabled = false;
                submitReportBtn.textContent = "Meldung einreichen";
            }
        });
    }

    // --- Teilen Logik ---
    const shareBtn = document.getElementById('btn-share');
    const shareModal = document.getElementById('share-modal');
    const closeShareBtn = document.getElementById('close-share-btn');
    const shareCopyBtn = document.getElementById('share-copy-btn');
    const shareFbBtn = document.getElementById('share-fb-btn');
    const shareWaBtn = document.getElementById('share-wa-btn');
    const shareEmailBtn = document.getElementById('share-email-btn');
    const shareFeedback = document.getElementById('share-feedback');

    if(shareBtn) {
        shareBtn.addEventListener('click', () => {
            const currentUrl = encodeURIComponent(window.location.href);
            const title = encodeURIComponent(document.title);
            
            // Setze Links auf Buttons
            shareFbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
            shareWaBtn.href = `https://api.whatsapp.com/send?text=${title} - ${currentUrl}`;
            shareEmailBtn.href = `mailto:?subject=${title}&body=Sieh dir dieses tolle Inserat an:%0D%0A${currentUrl}`;

            shareFeedback.style.display = 'none';
            shareModal.style.display = 'flex';
        });

        closeShareBtn.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });

        shareCopyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                shareFeedback.style.display = 'block';
                setTimeout(() => { shareFeedback.style.display = 'none'; }, 3000);
            }).catch(err => {
                console.error('Konnte Link nicht kopieren:', err);
                prompt('Link manuell kopieren:', window.location.href);
            });
        });
    }

});
