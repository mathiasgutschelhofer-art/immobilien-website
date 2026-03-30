const SUPABASE_URL = 'https://ncvxdpammwbgybhdlnwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnhkcGFtbXdiZ3liaGRsbndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTA1MjgsImV4cCI6MjA5MDM2NjUyOH0.oo1x1YTel9rK-9lFKmrKcHOmHZLQ--bXq6n4iBubBdQ';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (!window.supabase) {
            console.error('Supabase CDN wurde nicht geladen!');
            return;
        }

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Session abrufen
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        // Navigation + Logo updaten
        updateNavbar(session, supabase);

        // Dashboard & Profil schützen
        const protectedPages = ['dashboard.html', 'profil.html'];
        const isProtected = protectedPages.some(p => window.location.pathname.includes(p));
        if (isProtected && !session) {
            window.location.href = 'login.html';
        }

        // Logout
        document.addEventListener('click', async (e) => {
            if (e.target.id === 'logout-btn') {
                e.preventDefault();
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            }
        });

        // Registrierung (Alt)
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const name = document.getElementById('name').value;
                    const phone = document.getElementById('phone').value;
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    const confirmPassword = document.getElementById('confirm-password').value;
                    if (password !== confirmPassword) {
                        document.getElementById('error-msg').textContent = 'Fehler: Passwörter stimmen nicht überein!';
                        return;
                    }
                    document.getElementById('error-msg').textContent = '';
                    document.getElementById('success-msg').textContent = 'Lade...';

                    // --- Blacklist Check ---
                    const { data: bData } = await supabase.from('blacklist').select('action').eq('email', email.trim());
                    if (bData && bData.length > 0) {
                        throw new Error("Dieser Account wurde aufgrund von Verstößen gesperrt oder gelöscht. Eine Registrierung ist nicht möglich.");
                    }

                    const { error } = await supabase.auth.signUp({
                        email: email,
                        password: password,
                        options: { data: { name: name, phone: phone } }
                    });

                    if (error) throw error;
                    document.getElementById('success-msg').textContent = 'Account erstellt! Weiterleitung...';
                    setTimeout(() => window.location.href = 'dashboard.html', 1500);
                } catch (err) {
                    document.getElementById('error-msg').textContent = 'Fehler: ' + err.message;
                    document.getElementById('success-msg').textContent = '';
                }
            });
        }

        // Login (Alt)
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    document.getElementById('error-msg').textContent = 'Logge ein...';
                    
                    // --- Blacklist Check ---
                    const { data: bData } = await supabase.from('blacklist').select('action').eq('email', email.trim());
                    if (bData && bData.length > 0) {
                        throw new Error("Dieser Account wurde gesperrt. Bitte kontaktieren Sie den Support.");
                    }

                    const { error } = await supabase.auth.signInWithPassword({ email: email, password: password });
                    if (error) throw error;
                    window.location.href = 'dashboard.html';
                } catch (err) {
                    document.getElementById('error-msg').textContent = 'Login Fehler: ' + err.message;
                }
            });
        }

        // --- PROFIL SEITEN LOGIK ---
        if (window.location.pathname.includes('profil.html') && session) {
            initProfilePage(supabase, session.user);
        }

    } catch (globalError) {
        console.error(globalError);
    }
});

async function updateNavbar(session, supabase) {
    const navLinksList = document.querySelector('.nav-links');
    
    // Logo "Startseite" Hack (Verknüpfung)
    const logoContainer = document.querySelector('.logo-container');
    if (logoContainer && !logoContainer.querySelector('h2')) {
        logoContainer.style.display = "flex";
        logoContainer.style.alignItems = "center";
        logoContainer.style.gap = "1rem";
        logoContainer.style.textDecoration = "none";
        logoContainer.innerHTML += `<h2 style="margin: 0; color: var(--primary-color); font-size: 1.5rem; display: none;" class="logo-text-desktop">Startseite</h2>`;
        // Quick CSS to hide on mobile
        const style = document.createElement('style');
        style.innerHTML = `@media(min-width: 768px){ .logo-text-desktop { display: block !important; } }`;
        document.head.appendChild(style);
    }

    if (!navLinksList) return;

    // Alte Auth Items löschen
    ['auth-dashboard-item', 'auth-nav-item', 'logout-nav-item'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    if (session) {
        const providerCta = document.getElementById('provider-cta-btn');
        if (providerCta) {
            providerCta.href = "dashboard.html?action=new-listing";
            providerCta.innerHTML = '<span style="font-size: 1.2rem;">✨</span> Neues Inserat eintragen';
        }

        let fullName = session.user?.user_metadata?.name || "Benutzer";
        let displayStr = fullName;
        // Kürzen auf 5 Zeichen + ...
        if (fullName.length > 5) {
            displayStr = fullName.substring(0, 5) + '...';
        }

        // --- ADMIN LINK & BENACHRICHTIGUNG ---
        if (session.user.email === 'mathias.gutschelhofer@gmail.com') {
            let badgeHtml = "Admin";
            if (supabase) {
                const { count: pendingCount, error: pErr } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                const { count: reportCount, error: rErr } = await supabase.from('reports').select('*', { count: 'exact', head: true });
                
                let totalCount = 0;
                if (!pErr && pendingCount) totalCount += pendingCount;
                if (!rErr && reportCount) totalCount += reportCount;

                if (totalCount > 0) {
                    // Falls spezielle Anzeige gewünscht ist, könnte man das auch trennen. Wir summieren es hier einfach auf.
                    badgeHtml = `Admin <span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 12px; font-size: 0.75rem; margin-left: 4px; box-shadow: 0 0 8px rgba(255,0,0,0.3); animation: pulse 2s infinite;">${totalCount}</span>`;
                    
                    if(!document.getElementById('pulse-anim')) {
                        const style = document.createElement('style');
                        style.id = 'pulse-anim';
                        style.innerHTML = `@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }`;
                        document.head.appendChild(style);
                    }
                }
            }
            const adminLi = document.createElement('li');
            adminLi.id = 'admin-nav-item';
            adminLi.style.display = 'flex';
            adminLi.style.alignItems = 'center';
            adminLi.innerHTML = `<a href="admin.html" style="font-weight: 600; color: #ef4444; display: flex; align-items: center;">🛡️ ${badgeHtml}</a>`;
            navLinksList.appendChild(adminLi);
        }

        // 1. Mein Dashboard Link
        const dashLi = document.createElement('li');
        dashLi.id = 'auth-dashboard-item';
        dashLi.style.display = 'flex';
        dashLi.style.alignItems = 'center';
        dashLi.innerHTML = `<a href="dashboard.html" style="font-weight: 500;">Dashboard</a>`;
        navLinksList.appendChild(dashLi);

        // 2. Profil
        const profileLi = document.createElement('li');
        profileLi.id = 'auth-nav-item';
        profileLi.style.display = "flex";
        profileLi.style.alignItems = "center";
        profileLi.innerHTML = `<a href="profil.html" style="font-weight: 500;" title="${fullName}">👤 Profil</a>`;
        navLinksList.appendChild(profileLi);

        // 3. Logout
        const logoutLi = document.createElement('li');
        logoutLi.id = 'logout-nav-item';
        logoutLi.style.display = 'flex';
        logoutLi.style.alignItems = 'center';
        logoutLi.innerHTML = `<a href="#" id="logout-btn" style="color: var(--text-secondary); font-size: 0.9rem;">Abmelden</a>`;
        navLinksList.appendChild(logoutLi);
    } else {
        const loginLi = document.createElement('li');
        loginLi.id = 'auth-nav-item';
        loginLi.innerHTML = `<a href="login.html" class="btn btn-primary" style="color: white; padding: 0.4rem 1rem;">Login / Registrieren</a>`;
        navLinksList.appendChild(loginLi);
    }
}

// ============================================
// PROFIL FUNKTIONEN
// ============================================
function initProfilePage(supabase, user) {
    const meta = user.user_metadata || {};
    
    // Daten in UI laden
    document.getElementById('display-name').textContent = meta.name || "Unbekannt";
    document.getElementById('display-email').textContent = user.email;
    
    if (meta.avatar_url) {
        document.getElementById('current-avatar').src = meta.avatar_url;
    }
    document.getElementById('prof-plz').value = meta.plz || "";
    document.getElementById('prof-ort').value = meta.ort || "";
    document.getElementById('prof-land').value = meta.land || "";
    document.getElementById('prof-geschlecht').value = meta.geschlecht || "";

    // 1. Avatar Auswahl
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(img => {
        if(meta.avatar_url === img.getAttribute('data-url')) {
            img.classList.add('selected');
        }
        img.addEventListener('click', () => {
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            img.classList.add('selected');
        });
    });

    document.getElementById('save-avatar-btn').addEventListener('click', async () => {
        const selected = document.querySelector('.avatar-option.selected');
        if(!selected) return;
        const newUrl = selected.getAttribute('data-url');
        
        const { error } = await supabase.auth.updateUser({
            data: { avatar_url: newUrl }
        });
        const msg = document.getElementById('msg-avatar');
        if(error) { msg.style.color = "red"; msg.textContent = "Fehler: " + error.message; }
        else {
            msg.style.color = "green"; msg.textContent = "Avatar gespeichert!";
            document.getElementById('current-avatar').src = newUrl;
        }
    });

    // 2. Metadaten speichern
    document.getElementById('profile-meta-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('msg-meta');
        msg.textContent = "Speichere...";
        
        const { error } = await supabase.auth.updateUser({
            data: {
                plz: document.getElementById('prof-plz').value,
                ort: document.getElementById('prof-ort').value,
                land: document.getElementById('prof-land').value,
                geschlecht: document.getElementById('prof-geschlecht').value
            }
        });

        if(error) { msg.style.color = "red"; msg.textContent = "Fehler: " + error.message; }
        else { msg.style.color = "green"; msg.textContent = "Daten aktualisiert!"; }
    });

    // 3. Email ändern
    document.getElementById('profile-email-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('msg-email');
        const newEmail = document.getElementById('new-email').value;
        msg.style.color = "black"; msg.textContent = "Lade...";

        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if(error) { msg.style.color = "red"; msg.textContent = "Fehler: " + error.message; }
        else { msg.style.color = "green"; msg.textContent = "Bestätigungslinks wurden an beide E-Mails geschickt."; }
    });

    // 4. Passwort ändern
    document.getElementById('profile-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msg = document.getElementById('msg-pw');
        const newPw = document.getElementById('new-pw').value;
        msg.style.color = "black"; msg.textContent = "Lade...";

        const { error } = await supabase.auth.updateUser({ password: newPw });
        if(error) { msg.style.color = "red"; msg.textContent = "Fehler: " + error.message; }
        else { msg.style.color = "green"; msg.textContent = "Passwort erfolgreich geändert."; }
    });

    // 5. Account löschen (Gefahrenzone)
    document.getElementById('delete-account-btn').addEventListener('click', async () => {
        if(!confirm("Möchten Sie Ihren Account wirklich endgültig deaktivieren? Ihr Profilname und alle Daten werden gelöscht. Sie werden sofort ausgeloggt.")) return;
        
        // Da 'deleteUser' serverseitig ist, überschreiben wir lokal alle Daten mit "Gelöscht"
        await supabase.auth.updateUser({
            data: { 
                name: "Gelöscht", avatar_url: null, plz: null, ort: null, land: null, geschlecht: null, phone: null 
            }
        });
        
        alert("Ihr Account wurde erfolgreich deaktiviert. Melden Sie sich bei Bedarf beim Support für eine komplette Löschung.");
        await supabase.auth.signOut();
        window.location.href = "index.html";
    });

    // 6. Favoriten laden
    const favContainer = document.getElementById('favorites-container');
    if(favContainer) {
        supabase.from('favorites').select('listing_id').eq('user_id', user.id)
            .then(({ data: favData, error: favErr }) => {
                if(favErr || !favData || favData.length === 0) {
                    favContainer.innerHTML = '<p style="font-size: 0.9rem; color: #888; grid-column: 1 / -1;">Sie haben noch keine Inserate auf Ihrer Merkliste.</p>';
                    return;
                }
                const ids = favData.map(f => f.listing_id);
                supabase.from('listings').select('*').in('id', ids)
                    .then(({ data: listings, error: listErr }) => {
                        if(listErr || !listings) return;
                        favContainer.innerHTML = '';
                        listings.forEach(item => {
                            const imgUrl = (item.images && item.images.length > 0) ? item.images[0] : 'https://placehold.co/600x400/0d47a1/ffffff?text=Bild';
                            favContainer.innerHTML += `
                                <div class="property-card" style="box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 0;">
                                    <img src="${imgUrl}" alt="Bild" class="property-img" style="height: 120px;">
                                    <div class="property-content" style="padding: 1rem;">
                                        <h3 style="font-size: 1rem; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</h3>
                                        <div style="font-size: 0.85rem; font-weight: bold; color: var(--primary-color);">${item.price} € / ${item.price_interval}</div>
                                        <a href="expose.html?id=${item.id}" class="btn btn-secondary" style="width: 100%; padding: 0.3rem; margin-top: 10px; font-size: 0.8rem; background: var(--primary-color); color: white;">Zum Inserat</a>
                                    </div>
                                </div>
                            `;
                        });
                    });
            });
    }
}
