document.addEventListener('DOMContentLoaded', async () => {
    
    const SUPABASE_URL = 'https://ncvxdpammwbgybhdlnwd.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnhkcGFtbXdiZ3liaGRsbndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTA1MjgsImV4cCI6MjA5MDM2NjUyOH0.oo1x1YTel9rK-9lFKmrKcHOmHZLQ--bXq6n4iBubBdQ';
    
    if (!window.supabase) return;
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return; 
    }

    // ADMIN CHECK
    const isAdmin = session.user.email === 'mathias.gutschelhofer@gmail.com';
    if (!isAdmin) {
        alert("Zugriff verweigert. Nur Administratoren dürfen diese Seite sehen.");
        window.location.href = 'dashboard.html';
        return;
    }

    const pendingContainer = document.getElementById('admin-pending-list');
    const activeContainer = document.getElementById('admin-active-list');

    async function loadAdminListings() {
        // PENDING PAGE LOGIC
        if (pendingContainer) {
            const { data: pendingData, error: pendingErr } = await supabase.from('listings').select('*').eq('status', 'pending').order('created_at', { ascending: false });
            
            if(pendingErr) pendingContainer.innerHTML = `<p style="color:red">Fehler: ${pendingErr.message}</p>`;
            else if(pendingData.length === 0) pendingContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--white); border-radius: var(--border-radius); box-shadow: var(--box-shadow);"><p>✅ Vollständig abgewickelt! Keine neuen Inserate zur Freigabe.</p></div>`;
            else {
                pendingContainer.innerHTML = '';
                pendingData.forEach(item => {
                    const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : 'https://placehold.co/600x400/ddd/555?text=Kein+Bild';
                    
                    // Erkennung ob Neu oder Bearbeitet
                    const createdTime = new Date(item.created_at).getTime();
                    const updatedTime = item.status_updated_at ? new Date(item.status_updated_at).getTime() : createdTime;
                    const isEdited = (updatedTime - createdTime) > 60000; // Mehr als 1 Minute unterschied = Bearbeitet
                    
                    const editBadge = isEdited ? 
                        `<span style="background: var(--primary-light); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; margin-bottom: 10px; display: inline-block;">🔄 Vom Nutzer bearbeitet</span>` : 
                        `<span style="background: green; color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; margin-bottom: 10px; display: inline-block;">✨ Brandneues Inserat</span>`;

                    pendingContainer.innerHTML += `
                        <div class="property-card" style="border: 2px solid orange;">
                            <img src="${imgUrl}" alt="Bild" class="property-img">
                            <div class="property-content listing-info">
                                ${editBadge}
                                <h3 class="property-title">${item.title}</h3>
                                <p><strong>Preis:</strong> ${item.price} € / ${item.price_interval}</p>
                                <p><strong>Kategorie:</strong> ${item.category}</p>
                                <p><strong>E-Mail:</strong> ${item.contact_email}</p>
                                <p style="font-size: 0.8rem; height: 60px; overflow-y: auto; background: #f8fafc; padding: 0.5rem; border-radius: 4px; margin-top: 5px;">${item.description}</p>
                                <div style="display: flex; gap: 10px; margin-top: 1rem;">
                                    <button onclick="window.updateStatus('${item.id}', 'active')" class="btn btn-primary" style="flex: 1; padding: 0.5rem; background: green; border: none;">✅ Freigeben</button>
                                    <button onclick="window.updateStatus('${item.id}', 'rejected')" class="btn btn-secondary" style="flex: 1; padding: 0.5rem; background: darkred; color: white; border: none;">✖️ Ablehnen</button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
        }

        // ACTIVE PAGE LOGIC
        if (activeContainer) {
            const { data: activeData, error: activeErr } = await supabase.from('listings').select('*').in('status', ['active', 'paused', 'expired']).order('created_at', { ascending: false });
            
            if(activeErr) activeContainer.innerHTML = `<p style="color:red">Fehler: ${activeErr.message}</p>`;
            else if(activeData.length === 0) activeContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--white); border-radius: var(--border-radius); box-shadow: var(--box-shadow);"><p>Die Datenbank ist komplett leer.</p></div>`;
            else {
                activeContainer.innerHTML = '';
                activeData.forEach(item => {
                    const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : 'https://placehold.co/600x400/ddd/555?text=Kein+Bild';
                    
                    let statusColor = "green";
                    let statusLabel = "Aktiv";
                    if(item.status === 'paused') { statusColor = "gray"; statusLabel = "Vom Nutzer pausiert"; }
                    if(item.status === 'expired') { statusColor = "black"; statusLabel = "Abgelaufen"; }

                    activeContainer.innerHTML += `
                        <div class="property-card" style="border: 2px solid ${statusColor};">
                            <img src="${imgUrl}" alt="Bild" class="property-img" style="height: 140px;">
                            <div class="property-content">
                                <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; margin-bottom: 5px; display: inline-block;">${statusLabel}</span>
                                <h3 style="font-size: 1rem; margin-bottom: 5px;">${item.title}</h3>
                                <p style="font-size: 0.85rem; margin-bottom: 10px; color: var(--text-secondary);">${item.category} | Von: ${item.contact_email}</p>
                                <button onclick="window.updateStatus('${item.id}', 'delete')" class="btn btn-secondary" style="width: 100%; padding: 0.3rem; background: darkred; color: white; border: none; font-size: 0.8rem;">Zwangslöschen (Hard Delete)</button>
                            </div>
                        </div>
                    `;
                });
            }
        }
    }

    // Globale Funktion für Button-Clicks
    window.updateStatus = async (id, newStatus) => {
        if(!isAdmin) return;
        
        if(newStatus === 'delete') {
            if(!confirm("Inserat wirklich unwiderruflich aus der Datenbank und die Bilder vom Server löschen?")) return;
            
            // Bilder abrufen und löschen
            const { data: itemData } = await supabase.from('listings').select('images').eq('id', id).single();
            if (itemData && itemData.images && itemData.images.length > 0) {
                const pathsToRemove = itemData.images.map(url => {
                    const parts = url.split('/listing-images/');
                    return parts.length > 1 ? parts[1] : null;
                }).filter(p => p !== null);
                if (pathsToRemove.length > 0) {
                    await supabase.storage.from('listing-images').remove(pathsToRemove);
                }
            }

            const { error } = await supabase.from('listings').delete().eq('id', id);
            if(error) alert("Fehler: " + error.message);
            else { alert("Komplett gelöscht!"); loadAdminListings(); }
            return;
        }

        const confirmMsg = newStatus === 'active' ? "Inserat wirklich online stellen?" : "Inserat wirklich in den Papierkorb werfen (Ablehnen)?";
        if(!confirm(confirmMsg)) return;

        const { error } = await supabase.from('listings').update({ status: newStatus }).eq('id', id);
        if(error) alert("Fehler: " + error.message);
        else {
            alert("Erfolgreich aktualisiert!");
            loadAdminListings();
        }
    };

    const reportsContainer = document.getElementById('admin-reports-list');
    const usersContainer = document.getElementById('admin-users-list');

    async function loadAdminReports() {
        if (!reportsContainer) return;

        const { data: reportsData, error: reportsErr } = await supabase.from('reports').select('*, listings(*)').order('created_at', { ascending: false });
        
        if (reportsErr) {
            reportsContainer.innerHTML = `<p style="color:red">Fehler beim Laden der Reports: ${reportsErr.message}</p>`;
            return;
        }

        if (!reportsData || reportsData.length === 0) {
            reportsContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: var(--white); border-radius: var(--border-radius); box-shadow: var(--box-shadow);"><p>✅ Keine offenen Meldungen.</p></div>`;
            return;
        }

        reportsContainer.innerHTML = '';
        reportsData.forEach(rep => {
            const item = rep.listings;
            if (!item) {
                reportsContainer.innerHTML += `
                    <div class="property-card" style="border: 2px solid red; padding: 1rem;">
                        <h3 style="color:red;">Inserat wurde bereits gelöscht</h3>
                        <p><strong>Meldegrund:</strong> ${rep.reason}</p>
                        <p style="font-size:0.8rem; color:#888;">Genaue ID: ${rep.listing_id}</p>
                        <button onclick="window.dismissReport('${rep.id}')" class="btn btn-secondary" style="margin-top: 10px; width: 100%;">Meldung verwerfen / schließen</button>
                    </div>
                `;
                return;
            }

            const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : 'https://placehold.co/600x400/ddd/555?text=Kein+Bild';
            
            reportsContainer.innerHTML += `
                <div class="property-card" style="border: 2px solid #d32f2f;">
                    <div style="background: #fff0f0; color: #d32f2f; padding: 10px; border-bottom: 2px solid #d32f2f;">
                        <strong>🚩 Meldegrund:</strong> ${rep.reason}
                    </div>
                    <img src="${imgUrl}" alt="Bild" class="property-img">
                    <div class="property-content listing-info">
                        <h3 class="property-title">${item.title}</h3>
                        <p><strong>Preis:</strong> ${item.price} € / ${item.price_interval}</p>
                        <p><strong>Von E-Mail:</strong> ${item.contact_email}</p>
                        <div style="display: flex; gap: 10px; margin-top: 1rem;">
                            <button onclick="window.dismissReport('${rep.id}')" class="btn btn-secondary" style="flex: 1; padding: 0.5rem; font-size: 0.8rem;">✔️ Verwerfen</button>
                            <button onclick="window.updateStatus('${item.id}', 'delete')" class="btn btn-primary" style="flex: 1; padding: 0.5rem; background: darkred; border: none; font-size: 0.8rem;">🗑️ Inserat Löschen</button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    async function loadAdminUsers() {
        if (!usersContainer) return;
        
        const { data: listingsData, error: lErr } = await supabase.from('listings').select('user_id, contact_name, contact_email');
        const { data: blacklistData, error: bErr } = await supabase.from('blacklist').select('*');

        if(lErr) { usersContainer.innerHTML = `<tr><td colspan="5" style="color:red">Fehler: ${lErr.message}</td></tr>`; return;}

        const usersMap = new Map();

        if (listingsData) {
            listingsData.forEach(l => {
                if (l.contact_email && !usersMap.has(l.contact_email)) {
                    usersMap.set(l.contact_email, { id: l.user_id, name: l.contact_name || 'Unbekannt', email: l.contact_email, status: 'aktiv', listed_count: 1 });
                } else if(l.contact_email) {
                    usersMap.get(l.contact_email).listed_count++;
                }
            });
        }

        if (blacklistData) {
            blacklistData.forEach(b => {
                if (usersMap.has(b.email)) {
                    usersMap.get(b.email).status = b.action;
                } else {
                    usersMap.set(b.email, { id: 'N/A', name: b.username || 'Unbekannt (Nur in Blacklist)', email: b.email, status: b.action, listed_count: 0 });
                }
            });
        }

        usersContainer.innerHTML = '';
        const sortedUsers = Array.from(usersMap.values()).sort((a,b) => a.email.localeCompare(b.email));

        if (sortedUsers.length === 0) {
            usersContainer.innerHTML = `<tr><td colspan="5" style="text-align:center;">Keine registrierten Nutzer gefunden.</td></tr>`;
            return;
        }

        sortedUsers.forEach(u => {
            let statusBadge = `<span style="background: green; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">Aktiv</span>`;
            if (u.status === 'banned') statusBadge = `<span style="background: orange; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">Gesperrt</span>`;
            if (u.status === 'deleted') statusBadge = `<span style="background: red; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">Gelöscht</span>`;
            
            let btnAction = '';
            if (u.status === 'aktiv') {
                btnAction = `
                    <button onclick="window.adminBanUser('${u.email}', '${u.name}')" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Sperren</button>
                    <button onclick="window.adminDeleteUser('${u.email}', '${u.id}')" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: darkred; color:white; border:none;">Löschen</button>
                `;
            } else if (u.status === 'banned') {
                btnAction = `
                    <button onclick="window.adminUnbanUser('${u.email}')" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: green; color:white; border:none;">Entsperren</button>
                    <button onclick="window.adminDeleteUser('${u.email}', '${u.id}')" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: darkred; color:white; border:none;">Löschen</button>
                `;
            } else {
                 btnAction = `<span style="color:#888; font-size:0.8rem;">(Permanent entfernt)</span>`;
            }

            usersContainer.innerHTML += `
                <tr>
                    <td><div style="width: 40px; height: 40px; background: #eee; border-radius: 50%; display: flex; align-items: center; justify-content: center;">👤</div></td>
                    <td><strong>${u.name}</strong><br><span style="font-size:0.8rem; color:#888;">Inserate: ${u.listed_count}</span></td>
                    <td>${u.email}<br>${statusBadge}</td>
                    <td style="font-size:0.75rem; color:#888;">${u.id}</td>
                    <td style="display: flex; gap: 5px; align-items: center;">${btnAction}</td>
                </tr>
            `;
        });
    }

    window.dismissReport = async (reportId) => {
        if(!isAdmin) return;
        const { error } = await supabase.from('reports').delete().eq('id', reportId);
        if(error) alert("Fehler: " + error.message);
        else loadAdminReports();
    };

    window.adminBanUser = async (email, username) => {
        if(!confirm(`Möchten Sie ${email} wirklich sperren? Login wird verweigert.`)) return;
        const { error } = await supabase.from('blacklist').insert([{ email: email, username: username, action: 'banned'}]);
        if(error) alert("Sperren fehlgeschlagen: " + error.message);
        else loadAdminUsers();
    };

    window.adminUnbanUser = async (email) => {
        const { error } = await supabase.from('blacklist').delete().eq('email', email);
        if(error) alert("Fehler: " + error.message);
        else loadAdminUsers();
    };

    window.adminDeleteUser = async (email, userId) => {
        if(!isAdmin) return;
        if(!confirm(`ACHTUNG! Benutzer ${email} endgültig verbannen? Alle Inserate werden dadurch gelöscht.`)) return;
        if(!confirm(`Sind Sie wirklich sicher? Dieser Vorgang ist nicht umkehrbar.`)) return;

        await supabase.from('blacklist').upsert([{ email: email, action: 'deleted'}], { onConflict: 'email' });
        if(userId && userId !== 'N/A') {
            await supabase.from('listings').delete().eq('user_id', userId);
        }
        
        alert("Benutzer geblockt und Inserate gelöscht.");
        loadAdminUsers();
        loadAdminListings();
    };

    // --- 5. SYSTEM-REINIGUNG ---
    const cleanupBtn = document.getElementById('cleanup-storage-btn');
    const cleanupFeedback = document.getElementById('cleanup-feedback');

    if (cleanupBtn) {
        cleanupBtn.addEventListener('click', async () => {
            if (!isAdmin) return;
            cleanupBtn.disabled = true;
            cleanupBtn.textContent = "⏳ Analysiere...";
            cleanupFeedback.textContent = "";

            try {
                const bucket = 'listing-images';
                // 1. Alle Dateien im Storage listen (Standard Limit 100)
                const { data: storageFiles, error: storageErr } = await supabase.storage.from(bucket).list('', { limit: 500 });
                if (storageErr) throw storageErr;

                // 2. Alle genutzten Bild-URLs aus der DB holen
                const { data: allListings, error: dbErr } = await supabase.from('listings').select('images');
                if (dbErr) throw dbErr;

                const usedFiles = new Set();
                allListings.forEach(l => {
                    if (l.images) {
                        l.images.forEach(url => {
                            // Extrahiere Dateiname nach dem Bucket-Pfad
                            const parts = url.split('/' + bucket + '/');
                            if (parts.length > 1) usedFiles.add(parts[1]);
                        });
                    }
                });

                // 3. Verwaiste Dateien identifizieren
                const orphans = storageFiles
                    .map(f => f.name)
                    .filter(name => name !== '.emptyFolderPlaceholder' && !usedFiles.has(name));

                if (orphans.length === 0) {
                    cleanupFeedback.innerHTML = "✅ Keine verwaisten Bilder gefunden. Speicher ist sauber!";
                    cleanupBtn.textContent = "🔍 Speicher analysieren & bereinigen";
                    cleanupBtn.disabled = false;
                    return;
                }

                // 4. Löschung nach Bestätigung
                if (confirm(`Achtung: ${orphans.length} ungenutzte Bilder gefunden. Diese werden physisch vom Cloud-Speicher gelöscht. Fortfahren?`)) {
                    cleanupFeedback.textContent = `Lösche ${orphans.length} Dateien...`;
                    const { error: delErr } = await supabase.storage.from(bucket).remove(orphans);
                    
                    if (delErr) throw delErr;

                    cleanupFeedback.innerHTML = `✅ ${orphans.length} Bilder erfolgreich entfernt!`;
                } else {
                    cleanupFeedback.textContent = "Vorgang abgebrochen.";
                }

            } catch (err) {
                console.error("Cleanup Error:", err);
                cleanupFeedback.textContent = "❌ Fehler: " + err.message;
            } finally {
                cleanupBtn.disabled = false;
                cleanupBtn.textContent = "🔍 Speicher analysieren & bereinigen";
            }
        });
    }

    // Initital Load
    loadAdminListings();
    loadAdminReports();
    loadAdminUsers();
});
