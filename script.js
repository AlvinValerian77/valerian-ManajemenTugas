const DB_TASK = 'alvin_vFinal_Tasks_Fix';
const DB_HIST = 'alvin_vFinal_History_Fix';
let tasks = JSON.parse(localStorage.getItem(DB_TASK)) || [];
let history = JSON.parse(localStorage.getItem(DB_HIST)) || [];
const alarm = document.getElementById('alarmSound');

function unlockAudio() {
    alarm.play().then(() => {
        alarm.pause();
        alarm.currentTime = 0;
        document.getElementById('audioUnlocker').classList.add('animate__fadeOut');
        setTimeout(() => document.getElementById('audioUnlocker').style.display = 'none', 500);
    });
}

function updateClock() {
    const now = new Date();
    const currentTimeMs = now.getTime();
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID', { hour12: false });
    document.getElementById('date').innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    
    tasks.forEach((t, i) => {
        const deadlineMs = new Date(t.date).getTime();
        const remindAtMs = deadlineMs - (t.remindHours * 3600000);
        // LOGIC: Jika sekarang sudah lewat waktu pengingat, langsung bunyi
        if (currentTimeMs >= remindAtMs && !t.alerted) {
            triggerAlarm(t.name, i);
        }
    });
}
setInterval(updateClock, 1000);

function triggerAlarm(taskName, index) {
    tasks[index].alerted = true;
    saveData();
    alarm.currentTime = 0;
    alarm.play().catch(() => alert("🔔 DEADLINE: " + taskName));
    setTimeout(() => { alarm.pause(); alarm.currentTime = 0; }, 5000);
}

function addTask() {
    const name = document.getElementById('taskInput').value;
    const subj = document.getElementById('subjectInput').value;
    const date = document.getElementById('dateInput_only').value;
    const time = document.getElementById('timeInput_only').value;
    const remind = document.querySelector('input[name="reminder"]:checked').value;

    if (name && subj && date && time) {
        tasks.push({ name, subject: subj, date: `${date}T${time}`, remindHours: parseInt(remind), alerted: false });
        document.getElementById('taskInput').value = '';
        document.getElementById('subjectInput').value = '';
        render();
        switchPage('active-page');
    } else { alert("Vin, isi semua datanya dulu!"); }
}

function render() {
    const taskList = document.getElementById('taskList');
    const historyList = document.getElementById('historyList');
    taskList.innerHTML = ''; historyList.innerHTML = '';
    document.getElementById('taskCount').innerText = tasks.length;
    
    // Render Tugas Aktif
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((t, i) => {
        const d = new Date(t.date);
        taskList.innerHTML += `
            <div class="task-card animate__animated animate__fadeInUp">
                <div class="flex-1 min-w-0 pr-4">
                    <span class="text-[9px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest"><i class="fas fa-graduation-cap mr-1"></i>${t.subject}</span>
                    <h3 class="font-bold text-slate-800 text-base truncate uppercase mt-2">${t.name}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-2"><i class="far fa-clock mr-1"></i>${d.toLocaleDateString('id-ID')} | ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}</p>
                </div>
                <button onclick="markAsDone(${i})" class="check-btn"><i class="fas fa-check"></i></button>
            </div>`;
    });

    // Render Riwayat dengan Nama MK (Mata Kuliah)
    history.forEach(h => {
        historyList.innerHTML += `
            <div class="bg-white/70 p-5 rounded-2xl flex justify-between items-center border border-dashed border-slate-200 opacity-80">
                <div class="min-w-0">
                    <p class="text-[9px] font-black text-blue-500 uppercase tracking-tighter">${h.subject}</p>
                    <p class="text-sm font-bold text-slate-700 uppercase truncate">${h.name}</p>
                    <p class="text-[8px] font-bold text-green-600 uppercase mt-1"><i class="fas fa-check-circle mr-1"></i>Selesai pada ${h.doneTime}</p>
                </div>
                <div class="text-green-500 bg-green-50 p-3 rounded-full"><i class="fas fa-award text-lg"></i></div>
            </div>`;
    });
    saveData();
}

function markAsDone(index) {
    const doneTask = tasks.splice(index, 1)[0];
    doneTask.doneTime = new Date().toLocaleTimeString('id-ID', { hour12: false });
    history.unshift(doneTask);
    render();
}

function saveData() {
    localStorage.setItem(DB_TASK, JSON.stringify(tasks));
    localStorage.setItem(DB_HIST, JSON.stringify(history));
}

function switchPage(pageId) {
    ['input-page', 'active-page', 'history-page'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('tab-active'));
    document.getElementById('btn-' + pageId.split('-')[0]).classList.add('tab-active');
}

function clearHistory() { if(confirm("Vin, yakin mau hapus riwayat tugas?")) { history = []; render(); } }

updateClock();
render();