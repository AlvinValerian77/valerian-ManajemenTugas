// Database State (LocalStorage)
let tasks = JSON.parse(localStorage.getItem('alvin_pro_tasks')) || [];
let history = JSON.parse(localStorage.getItem('alvin_pro_history')) || [];
const alarm = document.getElementById('alarmSound');

// 1. Fungsi Navigasi Halaman
function switchPage(pageId) {
    document.getElementById('input-page').classList.add('hidden-page');
    document.getElementById('active-page').classList.add('hidden-page');
    document.getElementById('history-page').classList.add('hidden-page');
    
    const buttons = ['btn-input', 'btn-active', 'btn-history'];
    buttons.forEach(id => {
        document.getElementById(id).classList.remove('tab-active');
        document.getElementById(id).classList.add('text-white/70');
    });

    document.getElementById(pageId).classList.remove('hidden-page');
    const activeBtn = 'btn-' + pageId.split('-')[0];
    document.getElementById(activeBtn).classList.add('tab-active');
    document.getElementById(activeBtn).classList.remove('text-white/70');
}

// 2. Fungsi Jam Realtime
function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID');
    document.getElementById('date').innerText = now.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });
}
setInterval(updateClock, 1000);
updateClock();

// 3. Fungsi Sistem Alarm & Notifikasi
function triggerAlarm(taskName) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("PENGINGAT DEADLINE", {
            body: `Tugas "${taskName}" segera berakhir!`,
            icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
        });
        alarm.play().catch(e => console.log("Audio play deferred"));
        // Alarm berbunyi selama 8 detik
        setTimeout(() => { 
            alarm.pause(); 
            alarm.currentTime = 0; 
        }, 8000);
    }
}

// 4. Fungsi Render Data ke UI
function render() {
    const list = document.getElementById('taskList');
    const hist = document.getElementById('historyList');
    const countLabel = document.getElementById('taskCount');
    
    list.innerHTML = '';
    hist.innerHTML = '';

    // Sort tugas berdasarkan deadline terdekat
    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    countLabel.innerText = `${tasks.length} TUGAS AKTIF`;

    // Render Tugas Aktif
    if (tasks.length === 0) {
        list.innerHTML = `<div class="bg-white p-16 rounded-3xl border-2 border-dashed text-center text-slate-300 font-bold uppercase tracking-widest">Tidak ada tugas aktif</div>`;
    }

    tasks.forEach((t, i) => {
        const deadline = new Date(t.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diff = Math.ceil((deadline - today) / 86400000);
        
        let theme = "border-blue-700 bg-white";
        let badge = "bg-slate-100 text-slate-500";

        // Logic Alarm: H-1 Deadline
        if (diff === 1) { 
            theme = "border-red-600 bg-red-50 animate__animated animate__pulse animate__infinite"; 
            badge = "bg-red-600 text-white";
            triggerAlarm(t.name);
        } else if (diff === 0) {
            badge = "bg-orange-500 text-white";
        }

        list.innerHTML += `
            <div class="${theme} border-l-[12px] p-6 rounded-2xl shadow-md flex items-center justify-between transition-all hover:scale-[1.02]">
                <div class="flex items-center gap-6">
                    <button onclick="confirmComplete(${i})" class="h-12 w-12 rounded-2xl border-2 border-slate-200 flex items-center justify-center hover:bg-green-500 hover:border-green-500 transition-all group shadow-sm bg-slate-50">
                        <i class="fas fa-check text-transparent group-hover:text-white transition-all text-xl"></i>
                    </button>
                    <div>
                        <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest"><i class="fas fa-bookmark mr-1"></i> ${t.subject}</span>
                        <h3 class="font-extrabold text-slate-800 text-xl leading-tight">${t.name}</h3>
                        <div class="flex items-center gap-4 mt-2">
                            <p class="text-xs font-bold text-slate-400"><i class="far fa-calendar-alt mr-1"></i> ${t.date}</p>
                            <span class="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${badge}">
                                ${diff < 0 ? 'Terlewati' : diff === 0 ? 'Hari Ini' : diff + ' Hari Lagi'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    // Render Riwayat
    if (history.length === 0) {
        hist.innerHTML = `<div class="bg-white p-16 rounded-3xl border-2 border-dashed text-center text-slate-300 font-bold uppercase tracking-widest">Belum ada riwayat</div>`;
    }

    history.forEach((h) => {
        hist.innerHTML += `
            <div class="bg-white border-l-8 border-green-500 p-5 rounded-2xl flex items-center justify-between shadow-sm opacity-90">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${h.subject}</p>
                    <h3 class="font-bold text-slate-700 text-lg">${h.name}</h3>
                    <p class="text-[10px] font-bold text-green-600 uppercase mt-1"><i class="fas fa-check-circle mr-1"></i> Selesai pada ${new Date().toLocaleDateString('id-ID')}</p>
                </div>
                <div class="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `;
    });

    // Simpan ke LocalStorage
    localStorage.setItem('alvin_pro_tasks', JSON.stringify(tasks));
    localStorage.setItem('alvin_pro_history', JSON.stringify(history));
}

// 5. Fungsi Tambah Tugas
function addTask() {
    const name = document.getElementById('taskInput').value;
    const subject = document.getElementById('subjectInput').value;
    const date = document.getElementById('dateInput').value;
    
    if (name && subject && date) {
        tasks.push({ name, subject, date });
        // Reset Input
        document.getElementById('taskInput').value = '';
        document.getElementById('subjectInput').value = '';
        document.getElementById('dateInput').value = '';
        
        render();
        alert("Tugas berhasil disimpan! Silakan cek di halaman Daftar Tugas.");
        switchPage('active-page');
    } else {
        alert("Mohon isi semua data!");
    }
}

// 6. Fungsi Konfirmasi Selesai
function confirmComplete(index) {
    const taskName = tasks[index].name;
    if(confirm(`Selesaikan tugas "${taskName}"?`)) {
        const done = tasks.splice(index, 1);
        history.unshift(done[0]);
        render();
        // Hentikan alarm jika sedang bunyi
        alarm.pause();
        alarm.currentTime = 0;
    }
}

// 7. Fungsi Hapus Riwayat
function clearHistory() { 
    if(confirm("Hapus permanen semua riwayat?")) { 
        history = []; 
        render(); 
    } 
}

// Inisialisasi saat load
if ("Notification" in window) {
    Notification.requestPermission();
}
render();