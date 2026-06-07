
    // Load videos
    loadAndRenderVideos();
    subscribeToVideos();
    initAuth();
    document.addEventListener('click', e => { if (!e.target.closest('#nf-user-avatar')) closeAvatarMenu(); });
    const detailModal = document.getElementById('video-detail-modal');
    if (detailModal) detailModal.addEventListener('click', e => { if (e.target === detailModal) closeDetailModal(); });
});

// ===== DATA LOAD =====
async function loadAndRenderVideos() {
    let videos = [...dummyVideos];
    try {
        const sb = typeof getSB === 'function' ? getSB() : null;
        if (sb) {
            const { data, error } = await sb.from('videos').select('*');
            if (!error && data && data.length > 0) videos = [...data, ...videos];
        }
    } catch(e) {}
    videosList = videos;
    renderVideoRows(videos);
    setBillboard(videos[0]);
}

function setBillboard(v) {
    if (!v) return;
    const img = document.getElementById('billboard-img');
    if (img && v.thumbnail_url) { img.src = v.thumbnail_url; img.style.objectFit = 'cover'; }
    const logo = document.getElementById('billboard-logo'); if (logo) logo.textContent = v.title;
    const syn = document.getElementById('billboard-synopsis'); if (syn) syn.textContent = v.title;
    const playBtn = document.getElementById('billboard-play-btn');
    if (playBtn) playBtn.onclick = () => openVideoPlayer(v.video_url, v.title, v.id);
    const infoBtn = document.getElementById('billboard-info-btn');
    if (infoBtn) infoBtn.onclick = () => openDetailModal(v);
}

function renderVideoRows(videos) {
    const container = document.getElementById('video-rows-container');
    if (!container) return;
    const savedProgress = getSavedProgress();
    let html = '';

    // Continue Watching Row
    const cw = videos.filter(v => v.id && savedProgress[v.id]);
    if (cw.length > 0) {
        cw.sort((a, b) => (savedProgress[b.id].timestamp || 0) - (savedProgress[a.id].timestamp || 0));
        const pn = currentUser ? ' for ' + currentUser.name : '';
        html += '<div class="nf-row" id="continue-watching-row"><div class="nf-row-header"><span class="nf-row-title">';
        html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-3px;margin-right:6px"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        html += 'Continue Watching' + pn + '</span></div><div class="nf-slider">';
        cw.forEach(v => {
            const s = savedProgress[v.id];
            const pct = s && s.duration > 0 ? Math.min(100, (s.currentTime / s.duration) * 100).toFixed(1) : 0;
            const enc = encodeURIComponent(JSON.stringify(v));
            const safeUrl = v.video_url || '';
            const safeId = v.id || '';
            const safeThumb = v.thumbnail_url || '';
            const safeTitle = v.title || '';
            html += '<div class="nf-card" onclick="openDetailModal(JSON.parse(decodeURIComponent(\'' + enc + '\')))">';
            html += '<img src="' + safeThumb + '" alt="' + safeTitle + '" loading="lazy">';
            html += '<div class="nf-card-progress"><div class="nf-card-progress-fill" style="width:' + pct + '%"></div></div>';
            html += '<div class="nf-card-hover"><div class="nf-card-hover-btns">';
            html += '<button class="nf-card-icon-btn" onclick="event.stopPropagation();openDetailModal(JSON.parse(decodeURIComponent(\'' + enc + '\')))"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>';
            html += '</div><div class="nf-card-hover-title">' + safeTitle + '</div></div></div>';
        });
        html += '</div></div>';
    }

    // Category Rows
    const cats = {};
    videos.forEach(v => { if (!cats[v.category]) cats[v.category] = []; cats[v.category].push(v); });
    for (const cat in cats) {
        const icon = categoryIcons[cat] || '';
        html += '<div class="nf-row"><div class="nf-row-header"><span class="nf-row-title">' + icon + ' ' + cat + '</span>';
        html += '<span class="nf-row-explore">Explore All <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></span>';
        html += '</div><div class="nf-slider">';
        cats[cat].forEach(v => {
            const enc = encodeURIComponent(JSON.stringify(v));
            const safeUrl = v.video_url || '';
            const safeId = v.id || '';
            const safeThumb = v.thumbnail_url || '';
            const safeTitle = v.title || '';
            html += '<div class="nf-card" onclick="openDetailModal(JSON.parse(decodeURIComponent(\'' + enc + '\')))">';
            html += '<img src="' + safeThumb + '" alt="' + safeTitle + '" loading="lazy">';
            html += '<div class="nf-card-hover"><div class="nf-card-hover-btns">';
            html += '<button class="nf-card-icon-btn" onclick="event.stopPropagation();openVideoPlayer(decodeURIComponent(\'' + encodeURIComponent(safeUrl) + '\'),' + JSON.stringify(safeTitle) + ',\'' + safeId + '\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>';
            html += '<button class="nf-card-icon-btn" onclick="event.stopPropagation();openDetailModal(JSON.parse(decodeURIComponent(\'' + enc + '\')))"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></button>';
            html += '</div><div class="nf-card-hover-title">' + safeTitle + '</div></div></div>';
        });
        html += '</div></div>';
    }
    container.innerHTML = html;
}

function showPage(page) {
    document.querySelectorAll('.nf-page').forEach(p => p.style.display = 'none');
    const el = document.getElementById('page-' + page);
    if (el) el.style.display = 'block';
    document.querySelectorAll('.nf-nav-link, .nf-mobile-link, .nf-bottom-link').forEach(l => {
        l.classList.toggle('active', l.dataset.page === page);
    });
    if (page === 'profiles' || page === 'activation') {
        document.body.classList.add('hide-navs');
    } else {
        document.body.classList.remove('hide-navs');
    }
    if (page !== 'profiles' && page !== 'admin-dashboard') {
        localStorage.setItem('toto_last_page', page);
    }
    window.scrollTo(0, 0);
    closeMobileMenu();
}
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }
function closeMobileMenu() { document.getElementById('mobile-menu')?.classList.remove('open'); }
function toggleAvatarMenu() { document.getElementById('avatar-menu').classList.toggle('open'); }
function closeAvatarMenu() { document.getElementById('avatar-menu')?.classList.remove('open'); }

const avatarMap = {
    lion:     'assets/lion_mascot_1779138323522.png',
    elephant: 'assets/transparent_elephant_1780219301774.png',
    giraffe:  'assets/giraffe_mascot_1780220554293.png',
    monkey:   'assets/monkey_mascot_1780220566411.png',
};
function selectProfile(avatar, name, save = true) {
    currentUser = { avatar, name };
    if (save) localStorage.setItem('totomelodies_profile', JSON.stringify(currentUser));
    applyProfile(currentUser);
    const onbKey = 'totomelodies_onboarding_' + avatar;
    if (localStorage.getItem(onbKey) === 'true') { showPage('home'); } else { startOnboarding(); }
}
function applyProfile(profile) {
    currentUser = profile;
    const img = document.getElementById('nav-avatar-img');
    if (img && avatarMap[profile.avatar]) img.src = avatarMap[profile.avatar];
    const bi = document.getElementById('bottom-nav-avatar-img');
    if (bi && avatarMap[profile.avatar]) bi.src = avatarMap[profile.avatar];
}
function toggleSearch() {
    const bar = document.getElementById('search-bar');
    bar.classList.add('open');
    setTimeout(() => document.getElementById('search-input').focus(), 300);
}
function closeSearch() {
    document.getElementById('search-bar').classList.remove('open');
    document.getElementById('search-input').value = '';
    document.getElementById('search-results-grid').innerHTML = '';
}
function handleSearch(query) {
    if (!query.trim()) return;
    const results = videosList.filter(v =>
        v.title.toLowerCase().includes(query.toLowerCase()) ||
        v.category.toLowerCase().includes(query.toLowerCase())
    );
    showPage('search');
    const grid = document.getElementById('search-results-grid');
    let html = '';
    results.forEach(v => {
        const enc = encodeURIComponent(JSON.stringify(v));
        html += '<div class="search-result-card" onclick="openDetailModal(JSON.parse(decodeURIComponent(\'' + enc + '\')))">';
        html += '<img src="' + (v.thumbnail_url||'') + '" alt="' + (v.title||'') + '" loading="lazy">';
        html += '<div class="search-result-title">' + (v.title||'') + '</div></div>';
    });
    grid.innerHTML = html;
}

// ===== VIDEO PLAYER =====
