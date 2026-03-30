document.addEventListener('DOMContentLoaded', async () => {
    
    const SUPABASE_URL = 'https://ncvxdpammwbgybhdlnwd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnhkcGFtbXdiZ3liaGRsbndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTA1MjgsImV4cCI6MjA5MDM2NjUyOH0.oo1x1YTel9rK-9lFKmrKcHOmHZLQ--bXq6n4iBubBdQ';
    
    if (!document.getElementById('listing-modal')) return;
    if (!window.supabase) return;
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return; 

    // Das Admin Panel ist nun auf admin.html ausgelagert!
    
    // --- Lade Eigene Inserate ---
    async function loadUserListings() {
        const container = document.getElementById('user-listings-container');
        const { data: myData, error } = await supabase.from('listings').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
        
        if(error) {
            container.innerHTML = `<p style="color:red">Fehler beim Laden: ${error.message}</p>`;
            return;
        }

        if(!myData || myData.length === 0) {
            container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--white); border-radius: var(--border-radius); box-shadow: var(--box-shadow);"><p style="font-size: 3rem; margin-bottom: 1rem;">👋</p><h2>Willkommen in Ihrem Portal!</h2><p style="color: var(--text-secondary); max-width: 600px; margin: 1rem auto;">Hier werden bald Ihre erstellten Inserate erscheinen. Klicken Sie auf "+ Neues Inserat eintragen", um loszulegen!</p></div>`;
            return;
        }

        container.innerHTML = '';
        // Speichere die rohen Daten global um sie fürs Editieren abzurufen
        window.userListingsData = myData;

        myData.forEach(item => {
            const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : 'https://placehold.co/600x400/ddd/555?text=Kein+Bild';
            let statusBadge = item.status === 'active' ? `<span style="background: green; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">Aktiv / Online</span>` :
                              item.status === 'pending' ? `<span style="background: orange; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">Überprüfung ausstehend</span>` :
                              item.status === 'rejected' ? `<span style="background: red; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">Abgelehnt</span>` :
                              item.status === 'paused' ? `<span style="background: #888; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">Pausiert</span>` :
                              `<span style="background: #333; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">Abgelaufen / Offline</span>`;

            let actionButtons = '';
            if(item.status === 'active') {
                actionButtons = `
                    <button onclick="window.openShareModal('${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="btn btn-secondary" style="flex: 1; min-width:80px; padding: 0.3rem; font-size: 0.8rem; background: #e1f5fe; color: #0288d1; border: 1px solid #b3e5fc;">Teilen</button>
                    <button onclick="window.userAction('pause', '${item.id}')" class="btn btn-secondary" style="flex: 1; min-width:80px; padding: 0.3rem; font-size: 0.8rem;">Pausieren</button>
                    <button onclick="window.openEditListing('${item.id}')" class="btn btn-primary" style="flex: 1; min-width:80px; padding: 0.3rem; font-size: 0.8rem;">Bearbeiten</button>
                    <button onclick="window.userAction('delete', '${item.id}')" class="btn btn-secondary" style="flex: 1; min-width:80px; padding: 0.3rem; font-size: 0.8rem; background: darkred; color: white; border: none;">Löschen</button>
                `;
            } else if (item.status === 'paused' || item.status === 'expired') {
                actionButtons = `
                    <button onclick="window.userAction('reactivate', '${item.id}')" class="btn btn-primary" style="flex: 1; min-width:80px; padding: 0.3rem; font-size: 0.8rem; background: green; border:none;">Reaktivieren</button>
                    <button onclick="window.openEditListing('${item.id}')" class="btn btn-primary" style="flex: 1; min-width:80px; padding: 0.3rem; font-size: 0.8rem;">Bearbeiten</button>
                    <button onclick="window.userAction('delete', '${item.id}')" class="btn btn-secondary" style="flex: 1; min-width:80px; padding: 0.3rem; font-size: 0.8rem; background: darkred; color: white; border: none;">Löschen</button>
                `;
            } else {
                // Pending or Rejected
                actionButtons = `
                    <button onclick="window.openEditListing('${item.id}')" class="btn btn-primary" style="flex: 1; min-width:80px; padding: 0.3rem; font-size: 0.8rem;">Bearbeiten</button>
                    <button onclick="window.userAction('delete', '${item.id}')" class="btn btn-secondary" style="flex: 1; min-width:80px; padding: 0.3rem; font-size: 0.8rem; background: darkred; color: white; border: none;">Löschen</button>
                `;
            }

            let diffTime = 0;
            let daysTxt = "";
            let remainingLabel = "";

            if (item.status === 'paused') {
                let baseDate = item.status_updated_at ? new Date(item.status_updated_at) : new Date(item.created_at);
                diffTime = (baseDate.getTime() + (30 * 24 * 60 * 60 * 1000)) - new Date().getTime();
                let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                daysTxt = diffDays > 0 ? `Noch ${diffDays} Tage bis Löschung` : `Wird gelöscht`;
            } else if (item.status === 'pending') {
                daysTxt = `Warte auf Prüfung`;
            } else if (item.status === 'rejected') {
                daysTxt = `Abgelehnt`;
            } else {
                // Bei aktiv berechnen wir die 90 Tage bis zum Pausieren
                diffTime = (new Date(item.created_at).getTime() + (90 * 24 * 60 * 60 * 1000)) - new Date().getTime();
                let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                daysTxt = diffDays > 0 ? `Noch ${diffDays} Tage aktiv` : `Läuft ab`;
            }

            container.innerHTML += `
                <div class="property-card" style="display: flex; flex-direction: column; position: relative;">
                    <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; z-index: 10;">${daysTxt}</div>
                    <img src="${imgUrl}" alt="Bild" class="property-img">
                    <div class="property-content" style="flex-grow: 1; display: flex; flex-direction: column;">
                        <div class="property-price">${item.price} € / ${item.price_interval}</div>
                        <h3 class="property-title">${item.title}</h3>
                        <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">${statusBadge}</p>
                        <div class="property-details" style="margin-bottom: 1rem;">
                            <div class="detail-item">📍 ${item.zip} ${item.city}</div>
                            <div class="detail-item">🏷️ ${item.category}</div>
                        </div>
                        <div style="display: flex; gap: 5px; margin-top: auto; flex-wrap: wrap;">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // Admin Logik wurde ausgelagert.

    window.userAction = async (action, id) => {
        if(action === 'delete') {
            if(!confirm("Möchten Sie dieses Inserat wirklich samt allen Bildern unwiderruflich löschen?")) return;
            
            // Bilder aus Storage löschen
            const listing = window.userListingsData?.find(l => l.id === id);
            if (listing && listing.images && listing.images.length > 0) {
                const pathsToRemove = listing.images.map(url => {
                    const parts = url.split('/listing-images/');
                    return parts.length > 1 ? parts[1] : null;
                }).filter(p => p !== null);
                
                if (pathsToRemove.length > 0) {
                    await supabase.storage.from('listing-images').remove(pathsToRemove);
                }
            }

            // Wir nutzen nun den echten harten Delete! (Erfordert RLS Policy für DELETE)
            const { error } = await supabase.from('listings').delete().eq('id', id);
            if(error) alert("Fehler beim Löschen: " + error.message);
            else { alert("Inserat erfolgreich gelöscht."); loadUserListings(); }
        } else if(action === 'pause') {
            if(!confirm("Möchten Sie das Inserat pausieren? (Geht sofort offline)")) return;
            const { error } = await supabase.from('listings').update({ status: 'paused' }).eq('id', id);
            if(error) alert("Fehler: " + error.message);
            else { alert("Pausiert."); loadUserListings(); }
        } else if(action === 'reactivate') {
            if(!confirm("Wollen Sie das Inserat reaktivieren? (Muss danach kurz neu geprüft werden)")) return;
            const { error } = await supabase.from('listings').update({ status: 'pending' }).eq('id', id);
            if(error) alert("Fehler: " + error.message);
            else { alert("Reaktiviert. Wartet nun auf Freigabe."); loadUserListings(); }
        }
    };

    // --- Teilen Modal Logik Dashboard ---
    window.openShareModal = (id, title) => {
        const shareModal = document.getElementById('share-modal');
        const shareCopyBtn = document.getElementById('share-copy-btn');
        const shareFbBtn = document.getElementById('share-fb-btn');
        const shareWaBtn = document.getElementById('share-wa-btn');
        const shareEmailBtn = document.getElementById('share-email-btn');
        const shareFeedback = document.getElementById('share-feedback');
        
        // Base URL der Webseite berechnen
        const baseUrl = window.location.origin + window.location.pathname.replace('dashboard.html', '');
        const currentUrl = encodeURIComponent(`${baseUrl}expose.html?id=${id}`);
        const encTitle = encodeURIComponent(title);
        
        shareFbBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
        shareWaBtn.href = `https://api.whatsapp.com/send?text=${encTitle} - ${currentUrl}`;
        shareEmailBtn.href = `mailto:?subject=${encTitle}&body=Sieh dir dieses tolle Inserat an:%0D%0A${currentUrl}`;

        shareFeedback.style.display = 'none';
        shareModal.style.display = 'flex';

        // Event listener cloning um mehrfache Bindungen zu verhindern
        const newCopyBtn = shareCopyBtn.cloneNode(true);
        shareCopyBtn.parentNode.replaceChild(newCopyBtn, shareCopyBtn);
        newCopyBtn.addEventListener('click', () => {
            const decodedUrl = decodeURIComponent(currentUrl);
            navigator.clipboard.writeText(decodedUrl).then(() => {
                shareFeedback.style.display = 'block';
                setTimeout(() => { shareFeedback.style.display = 'none'; }, 3000);
            }).catch(err => {
                console.error('Konnte Link nicht kopieren:', err);
                prompt('Link manuell kopieren:', decodedUrl);
            });
        });
    };

    const closeShareBtn = document.getElementById('close-share-btn');
    if(closeShareBtn) {
        closeShareBtn.addEventListener('click', () => {
            document.getElementById('share-modal').style.display = 'none';
        });
    }

    window.openEditListing = (id) => {
        const listing = window.userListingsData.find(l => l.id === id);
        if(!listing) return;
        
        // Modal Felder befüllen
        document.getElementById('edit-listing-id').value = listing.id;
        document.getElementById('list-title').value = listing.title;
        document.getElementById('list-category').value = listing.category;
        const countryVal = listing.country || 'Österreich';
        const countryEl = document.getElementById('list-country');
        if(Array.from(countryEl.options).some(opt => opt.value === countryVal)) {
            countryEl.value = countryVal;
        } else {
            countryEl.value = 'Österreich';
        }
        document.getElementById('list-street').value = listing.street || '';
        document.getElementById('list-zip').value = listing.zip;
        document.getElementById('list-city').value = listing.city;
        document.getElementById('list-price').value = listing.price;
        document.getElementById('list-interval').value = listing.price_interval;
        document.getElementById('list-desc').value = listing.description;
        document.getElementById('char-count').textContent = `${listing.description.length} / 2000`;
        
        // Modal UI anpassen
        document.querySelector('#listing-modal h2').textContent = "Inserat bearbeiten";
        const imgLabel = document.querySelector('label[for="list-images"]');
        if(imgLabel) imgLabel.textContent = "Neue Bilder hochladen (Überschreibt alte Bilder. Überspringen um alte zu behalten.)";
        document.getElementById('submit-listing-btn').textContent = "Änderungen speichern (erneute Freigabe nötig)";
        
        document.getElementById('new-listing-form').style.display = 'block';
        document.getElementById('form-feedback-msg').style.display = 'none';
        document.getElementById('submit-listing-btn').style.display = 'block';
        document.getElementById('submit-listing-btn').disabled = false;
        
        const headerTexts = document.getElementById('modal-header-texts');
        if (headerTexts) headerTexts.style.display = 'block';
        document.getElementById('listing-modal').style.display = 'flex';
    };

    // Initital Load
    loadUserListings();


    // --- 1. MODAL LOGIK ---
    const modal = document.getElementById('listing-modal');
    const openBtn = document.getElementById('open-listing-modal-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    
    openBtn.addEventListener('click', () => { 
        const formObj = document.getElementById('new-listing-form');
        formObj.reset();
        formObj.style.display = 'block';
        const headerTexts = document.getElementById('modal-header-texts');
        if (headerTexts) headerTexts.style.display = 'block';
        document.getElementById('form-feedback-msg').style.display = 'none';
        document.getElementById('submit-listing-btn').style.display = 'block';
        document.getElementById('submit-listing-btn').disabled = false;
        document.getElementById('edit-listing-id').value = '';
        document.querySelector('#listing-modal h2').textContent = "Neues Inserat erstellen";
        const imgLabel = document.querySelector('label[for="list-images"]');
        if(imgLabel) imgLabel.textContent = "Bilder hochladen (Max. 3 Bilder à 2 MB)";
        document.getElementById('submit-listing-btn').textContent = "Inserat zur Freigabe einreichen";
        document.getElementById('preview-container').innerHTML = '';
        validFiles = [];
        modal.style.display = 'flex'; 
    });
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => { 
        if(e.target === modal) modal.style.display = 'none'; 
    });

    // --- 2. DYNAMISCHE KATEGORIEN ---
    const categorySelect = document.getElementById('list-category');
    const dropdownLinks = document.querySelectorAll('.dropdown-content a');
    dropdownLinks.forEach(link => {
        const option = document.createElement('option');
        option.value = link.textContent.trim();
        option.textContent = link.textContent.trim();
        categorySelect.appendChild(option);
    });

    const descArea = document.getElementById('list-desc');
    const charCountNode = document.getElementById('char-count');
    descArea.addEventListener('input', () => {
        charCountNode.textContent = `${descArea.value.length} / 2000`;
    });

    // --- 3. PLZ ZU ORT AUTOFILL ---
    const zipInput = document.getElementById('list-zip');
    const cityInput = document.getElementById('list-city');
    const countrySel = document.getElementById('list-country');

    async function fetchCityFromZip() {
        const zip = zipInput.value.trim();
        const countryName = countrySel.value;
        if (!zip || zip.length < 4) return;

        let countryCode = 'at';
        if (countryName === 'Deutschland') countryCode = 'de';
        else if (countryName === 'Schweiz') countryCode = 'ch';

        try {
            const response = await fetch(`https://api.zippopotam.us/${countryCode}/${zip}`);
            if (response.ok) {
                const data = await response.json();
                if (data.places && data.places.length > 0) {
                    cityInput.value = data.places[0]['place name'];
                    cityInput.style.backgroundColor = '#e8f5e9'; // kurz aufblinken lassen (Erfolg)
                    setTimeout(() => cityInput.style.backgroundColor = '', 1000);
                }
            }
        } catch (error) {
            console.error('Fehler beim Abrufen der PLZ:', error);
        }
    }

    zipInput.addEventListener('blur', fetchCityFromZip);
    zipInput.addEventListener('keyup', () => {
        const zip = zipInput.value.trim();
        const cName = countrySel.value;
        if ((cName === 'Deutschland' && zip.length === 5) || (cName !== 'Deutschland' && zip.length === 4)) {
            fetchCityFromZip();
        }
    });
    countrySel.addEventListener('change', () => {
        if(zipInput.value.trim().length >= 4) fetchCityFromZip();
    });

    // --- 4. BILDER VALIDATION & PREVIEW (Optimiert mit Drag & Drop) ---
    const imageInput = document.getElementById('list-images');
    const dropZone = document.getElementById('drop-zone');
    const errorMsg = document.getElementById('image-error-msg');
    const previewContainer = document.getElementById('preview-container');
    let validFiles = [];

    // Zentrale Funktion zur Dateiverarbeitung
    function handleFiles(files) {
        errorMsg.style.display = 'none';
        
        // Wir setzen die Dateien nicht komplett zurück, falls der Nutzer nacheinander auswählt? 
        // Nein, wir folgen der Logik: Eine Auswahl ersetzt die vorherige (wie beim <input> Standard).
        previewContainer.innerHTML = '';
        validFiles = [];
        
        const filesArray = Array.from(files);
        
        if (filesArray.length > 3) {
            errorMsg.style.display = 'block';
            errorMsg.textContent = 'Um unseren Service kostenlos anzubieten, beschränken wir Uploads auf max. 3 Bilder.';
            imageInput.value = ''; 
            return;
        }

        // Limit auf 10 MB erhöht (pre-compression)
        const MAX_SIZE = 10 * 1024 * 1024;
        let hasOversized = false;
        filesArray.forEach(f => { if (f.size > MAX_SIZE) hasOversized = true; });

        if (hasOversized) {
            errorMsg.style.display = 'block';
            errorMsg.textContent = 'Ein oder mehrere Bilder überschreiten das 10 MB Limit!';
            imageInput.value = ''; 
            return;
        }

        validFiles = filesArray;
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'image-preview';
                previewContainer.appendChild(img);
            };
            reader.readAsDataURL(file);
        });
    }

    // Input Change Event
    imageInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Drag & Drop Events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-active');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-active');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
        // Synchronisiere das Input-Feld, damit es die gedroppten Dateien "kennt" (optional, aber sauberer)
        imageInput.files = files;
    });

    // Erlaube Klick auf die gesamte Drop-Zone zum Öffnen des File-Dialogs (außer wenn direkt auf Input geklickt wird)
    dropZone.addEventListener('click', (e) => {
        if (e.target !== imageInput) {
            imageInput.click();
        }
    });

    // --- BILD-KOMPRIMIERUNGS-HELFER ---
    async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = width * ratio;
                        height = height * ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(blob => {
                        if (!blob) return reject(new Error('Canvas to Blob konvertierung fehlgeschlagen'));
                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        resolve(new File([blob], newFileName, {
                            type: 'image/webp',
                            lastModified: Date.now()
                        }));
                    }, 'image/webp', quality);
                };
                img.onerror = err => reject(err);
            };
            reader.onerror = err => reject(err);
        });
    }

    // --- 5. FORM SUBMIT UND SUPABASE UPLOAD ---
    const form = document.getElementById('new-listing-form');
    const feedback = document.getElementById('form-feedback-msg');
    const submitBtn = document.getElementById('submit-listing-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.textContent = "Lade hoch... Bitte warten.";
        feedback.style.display = 'none';

        try {
            const editId = document.getElementById('edit-listing-id').value;
            let finalImageUrls = [];

            // Wenn wir im Edit-Modus sind und keine neuen Bilder gewählt wurden, behalten wir die alten.
            if (editId && validFiles.length === 0) {
                const existingListing = window.userListingsData.find(l => l.id === editId);
                if (existingListing) finalImageUrls = existingListing.images || [];
            } else {
                // Upload neue Bilder (mit Komprimierung)
                for (let i = 0; i < validFiles.length; i++) {
                    const originalFile = validFiles[i];
                    
                    // Bild vor dem Upload in WebP umwandeln und max auf 1200x1200 komprimieren
                    const file = await compressImage(originalFile, 1200, 1200, 0.8);

                    const fileExt = file.name.split('.').pop() || 'webp';
                    const fileName = `${session.user.id}-${Date.now()}-${i}.${fileExt}`;
                    const filePath = `listings/${fileName}`;

                    const { data, uploadError } = await supabase.storage.from('listing-images').upload(filePath, file, { cacheControl: '3600', upsert: false });
                    if (uploadError) throw new Error("Bild-Upload Fehler: " + uploadError.message);

                    const { data: publicUrlData } = supabase.storage.from('listing-images').getPublicUrl(filePath);
                    finalImageUrls.push(publicUrlData.publicUrl);
                }
            }

            const title = document.getElementById('list-title').value;
            const category = document.getElementById('list-category').value;
            const country = document.getElementById('list-country').value;
            const street = document.getElementById('list-street').value;
            const zip = document.getElementById('list-zip').value;
            const city = document.getElementById('list-city').value;
            const price = parseFloat(document.getElementById('list-price').value);
            const interval = document.getElementById('list-interval').value;
            const desc = document.getElementById('list-desc').value;

            const listingData = {
                title: title,
                category: category,
                country: country,
                street: street,
                zip: zip,
                city: city,
                price: price,
                price_interval: interval,
                description: desc,
                images: finalImageUrls,
                status: 'pending'
            };

            let dbError;
            if (editId) {
                // UPDATE
                const { error: updErr } = await supabase.from('listings').update(listingData).eq('id', editId);
                dbError = updErr;
            } else {
                // INSERT
                listingData.user_id = session.user.id;
                listingData.contact_email = session.user.email;
                listingData.contact_name = session.user.user_metadata?.name || 'Anbieter';
                const { error: insErr } = await supabase.from('listings').insert([listingData]);
                dbError = insErr;
            }

            if (dbError) throw new Error("Datenbank Fehler: " + dbError.message);

            feedback.style.display = 'block';
            feedback.style.color = "#333";
            feedback.style.backgroundColor = "#f0fdf4";
            feedback.style.border = "2px solid #bbf7d0";
            feedback.style.padding = "20px";
            feedback.style.borderRadius = "8px";
            feedback.innerHTML = `
                <h3 style="color: #166534; margin-top:0; font-size: 1.3rem;">✅ Erfolg! Ihr Inserat wurde eingereicht.</h3>
                <p style="margin-bottom: 1rem;">Es wird nun in Kürze geprüft und danach freigeschaltet.</p>
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #dcfce7; text-align: center;">
                    <p style="margin-bottom: 1rem; font-size: 1rem;">
                        <strong>Unterstützen Sie uns ❤️</strong><br><br>
                        Wir legen großen Wert darauf, diesen Marktplatz völlig kostenlos und ohne störende Werbung anzubieten.<br>
                        Wenn Ihnen unser Service hilft, freuen wir uns riesig über eine kleine, freiwillige Unterstützung für den laufenden Serverbetrieb.
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: center; align-items: center; margin-top: 1rem; flex-wrap: wrap;">
                        <a href="https://paypal.me/gimmobilen" target="_blank" rel="noopener noreferrer" class="btn" style="background-color: #003087; color: white; padding: 0.8rem 1.5rem; border-radius: 50px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
                            Via PayPal unterstützen
                        </a>
                        <button type="button" onclick="document.getElementById('listing-modal').style.display='none'" class="btn" style="background: transparent; color: #666; font-size: 0.95rem; border: none; padding: 0.8rem; text-decoration: underline; cursor: pointer;">
                            Diesmal nicht
                        </button>
                    </div>
                </div>
            `;
            
            const headerTexts = document.getElementById('modal-header-texts');
            if (headerTexts) headerTexts.style.display = 'none';
            form.style.display = 'none'; // Verstecke das Eingabeformular
            submitBtn.style.display = 'none'; // Verstecke den alten Senden-Button

            form.reset();
            previewContainer.innerHTML = '';
            validFiles = [];
            loadUserListings(); // Update personal dashboard view!
            
            // Kein automatisches Schließen mehr! Der Nutzer soll in Ruhe den PayPal-Link ansehen können und dann selbst über das X schließen.

        } catch (err) {
            console.error(err);
            feedback.style.display = 'block';
            feedback.style.color = "red";
            feedback.style.backgroundColor = "#fff";
            feedback.textContent = err.message;
            submitBtn.disabled = false;
            submitBtn.textContent = "Erneut versuchen";
        }
    });

    // Automatic modal open if URL has ?action=new-listing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new-listing') {
        const createBtn = document.getElementById('open-listing-modal-btn');
        if (createBtn) {
            // Slight delay ensures rendering is fully complete
            setTimeout(() => createBtn.click(), 100);
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }

});
