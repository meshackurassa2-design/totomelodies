/* ===================== TOTOMELODIES ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â FULL APP.JS ===================== */

// ===== MOCKUP DATA =====
const dummyVideos = [];

const categoryIcons = {
    'Nyimbo Zetu':    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    'Katuni':         `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>`,
    'Jifunze Pamoja': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
};

const animalData = {
    lion:     { name:'Lion',       fact:'Lions are the kings of the jungle! They have a loud roar that can be heard from 5 miles away. They love to sleep in the shade for up to 20 hours a day.', img:'assets/lion_mascot_1779138323522.png' },
    elephant: { name:'Elephant',   fact:'Elephants are the largest animals on land. They use their long trunks to drink water, pick up food, and even give themselves a shower!', img:'assets/transparent_elephant_1780219301774.png' },
    giraffe:  { name:'Giraffe',    fact:'Giraffes have incredibly long necksÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âthey can easily reach the tastiest leaves at the very top of tall trees!', img:'assets/giraffe_mascot_1780220554293.png' },
    monkey:   { name:'Monkey',     fact:'Monkeys are super smart and love to play! They swing from tree to tree using their strong arms and long tails, and their favorite snack is a yellow banana.', img:'assets/monkey_mascot_1780220566411.png' },
    rhino:    { name:'Rhino',      fact:'Rhinos have large horns and very thick skinÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âthey are incredibly strong and powerful animals!', img:'assets/rhino_mascot_1780220579634.png' },
    zebra:    { name:'Zebra',      fact:'Zebras have unique black and white stripesÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Âno two zebras have the same pattern, just like human fingerprints!', img:'assets/zebra_mascot_1780220592191.png' },
};

// ===== STATE =====
let currentUser = null;
let videosList = [...dummyVideos];
let playerHideTimer = null;
let isPlaying = false;
let currentVideoPlayingId = null;
let gameInterval = null;
let gameScore = 0;
let audioCtx = null;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// ===== PROGRESS TRACKING =====
function getProgressKey() {
    return 'totomelodies_progress_' + (currentUser ? currentUser.name : 'default');
}
function getSavedProgress() {
    try {
        const data = localStorage.getItem(getProgressKey());
        return data ? JSON.parse(data) : {};
    } catch(e) { return {}; }
}
function saveVideoProgress(videoId, currentTime, duration) {
    if (!videoId) return;
    const progress = getSavedProgress();
    // If finished (>95%) or barely started (<2s), remove from continue watching
    if (duration > 0 && (currentTime / duration > 0.95 || currentTime < 2)) {
        delete progress[videoId];
    } else {
        progress[videoId] = { currentTime, duration, timestamp: Date.now() };
    }
    localStorage.setItem(getProgressKey(), JSON.stringify(progress));
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    // Scroll nav
    window.addEventListener('scroll', () => {
        document.getElementById('main-nav').classList.toggle('solid', window.scrollY > 60);
    });

    // Video player events
    const video = document.getElementById('main-video-player');
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', () => {
        document.getElementById('play-icon').style.display = 'block';
        document.getElementById('pause-icon').style.display = 'none';
    });

    // Show/hide player UI on mouse move / touch
    const overlay = document.getElementById('video-player-overlay');
    ['mousemove','touchstart','click'].forEach(evt => overlay.addEventListener(evt, showPlayerUI));

    // Build animals
    buildAnimals();

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
    startBillboardRotation(videos);
}

let billboardTimer = null;
let billboardIndex = 0;

function startBillboardRotation(videos) {
    if (!videos || videos.length === 0) return;
    clearInterval(billboardTimer);
    billboardIndex = 0;
    setBillboard(videos[billboardIndex]);
    billboardTimer = setInterval(() => {
        billboardIndex = (billboardIndex + 1) % Math.min(videos.length, 8);
        setBillboard(videos[billboardIndex]);
    }, 7000);
}

function setBillboard(v) {
    if (!v) return;
    const img = document.getElementById('billboard-img');
    if (img && v.thumbnail_url) {
        img.style.opacity = '0';
        setTimeout(() => {
            img.src = v.thumbnail_url;
            img.style.objectFit = 'cover';
            img.style.opacity = '1';
        }, 300);
    }
    const logo = document.getElementById('billboard-logo');
    if (logo) logo.textContent = v.title;
    const syn = document.getElementById('billboard-synopsis');
    if (syn) syn.textContent = v.description || v.title;
    // Match score & tags
    const meta = document.getElementById('billboard-meta');
    if (meta) {
        const matchPct = Math.floor(Math.random() * 15) + 85;
        const year = v.year || new Date().getFullYear();
        meta.innerHTML = '<span class="bb-match">' + matchPct + '% Match</span>' +
            '<span class="bb-year">' + year + '</span>' +
            '<span class="bb-rating">G</span>';
    }
    // Dot indicators
    const dots = document.getElementById('billboard-dots');
    if (dots) {
        dots.innerHTML = '';
        const total = Math.min((videosList || []).length, 8);
        for (let i = 0; i < total; i++) {
            const d = document.createElement('span');
            d.className = 'bb-dot' + (i === billboardIndex ? ' active' : '');
            d.onclick = () => { billboardIndex = i; setBillboard(videosList[i]); };
            dots.appendChild(d);
        }
    }
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
        html += 'Continue Watching' + pn + '</span></div><div class="nf-slider nf-slider-cw">';
        cw.forEach(v => {
            const s = savedProgress[v.id];
            const pct = s && s.duration > 0 ? Math.min(100, (s.currentTime / s.duration) * 100).toFixed(1) : 0;
            const safeId = v.id || '';
            const safeThumb = v.thumbnail_url || '';
            const safeTitle = v.title || '';
            const timeLeft = s && s.duration > 0 ? Math.round((s.duration - s.currentTime) / 60) : 0;
            html += '<div class="nf-card nf-cw-card" data-vid-id="' + safeId + '">';
            html += '<img src="' + safeThumb + '" alt="' + safeTitle + '" loading="lazy">';
            html += '<div class="nf-card-progress"><div class="nf-card-progress-fill" style="width:' + pct + '%"></div></div>';
            html += '<div class="nf-cw-hover">';
            html += '<div class="nf-cw-thumb"><img src="' + safeThumb + '" alt="' + safeTitle + '"><div class="nf-cw-play-btn"><svg viewBox="0 0 24 24" fill="white" width="24" height="24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div></div>';
            html += '<div class="nf-cw-info">';
            html += '<div class="nf-cw-title">' + safeTitle + '</div>';
            if (timeLeft > 0) html += '<div class="nf-cw-time">' + timeLeft + 'm remaining</div>';
            html += '<div class="nf-cw-progress-bar"><div class="nf-cw-progress-fill" style="width:' + pct + '%"></div></div>';
            html += '</div></div></div>';
        });
        html += '</div></div>';
        // Delegated click handler (runs after innerHTML set)
        setTimeout(() => {
            document.querySelectorAll('.nf-cw-card').forEach(card => {
                card.onclick = () => {
                    const vid = (videosList || []).find(v => v.id == card.dataset.vidId);
                    if (vid) openDetailModal(vid);
                };
            });
        }, 0);
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
            html += '<button class="nf-card-icon-btn" onclick="event.stopPropagation();openDetailModal(JSON.parse(decodeURIComponent(\'' + enc + '\')))"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>';
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

    const nav = document.getElementById('main-nav');
    const bottomNav = document.querySelector('.nf-bottom-nav');

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
    const onbKey = 'totomelodies_onboarding_done';
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
function openVideoPlayer(url, title, videoId) {
    const overlay = document.getElementById('video-player-overlay');
    const video = document.getElementById('main-video-player');
    const titleEl = document.getElementById('player-title-text');
    currentVideoPlayingId = videoId;
    video.src = url;
    if (titleEl) titleEl.textContent = title || '';
    overlay.classList.add('active');
    document.body.classList.add('video-playing');
    showPlayerUI();
    
    video.onloadedmetadata = () => {
        if (videoId) {
            const saved = getSavedProgress()[videoId];
            if (saved && saved.currentTime > 0) {
                video.currentTime = saved.currentTime;
            }
        }
    };

    video.play().catch(() => {});
    document.getElementById('play-icon').style.display = 'none';
    document.getElementById('pause-icon').style.display = 'block';
}

function closeVideoPlayer() {
    const overlay = document.getElementById('video-player-overlay');
    const video = document.getElementById('main-video-player');
    if (overlay) overlay.classList.remove('active', 'show-ui');
    document.body.classList.remove('video-playing');
    
    if (video) {
        if (currentVideoPlayingId && video.currentTime > 0) {
            saveVideoProgress(currentVideoPlayingId, video.currentTime, video.duration);
        }
        video.pause();
        video.src = '';
    }
    
    if (typeof renderVideoRows === 'function' && typeof videosList !== 'undefined') {
        renderVideoRows(videosList);
    }
}

function togglePlayPause() {
    const video = document.getElementById('main-video-player');
    if (video.paused) {
        video.play();
        document.getElementById('play-icon').style.display = 'none';
        document.getElementById('pause-icon').style.display = 'block';
    } else {
        video.pause();
        document.getElementById('play-icon').style.display = 'block';
        document.getElementById('pause-icon').style.display = 'none';
    }
}

function skipForward()  { document.getElementById('main-video-player').currentTime += 10; }
function skipBackward() { document.getElementById('main-video-player').currentTime -= 10; }

function toggleMute() {
    const v = document.getElementById('main-video-player');
    v.muted = !v.muted;
    document.getElementById('volume-slider').value = v.muted ? 0 : v.volume;
}

function setVolume(val) {
    const v = document.getElementById('main-video-player');
    v.volume = val;
    v.muted = val == 0;
}

function updateProgress() {
    const video = document.getElementById('main-video-player');
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-thumb').style.left = pct + '%';
    document.getElementById('player-time').textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
}

function seekVideo(e) {
    const bar = document.getElementById('progress-bar-container');
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const video = document.getElementById('main-video-player');
    video.currentTime = pct * video.duration;
}

function toggleFullscreen() {
    const overlay = document.getElementById('video-player-overlay');
    if (!document.fullscreenElement) overlay.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
}

function showPlayerUI() {
    const overlay = document.getElementById('video-player-overlay');
    overlay.classList.add('show-ui');
    clearTimeout(playerHideTimer);
    playerHideTimer = setTimeout(() => overlay.classList.remove('show-ui'), 3000);
}

function fmt(s) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2,'0')}`;
}

// ===== GAMES =====
window.openGame = function openGame(type) {
    closeAllGames();
    const overlay = document.getElementById('game-' + type + '-overlay');
    if (!overlay) return;
    overlay.classList.add('active');
    document.body.classList.add('game-playing');

    if (type === 'balloon') startBalloonGame();
    else if (type === 'shape') startShapeGame();
    else if (type === 'music') startMusicStudio();
};

window.closeGame = function closeGame(type) {
    const overlay = document.getElementById('game-' + type + '-overlay');
    if (overlay) overlay.classList.remove('active');
    document.body.classList.remove('game-playing');
    if (type === 'balloon') stopBalloonGame();
    if (type === 'music' && audioCtx) { try { audioCtx.close(); } catch(e){} audioCtx = null; }
};

window.closeAllGames = function closeAllGames() {
    ['balloon','shape','music'].forEach(t => {
        const el = document.getElementById('game-' + t + '-overlay');
        if (el) el.classList.remove('active');
    });
    document.body.classList.remove('game-playing');
    stopBalloonGame();
};

// -- Balloon Game --
let gameLives = 3;
function startBalloonGame() {
    gameScore = 0;
    gameLives = 3;
    document.getElementById('score-display').textContent = '0';
    document.getElementById('lives-display').textContent = 'ÃƒÂ¢Ã‚ÂÃ‚Â¤ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã‚ÂÃ‚Â¤ÃƒÂ¯Ã‚Â¸Ã‚ÂÃƒÂ¢Ã‚ÂÃ‚Â¤ÃƒÂ¯Ã‚Â¸Ã‚Â';
    document.getElementById('balloon-game-over').style.display = 'none';
    const playground = document.getElementById('balloon-playground');
    playground.innerHTML = '';
    stopBalloonGame();
    spawnClouds();
    gameInterval = setInterval(spawnBalloon, 900);
}

function stopBalloonGame() {
    clearInterval(gameInterval);
    gameInterval = null;
}

function spawnClouds() {
    const overlay = document.getElementById('game-balloon-overlay');
    overlay.querySelectorAll('.sky-cloud').forEach(c => c.remove());
    const cloudDefs = [
        { w: 180, h: 60, top: 10, dur: 22, delay: 0 },
        { w: 120, h: 42, top: 20, dur: 30, delay: 8 },
        { w: 220, h: 70, top: 6,  dur: 18, delay: 14 },
        { w: 140, h: 50, top: 28, dur: 26, delay: 4 },
        { w: 95,  h: 36, top: 15, dur: 34, delay: 20 },
    ];
    cloudDefs.forEach(c => {
        const el = document.createElement('div');
        el.className = 'sky-cloud';
        el.style.cssText = `width:${c.w}px; height:${c.h}px; top:${c.top}%; left:-${c.w + 20}px; animation-duration:${c.dur}s; animation-delay:-${c.delay}s;`;
        overlay.appendChild(el);
    });
}

function spawnBalloon() {
    const playground = document.getElementById('balloon-playground');
    if (!playground || !document.getElementById('game-balloon-overlay').classList.contains('active')) { stopBalloonGame(); return; }

    const colors = [
        { base: '#e50914', light: '#ff6b6b' },
        { base: '#0071eb', light: '#5ba8ff' },
        { base: '#2dbe60', light: '#6de89a' },
        { base: '#f5a623', light: '#ffd080' },
        { base: '#9b59b6', light: '#c98de8' },
        { base: '#e91e63', light: '#f57eb6' },
        { base: '#1abc9c', light: '#5de8ce' },
        { base: '#FF6B35', light: '#FFAB87' },
    ];
    const picked = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.floor(Math.random() * 40) + 60; // 60ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“100px wide
    const left = Math.floor(Math.random() * 83);
    const dur  = Math.floor(Math.random() * 4) + 5; // 5ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“9s
    const wobble = Math.random() > 0.5 ? 'animation: floatUp linear, wobble 1.5s ease-in-out infinite alternate;' : '';

    // Build realistic balloon structure
    const wrapper = document.createElement('div');
    wrapper.className = 'balloon';
    wrapper.style.cssText = `width:${size}px; left:${left}%; animation-duration:${dur}s;`;

    wrapper.innerHTML = `
        <div class="balloon-body" style="background: radial-gradient(circle at 35% 30%, ${picked.light}, ${picked.base} 70%, ${picked.base}99)">
            <div class="balloon-shine"></div>
        </div>
        <div class="balloon-knot" style="background:${picked.base}; display:block; width:8px; height:10px; margin:-2px auto 0; border-radius:50% 50% 50% 50%/30% 30% 70% 70%;"></div>
        <div class="balloon-string"></div>
    `;

    wrapper.addEventListener('click', () => {
        if (wrapper.parentNode) {
            if (window.confetti) confetti({ particleCount: 50, spread: 70, origin: { x: (left + 5) / 100, y: 0.6 }, colors: [picked.base, picked.light, '#fff'] });
            playground.removeChild(wrapper);
            gameScore++;
            document.getElementById('score-display').textContent = gameScore;
            playToneOnce(300 + gameScore * 20, 0.15);
        }
    });

    playground.appendChild(wrapper);
    setTimeout(() => { 
        if (wrapper.parentNode) {
            playground.removeChild(wrapper); 
            loseBalloonLife();
        }
    }, dur * 1000);
}

function loseBalloonLife() {
    if (gameLives <= 0) return;
    gameLives--;
    let hearts = '';
    for(let i = 0; i < gameLives; i++) hearts += 'ÃƒÂ¢Ã‚ÂÃ‚Â¤ÃƒÂ¯Ã‚Â¸Ã‚Â';
    document.getElementById('lives-display').textContent = hearts;
    
    if (gameLives === 0) {
        stopBalloonGame();
        document.getElementById('final-score').textContent = gameScore;
        document.getElementById('balloon-game-over').style.display = 'flex';
    }
}

// -- Shape Game --
const shapeConfig = [
    { id:'circle',   svg:`<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#4ECDC4"/></svg>` },
    { id:'square',   svg:`<svg viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="8" fill="#e50914"/></svg>` },
    { id:'triangle', svg:`<svg viewBox="0 0 100 100"><polygon points="50,8 92,88 8,88" fill="#f5a623"/></svg>` },
    { id:'star',     svg:`<svg viewBox="0 0 100 100"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="#9b59b6"/></svg>` },
];

function startShapeGame() {
    const targets = document.getElementById('shape-targets-container');
    const drags   = document.getElementById('shape-draggables-container');
    targets.innerHTML = '';
    drags.innerHTML = '';

    const shuffled = [...shapeConfig].sort(() => Math.random() - 0.5);
    shuffled.forEach(s => {
        const slot = document.createElement('div');
        slot.className = 'target-slot';
        slot.dataset.shape = s.id;
        slot.innerHTML = s.svg;
        slot.style.opacity = '0.25';
        slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('hovered'); });
        slot.addEventListener('dragleave', () => slot.classList.remove('hovered'));
        slot.addEventListener('drop', e => {
            e.preventDefault();
            slot.classList.remove('hovered');
            if (e.dataTransfer.getData('shape') === s.id) {
                slot.classList.add('correct');
                slot.style.opacity = '1';
                playToneOnce(660, 0.2);
                if (window.confetti) confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            }
        });
        targets.appendChild(slot);
    });

    [...shapeConfig].sort(() => Math.random() - 0.5).forEach(s => {
        const drag = document.createElement('div');
        drag.className = 'draggable-shape';
        drag.draggable = true;
        drag.dataset.shape = s.id;
        drag.innerHTML = s.svg;
        drag.addEventListener('dragstart', e => e.dataTransfer.setData('shape', s.id));
        drags.appendChild(drag);
    });
}

// -- Music Studio --
const pianoNotes = [
    { note:'C4', freq:261.6, type:'white' }, { note:'C#4', freq:277.2, type:'black' },
    { note:'D4', freq:293.7, type:'white' }, { note:'D#4', freq:311.1, type:'black' },
    { note:'E4', freq:329.6, type:'white' },
    { note:'F4', freq:349.2, type:'white' }, { note:'F#4', freq:370.0, type:'black' },
    { note:'G4', freq:392.0, type:'white' }, { note:'G#4', freq:415.3, type:'black' },
    { note:'A4', freq:440.0, type:'white' }, { note:'A#4', freq:466.2, type:'black' },
    { note:'B4', freq:493.9, type:'white' },
    { note:'C5', freq:523.3, type:'white' }, { note:'C#5', freq:554.4, type:'black' },
    { note:'D5', freq:587.3, type:'white' }, { note:'D#5', freq:622.3, type:'black' },
    { note:'E5', freq:659.3, type:'white' },
    { note:'F5', freq:698.5, type:'white' }, { note:'F#5', freq:740.0, type:'black' },
    { note:'G5', freq:784.0, type:'white' },
];

const drumConfig = [
    { id:'kick',  freq:80,  label:'Kick',  dur:0.5 },
    { id:'snare', freq:200, label:'Snare', dur:0.2 },
    { id:'hihat', freq:800, label:'Hi-Hat',dur:0.1 },
    { id:'tom',   freq:150, label:'Tom',   dur:0.3 },
];

const xyloColors = ['#e50914','#f5a623','#2dbe60','#0071eb','#9b59b6','#1abc9c','#e67e22','#e91e63','#3498db','#2ecc71'];

function startMusicStudio() {
    buildPiano();
    buildDrums();
    buildXylo();
    buildSongSelector();
}

function buildPiano() {
    const wrapper = document.getElementById('piano-keys-wrapper');
    wrapper.innerHTML = '';
    let leftOffset = 0;
    const screenWidth = Math.max(window.innerWidth, window.innerHeight);
    const whiteKeysCount = pianoNotes.filter(n => n.type === 'white').length;
    const whiteWidth = Math.min(100, Math.floor((screenWidth * 0.9) / whiteKeysCount));
    const blackWidth = Math.floor(whiteWidth * 0.6);

    pianoNotes.forEach((n, i) => {
        const key = document.createElement('div');
        key.className = `piano-key ${n.type}`;
        key.id = `key-${n.note.replace('#','s')}`;
        key.style.width = (n.type === 'white' ? whiteWidth : blackWidth) + 'px';
        if (n.type === 'black') {
            key.style.left = (leftOffset - blackWidth / 2) + 'px';
        } else {
            leftOffset += whiteWidth;
        }
        const play = () => { playTone(n.freq, 'sine', 0.5); key.classList.add('highlight'); setTimeout(() => key.classList.remove('highlight'), 200); };
        key.addEventListener('mousedown', play);
        key.addEventListener('touchstart', e => { e.preventDefault(); play(); }, { passive: false });
        wrapper.appendChild(key);
    });
}

function buildDrums() {
    const wrapper = document.getElementById('drum-pads-wrapper');
    wrapper.innerHTML = '';
    drumConfig.forEach(d => {
        const pad = document.createElement('div');
        pad.className = `drum-pad drum-${d.id}`;
        pad.innerHTML = `<div class="drum-label">${d.label}</div>`;
        const hit = () => {
            playTone(d.freq, d.id === 'hihat' ? 'sawtooth' : 'sine', d.dur);
            pad.classList.add('hit');
            setTimeout(() => pad.classList.remove('hit'), 120);
        };
        pad.addEventListener('mousedown', hit);
        pad.addEventListener('touchstart', e => { e.preventDefault(); hit(); }, { passive: false });
        wrapper.appendChild(pad);
    });
}

function buildXylo() {
    const wrapper = document.getElementById('xylo-bars-wrapper');
    wrapper.innerHTML = '';
    const notes = pianoNotes.filter(n => n.type === 'white').slice(0, 10);
    notes.forEach((n, i) => {
        const bar = document.createElement('div');
        bar.className = 'xylo-bar';
        bar.style.background = xyloColors[i % xyloColors.length];
        bar.style.height = `${100 - i * 7}%`;
        const play = () => { playTone(n.freq, 'sine', 0.4); };
        bar.addEventListener('mousedown', play);
        bar.addEventListener('touchstart', e => { e.preventDefault(); play(); }, { passive: false });
        wrapper.appendChild(bar);
    });
}

function buildSongSelector() {
    const sel = document.getElementById('song-selector');
    if (!sel || !window.songLibrary) return;
    sel.innerHTML = window.songLibrary.map((s, i) => `<option value="${i}">${s.title}</option>`).join('');
}

function switchInstrument(type, btn) {
    document.querySelectorAll('.inst-tab').forEach(t => t.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.instrument-view').forEach(v => v.classList.remove('active'));
    const container = document.getElementById(type + '-container');
    if (container) container.classList.add('active');
}

let songPlaying = false;
async function autoPlaySelectedSong() {
    if (songPlaying) return;
    songPlaying = true;
    const ctx = getAudioCtx();
    const sel = document.getElementById('song-selector');
    const song = window.songLibrary && window.songLibrary[sel.value];
    if (!song) { songPlaying = false; return; }

    const melody = song.notes.split(' ').map(n => {
        const [note, dur] = n.split('-');
        return { note, duration: parseInt(dur) };
    });

    for (const m of melody) {
        if (!document.getElementById('game-music-overlay').classList.contains('active')) break;
        const noteData = pianoNotes.find(n => n.note === m.note);
        if (noteData) {
            playTone(noteData.freq, 'sine', m.duration / 1000);
            const keyEl = document.getElementById(`key-${m.note.replace('#','s')}`);
            if (keyEl) { keyEl.classList.add('highlight'); setTimeout(() => keyEl.classList.remove('highlight'), m.duration - 50); }
        }
        await new Promise(r => setTimeout(r, m.duration));
    }
    songPlaying = false;
}

// ===== AUDIO ENGINE =====
function playTone(freq, type = 'sine', duration = 0.4) {
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration + 0.3);
    } catch(e) {}
}

function playToneOnce(freq, duration) { playTone(freq, 'sine', duration); }

// ===== ANIMALS =====
function buildAnimals() {
    const grid = document.getElementById('animals-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(animalData).map(([key, a]) => `
        <div class="animal-card" onclick="openAnimalModal('${key}')">
            <img class="animal-card-img" src="${a.img}" alt="${a.name}">
            <div class="animal-card-name">${a.name}</div>
        </div>
    `).join('');
}

function openAnimalModal(key) {
    const a = animalData[key];
    if (!a) return;
    document.getElementById('modal-animal-name').textContent = a.name;
    document.getElementById('modal-animal-fact').textContent = a.fact;
    document.getElementById('modal-hero-img').innerHTML = `<img src="${a.img}" alt="${a.name}">`;
    document.getElementById('animal-modal').classList.add('active');
    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(a.fact);
        u.lang = 'en-US'; u.rate = 0.85; u.pitch = 1.3;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
    }
    if (window.confetti) confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
}

function closeAnimalModal() {
    document.getElementById('animal-modal').classList.remove('active');
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// ===== VIDEO DETAIL MODAL (Netflix More Info flow) =====
const videoDescriptions = [
    'An exciting adventure full of fun, music and learning for kids of all ages!',
    'Join your favourite animals on a magical journey through songs and stories.',
    'Sing along, dance along and discover new things every day!',
    'A wonderful world of colours, sounds and imagination awaits you.',
    'Learn, laugh and grow with your favourite characters from TotoMelodies!',
];

function openDetailModal(video) {
    const modal = document.getElementById('video-detail-modal');
    document.getElementById('detail-backdrop').src = video.thumbnail_url;
    document.getElementById('detail-title').textContent = video.title;
    document.getElementById('detail-description').textContent =
        videoDescriptions[video.id % videoDescriptions.length] || videoDescriptions[0];

    // Progress Bar Logic
    const saved = getSavedProgress()[video.id];
    const progressContainer = document.getElementById('detail-progress-container');
    const playBtnText = document.getElementById('detail-play-btn');
    if (saved && saved.currentTime > 0 && saved.duration > 0) {
        const percent = Math.min(100, (saved.currentTime / saved.duration) * 100);
        document.getElementById('detail-progress-fill').style.width = percent + '%';
        const timeLeftMs = (saved.duration - saved.currentTime) * 1000;
        const minsLeft = Math.ceil(timeLeftMs / 60000);
        document.getElementById('detail-time-left').textContent = `Il reste ${minsLeft}m`; // or "Xm left" in Swahili
        progressContainer.style.display = 'block';
        playBtnText.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Resume';
    } else {
        progressContainer.style.display = 'none';
        playBtnText.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Play';
    }

    // Play button
    document.getElementById('detail-play-btn').onclick = () => {
        closeDetailModal();
        openVideoPlayer(video.video_url, video.title, video.id);
    };

    // Download button
    document.getElementById('detail-download-btn').onclick = async () => {
        const btn = document.getElementById('detail-download-btn');
        const origHtml = btn.innerHTML;
        btn.innerHTML = 'Downloading...';
        try {
            const res = await fetch(video.video_url);
            if (!res.ok) throw new Error('Network error');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = (video.title || 'video').replace(/[^a-z0-9]/gi, '_') + '.mp4';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error('Download failed:', e);
            alert("Could not download video directly. It may open in a new tab instead.");
            window.open(video.video_url, '_blank');
        }
        btn.innerHTML = origHtml;
    };

    // Watchlist toggle
    const wl = document.getElementById('detail-watchlist-btn');
    const inList = isInWatchlist(video.id);
    wl.style.opacity = inList ? '1' : '0.8';
    // setWatchlistIcon(wl, inList);
    wl.onclick = () => {
        const nowIn = toggleWatchlist(video);
        wl.style.opacity = nowIn ? '1' : '0.8';
    };

    // More Like This
    const similar = videosList
        .filter(v => v.category === video.category && v.id !== video.id)
        .slice(0, 6);
    document.getElementById('detail-similar-grid').innerHTML = similar.map(v => `
        <div class="nf-similar-card" onclick="openDetailModal(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(v))}')))">
            <img src="${v.thumbnail_url}" alt="${v.title}" loading="lazy">
        </div>
    `).join('');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
    document.getElementById('video-detail-modal').classList.remove('active');
    document.body.style.overflow = '';
}

// Close on backdrop click
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('video-detail-modal').addEventListener('click', function(e) {
        if (e.target === this) closeDetailModal();
    });
});

// ===== WATCHLIST =====
function getWatchlist() { return JSON.parse(localStorage.getItem('totomelodies_watchlist') || '[]'); }
function saveWatchlist(list) { localStorage.setItem('totomelodies_watchlist', JSON.stringify(list)); }
function isInWatchlist(id) { return getWatchlist().some(v => v.id === id); }
function toggleWatchlist(video) {
    let list = getWatchlist();
    if (isInWatchlist(video.id)) { list = list.filter(v => v.id !== video.id); }
    else { list.push(video); }
    saveWatchlist(list);
    return isInWatchlist(video.id);
}
function setWatchlistIcon(btn, inList) {
    btn.classList.toggle('added', inList);
    btn.innerHTML = inList
        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polyline points="20 6 9 17 4 12"/></svg>`
        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
}

// ===== ONBOARDING (TASTE PROFILE) =====
let onboardingSelectedIds = [];

function startOnboarding() {
    onboardingSelectedIds = [];
    showPage('onboarding');
    document.getElementById('onboarding-continue-btn').disabled = true;
    document.getElementById('onboarding-continue-btn').textContent = 'Choose 3 more';

    const grid = document.getElementById('onboarding-grid');
    grid.innerHTML = videosList.map(v => `
        <div class="ob-card" id="ob-card-${v.id}" onclick="toggleOnboardingSelection('${v.id}')">
            <img src="${v.thumbnail_url}" alt="${v.title.replace(/"/g, '&quot;')}" loading="lazy">
            <div class="ob-card-title">${v.title}</div>
            <div class="ob-check">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
        </div>
    `).join('');
}

function toggleOnboardingSelection(id) {
    const card = document.getElementById('ob-card-' + id);
    const index = onboardingSelectedIds.indexOf(id);
    
    if (index === -1) {
        onboardingSelectedIds.push(id);
        card.classList.add('selected');
    } else {
        onboardingSelectedIds.splice(index, 1);
        card.classList.remove('selected');
    }

    const btn = document.getElementById('onboarding-continue-btn');
    btn.disabled = onboardingSelectedIds.length < 3;
    btn.textContent = onboardingSelectedIds.length < 3 
        ? 'Choose ' + (3 - onboardingSelectedIds.length) + ' more' 
        : 'Continue (' + onboardingSelectedIds.length + ' selected)';
}

function finishOnboarding() {
    if (onboardingSelectedIds.length < 3 || !currentUser) return;
    
    const onbKey = 'totomelodies_onboarding_done';
    localStorage.setItem(onbKey, 'true');
    
    console.log('Taste profile selected IDs:', onboardingSelectedIds);
    
    showPage('home');
}

// ===== PROFILE CREATION (Supabase Sync) =====
let selectedCreateAvatar = 'lion';

function selectCreateAvatar(avatar, el) {
    selectedCreateAvatar = avatar;
    document.querySelectorAll('.cp-avatar-opt').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    
    const preview = document.getElementById('selected-avatar-preview');
    if (preview && avatarMap[avatar]) {
        preview.src = avatarMap[avatar];
    }
}

async function saveNewProfile() {
    const nameInput = document.getElementById('create-profile-name').value.trim();
    const errEl = document.getElementById('create-profile-error');
    const btn = document.getElementById('save-profile-btn');
    
    if (!nameInput) {
        errEl.textContent = 'Please enter a name.';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Saving...';
    errEl.textContent = '';
    
    const newProfile = { name: nameInput, avatar: selectedCreateAvatar };
    
    try {
        const sb = getSB();
        const { error } = await sb.auth.updateUser({
            data: { child_profile: newProfile }
        });
        
        if (error) throw error;
        
        // Update local session
        if (currentAuthUser) {
            if (!currentAuthUser.user_metadata) currentAuthUser.user_metadata = {};
            currentAuthUser.user_metadata.child_profile = newProfile;
        }
        
        // Immediately log them in using this profile
        selectProfile(newProfile.avatar, newProfile.name, true);
        
    } catch(e) {
        errEl.textContent = 'Failed to save profile. ' + e.message;
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Profile';
    }
}

function renderProfilesView() {
    if (!currentAuthUser) return;
    
    const childProfile = currentAuthUser.user_metadata?.child_profile;
    const selectView = document.getElementById('profiles-select-view');
    const createView = document.getElementById('profiles-create-view');
    
    if (childProfile) {
        // Show their existing profile
        selectView.style.display = 'block';
        createView.style.display = 'none';
        
        document.getElementById('dynamic-profiles-grid').innerHTML = `
            <div class="profile-item" onclick="selectProfile('${childProfile.avatar}', '${childProfile.name.replace(/'/g, "\\'")}')">
                <div class="profile-avatar">
                    <img src="${avatarMap[childProfile.avatar]}" alt="${childProfile.name.replace(/"/g, '&quot;')}">
                </div>
                <span class="profile-name">${childProfile.name}</span>
            </div>
        `;
    } else {
        // No profile, force creation
        selectView.style.display = 'none';
        createView.style.display = 'flex';
    }
}

function cancelCreateProfile() {
    if (currentAuthUser && currentAuthUser.user_metadata && currentAuthUser.user_metadata.child_profile) {
        renderProfilesView();
    } else {
        handleSignOut();
    }
}

/* ===================== ADMIN UI LOGIC ===================== */
// Periodically check if Admin Link should be visible (lazy load approach)
setInterval(() => {
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink && typeof isAdmin === 'function') {
        adminLink.style.display = isAdmin() ? 'inline-block' : 'none';
    }
}, 1000);

// Restore memory state on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const lastPage = localStorage.getItem('toto_last_page');
        // Only restore if we are not currently stuck on the profiles login page
        if (lastPage && document.getElementById('page-profiles') && document.getElementById('page-profiles').style.display === 'none') {
            showPage(lastPage);
        }
    }, 500);
});

async function loadAdminDashboard() {
    const list = document.getElementById('admin-video-list');
    if (!list) return;
    
    list.innerHTML = '<div style="color:#ccc;">Loading videos...</div>';
    
    if (typeof fetchVideosFromDatabase !== 'function') return;
    
    const dbVideos = await fetchVideosFromDatabase();
    if (dbVideos.length === 0) {
        list.innerHTML = '<div style="color:#ccc;">No videos posted yet.</div>';
        return;
    }
    
    let html = '';
    dbVideos.forEach(v => {
        html += `
            <div style="background:#333; border-radius:8px; overflow:hidden;">
                <img src="${v.thumbnail_url}" style="width:100%; height:120px; object-fit:cover;">
                <div style="padding:10px;">
                    <div style="font-weight:bold; font-size:1.1rem; margin-bottom:5px;">${v.title}</div>
                    <div style="font-size:0.9rem; color:#888;">${v.category}</div>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// Expose showPage globally so HTML onclick attributes can call it
const _internalShowPage = showPage; // capture BEFORE window override
window.showPage = function(pageId) {
    if (pageId === 'admin-dashboard') {
        if (typeof isAdmin !== 'function' || !isAdmin()) {
            alert("Access Denied.");
            return;
        }
        loadAdminDashboard();
    }
    _internalShowPage(pageId); // call original ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â no recursion
    if (pageId !== 'profiles') {
        const pScreen = document.getElementById('profiles-create-view');
        if (pScreen) pScreen.style.display = 'none';
    }
};

window.updateFileName = function(input, labelId) {
    const label = document.getElementById(labelId);
    if (input.files && input.files.length > 0) {
        label.textContent = input.files[0].name;
    } else {
        label.textContent = '';
    }
};

async function submitAdminVideo() {
    const errorEl = document.getElementById('admin-error-msg');
    try {
        const title = document.getElementById('admin-video-title').value.trim();
        const videoInput = document.getElementById('admin-video-file');
        const thumbInput = document.getElementById('admin-thumbnail-file');
        const descEl = document.getElementById('admin-video-desc');
        const desc = descEl ? descEl.value.trim() : '';
        const cat = document.getElementById('admin-video-category')?.value;
        const releaseDate = document.getElementById('admin-video-date')?.value || null;
        
        errorEl.textContent = '';
        errorEl.style.color = '#e50914';
        
        if (!title || !videoInput.files || videoInput.files.length === 0 || !thumbInput.files || thumbInput.files.length === 0 || !cat) {
            errorEl.textContent = "Please fill in all required fields (Title, Video File, Thumbnail File, Category).";
            return;
        }
        
        const sb = typeof getSB === 'function' ? getSB() : null;
        if (!sb) {
            errorEl.textContent = "Database connection error.";
            return;
        }
        
        errorEl.style.color = '#46d369';
        errorEl.textContent = "Uploading Thumbnail (1/2)...";
        
        const thumbFile = thumbInput.files[0];
        const thumbExt = thumbFile.name.split('.').pop();
        const thumbPath = 'public/thumbs/' + Date.now() + '_' + Math.random().toString(36).substring(2,9) + '.' + thumbExt;
        const { error: thumbErr } = await sb.storage.from('videos').upload(thumbPath, thumbFile);
        if (thumbErr) {
            errorEl.style.color = '#e50914';
            errorEl.textContent = "Thumbnail upload failed: " + thumbErr.message;
            return;
        }
        const thumbUrl = sb.storage.from('videos').getPublicUrl(thumbPath).data.publicUrl;
        
        errorEl.textContent = "Uploading Video File (2/2)... Please wait (This can take a few minutes for large files!).";
        
        const videoFile = videoInput.files[0];
        const videoExt = videoFile.name.split('.').pop();
        const videoPath = 'public/vids/' + Date.now() + '_' + Math.random().toString(36).substring(2,9) + '.' + videoExt;
        const { error: vidErr } = await sb.storage.from('videos').upload(videoPath, videoFile);
        if (vidErr) {
            errorEl.style.color = '#e50914';
            errorEl.textContent = "Video upload failed: " + vidErr.message;
            return;
        }
        const videoUrl = sb.storage.from('videos').getPublicUrl(videoPath).data.publicUrl;
        
        errorEl.textContent = "Saving to database...";
        
        const success = await uploadVideoToDatabase({
            title: title,
            video_url: videoUrl,
            thumbnail_url: thumbUrl,
            description: desc,
            category: cat,
            release_date: releaseDate
        });
        
        if (success) {
            errorEl.textContent = "Video posted successfully! Redirecting to Home...";
            document.getElementById('admin-video-title').value = '';
            if (descEl) descEl.value = '';
            const vfName = document.getElementById('video-file-name'); if(vfName) vfName.textContent = '';
            const tfName = document.getElementById('thumb-file-name'); if(tfName) tfName.textContent = '';
            
            loadAndRenderVideos();
            setTimeout(() => showPage('home'), 1500);
        } else {
            errorEl.style.color = '#e50914';
            errorEl.textContent = "Failed to post video to database.";
        }
    } catch (err) {
        errorEl.style.color = '#e50914';
        errorEl.textContent = "CRASH ERROR: " + err.message;
    }
}

/* ===================== VIDEO PLAYER LOGIC ===================== */
let videoPlayerInterval;

window.openVideoPlayer = function(url, title, videoId) {
    currentVideoPlayingId = videoId;
    const overlay = document.getElementById('video-player-overlay');
    const videoEl = document.getElementById('main-video-player');
    const titleEl = document.getElementById('player-title-text');
    
    if (!overlay || !videoEl) return;
    
    titleEl.textContent = title || "Playing Video";
    videoEl.src = url;
    
    overlay.style.display = 'flex';
    videoEl.play();
    
    // Setup interval for progress bar and time
    clearInterval(videoPlayerInterval);
    videoPlayerInterval = setInterval(updatePlayerUI, 250);
    
    // Add event listeners for Netflix style controls
    videoEl.onplay = () => {
        document.getElementById('play-icon').style.display = 'none';
        document.getElementById('pause-icon').style.display = 'block';
    };
    videoEl.onpause = () => {
        document.getElementById('play-icon').style.display = 'block';
        document.getElementById('pause-icon').style.display = 'none';
    };
    
    // Loading spinner logic
    const spinner = document.getElementById('video-loading-spinner');
    if (spinner) {
        const showSpinner = () => spinner.style.display = 'flex';
        const hideSpinner = () => spinner.style.display = 'none';
        
        videoEl.onloadstart = showSpinner;
        videoEl.onwaiting = showSpinner;
        videoEl.onplaying = hideSpinner;
        videoEl.oncanplay = hideSpinner;
        videoEl.onerror = hideSpinner;
        
        // Ensure spinner is visible initially since we are loading a new video
        showSpinner();
    }
};

window.closeVideoPlayer = function() {
    const overlay = document.getElementById('video-player-overlay');
    const videoEl = document.getElementById('main-video-player');
    
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.remove('active', 'show-ui');
    }
    document.body.classList.remove('video-playing');
    
    if (videoEl) {
        // Save progress before pausing/clearing
        if (currentVideoPlayingId && videoEl.currentTime > 0) {
            saveVideoProgress(currentVideoPlayingId, videoEl.currentTime, videoEl.duration);
        }
        videoEl.pause();
        videoEl.src = "";
    }
    clearInterval(videoPlayerInterval);
    currentVideoPlayingId = null;
    
    // Refresh the home screen to show Continue Watching updates
    if (typeof renderVideoRows === 'function' && typeof videosList !== 'undefined') {
        renderVideoRows(videosList);
    }
};

window.togglePlayPause = function() {
    const videoEl = document.getElementById('main-video-player');
    if (!videoEl) return;
    if (videoEl.paused) videoEl.play();
    else videoEl.pause();
};

window.skipBackward = function() {
    const videoEl = document.getElementById('main-video-player');
    if (videoEl) videoEl.currentTime -= 10;
};

window.skipForward = function() {
    const videoEl = document.getElementById('main-video-player');
    if (videoEl) videoEl.currentTime += 10;
};

window.setVolume = function(val) {
    const videoEl = document.getElementById('main-video-player');
    if (videoEl) videoEl.volume = val;
};

window.seekVideo = function(e) {
    const container = document.getElementById('progress-bar-container');
    const videoEl = document.getElementById('main-video-player');
    if (!container || !videoEl) return;
    
    const rect = container.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoEl.currentTime = pos * videoEl.duration;
};

function updatePlayerUI() {
    const videoEl = document.getElementById('main-video-player');
    const fill = document.getElementById('progress-fill');
    const timeEl = document.getElementById('player-time');
    
    if (!videoEl || !fill || !timeEl) return;
    
    // Progress bar
    if (videoEl.duration) {
        const percent = (videoEl.currentTime / videoEl.duration) * 100;
        fill.style.width = percent + '%';
        
        // Time text
        timeEl.textContent = formatTime(videoEl.currentTime) + " / " + formatTime(videoEl.duration);
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
}





/* ===================== PROFILE SETTINGS ===================== */
window.populateProfileSettings = function() {
    const nameEl = document.getElementById('settings-profile-name');
    const emailEl = document.getElementById('settings-account-email');
    const imgEl = document.getElementById('settings-avatar-img');
    const grid = document.getElementById('settings-avatar-grid');
    
    if (currentUser) {
        nameEl.textContent = currentUser.name;
        if (avatarMap[currentUser.avatar]) {
            imgEl.src = avatarMap[currentUser.avatar];
        }
    }
    
    if (currentAuthUser && currentAuthUser.email) {
        emailEl.textContent = currentAuthUser.email;
    }
    
    // Build avatar grid
    let gridHtml = '';
    for (const key in avatarMap) {
        const isSelected = currentUser && currentUser.avatar === key;
        gridHtml += `
            <div class="cp-avatar-opt ${isSelected ? 'selected' : ''}" onclick="changeSettingsAvatar('${key}')" style="border: 2px solid ${isSelected ? '#e50914' : '#333'}; border-radius: 8px; cursor: pointer; overflow: hidden; padding: 5px; transition: all 0.2s;">
                <img src="${avatarMap[key]}" style="width: 100%; height: auto; object-fit: cover; border-radius: 4px;">
            </div>
        `;
    }
    grid.innerHTML = gridHtml;
};

window.changeSettingsAvatar = function(newAvatarKey) {
    if (!currentUser) return;
    
    currentUser.avatar = newAvatarKey;
    localStorage.setItem('totomelodies_profile', JSON.stringify(currentUser));
    applyProfile(currentUser);
    populateProfileSettings(); // re-render to update the red borders
    
    // Sync with Supabase
    if (typeof getSB === 'function' && typeof currentAuthUser !== 'undefined' && currentAuthUser) {
        const sb = getSB();
        if (currentAuthUser.user_metadata && currentAuthUser.user_metadata.child_profile) {
            currentAuthUser.user_metadata.child_profile.avatar = newAvatarKey;
            sb.auth.updateUser({
                data: { child_profile: currentAuthUser.user_metadata.child_profile }
            }).catch(e => console.error('Failed to sync avatar update:', e));
        }
    }
};

// ===== ANIMAL SOUNDBOARD =====
const safariAnimals = [
    { id: 'lion', name: "Lion", story: "Lions are the kings of the jungle! They have a loud roar that can be heard from 5 miles away. They love to sleep in the shade for up to 20 hours a day.", svg: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e50914" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="8" cy="10" r="1"></circle><circle cx="16" cy="10" r="1"></circle><path d="M12 16c-2 0-3-1-3-1"></path></svg>` },
    { id: 'elephant', name: "Elephant", story: "Elephants are the largest animals on land. They use their long trunks to drink water, pick up food, and even give themselves a shower!", svg: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2"><path d="M4 10h16v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-8z"></path><path d="M12 10v12"></path></svg>` },
    { id: 'monkey', name: "Monkey", story: "Monkeys are super smart and love to play! They swing from tree to tree using their strong arms and long tails, and their favorite snack is a yellow banana.", svg: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b4513" stroke-width="2"><circle cx="12" cy="12" r="8"></circle><circle cx="8" cy="12" r="2"></circle><circle cx="16" cy="12" r="2"></circle><path d="M10 16h4"></path></svg>` },
    { id: 'cow', name: "Cow", story: "Cows are gentle farm animals that eat grass all day long. They give us delicious milk that makes our bones strong and healthy!", svg: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="4" y="8" width="16" height="12" rx="4"></rect><path d="M8 8V6a4 4 0 0 1 8 0v2"></path></svg>` },
    { id: 'chicken', name: "Chicken", story: "Chickens are friendly birds that live on farms. They wake up early in the morning and lay fresh eggs for our breakfast!", svg: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffeb3b" stroke-width="2"><circle cx="12" cy="12" r="8"></circle><path d="M12 4L8 8h8z"></path></svg>` },
    { id: 'cat', name: "Cat", story: "Cats are fluffy and very clean animals. They love to purr when they are happy, and they are excellent jumpers who always land on their feet.", svg: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffa500" stroke-width="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path><path d="M8 8l4-4 4 4"></path></svg>` },
    { id: 'dog', name: "Dog", story: "Dogs are a human's best friend! They are incredibly loyal, love to play fetch, and have a super sense of smell to find hidden treats.", svg: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#deb887" stroke-width="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path><path d="M7 10h.01M17 10h.01M12 16h.01"></path></svg>` },
    { id: 'duck', name: "Duck", story: "Ducks are wonderful swimmers who love to splash in ponds. Their feathers are waterproof, keeping them completely dry while they quack and play in the water!", svg: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00bcd4" stroke-width="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path><path d="M22 12h-4l-3-3H9L6 12H2"></path></svg>` }
];

function buildAnimalGrid() {
    const grid = document.getElementById('animal-grid');
    if (!grid) return;
    
    let html = '';
    safariAnimals.forEach(a => {
        html += `
            <div class="animal-card" id="animal-${a.id}" onclick="playAnimalSound('${a.id}', '${a.name}')">
                <span class="animal-emoji" style="margin-bottom:15px; display:inline-block;">${a.svg}</span>
                <span class="animal-name">${a.name}</span>
            </div>
        `;
    });
    grid.innerHTML = html;
}

window.playAnimalSound = function(id, name) {
    const card = document.getElementById(`animal-${id}`);
    if (card) {
        card.classList.add('playing');
        setTimeout(() => card.classList.remove('playing'), 600);
    }
    
    // Find the story
    const animal = safariAnimals.find(a => a.id === id);
    const storyText = animal && animal.story ? animal.story : `This is a ${name}.`;
    
    // Show Modal
    let modal = document.getElementById('animal-story-modal');
    if (modal) {
        document.getElementById('animal-story-title').textContent = name;
        document.getElementById('animal-story-text').textContent = storyText;
        modal.style.display = 'flex';
        
        // Add emoji to modal based on svg if possible
        const emojiEl = document.getElementById('animal-story-emoji');
        if (animal && animal.svg) {
            emojiEl.innerHTML = animal.svg;
        } else {
            emojiEl.innerHTML = '';
        }
    }

    // Educational feature: Read the story aloud in English
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // stop previous
        const utterance = new SpeechSynthesisUtterance(storyText);
        utterance.lang = 'en-US'; // English
        utterance.pitch = 1.3;
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    }
};

window.closeAnimalStory = function() {
    const modal = document.getElementById('animal-story-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};

// Register Service Worker for Offline PWA Support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('SW registered:', reg);
        }).catch(err => {
            console.error('SW registration failed:', err);
        });
        buildAnimalGrid();
    });
} else {
    window.addEventListener('load', buildAnimalGrid);
}

// ===== REAL-TIME SUBSCRIPTION COUNTDOWN =====
let subscriptionInterval = null;

function startSubscriptionCountdown() {
    if (subscriptionInterval) clearInterval(subscriptionInterval);
    
    subscriptionInterval = setInterval(() => {
        const el = document.getElementById('subscription-countdown');
        if (!el || el.offsetParent === null) return; // Don't run if not visible
        
        if (!window.currentSubscriptionEndsAt) {
            el.textContent = "Lifetime / Not Found";
            return;
        }
        
        const now = new Date();
        const diff = window.currentSubscriptionEndsAt - now;
        
        if (diff <= 0) {
            el.textContent = "Expired";
            el.style.color = "#888";
            clearInterval(subscriptionInterval);
            return;
        }
        
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / 1000 / 60) % 60);
        const s = Math.floor((diff / 1000) % 60);
        
        el.textContent = `${d}d ${h}h ${m}m ${s}s`;
    }, 1000);
}

// Hook into showPage so we only start counting when needed
const originalShowPage = showPage;
showPage = function(pageId) {
    originalShowPage(pageId);
    if (pageId === 'profile-settings') {
        startSubscriptionCountdown();
    } else {
        if (subscriptionInterval) clearInterval(subscriptionInterval);
    }
};

// ===================== STORY BOOKS FEATURE =====================
// ===================== STORY BOOKS FEATURE =====================
const storyBooks = [
    {
        id: 'lion-brave',
        title: 'The Brave Little Lion',
        coverEmoji: 'ÃƒÂ°Ã…Â¸Ã‚Â¦Ã‚Â',
        coverBg: "url('assets/lion_cover.png') center/cover",
        spineColor: '#FF6B6B',
        pages: [
            { img: 'assets/lion_cover.png', bg: '#FFF9C4', text: 'Once upon a time, deep in the sunny savannah, there lived a little lion named Simba.' },
            { img: 'assets/serengeti.png', bg: '#FFE0B2', text: 'All the grown-up lions had HUGE roars that shook the ground and could be heard for miles!' },
            { img: 'assets/lion_page_3.png', bg: '#E1F5FE', text: 'But when little Simba tried to roarÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ all that came out was a tiny little "squeak." The animals giggled.' },
            { img: 'assets/transparent_lion.png', bg: '#FFF8E1', text: 'Simba was determined to find his big roar. He marched bravely out into the wide grassy plains.' },
            { img: 'assets/giraffe.png', bg: '#F1F8E9', text: 'He met a very tall giraffe. "Can you teach me to roar?" Simba squeaked hopefully.' },
            { img: 'assets/kilimanjaro.png', bg: '#E8EAF6', text: 'The giraffe just munched on leaves. "I don\'t roar, little one. I just reach high into the trees!"' },
            { img: 'assets/rhino.png', bg: '#EFEBE9', text: 'Next, he saw a tough rhino in the mud. "Can you teach me to roar?" Simba asked.' },
            { img: 'assets/zebra.png', bg: '#FFF3E0', text: 'The rhino snorted. "I don\'t roar, I charge!" Even the galloping zebras didn\'t know how to roar.' },
            { img: 'assets/simba.png', bg: '#FFEBEE', text: 'Suddenly, a mean hyena jumped out of the bushes! Simba had to be brave! He took a huge breath...' },
            { img: 'assets/lion_page_4.png', bg: '#E8F5E9', text: '"ROARRRR!!!" The biggest, loudest roar ever! The hyena ran away so fast it tripped over its paws! ÃƒÂ°Ã…Â¸Ã‚Â¦Ã‚Â The End ÃƒÂ¢Ã‚Â­Ã‚Â' }
        ]
    },
    {
        id: 'elephant-forgets',
        title: 'The Elephant Who Forgot',
        coverEmoji: 'ÃƒÂ°Ã…Â¸Ã‚ÂÃ‹Å“',
        coverBg: "url('assets/elephant_cover.png') center/cover",
        spineColor: '#4ECDC4',
        pages: [
            { img: 'assets/tembo_page_one_1780338501887.png', bg: '#E0F7FA', text: 'Tembo was the wisest elephant in the jungle. Everyone always said, "An elephant NEVER forgets!"' },
            { img: 'assets/tembo_page_two_1780338516887.png', bg: '#FFFDE7', text: 'But one sunny morning, Tembo woke up and his head felt suspiciously chilly.' },
            { img: 'assets/tembo_page_three_1780338532646.png', bg: '#E3F2FD', text: '"My favorite red hat!" cried Tembo. "It\'s gone!" He started his search at the sparkling river.' },
            { img: 'assets/kilimanjaro.png', bg: '#E8F5E9', text: 'He checked under the giant baobab tree, but only found some sleepy bats.' },
            { img: 'assets/giraffe.png', bg: '#FFF8E1', text: '"Have you seen my hat?" he asked the tall giraffes munching on leaves. They shook their heads.' },
            { img: 'assets/rhino.png', bg: '#F3E5F5', text: 'He asked the rhinos playing in the mud. "Nope, not here!" they snorted.' },
            { img: 'assets/zebra.png', bg: '#FFEBEE', text: 'He even asked the zebras galloping by, but they hadn\'t seen it either.' },
            { img: 'assets/transparent_elephant.png', bg: '#ECEFF1', text: 'Tembo felt sad. How could a wise elephant lose his favorite hat?' },
            { img: 'assets/monkey.png', bg: '#E8F5E9', text: 'Just then, a cheeky little monkey swung down and pointed, giggling. "Tembo... what\'s that in your trunk?"' },
            { img: 'assets/tembo.png', bg: '#E0F7FA', text: 'Tembo looked down. He had been holding his red hat in his trunk the entire time! All the animals laughed! ÃƒÂ°Ã…Â¸Ã‚ÂÃ‹Å“ The End ÃƒÂ¢Ã‚Â­Ã‚Â' }
        ]
    },
    {
        id: 'magic-mango',
        title: 'The Magic Mango Tree',
        coverEmoji: 'ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â³',
        coverBg: "url('assets/mango_cover.png') center/cover",
        spineColor: '#66BB6A',
        pages: [
            { img: 'assets/mango_cover.png', bg: '#F9FBE7', text: 'Deep in the jungle stood a magical Mango Tree. Its leaves shimmered gold, and its mangoes glowed like tiny suns.' },
            { img: 'assets/serengeti.png', bg: '#FFFDE7', text: 'The legend said: whoever showed true KINDNESS to another would receive a golden mango that grants one wish.' },
            { img: 'assets/zebra.png', bg: '#ECEFF1', text: 'A greedy zebra galloped up and kicked the trunk. "Give me a mango NOW!" he demanded rudely. Nothing happened.' },
            { img: 'assets/rhino.png', bg: '#E3F2FD', text: 'A grumpy rhino bumped the tree with his horn. "I demand a mango!" But the tree stayed silent.' },
            { img: 'assets/lion_cover.png', bg: '#F1F8E9', text: 'Even a proud lion roared at the tree, but the magic mangoes would not fall for selfishness.' },
            { img: 'assets/monkey.png', bg: '#FFF9C4', text: 'Then, a little monkey swung by. He saw a tiny bird who had lost her nest in a terrible storm.' },
            { img: 'assets/giraffe.png', bg: '#E8F5E9', text: 'The monkey felt sad for the little bird. He quickly climbed high up to gather soft leaves for a new nest.' },
            { img: 'assets/kilimanjaro.png', bg: '#66BB6A', text: 'Without hesitating, the monkey shared his only banana with the hungry bird. It was true kindness.' },
            { img: 'assets/mango_cover.png', bg: '#FFD54F', text: 'Suddenly, the tree rustled its golden leaves! A glowing mango fell gently right into the monkey\'s hands!' },
            { img: 'assets/elephant_cover.png', bg: '#E0F7FA', text: 'The monkey wished for enough food for everyone in the jungle. POOF! The jungle was full of fruit! ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â³ The End ÃƒÂ¢Ã‚Â­Ã‚Â' }
        ]
    }
];

// ---- Shelf / Book Card View ----
function buildStoriesGrid() {
    const shelf = document.getElementById('stories-shelf');
    if (!shelf) return;
    
    let html = `
    <!-- Playroom Library Container -->
    <div style="display: flex; flex-direction: column; gap: 60px; padding-top: 40px; align-items: center; position: relative; z-index: 2;">
        <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 60px 80px; width: 100%; max-width: 1000px;">
    `;
    
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#9D4EDD', '#FF9F1C'];
    
    storyBooks.forEach((book, index) => {
        const tilt = index % 2 === 0 ? '-3deg' : '3deg';
        const color = colors[index % colors.length];
        
        html += `
            <div class="creative-book-item" style="position: relative; display: flex; flex-direction: column; align-items: center; width: 240px; margin-bottom: 20px;">
                <!-- The Book -->
                <div class="magic-book" onclick="openBook('${book.id}')" 
                     style="background: ${book.coverBg}; border-radius: 12px 20px 20px 12px; width: 190px; height: 260px; 
                            box-shadow: -10px 15px 30px rgba(0,0,0,0.15), inset 4px 0 10px rgba(255,255,255,0.4); 
                            position: relative; z-index: 3; cursor: pointer; transform: rotate(${tilt}); 
                            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
                            border-right: 5px solid #fff; border-top: 3px solid #fff; border-bottom: 3px solid #fff; border-left: 1px solid #fff;">
                    
                    <!-- Spine -->
                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 22px; background: ${book.spineColor}; border-radius: 10px 0 0 10px; box-shadow: inset -4px 0 8px rgba(0,0,0,0.2);"></div>
                    
                    <!-- Title Badge -->
                    <div style="position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); width: 90%; background: #fff; padding: 10px 5px; border-radius: 16px; box-shadow: 0 10px 20px rgba(0,0,0,0.15); text-align: center; border: 4px solid ${color};">
                        <div style="font-size: 1.05rem; font-weight: 900; color: #333; line-height: 1.2;">${book.title}</div>
                    </div>
                </div>
                
                <!-- Magical Floating Shelf (Pill shaped) -->
                <div style="width: 260px; height: 28px; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(10px); border-radius: 30px; box-shadow: 0 15px 25px rgba(0,0,0,0.08), inset 0 3px 6px rgba(255,255,255,1); position: relative; z-index: 1; margin-top: 10px;">
                     <!-- Shelf Lip Highlight -->
                     <div style="position: absolute; top: 2px; left: 10%; right: 10%; height: 6px; background: rgba(255,255,255,0.9); border-radius: 10px;"></div>
                </div>
                
                <!-- Page Count Badge -->
                <div style="margin-top: 25px; background: ${color}; color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); z-index: 2; border: 2px solid #fff;">
                    ${book.pages.length} Pages
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
    </div>
    
    <!-- CSS for hover animations and magic sparkles -->
    <style>
        .creative-book-item .magic-book:hover {
            transform: translateY(-20px) rotate(0deg) scale(1.08) !important;
            box-shadow: -15px 25px 40px rgba(0,0,0,0.2), inset 4px 0 10px rgba(255,255,255,0.6) !important;
        }
        
        /* Floating sparkles background effect */
        .sparkle-bg {
            position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none;
        }
        .sparkle {
            position: absolute; background: #fff; border-radius: 50%; opacity: 0.6;
            animation: float-up linear infinite;
        }
        @keyframes float-up {
            0% { transform: translateY(100vh) scale(0); opacity: 0; }
            50% { opacity: 0.8; }
            100% { transform: translateY(-20vh) scale(1.5); opacity: 0; }
        }
    </style>
    
    <!-- Background Sparkles -->
    <div class="sparkle-bg">
        <div class="sparkle" style="width: 12px; height: 12px; left: 15%; animation-duration: 8s; animation-delay: 1s;"></div>
        <div class="sparkle" style="width: 18px; height: 18px; left: 35%; animation-duration: 12s; animation-delay: 3s;"></div>
        <div class="sparkle" style="width: 10px; height: 10px; left: 55%; animation-duration: 7s; animation-delay: 0s;"></div>
        <div class="sparkle" style="width: 25px; height: 25px; left: 75%; animation-duration: 10s; animation-delay: 2s;"></div>
        <div class="sparkle" style="width: 15px; height: 15px; left: 85%; animation-duration: 9s; animation-delay: 4s;"></div>
    </div>
    `;
    
    shelf.innerHTML = html;
}

// ---- Book Reader ----
let currentBook = null;
let currentPageIndex = 0;

window.openBook = function(id) {
    currentBook = storyBooks.find(b => b.id === id);
    if (!currentBook) return;
    currentPageIndex = 0;
    window.speechSynthesis && window.speechSynthesis.cancel();

    document.getElementById('book-reader-title-bar').textContent = currentBook.title;
    const overlay = document.getElementById('book-reader-overlay');
    overlay.style.display = 'flex';
    renderBookPage(true);
};

window.closeBook = function() {
    document.getElementById('book-reader-overlay').style.display = 'none';
    window.speechSynthesis && window.speechSynthesis.cancel();
};

window.bookNextPage = function() {
    if (!currentBook) return;
    if (currentPageIndex < currentBook.pages.length - 1) {
        currentPageIndex++;
        renderBookPage(true);
    }
};

window.bookPrevPage = function() {
    if (!currentBook || currentPageIndex === 0) return;
    currentPageIndex--;
    renderBookPage(false);
};

window.readCurrentPageAloud = function() {
    if (!currentBook) return;
    const page = currentBook.pages[currentPageIndex];
    if (!page) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(page.text);
        u.lang = 'en-US';
        u.rate = 0.8;
        u.pitch = 1.3;
        window.speechSynthesis.speak(u);
    }
};

function renderBookPage(forward = true) {
    if (!currentBook) return;
    const page = currentBook.pages[currentPageIndex];
    const total = currentBook.pages.length;
    const container = document.getElementById('book-container');
    const indicator = document.getElementById('book-page-indicator');
    const prevBtn = document.getElementById('book-prev-btn');
    const nextBtn = document.getElementById('book-next-btn');

    // Update page indicator
    indicator.textContent = `Page ${currentPageIndex + 1} of ${total}`;
    prevBtn.style.opacity = currentPageIndex === 0 ? '0.3' : '1';
    prevBtn.style.pointerEvents = currentPageIndex === 0 ? 'none' : 'auto';

    if (currentPageIndex === total - 1) {
        nextBtn.textContent = 'ÃƒÂ°Ã…Â¸Ã…Â½Ã¢â‚¬Â° Finish';
        nextBtn.onclick = closeBook;
    } else {
        nextBtn.textContent = 'Next ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¶';
        nextBtn.onclick = bookNextPage;
    }

    // Animate page flip
    let leftAnim = forward ? '' : 'animation: leftPageTurn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; transform-origin: right center;';
    let rightAnim = forward ? 'animation: rightPageTurn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both; transform-origin: left center;' : '';

    if (currentPageIndex === 0) {
        // Book Opening Animation
        leftAnim = 'animation: leftPageTurn 1s cubic-bezier(0.2, 0.8, 0.2, 1) both; transform-origin: right center;';
        rightAnim = 'animation: rightPageTurn 1s cubic-bezier(0.2, 0.8, 0.2, 1) both; transform-origin: left center;';
    }
    
    let imgHTML = '';
    if (page.img) {
        imgHTML = `
            <div class="book-img-page" style="flex:1; background: ${page.bg || '#fffdf5'}; border-radius: 12px 0 0 12px; display: flex; align-items: center; justify-content: center; padding: 25px; box-shadow: inset -10px 0 20px rgba(0,0,0,0.1); min-height: 250px; overflow: hidden; position: relative; ${leftAnim}">
                <!-- Decorative background elements using pure CSS/HTML pattern to make it feel premium -->
                <div style="position: absolute; inset: 0; opacity: 0.05; background-image: radial-gradient(circle at 20% 30%, #000 1px, transparent 1px), radial-gradient(circle at 75% 60%, #000 1px, transparent 1px); background-size: 20px 20px;"></div>
                <img src="${page.img}" alt="Page illustration" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 12px; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.12)); border: 6px solid #fff; transform: rotate(-1deg); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);" onmouseover="this.style.transform='scale(1.05) rotate(1deg)'; this.style.boxShadow='0 12px 24px rgba(0,0,0,0.18)';" onmouseout="this.style.transform='scale(1) rotate(-1deg)'; this.style.boxShadow='none';">
            </div>
        `;
    } else {
        imgHTML = `<div class="book-img-page" style="flex:1; background: ${page.bg}; border-radius: 12px 0 0 12px; display:flex; align-items:center; justify-content:center; font-size:100px; box-shadow: inset -10px 0 20px rgba(0,0,0,0.1); min-height: 250px; ${leftAnim}">${page.emoji}</div>`;
    }

    container.innerHTML = `
        <div class="book-hardcover" style="background: #2a3b5c; padding: 10px; border-radius: 15px; box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,0,0,0.8); position: relative; max-width: 950px; margin: 0 auto; display: flex; perspective: 3000px;">
            
            <!-- Book Spine Binding Details on Hardcover -->
            <div style="position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); width: 40px; background: linear-gradient(to right, rgba(0,0,0,0.4), rgba(0,0,0,0.1) 20%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.4)); z-index: 0;"></div>
            
            <div class="book-spread" style="display: flex; width: 100%; position: relative; z-index: 1; transform-style: preserve-3d;">
                <!-- Left Page (Image) -->
                ${imgHTML}

                <!-- Center Fold (Spine shadow inside pages) -->
                <div class="book-spine-fold" style="position: absolute; left: 50%; top: 0; bottom: 0; width: 40px; transform: translateX(-50%); background: linear-gradient(to right, transparent, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.15) 55%, transparent); pointer-events: none; z-index: 10;"></div>

                <!-- Right Page (Text) -->
                <div class="book-text-page" style="flex:1; background: #fffdf5; border-radius: 0 10px 10px 0; padding: 40px; display: flex; flex-direction: column; justify-content: center; box-shadow: inset 10px 0 20px rgba(0,0,0,0.05); position: relative; ${rightAnim}">
                    <div style="position: absolute; bottom: 15px; right: 20px; font-size: 1rem; color: #888; font-weight: 700;">${currentPageIndex + 1}</div>
                    <p class="book-text-content" style="font-size: 1.8rem; line-height: 1.6; color: #333; font-weight: 600; text-align: left;">${page.text}</p>
                </div>
            </div>
        </div>
    `;

    // Auto read new page
    window.speechSynthesis && window.speechSynthesis.cancel();
}

// Add CSS for page animations
if (!document.getElementById('book-anim-style')) {
    const style = document.createElement('style');
    style.id = 'book-anim-style';
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');

        @keyframes rightPageTurn {
            0% { transform: perspective(2500px) rotateY(-90deg); filter: brightness(0.5); }
            100% { transform: perspective(2500px) rotateY(0deg); filter: brightness(1); }
        }
        @keyframes leftPageTurn {
            0% { transform: perspective(2500px) rotateY(90deg); filter: brightness(0.5); }
            100% { transform: perspective(2500px) rotateY(0deg); filter: brightness(1); }
        }
        
        .book-spread {
            display: flex;
            width: 100%;
            height: 480px;
            perspective: 2500px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            border-radius: 12px;
            background: #fff;
            position: relative;
            transform-style: preserve-3d;
        }

        .book-spine-fold {
            width: 3px; 
            background: linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.2) 50%, rgba(0,0,0,0.3) 100%); 
            z-index: 5;
        }

        .book-text-page {
            flex:1; 
            background: #fffdf5; 
            border-radius: 0 12px 12px 0; 
            padding: 40px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            position: relative; 
            box-shadow: inset 15px 0 25px rgba(0,0,0,0.06);
        }

        .book-text-content {
            font-size: clamp(1.4rem, 2.5vw, 1.8rem); 
            font-weight: 700; 
            color: #333; 
            line-height: 1.6; 
            text-align: center; 
            font-family: 'Fredoka One', 'Inter', sans-serif;
        }

        /* Responsive Layout for Mobile */
        @media (max-width: 768px) {
            .book-spread {
                flex-direction: column;
                height: auto;
                min-height: 60vh;
                border-radius: 12px;
                overflow: hidden;
            }
            .book-img-page {
                border-radius: 12px 12px 0 0 !important;
                min-height: 250px;
            }
            .book-spine-fold {
                width: 100%;
                height: 3px;
                background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(255,255,255,0.2) 50%, rgba(0,0,0,0.3) 100%);
            }
            .book-text-page {
                border-radius: 0 0 12px 12px;
                padding: 30px 20px;
                min-height: 250px;
            }
        }

        /* Magical Floating Shelves Styling */
        .magic-shelves-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 50px 30px;
            justify-content: center;
        }

        .magic-shelf-item {
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            position: relative;
            width: 250px;
            padding-bottom: 25px; 
            z-index: 2;
        }
        
        /* The magical glowing shelf plank */
        .magic-shelf-item::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 20px;
            background: linear-gradient(180deg, rgba(160, 95, 53, 0.95), rgba(90, 50, 25, 0.98));
            border-top: 2px solid rgba(255, 215, 0, 0.4);
            border-bottom: 6px solid rgba(30, 15, 5, 0.95);
            border-radius: 4px;
            box-shadow: 
                0 15px 30px rgba(0,0,0,0.9),
                0 0 30px rgba(255, 215, 0, 0.15);
            z-index: 0;
        }

        /* Bracket underneath */
        .magic-shelf-item::before {
            content: '';
            position: absolute;
            bottom: -15px;
            left: 50%;
            transform: translateX(-50%);
            width: 180px;
            height: 15px;
            background: linear-gradient(180deg, rgba(60, 30, 15, 0.8), transparent);
            border-radius: 0 0 50% 50%;
            z-index: -1;
            filter: blur(2px);
        }

        .bookcase-book {
            position: relative; 
            width: 180px; 
            height: 240px; 
            border-radius: 4px 12px 12px 4px; 
            box-shadow: -15px 15px 30px rgba(0,0,0,0.8), inset -4px 0 8px rgba(0,0,0,0.4); 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            padding: 15px; 
            text-align: center;
            cursor: pointer;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 2;
        }
        
        .bookcase-book:hover {
            transform: translateY(-20px) rotate(-3deg) scale(1.05);
        }

        /* Book shelf cards */
        #stories-shelf { margin-bottom: 30px; }
        #stories-shelf > div { user-select: none; }
    `;
    document.head.appendChild(style);
}

window.addEventListener('load', buildStoriesGrid);



