(function () {
  var SK = 'studash';

  /* ---- data ---- */
  var defaultLayout = ['pomodoro','kanban','habits','exams','notes','grid','quote'];
  var layout = [];
  var tasks = [];
  var habits = [];
  var notes = '';
  var pomRunning = false, pomMinutes = 25, pomSeconds = 0, pomPhase = 'focus';
  var pomInterval = null;
  var quotes = [
    { t: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
    { t: 'Education is the most powerful weapon to change the world.', a: 'Nelson Mandela' },
    { t: 'The future belongs to those who believe in the beauty of their dreams.', a: 'Eleanor Roosevelt' },
    { t: 'It does not matter how slowly you go as long as you do not stop.', a: 'Confucius' },
    { t: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', a: 'Winston Churchill' },
    { t: 'The only way to do great work is to love what you do.', a: 'Steve Jobs' },
    { t: 'Believe you can and you\'re halfway there.', a: 'Theodore Roosevelt' },
  ];
  var seedTasks = [
    { id: 1, text: 'Review DBMS Normalization Rules', done: false },
    { id: 2, text: 'Refine Figma High-Fidelity App UI', done: true },
    { id: 3, text: 'C++ OOP Inheritance Practical', done: false },
    { id: 4, text: 'Complete Calculus Assignment Set', done: false },
  ];
  var seedExams = [
    { name: 'Database Management Systems', days: 14 },
    { name: 'Object-Oriented Programming', days: 28 },
    { name: 'Discrete Mathematics', days: 45 },
    { name: 'Software Engineering', days: 60 },
  ];
  var habitLabels = 'Mon Tue Wed Thu Fri Sat Sun'.split(' ');

  /* ---- DOM ---- */
  var workspace = document.getElementById('workspace');
  var liveClock = document.getElementById('liveClock');
  var prodPct = document.getElementById('prodPct');
  var welcomeMsg = document.getElementById('welcomeMsg');
  var resetLayoutBtn = document.getElementById('resetLayoutBtn');
  var purgeBtn = document.getElementById('purgeBtn');

  /* ---- load/store ---- */
  function loadState() {
    try {
      var r = localStorage.getItem(SK);
      if (r) {
        var d = JSON.parse(r);
        if (d && typeof d === 'object') {
          layout = d.layout && d.layout.length ? d.layout : defaultLayout.slice();
          tasks = d.tasks || [];
          habits = d.habits || [];
          notes = d.notes || '';
          return;
        }
      }
    } catch (e) {}
    layout = defaultLayout.slice();
    tasks = JSON.parse(JSON.stringify(seedTasks));
    habits = [];
    notes = '';
  }
  function saveState() {
    try { localStorage.setItem(SK, JSON.stringify({ layout: layout, tasks: tasks, habits: habits, notes: notes })); } catch (e) {}
  }

  /* ---- render ---- */
  function renderWorkspace() {
    workspace.innerHTML = '';
    layout.forEach(function (id) {
      var tmpl = document.getElementById('tmpl' + id.charAt(0).toUpperCase() + id.slice(1));
      if (!tmpl) return;
      var clone = tmpl.content.cloneNode(true);
      var widget = clone.querySelector('.widget');
      widget.draggable = true;
      widget.dataset.widgetId = id;
      bindDrag(widget);
      workspace.appendChild(clone);
    });
    hydrateWidgets();
  }

  function hydrateWidgets() {
    /* pomodoro */
    var pom = workspace.querySelector('[data-widget-id="pomodoro"]');
    if (pom) updatePomDisplay();
    /* kanban */
    renderTasks();
    /* habits */
    renderHabits();
    /* exams */
    renderExams();
    /* notes */
    var na = document.getElementById('notesArea');
    if (na) { na.value = notes; bindNotes(na); }
    /* grid */
    renderGrid();
    /* quote */
    renderQuote();
    /* pomo buttons */
    var ps = document.getElementById('pomStart');
    var pr = document.getElementById('pomReset');
    if (ps) { ps.textContent = pomRunning ? 'Pause' : 'Start'; if (pomRunning) ps.classList.add('running'); }
    if (pr) pr.onclick = resetPom;
    /* task add */
    var ta = document.getElementById('taskAdd');
    if (ta) ta.onclick = addTask;
    setTimeout(updateProd, 100);
  }

  /* ---- DnD ---- */
  function bindDrag(el) {
    el.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', el.dataset.widgetId);
      el.classList.add('dragging');
    });
    el.addEventListener('dragend', function () { el.classList.remove('dragging'); document.querySelectorAll('.widget').forEach(function (w) { w.classList.remove('drag-over','dragover-eject'); }); });
    el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('drag-over'); });
    el.addEventListener('dragleave', function () { el.classList.remove('drag-over'); });
    el.addEventListener('drop', function (e) {
      e.preventDefault();
      el.classList.remove('drag-over');
      var fromId = e.dataTransfer.getData('text/plain');
      var toId = el.dataset.widgetId;
      if (fromId === toId) return;
      var fi = layout.indexOf(fromId);
      var ti = layout.indexOf(toId);
      if (fi === -1 || ti === -1) return;
      layout[fi] = toId; layout[ti] = fromId;
      saveState();
      renderWorkspace();
    });
  }

  /* ---- Pomodoro ---- */
  function updatePomDisplay() {
    var el = document.getElementById('pomTime');
    var ring = document.getElementById('pomRing');
    if (!el || !ring) return;
    var total = pomPhase === 'focus' ? 1500 : 300;
    var rem = pomMinutes * 60 + pomSeconds;
    var pct = rem / total;
    var circ = 2 * Math.PI * 52;
    el.textContent = pad(pomMinutes) + ':' + pad(pomSeconds);
    el.style.color = pomPhase === 'break' ? '#10b981' : '#00f0ff';
    ring.setAttribute('stroke-dasharray', (pct * circ) + ' ' + circ);
    ring.setAttribute('stroke', pomPhase === 'break' ? '#10b981' : '#00f0ff');
    var lbl = pom.querySelector('.pom-lbl');
    if (lbl) lbl.textContent = pomPhase === 'focus' ? 'Focus' : 'Break';
  }

  function togglePom() {
    var btn = document.getElementById('pomStart');
    if (!btn) return;
    if (pomRunning) {
      clearInterval(pomInterval); pomInterval = null; pomRunning = false;
      btn.textContent = 'Resume'; btn.classList.remove('running');
    } else {
      if (pomMinutes === 0 && pomSeconds === 0) resetPomVars();
      pomRunning = true; btn.textContent = 'Pause'; btn.classList.add('running');
      pomInterval = setInterval(function () {
        if (pomSeconds === 0) {
          if (pomMinutes === 0) {
            clearInterval(pomInterval); pomInterval = null; pomRunning = false;
            var btn2 = document.getElementById('pomStart');
            if (btn2) { btn2.textContent = 'Start'; btn2.classList.remove('running'); }
            if (pomPhase === 'focus') { pomPhase = 'break'; pomMinutes = 5; pomSeconds = 0; }
            else { pomPhase = 'focus'; pomMinutes = 25; pomSeconds = 0; }
            updatePomDisplay();
            return;
          }
          pomMinutes--; pomSeconds = 59;
        } else pomSeconds--;
        updatePomDisplay();
      }, 1000);
    }
  }

  function resetPom() {
    clearInterval(pomInterval); pomInterval = null; pomRunning = false;
    resetPomVars();
    var btn = document.getElementById('pomStart');
    if (btn) { btn.textContent = 'Start'; btn.classList.remove('running'); }
    updatePomDisplay();
  }

  function resetPomVars() { pomPhase = 'focus'; pomMinutes = 25; pomSeconds = 0; }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /* ---- Kanban ---- */
  function renderTasks() {
    var list = document.getElementById('taskList');
    var cnt = document.getElementById('taskCount');
    if (!list) return;
    list.innerHTML = '';
    var done = 0;
    tasks.forEach(function (t) {
      if (t.done) done++;
      var div = document.createElement('div');
      div.className = 'task-item' + (t.done ? ' done' : '');
      div.innerHTML = '<input type="checkbox"' + (t.done ? ' checked' : '') + ' data-id="' + t.id + '"><span class="task-text">' + esc(t.text) + '</span><button class="task-del" data-id="' + t.id + '">\u00D7</button>';
      div.querySelector('input[type=checkbox]').onchange = function () { toggleTask(t.id); };
      div.querySelector('.task-del').onclick = function () { delTask(t.id); };
      list.appendChild(div);
    });
    if (cnt) cnt.textContent = done + '/' + tasks.length;
  }

  function addTask() {
    var text = prompt('New task:');
    if (!text || !text.trim()) return;
    var maxId = 0; tasks.forEach(function (t) { if (t.id > maxId) maxId = t.id; });
    tasks.push({ id: maxId + 1, text: sanitize(text), done: false });
    saveState(); renderTasks(); updateProd();
  }

  function toggleTask(id) {
    for (var i = 0; i < tasks.length; i++) { if (tasks[i].id === id) { tasks[i].done = !tasks[i].done; break; } }
    saveState(); renderTasks(); updateProd();
  }

  function delTask(id) {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    saveState(); renderTasks(); updateProd();
  }

  /* ---- Habits ---- */
  function renderHabits() {
    var grid = document.getElementById('habitGrid');
    var cnt = document.getElementById('streakCount');
    if (!grid) return;
    grid.innerHTML = '';
    var streak = 0;
    for (var i = 0; i < 28; i++) {
      var done = habits.indexOf(i) !== -1;
      if (done) streak++;
      var dot = document.createElement('div');
      dot.className = 'habit-dot' + (done ? ' done' : '');
      dot.innerHTML = '<span class="h-day">' + habitLabels[i % 7] + '</span><div class="h-circle"></div>';
      dot.onclick = function (idx) { return function () { toggleHabit(idx); }; }(i);
      grid.appendChild(dot);
    }
    if (cnt) cnt.textContent = streak + ' days';
  }

  function toggleHabit(idx) {
    var pos = habits.indexOf(idx);
    if (pos === -1) habits.push(idx); else habits.splice(pos, 1);
    saveState(); renderHabits(); updateProd();
  }

  /* ---- Exams ---- */
  function renderExams() {
    var list = document.getElementById('examList');
    if (!list) return;
    list.innerHTML = '';
    seedExams.forEach(function (e) {
      var div = document.createElement('div');
      div.className = 'exam-item';
      div.innerHTML = '<span class="exam-name">' + esc(e.name) + '</span><span class="exam-days">' + e.days + ' days</span>';
      list.appendChild(div);
    });
  }

  /* ---- Notes ---- */
  function bindNotes(ta) {
    var saved = document.getElementById('notesSaved');
    var timer;
    ta.addEventListener('input', function () {
      if (saved) saved.textContent = 'Unsaved'; if (saved) saved.classList.add('dirty');
      clearTimeout(timer);
      timer = setTimeout(function () {
        notes = ta.value; saveState();
        if (saved) { saved.textContent = 'Saved'; saved.classList.remove('dirty'); }
      }, 400);
    });
  }

  /* ---- Grid ---- */
  function renderGrid() {
    var grid = document.getElementById('contribGrid');
    if (!grid) return;
    grid.innerHTML = '';
    for (var i = 0; i < 35; i++) {
      var cell = document.createElement('div');
      cell.className = 'gh-cell';
      var r = Math.random();
      if (r > 0.7) cell.classList.add('l' + (Math.floor(Math.random() * 4) + 1));
      grid.appendChild(cell);
    }
  }

  /* ---- Quote ---- */
  function renderQuote() {
    var qt = document.getElementById('quoteText');
    var qa = document.getElementById('quoteAuth');
    if (!qt || !qa) return;
    var q = quotes[Math.floor(Math.random() * quotes.length)];
    qt.textContent = '"' + q.t + '"';
    qa.textContent = '\u2014 ' + q.a;
  }

  /* ---- Productivity ---- */
  function updateProd() {
    if (!tasks.length) { prodPct.textContent = '0%'; return; }
    var done = 0; tasks.forEach(function (t) { if (t.done) done++; });
    var pct = Math.round((done / tasks.length) * 100);
    prodPct.textContent = pct + '%';
  }

  /* ---- Clock ---- */
  function updateClock() {
    var d = new Date();
    liveClock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    var h = d.getHours();
    if (h < 12) welcomeMsg.textContent = 'Good Morning';
    else if (h < 18) welcomeMsg.textContent = 'Good Afternoon';
    else welcomeMsg.textContent = 'Good Evening';
  }

  /* ---- Reset / Purge ---- */
  function resetLayout() {
    clearInterval(pomInterval); pomInterval = null; pomRunning = false;
    resetPomVars();
    layout = defaultLayout.slice();
    tasks = JSON.parse(JSON.stringify(seedTasks));
    habits = [];
    notes = '';
    saveState();
    renderWorkspace();
  }
  function purgeAll() {
    if (!confirm('Purge all local storage data?')) return;
    localStorage.removeItem(SK);
    location.reload();
  }

  /* ---- utils ---- */
  function esc(s) { var d = document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }
  function sanitize(s) { return s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<\/?[^>]+(>|$)/g, '').trim(); }

  /* ---- boot ---- */
  (function boot() {
    loadState();
    renderWorkspace();
    updateClock();
    setInterval(updateClock, 1000);
    (function tickPom() { if (pomRunning) { /* already handled */ } })();

    /* find buttons */
    var ps = document.getElementById('pomStart');
    if (ps) ps.onclick = togglePom;
    var pr = document.getElementById('pomReset');
    if (pr) pr.onclick = resetPom;
    var ta = document.getElementById('taskAdd');
    if (ta) ta.onclick = addTask;

    resetLayoutBtn.onclick = resetLayout;
    purgeBtn.onclick = purgeAll;
  })();
})();
