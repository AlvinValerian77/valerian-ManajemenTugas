// Database Bridge (Mengambil fungsi dari window yang diset di index.html)
let tasks = [];
let history = [];
const alarm = document.getElementById('alarmSound');

// 1. FUNGSI SINKRONISASI REAL-TIME
// Fungsi ini dipanggil otomatis oleh kode di index.html saat Firebase siap
window.startSync = function() {
    // Listen data tugas aktif (diurutkan berdasarkan deadline terdekat)
    const qTasks = window.fs.query(window.fs.collection(window.db, "tasks"), window.fs.orderBy("date", "asc"));
    window.fs.onSnapshot(qTasks, (snapshot) => {
        tasks = [];
        snapshot.forEach((doc) => tasks.push({ id: doc.id, ...doc.data() }));
        render();
    });

    // Listen data riwayat selesai (diurutkan berdasarkan yang terbaru selesai)
    const qHist = window.fs.query(window.fs.collection(window.db, "history"), window.fs.orderBy("doneAt", "desc"));
    window.fs.onSnapshot(qHist, (snapshot) => {
        history = [];
        snapshot.forEach((doc) => history.push({ id: doc.id, ...doc.data() }));
        render();
    });
};

// 2. LOGIKA JAM & PENGECEKAN ALARM
function updateClock() {
    const now = new Date();
    const currentTimeMs = now.getTime();
    
    // Update Tampilan Jam di Navbar
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (clockEl) clockEl.innerText = now.toLocaleTimeString('id-ID', { hour12: false });
    if (dateEl) dateEl.innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    
    // Cek setiap tugas apakah sudah masuk waktu alarm
    tasks.forEach(async (t) => {
        const deadlineMs = new Date(t.date).getTime();
        const remindAtMs = deadlineMs - (t.remindHours * 3600000);
        
        if (currentTimeMs >= remindAtMs && !t.alerted) {
            triggerAlarm(t.name);
            // Update status 'alerted' ke Firebase agar alarm tidak berulang
            try {
                const docRef = window.fs.doc(window.db, "tasks", t.id);
                await window.fs.updateDoc(docRef, { alerted: true });
            } catch (err) { console.error("Gagal update status alarm:", err); }
        }
    });
}
setInterval(updateClock, 1000);

function triggerAlarm(taskName) {
    alarm.currentTime = 0;
    alarm.play().catch(() => alert("🔔 DEADLINE: " + taskName));
    // Alarm mati otomatis setelah 5 detik
    setTimeout(() => { 
        alarm.pause(); 
        alarm.currentTime = 0; 
    }, 5000);
}

// 3. TAMBAH TUGAS (SIMPAN KE CLOUD)
async function addTask() {
    const name = document.getElementById('taskInput').value;
    const subj = document.getElementById('subjectInput').value;
    const date = document.getElementById('dateInput_only').value;
    const time = document.getElementById('timeInput_only').value;
    const remind = document.querySelector('input[name="reminder"]:checked').value;

    if (name && subj && date && time) {
        try {
            await window.fs.addDoc(window.fs.collection(window.db, "tasks"), {
                name: name,
                subject: subj,
                date: `${date}T${time}`,
                remindHours: parseInt(remind),
                alerted: false,
                createdAt: new Date().getTime()
            });
            // Reset Form
            document.getElementById('taskInput').value = '';
            document.getElementById('subjectInput').value = '';
            switchPage('active-page');
        } catch (e) { 
            alert("Error: Gagal menyimpan ke Firebase. Cek koneksi!"); 
        }
    } else { 
        alert("Vin, isi semua datanya dulu!"); 
    }
}

// 4. PINDAH KE RIWAYAT (MARK AS DONE)
async function markAsDone(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
        // Tambah ke koleksi history
        await window.fs.addDoc(window.fs.collection(window.db, "history"), {
            name: task.name,
            subject: task.subject,
            doneTime: new Date().toLocaleTimeString('id-ID', { hour12: false }),
            doneAt: new Date().getTime()
        });
        // Hapus dari koleksi aktif
        await window.fs.deleteDoc(window.fs.doc(window.db, "tasks", id));
    } catch (e) { 
        console.error("Gagal memindahkan tugas:", e); 
    }
}

// 5. RENDER TAMPILAN
function render() {
    const taskList = document.getElementById('taskList');
    const historyList = document.getElementById('historyList');
    if (!taskList || !historyList) return;

    taskList.innerHTML = ''; 
    historyList.innerHTML = '';
    document.getElementById('taskCount').innerText = tasks.length;
    
    // Render Kartu Tugas Aktif
    tasks.forEach((t) => {
        const d = new Date(t.date);
        taskList.innerHTML += `
            <div class="task-card animate__animated animate__fadeInUp">
                <div class="flex-1 min-w-0 pr-4">
                    <span class="text-[9px] font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">
                        <i class="fas fa-graduation-cap mr-1"></i>${t.subject}
                    </span>
                    <h3 class="font-bold text-slate-800 text-base truncate uppercase mt-2">${t.name}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-2">
                        <i class="far fa-clock mr-1"></i>${d.toLocaleDateString('id-ID')} | ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}
                    </p>
                </div>
                <button onclick="markAsDone('${t.id}')" class="check-btn"><i class="fas fa-check"></i></button>
            </div>`;
    });

    // Render Kartu Riwayat
    history.forEach(h => {
        historyList.innerHTML += `
            <div class="bg-white/70 p-5 rounded-2xl flex justify-between items-center border border-dashed border-slate-200 opacity-80">
                <div class="min-w-0">
                    <p class="text-[9px] font-black text-blue-500 uppercase tracking-tighter">${h.subject}</p>
                    <p class="text-sm font-bold text-slate-700 uppercase truncate">${h.name}</p>
                    <p class="text-[8px] font-bold text-green-600 uppercase mt-1">
                        <i class="fas fa-check-circle mr-1"></i>Selesai pada ${h.doneTime}
                    </p>
                </div>
                <div class="text-green-500 bg-green-50 p-3 rounded-full"><i class="fas fa-award text-lg"></i></div>
            </div>`;
    });
}

// 6. FUNGSI PENDUKUNG UI
function switchPage(pageId) {
    ['input-page', 'active-page', 'history-page'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('tab-active'));
    const activeBtn = document.getElementById('btn-' + pageId.split('-')[0]);
    if (activeBtn) activeBtn.classList.add('tab-active');
}

function unlockAudio() {
    alarm.play().then(() => {
        alarm.pause();
        alarm.currentTime = 0;
        const unlocker = document.getElementById('audioUnlocker');
        unlocker.classList.add('animate__fadeOut');
        setTimeout(() => unlocker.style.display = 'none', 500);
    }).catch(err => console.error("Audio failed:", err));
}

async function clearHistory() {
    if (confirm("Vin, yakin mau hapus SEMUA riwayat di Cloud?")) {
        // Di Firebase, kita harus hapus satu per satu dokumen dalam koleksi
        for (const h of history) {
            await window.fs.deleteDoc(window.fs.doc(window.db, "history", h.id));
        }
    }
}

// Inisialisasi awal
updateClock();