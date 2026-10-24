const defaultProjects = [
  { id: 'work', name: 'Work', color: '#6f9edb' },
  { id: 'personal', name: 'Personal', color: '#d7868d' },
  { id: 'learning', name: 'Learning', color: '#d2ae59' }
];
const day = new Date();
const iso = (date) => date.toISOString().slice(0, 10);
const dateOffset = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return iso(d); };
const seedTasks = [
  { id: crypto.randomUUID(), title: 'Prepare presentation for Monday', due: dateOffset(0), project: 'work', priority: 'high', done: false },
  { id: crypto.randomUUID(), title: 'Reply to client feedback', due: dateOffset(0), project: 'work', priority: 'medium', done: false },
  { id: crypto.randomUUID(), title: 'Morning run', due: dateOffset(0), project: 'personal', priority: 'low', done: true },
  { id: crypto.randomUUID(), title: 'Read two chapters of Atomic Habits', due: dateOffset(1), project: 'learning', priority: 'medium', done: false },
  { id: crypto.randomUUID(), title: 'Book dentist appointment', due: dateOffset(3), project: 'personal', priority: 'low', done: false }
];
let projects = JSON.parse(localStorage.getItem('taskflow-projects')) || defaultProjects;
let tasks = JSON.parse(localStorage.getItem('taskflow-tasks')) || seedTasks;
let filter = 'all', priorityFilter = 'all', selectedProject = null, editingId = null;
const $ = (selector) => document.querySelector(selector);
const save = () => { localStorage.setItem('taskflow-tasks', JSON.stringify(tasks)); localStorage.setItem('taskflow-projects', JSON.stringify(projects)); };

function displayDate(dateString) { if (!dateString) return 'No due date'; const date = new Date(`${dateString}T12:00:00`); const today = iso(new Date()); const tomorrow = dateOffset(1); if (dateString === today) return 'Today'; if (dateString === tomorrow) return 'Tomorrow'; return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
function renderProjects() { const box = $('#projects'); box.innerHTML = ''; projects.forEach(project => { const total = tasks.filter(t => t.project === project.id && !t.done).length; const item = document.createElement('button'); item.className = `project ${selectedProject === project.id ? 'selected' : ''}`; item.innerHTML = `<i class="dot" style="background:${project.color}"></i>${project.name}<b>${total || ''}</b>`; item.onclick = () => { selectedProject = project.id; filter = 'project'; document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); render(); renderProjects(); }; box.append(item); }); $('#taskProject').innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join(''); }
function matchesTask(task) { if (filter === 'today' && task.due !== iso(new Date())) return false; if (filter === 'upcoming' && (!task.due || task.due <= iso(new Date()) || task.done)) return false; if (filter === 'completed' && !task.done) return false; if (filter === 'project' && task.project !== selectedProject) return false; if (filter !== 'completed' && filter !== 'all' && filter !== 'today' && filter !== 'upcoming' && filter !== 'project') return false; return priorityFilter === 'all' || task.priority === priorityFilter; }
function render() { const visible = tasks.filter(matchesTask).sort((a,b) => Number(a.done) - Number(b.done) || (a.due || '9999').localeCompare(b.due || '9999')); const list = $('#taskList'); list.innerHTML = ''; visible.forEach(task => { const node = $('#taskTemplate').content.cloneNode(true); const project = projects.find(p => p.id === task.project); const taskEl = node.querySelector('.task'); taskEl.classList.toggle('done', task.done); const due = node.querySelector('.due'); due.textContent = displayDate(task.due); if (task.due && task.due < iso(new Date()) && !task.done) due.classList.add('overdue'); node.querySelector('h3').textContent = task.title; node.querySelector('.project-tag').textContent = project?.name || 'General'; node.querySelector('.priority').classList.add(task.priority); node.querySelector('.check').onclick = () => { task.done = !task.done; save(); render(); }; node.querySelector('.task-menu').onclick = () => openModal(task); list.append(node); }); $('#emptyState').hidden = visible.length > 0; updateDashboard(); }
function updateDashboard() { const today = iso(new Date()); const active = tasks.filter(t => !t.done); const completed = tasks.filter(t => t.done); const dueToday = active.filter(t => t.due === today).length; const inProgress = active.filter(t => t.due && t.due >= today).length; const focusTotal = tasks.filter(t => t.due === today).length; const focusDone = tasks.filter(t => t.due === today && t.done).length; $('#allCount').textContent = active.length; $('#todayCount').textContent = dueToday; $('#dueCount').textContent = dueToday; $('#progressCount').textContent = inProgress; $('#completedCount').textContent = completed.length; $('#focusText').textContent = `${focusDone} of ${focusTotal} done`; const percent = focusTotal ? Math.round((focusDone / focusTotal) * 100) : 0; $('#focusPercent').textContent = `${percent}%`; $('.ring').style.setProperty('--progress', `${percent}%`); }
function openModal(task) { editingId = task?.id || null; $('#modalTitle').textContent = task ? 'Edit task' : 'Add a task'; $('#taskName').value = task?.title || ''; $('#taskDate').value = task?.due || ''; $('#taskPriority').value = task?.priority || 'medium'; $('#taskProject').value = task?.project || projects[0]?.id || ''; $('#modalBackdrop').hidden = false; setTimeout(() => $('#taskName').focus(), 10); }
function closeModal() { $('#modalBackdrop').hidden = true; editingId = null; }
function titleForView() { if (filter === 'project') return projects.find(p => p.id === selectedProject)?.name || 'Tasks'; return ({all:'All tasks',today:'Today',upcoming:'Upcoming',completed:'Completed'})[filter] || 'All tasks'; }
document.querySelectorAll('[id^="openTaskModal"], #emptyAdd').forEach(btn => btn.onclick = () => openModal());
$('#closeModal').onclick = $('#cancelTask').onclick = closeModal;
$('#modalBackdrop').onclick = (e) => { if (e.target === $('#modalBackdrop')) closeModal(); };
$('#taskForm').onsubmit = (e) => { e.preventDefault(); const data = { title: $('#taskName').value.trim(), due: $('#taskDate').value, priority: $('#taskPriority').value, project: $('#taskProject').value }; if (!data.title) return; if (editingId) Object.assign(tasks.find(t => t.id === editingId), data); else tasks.unshift({ id: crypto.randomUUID(), ...data, done: false }); save(); closeModal(); render(); renderProjects(); };
document.querySelectorAll('.nav-item').forEach(button => button.onclick = () => { filter = button.dataset.filter; selectedProject = null; document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n === button)); $('#viewTitle').textContent = titleForView(); render(); renderProjects(); });
document.querySelectorAll('.tab').forEach(button => button.onclick = () => { priorityFilter = button.dataset.priority; document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === button)); render(); });
$('#addProject').onclick = () => { const name = prompt('Project name'); if (!name?.trim()) return; projects.push({id: crypto.randomUUID(), name: name.trim(), color: ['#6f9edb','#d7868d','#d2ae59','#78b8a2'][projects.length % 4]}); save(); renderProjects(); };
$('#themeToggle').onclick = () => { document.body.classList.toggle('dark'); localStorage.setItem('taskflow-dark', document.body.classList.contains('dark')); };
$('#menuButton').onclick = () => $('#sidebar').classList.toggle('open');
$('#sortButton').onclick = () => { tasks.reverse(); save(); render(); };
$('#dateText').textContent = day.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' });
if (localStorage.getItem('taskflow-dark') === 'true') document.body.classList.add('dark');
renderProjects(); render();
