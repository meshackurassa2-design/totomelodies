/* ===================== SUPABASE CLIENT ===================== */
const SUPABASE_URL  = 'https://ntlvuizaasqwegcbrllq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50bHZ1aXphYXNxd2VnY2JybGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTk1MDcsImV4cCI6MjA5NTc3NTUwN30.7NpQYofB4aYSFWlpdrf9MST6AAQX2dsnJJqbhnZSU0k';

let sbClient = null;
function getSB() {
    if (!sbClient && window.supabase) sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    return sbClient;
}

/* ===================== AUTH ===================== */
let currentAuthUser = null;

async function initAuth() {
    const sb = getSB();
    if (!sb) { showAuthScreen(); return; }

    // Listen for auth state changes in real time
    sb.auth.onAuthStateChange((event, session) => {
        currentAuthUser = session?.user || null;
        if (currentAuthUser) {
            hideAuthScreen();
            checkAndRouteUser();
        } else {
            showAuthScreen();
        }
    });

    // Check current session
    const { data: { session } } = await sb.auth.getSession();
    currentAuthUser = session?.user || null;
    
    // Hide the global splash screen now that we know the auth state
    const splash = document.getElementById('global-splash');
    if (splash) splash.style.display = 'none';

    if (!currentAuthUser) showAuthScreen();
}

async function checkAndRouteUser() {
    if (!currentAuthUser) return;
    
    // Toggle admin link visibility
    const adminLink = document.getElementById('nav-admin-link');
    if (adminLink) {
        adminLink.style.display = isAdmin() ? 'list-item' : 'none';
    }

    // 1. Check subscription status
    const sb = getSB();
    const { data: profile } = await sb.from('profiles').select('subscription_ends_at').eq('id', currentAuthUser.id).single();
    
    let isSubscribed = false;
    window.currentSubscriptionEndsAt = null; // Store globally for countdown

    if (profile && profile.subscription_ends_at) {
        const endsAt = new Date(profile.subscription_ends_at);
        window.currentSubscriptionEndsAt = endsAt;
        if (endsAt > new Date()) {
            isSubscribed = true;
        }
    }

    if (!isSubscribed && !isAdmin()) {
        showPage('activation');
        return; // Block access
    }
    
    // Check if the user has a profile saved in Supabase metadata
    const childProfile = currentAuthUser.user_metadata?.child_profile;
    
    if (childProfile) {
        // Apply it and go to home (or onboarding)
        applyProfile(childProfile);
        const onbKey = 'totomelodies_onboarding_done';
        if (localStorage.getItem(onbKey) === 'true') {
            showPage('home');
        } else {
            startOnboarding();
        }
    } else {
        // No profile in metadata, show the profiles screen (which will auto-show Create)
        showPage('profiles');
        if (typeof renderProfilesView === 'function') renderProfilesView();
    }
}

function showAuthScreen() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('main-nav').style.display = 'none';
}

function hideAuthScreen() {
    document.getElementById('auth-screen').classList.add('hidden');
}

async function handleLogin() {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');
    const btn      = document.getElementById('login-btn');

    errEl.textContent = '';
    if (!email || !password) { errEl.textContent = 'Please enter your email and password.'; return; }

    btn.disabled = true;
    btn.innerHTML = '<div class="auth-spinner"></div> Signing in…';

    try {
        const sb = getSB();
        const { error, data } = await sb.auth.signInWithPassword({ email, password });
        
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
        if (error) {
            errEl.style.color = '#e87c03';
            errEl.textContent = error.message;
            alert("Sign In Error: " + error.message);
        } else if (data?.session) {
            currentAuthUser = data.session.user;
            hideAuthScreen();
            checkAndRouteUser();
        } else {
            alert("Unexpected state: no error but no session.");
        }
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
        errEl.style.color = '#e87c03';
        errEl.textContent = 'An unexpected error occurred. Please try again.';
        alert("Unexpected JavaScript Error: " + err.message);
        console.error(err);
    }
}

async function handleSignup() {
    const name     = document.getElementById('signup-name').value.trim();
    const email    = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const errEl    = document.getElementById('signup-error');
    const btn      = document.getElementById('signup-btn');

    errEl.textContent = '';
    if (!name)            { errEl.textContent = 'Please enter your name.'; return; }
    if (!email)           { errEl.textContent = 'Please enter your email.'; return; }
    if (password.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; return; }

    btn.disabled = true;
    btn.innerHTML = '<div class="auth-spinner"></div> Creating account…';

    const sb = getSB();
    const { error, data } = await sb.auth.signUp({ email, password, options: { data: { full_name: name } } });

    btn.disabled = false;
    btn.innerHTML = 'Create Account';
    if (error) {
        errEl.style.color = '#e87c03';
        errEl.textContent = error.message;
    } else {
        errEl.style.color = '#46d369';
        if (data?.session) {
            errEl.textContent = 'Account created successfully!';
            // The auth state listener will automatically log the user in
        } else {
            errEl.textContent = 'Account created! (Note: You must turn off "Confirm email" in your Supabase Auth settings to skip confirmation).';
        }
    }
}

async function handleSignOut() {
    closeAvatarMenu();
    const sb = getSB();
    if (sb) await sb.auth.signOut();
    localStorage.removeItem('totomelodies_profile');
    currentAuthUser = null;
    showAuthScreen();
    showPage('home');
}

function switchAuthForm(type) {
    document.getElementById('auth-login-form').style.display  = type === 'login'  ? 'block' : 'none';
    document.getElementById('auth-signup-form').style.display = type === 'signup' ? 'block' : 'none';
    document.getElementById('login-error').textContent  = '';
    document.getElementById('signup-error').textContent = '';
}

function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.style.opacity = input.type === 'text' ? '0.5' : '1';
}

// Allow Enter key to submit
document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (document.getElementById('auth-screen').classList.contains('hidden')) return;
    const loginForm  = document.getElementById('auth-login-form');
    const signupForm = document.getElementById('auth-signup-form');
    if (loginForm  && loginForm.style.display  !== 'none') handleLogin();
    if (signupForm && signupForm.style.display !== 'none') handleSignup();
});

/* ===================== REAL-TIME VIDEO SUBSCRIPTION ===================== */
function subscribeToVideos() {
    const sb = getSB();
    if (!sb) return;
    sb.channel('videos-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, payload => {
            console.log('Real-time video update:', payload.eventType);
            loadAndRenderVideos(); // re-render on INSERT/UPDATE/DELETE
        })
        .subscribe();
}

/* ===================== ADMIN & VIDEO MANAGEMENT ===================== */
function isAdmin() {
    return currentAuthUser && currentAuthUser.email && currentAuthUser.email.toLowerCase() === 'meshackurassa2@gmail.com';
}

async function fetchVideosFromDatabase() {
    const sb = getSB();
    if (!sb) return [];
    
    const { data, error } = await sb.from('videos').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Error fetching videos:", error);
        return [];
    }
    return data || [];
}

async function uploadVideoToDatabase(videoData) {
    if (!isAdmin()) {
        alert("Access Denied: Only meshackurassa2@gmail.com can post videos.");
        return false;
    }
    
    const sb = getSB();
    const { data, error } = await sb.from('videos').insert([
        {
            title: videoData.title,
            description: videoData.description,
            thumbnail_url: videoData.thumbnail_url,
            video_url: videoData.video_url,
            category: videoData.category,
            release_date: videoData.release_date || null
        }
    ]);
    
    if (error) {
        console.error("Upload error:", error);
        alert("Upload error: " + error.message);
        return false;
    }
    
    return true;
}

/* ===================== SUBSCRIPTION ACTIVATION ===================== */
async function submitActivationCode() {
    const codeInput = document.getElementById('activation-code-input').value.trim().toUpperCase();
    const errorEl = document.getElementById('activation-error');
    const btn = document.getElementById('activation-btn');

    if (!codeInput) {
        errorEl.textContent = 'Please enter a code.';
        return;
    }

    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Activating...';

    const sb = getSB();
    
    // 1. Find the code
    const { data: codes, error } = await sb.from('activation_codes')
        .select('*')
        .eq('code', codeInput)
        .eq('is_used', false);
        
    if (error || !codes || codes.length === 0) {
        errorEl.textContent = 'Invalid or already used activation code.';
        btn.disabled = false;
        btn.textContent = 'Activate Subscription';
        return;
    }

    const validCode = codes[0];

    // 2. Calculate new expiration date (1 month from now)
    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + 1);

    // 3. Update profile
    const { error: profileErr } = await sb.from('profiles')
        .update({ subscription_ends_at: newDate.toISOString() })
        .eq('id', currentAuthUser.id);
        
    if (profileErr) {
        errorEl.textContent = 'Failed to activate. Please try again.';
        btn.disabled = false;
        btn.textContent = 'Activate Subscription';
        return;
    }

    // 4. Mark code as used
    await sb.from('activation_codes')
        .update({ is_used: true, used_by: currentAuthUser.id })
        .eq('id', validCode.id);

    btn.textContent = 'Success!';
    setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Activate Subscription';
        checkAndRouteUser();
    }, 1500);
}

async function adminGenerateCode() {
    if (!isAdmin()) {
        alert("Access Denied: Admin only.");
        return;
    }

    const msgEl = document.getElementById('admin-code-msg');
    const inputEl = document.getElementById('admin-generated-code');
    msgEl.textContent = 'Generating...';
    msgEl.style.color = '#e87c03';
    
    // Generate random code like TOTO-ABCD-1234
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let p1 = '', p2 = '';
    for(let i=0; i<4; i++) p1 += chars.charAt(Math.floor(Math.random()*chars.length));
    for(let i=0; i<4; i++) p2 += chars.charAt(Math.floor(Math.random()*chars.length));
    const code = `TOTO-${p1}-${p2}`;

    const sb = getSB();
    const { error } = await sb.from('activation_codes').insert([{ code: code }]);
    
    if (error) {
        msgEl.textContent = 'Error: ' + error.message;
    } else {
        msgEl.style.color = '#46d369';
        msgEl.textContent = 'Code generated successfully!';
        inputEl.value = code;
    }
}
