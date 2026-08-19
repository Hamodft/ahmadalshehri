/* ==========================================================================
   Career Hub admin.
   Reads and writes /data/*.json through the GitHub Contents API.
   The token lives only in this browser (sessionStorage / localStorage).
   Nothing secret is ever written into the repository.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- repo detected from the GitHub Pages URL, so nothing is hard-coded ---- */
  var REPO = (function () {
    var h = location.hostname, p = location.pathname;
    var owner = h.endsWith('.github.io') ? h.replace('.github.io', '') : '';
    var seg = p.split('/').filter(Boolean);
    var i = seg.indexOf('admin');
    var repo = i > 0 ? seg[i - 1] : (owner ? owner + '.github.io' : '');
    return { owner: owner, repo: repo, branch: 'main' };
  })();

  var FILES = ['profile', 'settings', 'experience', 'progression', 'achievements',
    'skills', 'certifications', 'education', 'languages', 'projects', 'training', 'documents'];

  var AUTH = window.ADMIN_AUTH_CONFIG || { enabled: false };
  var S = {
    token: '', online: false, data: {}, sha: {}, dirty: {}, view: 'profile',
    auth: null, user: null, media: [], mediaLoaded: false
  };
  var $ = function (id) { return document.getElementById(id); };

  function authEnabled() {
    return Boolean(AUTH.enabled && AUTH.supabaseUrl && AUTH.supabasePublishableKey && window.supabase);
  }

  function ownerEmail() { return String(AUTH.ownerEmail || '').trim().toLowerCase(); }
  function isOwner(user) {
    return Boolean(user && user.email && user.email.toLowerCase() === ownerEmail() && user.email_confirmed_at);
  }

  /* ------------------------------------------------------------- storage */
  function store(k, v) {
    try {
      if (v === null) { localStorage.removeItem(k); sessionStorage.removeItem(k); return; }
      if (v === undefined) return localStorage.getItem(k) || sessionStorage.getItem(k);
      (S.remember ? localStorage : sessionStorage).setItem(k, v);
    } catch (e) { return null; }
  }

  function toast(msg, bad) {
    var t = $('toast');
    t.textContent = msg;
    t.className = 'toast on' + (bad ? ' bad' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.className = 'toast'; }, bad ? 6000 : 3000);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function get(o, path) {
    return path.split('.').reduce(function (x, k) { return x == null ? x : x[k]; }, o);
  }
  function set(o, path, val) {
    var k = path.split('.'), last = k.pop();
    var t = k.reduce(function (x, s) { if (x[s] == null) x[s] = {}; return x[s]; }, o);
    t[last] = val;
  }
  function uid(p) { return p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  /* --------------------------------------------------------------- auth */
  function authMsg(msg, bad, good) {
    $('authMsg').innerHTML = msg
      ? '<div class="note' + (bad ? ' bad' : (good ? ' good' : '')) + '">' + esc(msg) + '</div>'
      : '';
  }

  function redirectUrl() {
    return location.origin + location.pathname;
  }

  function showTokenGate() {
    $('authGate').classList.remove('on');
    $('tokenGate').style.display = '';
    $('gateIntro').textContent = 'Owner verified. Connect this browser to the GitHub repository to publish.';
    var saved = store('aa_token');
    if (saved) {
      $('tok').value = saved;
      S.remember = true;
      signIn();
    }
  }

  function acceptAuthUser(user) {
    if (!user || !user.email) return false;
    if (user.email.toLowerCase() !== ownerEmail()) {
      S.auth.auth.signOut();
      authMsg('This account is not approved to manage the website.', true);
      return false;
    }
    if (!user.email_confirmed_at) {
      authMsg('Verify your email first, then return here and sign in.', true);
      return false;
    }
    S.user = user;
    showTokenGate();
    return true;
  }

  function initAuth() {
    $('authGate').classList.add('on');
    $('tokenGate').style.display = 'none';
    $('gateIntro').textContent = 'Secure owner sign-in with verified email.';
    $('authEmail').value = AUTH.ownerEmail || '';
    $('authEmail').readOnly = Boolean(AUTH.ownerEmail);

    S.auth = window.supabase.createClient(AUTH.supabaseUrl, AUTH.supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    $('authSignin').onclick = function () {
      var email = $('authEmail').value.trim(), password = $('authPassword').value;
      if (!email || !password) { authMsg('Enter your email and password.', true); return; }
      authMsg('Checking your account…');
      S.auth.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
        if (r.error) throw r.error;
        acceptAuthUser(r.data.user);
      }).catch(function (e) { authMsg(e.message, true); });
    };

    $('authSignup').onclick = function () {
      var email = $('authEmail').value.trim(), password = $('authPassword').value;
      if (email.toLowerCase() !== ownerEmail()) { authMsg('Use the approved owner email.', true); return; }
      if (!password || password.length < 8) { authMsg('Use a password with at least 8 characters.', true); return; }
      authMsg('Creating the owner account…');
      S.auth.auth.signUp({
        email: email, password: password,
        options: { emailRedirectTo: redirectUrl(), data: { username: 'ahmad.alshehri' } }
      }).then(function (r) {
        if (r.error) throw r.error;
        authMsg('Account created. Check your email and open the verification link.', false, true);
      }).catch(function (e) { authMsg(e.message, true); });
    };

    $('authForgot').onclick = function () {
      var email = $('authEmail').value.trim();
      if (email.toLowerCase() !== ownerEmail()) { authMsg('Use the approved owner email.', true); return; }
      S.auth.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() + '?reset=1' })
        .then(function (r) {
          if (r.error) throw r.error;
          authMsg('Password reset email sent.', false, true);
        }).catch(function (e) { authMsg(e.message, true); });
    };

    $('authPassword').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') $('authSignin').click();
    });

    S.auth.auth.getSession().then(function (r) {
      if (r.data && r.data.session) acceptAuthUser(r.data.session.user);
    });
  }

  /* -------------------------------------------------------------- GitHub */
  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({
      'Accept': 'application/vnd.github+json',
      'Authorization': 'Bearer ' + S.token,
      'X-GitHub-Api-Version': '2022-11-28'
    }, opts.headers || {});
    return fetch('https://api.github.com/repos/' + REPO.owner + '/' + REPO.repo + path, opts)
      .then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
          var err = new Error(j.message || ('GitHub ' + r.status));
          err.status = r.status;
          throw err;
        });
        return r.status === 204 ? {} : r.json();
      });
  }

  function b64encode(str) {
    return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str)));
  }
  function b64decode(b64) {
    var bin = atob(b64.replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function loadFromGitHub() {
    return api('/contents/data?ref=' + REPO.branch).then(function (list) {
      var byName = {};
      list.forEach(function (f) { byName[f.name] = f; });
      return Promise.all(FILES.map(function (f) {
        var meta = byName[f + '.json'];
        if (!meta) throw new Error('data/' + f + '.json not found in the repository');
        S.sha[f] = meta.sha;
        return api('/contents/data/' + f + '.json?ref=' + REPO.branch).then(function (c) {
          return JSON.parse(b64decode(c.content));
        });
      })).then(function (all) {
        FILES.forEach(function (f, i) { S.data[f] = all[i]; });
      });
    });
  }

  function loadLocal() {
    return Promise.all(FILES.map(function (f) {
      return fetch('../data/' + f + '.json', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error(f + '.json — ' + r.status); return r.json();
      });
    })).then(function (all) {
      FILES.forEach(function (f, i) { S.data[f] = all[i]; });
    });
  }

  function bytesToB64(buf) {
    var bytes = new Uint8Array(buf), out = '', step = 0x8000;
    for (var i = 0; i < bytes.length; i += step) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + step, bytes.length)));
    }
    return btoa(out);
  }

  function loadMedia() {
    if (!S.online) { S.media = []; return Promise.resolve([]); }
    return Promise.all(['assets/profile', 'assets/uploads'].map(function (dir) {
      return api('/contents/' + dir + '?ref=' + REPO.branch).catch(function (e) {
        if (e.status === 404) return [];
        throw e;
      });
    })).then(function (groups) {
      S.media = groups.reduce(function (a, b) { return a.concat(Array.isArray(b) ? b : []); }, [])
        .filter(function (f) { return f.type === 'file' && /\.(png|jpe?g|webp|gif|pdf)$/i.test(f.name); })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
      S.mediaLoaded = true;
      return S.media;
    });
  }

  function uploadMedia(file) {
    if (!S.online) { toast('Connect to GitHub before uploading files.', true); return; }
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { toast('File is larger than 8 MB.', true); return; }
    var safe = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!safe) safe = 'asset-' + Date.now();
    var path = 'assets/uploads/' + Date.now().toString(36) + '-' + safe;
    file.arrayBuffer().then(function (buf) {
      return api('/contents/' + path, {
        method: 'PUT',
        body: JSON.stringify({
          message: 'Upload ' + safe + ' via admin',
          content: bytesToB64(buf),
          branch: REPO.branch
        })
      });
    }).then(function () {
      toast('Uploaded. Copy its path and use it in any image or document field.');
      return loadMedia();
    }).then(renderView).catch(function (e) { toast('Upload failed — ' + e.message, true); });
  }

  function deleteMedia(item) {
    if (!item || item.path.indexOf('assets/uploads/') !== 0) return;
    if (!confirm('Delete "' + item.name + '" from the website repository?')) return;
    api('/contents/' + item.path, {
      method: 'DELETE',
      body: JSON.stringify({
        message: 'Delete ' + item.name + ' via admin',
        sha: item.sha,
        branch: REPO.branch
      })
    }).then(function () {
      toast('File deleted.');
      return loadMedia();
    }).then(renderView).catch(function (e) { toast('Delete failed — ' + e.message, true); });
  }

  function publish() {
    var changed = Object.keys(S.dirty).filter(function (k) { return S.dirty[k]; });
    if (!changed.length) { toast('Nothing to publish'); return; }
    if (!S.online) { toast('Offline — export a backup instead', true); return; }

    var btn = $('btnPublish');
    btn.disabled = true; btn.textContent = 'Publishing…';

    var seq = Promise.resolve();
    changed.forEach(function (f) {
      seq = seq.then(function () {
        var body = {
          message: 'Update ' + f + '.json via admin',
          content: b64encode(JSON.stringify(S.data[f], null, 2) + '\n'),
          branch: REPO.branch
        };
        if (S.sha[f]) body.sha = S.sha[f];
        return api('/contents/data/' + f + '.json', {
          method: 'PUT', body: JSON.stringify(body)
        }).then(function (res) {
          S.sha[f] = res.content.sha;
          delete S.dirty[f];
        });
      });
    });

    seq.then(function () {
      markDirty();
      toast('Published. GitHub Pages rebuilds in about a minute.');
    }).catch(function (e) {
      toast('Publish failed — ' + e.message, true);
    }).then(function () {
      btn.disabled = false; btn.textContent = 'Publish';
    });
  }

  function markDirty() {
    var n = Object.keys(S.dirty).filter(function (k) { return S.dirty[k]; }).length;
    $('dirtyFlag').innerHTML = n ? '<span class="dirty"></span>' + n + ' unpublished' : '';
    renderNav();
  }
  function touch(f) { S.dirty[f] = true; markDirty(); }

  /* --------------------------------------------------------------- fields */
  function fieldHTML(f, val, path) {
    var id = 'f_' + path.replace(/[^\w]/g, '_');
    var h = '<div class="field"><label for="' + id + '">' + esc(f.label) + '</label>';

    if (f.t === 'bitext' || f.t === 'biarea' || f.t === 'bilist') {
      var v = val || {};
      var tag = f.t === 'bitext' ? 'input' : 'textarea';
      var cls = f.t === 'bilist' ? 'in tall' : 'in';
      var toStr = function (x) { return Array.isArray(x) ? x.join('\n') : (x || ''); };
      h += '<div class="bi">';
      [['en', 'English'], ['ar', 'العربية']].forEach(function (L) {
        h += '<div><span class="lab">' + L[1] + '</span>';
        h += tag === 'input'
          ? '<input class="' + cls + (L[0] === 'ar' ? ' ar-in' : '') + '" data-path="' + esc(path + '.' + L[0]) + '" data-kind="' + f.t + '" value="' + esc(toStr(v[L[0]])) + '">'
          : '<textarea class="' + cls + (L[0] === 'ar' ? ' ar-in' : '') + '" data-path="' + esc(path + '.' + L[0]) + '" data-kind="' + f.t + '">' + esc(toStr(v[L[0]])) + '</textarea>';
        h += '</div>';
      });
      h += '</div>';

    } else if (f.t === 'area') {
      h += '<textarea class="in" id="' + id + '" data-path="' + esc(path) + '" data-kind="text">' + esc(val || '') + '</textarea>';

    } else if (f.t === 'bool') {
      h += '<label class="chk"><input type="checkbox" id="' + id + '" data-path="' + esc(path) + '" data-kind="bool"' +
        (val ? ' checked' : '') + '> ' + esc(f.label) + '</label>';

    } else if (f.t === 'select') {
      h += '<select class="in" id="' + id + '" data-path="' + esc(path) + '" data-kind="text">';
      (f.opts || []).forEach(function (o) {
        h += '<option value="' + esc(o[0]) + '"' + (String(val) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
      });
      h += '</select>';

    } else if (f.t === 'tags') {
      h += '<textarea class="in" id="' + id + '" data-path="' + esc(path) + '" data-kind="lines" placeholder="One per line">' +
        esc((val || []).map(function (x) { return typeof x === 'string' ? x : (x.en || ''); }).join('\n')) + '</textarea>';

    } else if (f.t === 'ref') {
      var opts = (S.data[f.ref] && S.data[f.ref].items) || [];
      var cur = val || [];
      h += '<div class="reflist">';
      opts.forEach(function (o) {
        var lbl = o.name ? (o.name.en || o.name.ar) : (o.title ? (o.title.en || o.title.ar) : o.id);
        h += '<label><input type="checkbox" data-refpath="' + esc(path) + '" value="' + esc(o.id) + '"' +
          (cur.indexOf(o.id) > -1 ? ' checked' : '') + '> ' + esc(lbl) + '</label>';
      });
      h += opts.length ? '</div>' : '<p class="help">Nothing to link yet.</p></div>';

    } else if (f.t === 'docs') {
      h += '<div data-docs="' + esc(path) + '">';
      (val || []).forEach(function (d, i) {
        h += '<div class="docrow">' +
          '<input class="in" placeholder="Title" data-docfield="title" data-docidx="' + i + '" value="' + esc(d.title ? (d.title.en || '') : '') + '">' +
          '<input class="in" placeholder="https://…" data-docfield="url" data-docidx="' + i + '" value="' + esc(d.url || '') + '">' +
          '<button class="b sm warn" data-docdel="' + i + '" type="button">Remove</button></div>';
      });
      h += '<button class="b sm" data-docadd="1" type="button">+ Add document</button></div>';

    } else if (f.t === 'num') {
      h += '<input class="in" id="' + id + '" type="number" data-path="' + esc(path) + '" data-kind="num" value="' + esc(val == null ? '' : val) + '">';

    } else {
      h += '<input class="in" id="' + id + '" type="' + (f.t === 'url' ? 'url' : 'text') + '" data-path="' + esc(path) + '" data-kind="text" value="' + esc(val == null ? '' : val) + '">';
    }

    if (f.help) h += '<p class="help">' + esc(f.help) + '</p>';
    return h + '</div>';
  }

  function bindInputs(root, obj, file) {
    root.querySelectorAll('[data-path]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var kind = inp.getAttribute('data-kind'), p = inp.getAttribute('data-path'), v;
        if (kind === 'bool') v = inp.checked;
        else if (kind === 'num') v = inp.value === '' ? '' : Number(inp.value);
        else if (kind === 'lines' || kind === 'bilist') v = inp.value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
        else v = inp.value;
        set(obj, p, v);
        touch(file);
      });
      if (inp.type === 'checkbox' || inp.tagName === 'SELECT') {
        inp.addEventListener('change', function () { inp.dispatchEvent(new Event('input')); });
      }
    });
    root.querySelectorAll('[data-refpath]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var p = cb.getAttribute('data-refpath');
        var cur = get(obj, p) || [];
        var i = cur.indexOf(cb.value);
        if (cb.checked && i < 0) cur.push(cb.value);
        if (!cb.checked && i > -1) cur.splice(i, 1);
        set(obj, p, cur);
        touch(file);
      });
    });
    root.querySelectorAll('[data-docs]').forEach(function (box) {
      var p = box.getAttribute('data-docs');
      box.addEventListener('click', function (e) {
        if (e.target.hasAttribute('data-docadd')) {
          var arr = get(obj, p) || [];
          arr.push({ title: { en: '', ar: '' }, url: '' });
          set(obj, p, arr); touch(file); renderView();
        }
        if (e.target.hasAttribute('data-docdel')) {
          var a = get(obj, p) || [];
          a.splice(Number(e.target.getAttribute('data-docdel')), 1);
          set(obj, p, a); touch(file); renderView();
        }
      });
      box.addEventListener('input', function (e) {
        var f = e.target.getAttribute('data-docfield');
        if (!f) return;
        var arr = get(obj, p) || [], i = Number(e.target.getAttribute('data-docidx'));
        if (f === 'title') arr[i].title = { en: e.target.value, ar: e.target.value };
        else arr[i][f] = e.target.value;
        touch(file);
      });
    });
  }

  /* ----------------------------------------------------------- views */
  function labelOf(item, sch) {
    var v = item[sch.titleField || 'title'];
    if (!v) return item.id || 'Untitled';
    return (typeof v === 'string') ? v : (v.en || v.ar || item.id);
  }

  function renderNav() {
    var html = window.COLLECTION_ORDER.map(function (k) {
      var sch = window.SCHEMA[k];
      var n = sch.single ? '' : '<span class="n">' + ((S.data[k] && S.data[k].items) || []).length + '</span>';
      var d = S.dirty[k] ? '<span class="dirty"></span>' : '';
      return '<button data-go="' + k + '" class="' + (S.view === k ? 'on' : '') + '">' + d + esc(sch.label.en) + n + '</button>';
    }).join('');
    html += '<button data-go="media" class="' + (S.view === 'media' ? 'on' : '') + '">Media library</button>';
    html += '<button data-go="atscv" class="' + (S.view === 'atscv' ? 'on' : '') + '">ATS CV & PDF</button>';
    html += '<button data-go="account" class="' + (S.view === 'account' ? 'on' : '') + '">Account & security</button>';
    $('sideNav').innerHTML = html;
    $('sideNav').querySelectorAll('[data-go]').forEach(function (b) {
      b.onclick = function () { S.view = b.getAttribute('data-go'); renderView(); };
    });
  }

  function renderMedia() {
    var v = $('view');
    $('viewTitle').textContent = 'Media library';
    if (!S.online) {
      v.innerHTML = '<div class="note bad">Media uploads require a GitHub connection. Sign in online to continue.</div>';
      return;
    }
    if (!S.mediaLoaded) {
      v.innerHTML = '<div class="card">Loading media…</div>';
      loadMedia().then(renderView).catch(function (e) {
        v.innerHTML = '<div class="note bad">' + esc(e.message) + '</div>';
      });
      return;
    }
    var h = '<div class="card"><h3 style="margin-top:0">Upload images and documents</h3>' +
      '<p class="help">PNG, JPG, WebP, GIF or PDF up to 8 MB. Uploaded files are saved in <code>assets/uploads/</code>.</p>' +
      '<button class="b p" id="uploadMedia">Choose file</button></div><div class="media-grid">';
    if (!S.media.length) h += '<div class="empty">No media files yet.</div>';
    S.media.forEach(function (f, i) {
      var image = /\.(png|jpe?g|webp|gif)$/i.test(f.name);
      h += '<div class="media-card"><div class="media-thumb">' +
        (image ? '<img src="../' + esc(f.path) + '?v=' + esc(f.sha) + '" alt="">' : '<b>PDF</b>') +
        '</div><div class="media-meta"><b title="' + esc(f.name) + '">' + esc(f.name) + '</b>' +
        '<small>' + Math.max(1, Math.round((f.size || 0) / 1024)) + ' KB</small><div class="media-acts">' +
        '<button class="b sm" data-copy-media="' + i + '">Copy path</button>' +
        '<a class="b sm" href="../' + esc(f.path) + '" target="_blank" rel="noopener">Open</a>' +
        (f.path.indexOf('assets/uploads/') === 0 ? '<button class="b sm warn" data-delete-media="' + i + '">Delete</button>' : '') +
        '</div></div></div>';
    });
    v.innerHTML = h + '</div>';
    $('uploadMedia').onclick = function () { $('mediaFile').click(); };
    v.querySelectorAll('[data-copy-media]').forEach(function (b) {
      b.onclick = function () {
        var item = S.media[Number(b.getAttribute('data-copy-media'))];
        navigator.clipboard.writeText(item.path).then(function () { toast('Path copied: ' + item.path); })
          .catch(function () { toast('Copy failed. Select the path manually.', true); });
      };
    });
    v.querySelectorAll('[data-delete-media]').forEach(function (b) {
      b.onclick = function () { deleteMedia(S.media[Number(b.getAttribute('data-delete-media'))]); };
    });
  }

  function renderAccount() {
    var v = $('view'), email = AUTH.ownerEmail || 'Ahmadfalshehry@gmail.com';
    $('viewTitle').textContent = 'Account & security';
    var configured = authEnabled();
    var username = S.user && S.user.user_metadata ? (S.user.user_metadata.username || '') : 'ahmad.alshehri';
    var h = '<div class="account-grid"><div class="card"><h3 style="margin-top:0">Account status</h3>' +
      '<div class="status-line"><span class="status-dot' + (configured ? '' : ' wait') + '"></span><b>' +
      (configured ? 'Email authentication active' : 'Supabase connection pending') + '</b></div>' +
      '<p class="help">Approved email: <span class="ltr">' + esc(email) + '</span></p>' +
      '<p class="help">Repository: ' + esc(REPO.owner + '/' + REPO.repo) + ' — ' + (S.online ? 'connected' : 'offline') + '</p></div>' +
      '<div class="card"><h3 style="margin-top:0">Owner profile</h3>' +
      '<div class="field"><label for="accountUsername">Username</label><input class="in" id="accountUsername" value="' + esc(username) + '"' + (configured ? '' : ' disabled') + '></div>' +
      '<button class="b p" id="saveUsername"' + (configured ? '' : ' disabled') + '>Save username</button></div>' +
      '<div class="card"><h3 style="margin-top:0">Password</h3>' +
      '<div class="field"><label for="newPassword">New password</label><input class="in" id="newPassword" type="password" autocomplete="new-password" placeholder="At least 8 characters"' + (configured ? '' : ' disabled') + '></div>' +
      '<button class="b" id="changePassword"' + (configured ? '' : ' disabled') + '>Change password</button> ' +
      '<button class="b" id="sendReset"' + (configured ? '' : ' disabled') + '>Send reset email</button></div>' +
      '<div class="card"><h3 style="margin-top:0">Repository access</h3>' +
      '<p class="help">The GitHub token remains only in this browser and can be revoked at any time.</p>' +
      '<button class="b warn" id="forgetToken">Forget this device token</button></div></div>';
    if (!configured) h = '<div class="note">Secure email login is prepared but not activated. The existing GitHub-token login remains active so the admin page continues to work.</div>' + h;
    v.innerHTML = h;
    $('forgetToken').onclick = function () { store('aa_token', null); S.token = ''; toast('Saved token removed from this browser.'); };
    if (!configured || !S.auth || !S.user) return;
    $('saveUsername').onclick = function () {
      var name = $('accountUsername').value.trim();
      if (!name) { toast('Enter a username.', true); return; }
      S.auth.auth.updateUser({ data: { username: name } }).then(function (r) {
        if (r.error) throw r.error;
        S.user = r.data.user; toast('Username updated.');
      }).catch(function (e) { toast(e.message, true); });
    };
    $('changePassword').onclick = function () {
      var password = $('newPassword').value;
      if (password.length < 8) { toast('Use at least 8 characters.', true); return; }
      S.auth.auth.updateUser({ password: password }).then(function (r) {
        if (r.error) throw r.error;
        $('newPassword').value = ''; toast('Password updated.');
      }).catch(function (e) { toast(e.message, true); });
    };
    $('sendReset').onclick = function () {
      S.auth.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() + '?reset=1' }).then(function (r) {
        if (r.error) throw r.error;
        toast('Reset email sent.');
      }).catch(function (e) { toast(e.message, true); });
    };
  }

  function renderAtsCv() {
    var v = $('view');
    $('viewTitle').textContent = 'ATS CV & PDF';
    v.innerHTML = '<div class="note good"><b>Automatically synced.</b> The CV is generated from the same profile, experience, skills, education and certifications used by the website. Publish an edit once and both the website and CV update together.</div>' +
      '<div class="card"><h2 style="margin-top:0">Export the latest ATS resume</h2>' +
      '<p style="color:var(--ink-soft)">Choose a version, review it, then select <b>Export ATS PDF</b>. The PDF keeps selectable text, a simple one-column reading order and the same navy, gold and warm-white visual identity as the website.</p>' +
      '<div class="auth-actions" style="margin-top:18px">' +
      '<a class="b p" href="../cv.html?lang=en" target="_blank" rel="noopener">English PDF</a>' +
      '<a class="b" href="../cv.html?lang=ar" target="_blank" rel="noopener">Arabic PDF</a>' +
      '<a class="b" href="../cv.html?lang=both" target="_blank" rel="noopener">Bilingual PDF</a></div></div>' +
      '<div class="card" style="margin-top:16px"><h2 style="margin-top:0">Single source of truth</h2>' +
      '<ol class="steps"><li>Edit any section in this admin page.</li><li>Press <b>Publish</b>.</li><li>Open the ATS CV here; it always loads the latest published data.</li><li>Export as PDF. No separate CV file needs to be uploaded or maintained.</li></ol></div>';
  }

  function renderView() {
    var key = S.view, sch = window.SCHEMA[key], v = $('view');
    if (key === 'atscv') { renderNav(); renderAtsCv(); return; }
    renderNav();
    if (key === 'media') { renderMedia(); return; }
    if (key === 'account') { renderAccount(); return; }
    $('viewTitle').textContent = sch.label.en;

    if (sch.single) {
      var obj = S.data[key];
      var h = '<div class="card">';
      sch.fields.forEach(function (f) { h += fieldHTML(f, get(obj, f.k), f.k); });
      h += '</div>';
      if (sch.repeat) {
        h += '<h3 style="font-family:var(--display);margin:26px 0 12px">' + esc(sch.repeat.label.en) + '</h3>';
        (get(obj, sch.repeat.k) || []).forEach(function (row, i) {
          h += '<div class="sub"><div class="sub-head"><b>#' + (i + 1) + '</b>' +
            '<button class="b sm warn" data-subdel="' + i + '" type="button">Remove</button></div>';
          sch.repeat.fields.forEach(function (f) {
            h += fieldHTML(f, row[f.k], sch.repeat.k + '.' + i + '.' + f.k);
          });
          h += '</div>';
        });
        h += '<button class="b" data-subadd="1" type="button">+ Add</button>';
      }
      v.innerHTML = h;
      bindInputs(v, obj, key);
      v.querySelectorAll('[data-subdel]').forEach(function (b) {
        b.onclick = function () {
          get(obj, sch.repeat.k).splice(Number(b.getAttribute('data-subdel')), 1);
          touch(key); renderView();
        };
      });
      var add = v.querySelector('[data-subadd]');
      if (add) add.onclick = function () {
        var arr = get(obj, sch.repeat.k) || [];
        var blank = {}; sch.repeat.fields.forEach(function (f) { blank[f.k] = { en: '', ar: '' }; });
        arr.push(blank); set(obj, sch.repeat.k, arr); touch(key); renderView();
      };
      return;
    }

    /* -------- collection list / editor -------- */
    var items = S.data[key].items;
    if (S.editing != null) return renderEditor(key, sch, items, S.editing);

    var h2 = '<p class="note">Drag the ⠿ handle to reorder. Order here is the order on the site.</p>' +
      '<button class="b p" id="addItem" style="margin-bottom:14px">+ Add ' + esc(sch.label.en.replace(/s$/, '')) + '</button>' +
      '<div id="list">';
    if (!items.length) h2 += '<div class="empty">Nothing here yet.</div>';
    items.forEach(function (it, i) {
      h2 += '<div class="row' + (it.visible === false ? ' hidden-row' : '') + '" draggable="true" data-i="' + i + '">' +
        '<span class="grip" aria-hidden="true">⠿</span>' +
        '<span class="txt"><b>' + esc(labelOf(it, sch)) + '</b><span>' +
        esc([it.company, it.year || (it.period && it.period.en), it.hours ? it.hours + ' hrs' : ''].filter(Boolean).join(' · ')) +
        '</span></span>' +
        '<span class="pill' + (it.visible === false ? ' off' : '') + '">' + (it.visible === false ? 'Hidden' : 'Live') + '</span>' +
        '<span class="acts">' +
        '<button class="b sm" data-edit="' + i + '">Edit</button>' +
        '<button class="b sm" data-vis="' + i + '">' + (it.visible === false ? 'Show' : 'Hide') + '</button>' +
        '<button class="b sm" data-dup="' + i + '">Duplicate</button>' +
        '<button class="b sm warn" data-del="' + i + '">Delete</button>' +
        '</span></div>';
    });
    v.innerHTML = h2 + '</div>';

    $('addItem').onclick = function () {
      var blank = { id: uid(key.slice(0, 3)), order: items.length, visible: true };
      sch.fields.forEach(function (f) {
        blank[f.k] = (f.t === 'bitext' || f.t === 'biarea') ? { en: '', ar: '' }
          : (f.t === 'bilist') ? { en: [], ar: [] }
          : (f.t === 'tags' || f.t === 'ref' || f.t === 'docs') ? []
          : (f.t === 'bool') ? false : '';
      });
      items.push(blank); touch(key); S.editing = items.length - 1; renderView();
    };
    v.querySelectorAll('[data-edit]').forEach(function (b) {
      b.onclick = function () { S.editing = Number(b.getAttribute('data-edit')); renderView(); };
    });
    v.querySelectorAll('[data-vis]').forEach(function (b) {
      b.onclick = function () {
        var i = Number(b.getAttribute('data-vis'));
        items[i].visible = items[i].visible === false;
        touch(key); renderView();
      };
    });
    v.querySelectorAll('[data-dup]').forEach(function (b) {
      b.onclick = function () {
        var i = Number(b.getAttribute('data-dup'));
        var copy = JSON.parse(JSON.stringify(items[i]));
        copy.id = uid(key.slice(0, 3));
        items.splice(i + 1, 0, copy); reorder(items); touch(key); renderView();
      };
    });
    v.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        var i = Number(b.getAttribute('data-del'));
        if (!confirm('Delete "' + labelOf(items[i], sch) + '"? This cannot be undone until you reload without publishing.')) return;
        items.splice(i, 1); reorder(items); touch(key); renderView();
      };
    });

    /* drag to reorder */
    var dragI = null;
    v.querySelectorAll('.row').forEach(function (row) {
      row.addEventListener('dragstart', function () { dragI = Number(row.getAttribute('data-i')); row.classList.add('dragging'); });
      row.addEventListener('dragend', function () { row.classList.remove('dragging'); });
      row.addEventListener('dragover', function (e) { e.preventDefault(); row.classList.add('over'); });
      row.addEventListener('dragleave', function () { row.classList.remove('over'); });
      row.addEventListener('drop', function (e) {
        e.preventDefault(); row.classList.remove('over');
        var to = Number(row.getAttribute('data-i'));
        if (dragI == null || dragI === to) return;
        items.splice(to, 0, items.splice(dragI, 1)[0]);
        reorder(items); touch(key); renderView();
      });
    });
  }

  function reorder(items) { items.forEach(function (x, i) { x.order = i; }); }

  function renderEditor(key, sch, items, i) {
    var item = items[i], v = $('view');
    var h = '<button class="b" id="back" style="margin-bottom:14px">← Back to list</button>' +
      '<div class="card">' +
      '<div class="field"><label class="chk"><input type="checkbox" id="visTog"' +
      (item.visible !== false ? ' checked' : '') + '> Visible on the website</label></div>';
    sch.fields.forEach(function (f) { h += fieldHTML(f, item[f.k], f.k); });
    h += '<p class="help">Item ID: <code>' + esc(item.id) + '</code></p></div>';
    v.innerHTML = h;
    bindInputs(v, item, key);
    $('back').onclick = function () { S.editing = null; renderView(); };
    $('visTog').onchange = function () { item.visible = this.checked; touch(key); };
  }

  /* --------------------------------------------------------- preview */
  function preview() {
    try {
      sessionStorage.setItem('aa_preview', JSON.stringify(S.data));
      window.open('../index.html?preview=1', '_blank');
    } catch (e) { toast('Preview needs session storage', true); }
  }

  /* ---------------------------------------------------- backup / restore */
  function exportAll() {
    var bundle = { exportedAt: new Date().toISOString(), version: 1, data: S.data };
    var blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'career-hub-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast('Backup downloaded');
  }

  function importAll(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var b = JSON.parse(r.result);
        var d = b.data || b;
        var found = FILES.filter(function (f) { return d[f]; });
        if (!found.length) throw new Error('No recognisable data in that file');
        if (!confirm('Replace ' + found.length + ' collections with the backup? Nothing publishes until you press Publish.')) return;
        found.forEach(function (f) { S.data[f] = d[f]; S.dirty[f] = true; });
        S.editing = null; markDirty(); renderView();
        toast('Imported ' + found.length + ' collections — review, then Publish');
      } catch (e) { toast('Import failed — ' + e.message, true); }
    };
    r.readAsText(file);
  }

  /* ------------------------------------------------------------- boot */
  function start() {
    $('gate').style.display = 'none';
    $('shell').classList.add('on');
    $('repoLabel').textContent = S.online ? REPO.owner + '/' + REPO.repo : 'offline mode';
    $('btnPublish').disabled = !S.online;
    S.editing = null;
    renderView(); markDirty();
  }

  function signIn() {
    if (authEnabled() && !isOwner(S.user)) {
      gateMsg('Verify the approved owner email before connecting the repository.', true);
      return;
    }
    var tok = $('tok').value.trim();
    if (!tok) { gateMsg('Paste your token first.', true); return; }
    S.token = tok;
    S.remember = $('remember').checked;
    gateMsg('Checking access…');
    api('').then(function (r) {
      if (!r.permissions || !r.permissions.push) throw new Error('That token cannot write to this repository.');
      REPO.branch = r.default_branch || 'main';
      return loadFromGitHub();
    }).then(function () {
      store('aa_token', tok);
      S.online = true; start();
    }).catch(function (e) {
      S.token = '';
      gateMsg(e.message, true);
    });
  }

  function gateMsg(msg, bad) {
    $('gateMsg').innerHTML = '<div class="note' + (bad ? ' bad' : '') + '">' + esc(msg) + '</div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('repoName').textContent = REPO.owner ? REPO.owner + '/' + REPO.repo : 'your repository';
    $('signin').onclick = signIn;
    $('tok').addEventListener('keydown', function (e) { if (e.key === 'Enter') signIn(); });
    $('offline').onclick = function () {
      loadLocal().then(function () { S.online = false; start(); })
        .catch(function (e) { gateMsg(e.message, true); });
    };
    $('btnPublish').onclick = publish;
    $('btnPreview').onclick = preview;
    $('btnAccount').onclick = function () { S.view = 'account'; renderView(); };
    $('btnExport').onclick = exportAll;
    $('btnImport').onclick = function () { $('importFile').click(); };
    $('importFile').onchange = function () { if (this.files[0]) importAll(this.files[0]); this.value = ''; };
    $('mediaFile').onchange = function () { if (this.files[0]) uploadMedia(this.files[0]); this.value = ''; };
    $('btnSignout').onclick = function () {
      if (Object.keys(S.dirty).length && !confirm('You have unpublished changes. Sign out anyway?')) return;
      store('aa_token', null);
      if (S.auth) S.auth.auth.signOut().then(function () { location.reload(); });
      else location.reload();
    };
    window.addEventListener('beforeunload', function (e) {
      if (Object.keys(S.dirty).length) { e.preventDefault(); e.returnValue = ''; }
    });

    if (authEnabled()) {
      initAuth();
    } else {
      $('authGate').classList.remove('on');
      $('tokenGate').style.display = '';
      var saved = store('aa_token');
      if (saved) { $('tok').value = saved; S.remember = true; signIn(); }
    }
  });
})();
