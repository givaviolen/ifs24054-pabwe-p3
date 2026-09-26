// ===== UTILS & MODALS =====
const modals = {
    expense: document.getElementById('modal-expense'),
    bookmark: document.getElementById('modal-bookmark'),
    confirm: document.getElementById('modal-confirm')
};

function openModal(modalId) {
    modals[modalId].classList.remove('hidden');
}

function closeModal(modalId) {
    modals[modalId].classList.add('hidden');
}

// Menutup modal dengan tombol silang atau batal
document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.fixed');
        if (modal) {
            modal.classList.add('hidden');
        }
    });
});

let deleteCallback = null;
document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    if (deleteCallback) deleteCallback();
    closeModal('confirm');
});

function requestConfirm(callback) {
    deleteCallback = callback;
    openModal('confirm');
}

// ===== TAB ROUTER (QUERY STRING) =====
const tabs = document.querySelectorAll('.tab-btn');
const panels = document.querySelectorAll('.panel');

function switchTab(tabId) {
    // Update URL via query string without reloading
    const url = new URL(window.location);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url);

    // Update UI Tab Active State
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabId) {
            tab.classList.add('tab-active');
            tab.classList.remove('text-gray-500');
        } else {
            tab.classList.remove('tab-active');
            tab.classList.add('text-gray-500');
        }
    });

    // Tampilkan panel yang sesuai
    panels.forEach(panel => {
        if (panel.id === `panel-${tabId}`) {
            panel.classList.remove('hidden-panel');
        } else {
            panel.classList.add('hidden-panel');
        }
    });
}

function initTabs() {
    const urlParams = new URLSearchParams(window.location.search);
    let activeTab = urlParams.get('tab');
    
    // Default tab jika tidak ada query string valid
    if (!['expense', 'bookmark', 'quiz'].includes(activeTab)) {
        activeTab = 'expense';
    }
    
    switchTab(activeTab);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });
}

// ===== EXPENSE TRACKER =====
const EXPENSE_KEY = 'expense_tracker_data';
let expenses = JSON.parse(localStorage.getItem(EXPENSE_KEY)) || [];

const expenseList = document.getElementById('expense-list');
const expenseEmpty = document.getElementById('expense-empty');
const formExpense = document.getElementById('form-expense');
const searchExpense = document.getElementById('search-expense');
const filterExpenseType = document.getElementById('filter-expense-type');
const sortExpense = document.getElementById('sort-expense');

// Input Element Modal
const exIdInput = document.getElementById('expense-id');
const exTitleInput = document.getElementById('expense-title');
const exCategoryInput = document.getElementById('expense-category');
const exAmountInput = document.getElementById('expense-amount');
const exTypeInput = document.getElementById('expense-type');
const exDateInput = document.getElementById('expense-date');

function saveExpenses() {
    localStorage.setItem(EXPENSE_KEY, JSON.stringify(expenses));
    renderExpenses();
}

function renderExpenses() {
    // Filter pencarian dan tipe
    let filtered = expenses.filter(ex => {
        const matchSearch = ex.title.toLowerCase().includes(searchExpense.value.toLowerCase()) || 
                            ex.category.toLowerCase().includes(searchExpense.value.toLowerCase());
        const matchType = filterExpenseType.value === 'all' || ex.type === filterExpenseType.value;
        return matchSearch && matchType;
    });

    // Sorting
    const sortVal = sortExpense.value;
    filtered.sort((a, b) => {
        if (sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortVal === 'amount-desc') return b.amount - a.amount;
        if (sortVal === 'amount-asc') return a.amount - b.amount;
    });

    expenseList.innerHTML = '';
    
    if (filtered.length === 0) {
        expenseEmpty.classList.remove('hidden');
    } else {
        expenseEmpty.classList.add('hidden');
        filtered.forEach(ex => {
            const li = document.createElement('li');
            li.className = 'p-4 hover:bg-gray-50 flex justify-between items-center transition-colors';
            
            const isIncome = ex.type === 'income';
            const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
            const amountPrefix = isIncome ? '+' : '-';
            const icon = isIncome ? 'ti-trending-up text-green-500' : 'ti-trending-down text-red-500';

            li.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <i class="ti ${icon} text-xl"></i>
                    </div>
                    <div>
                        <p class="font-bold text-gray-800">${ex.title}</p>
                        <p class="text-xs text-gray-500">${ex.category} • ${ex.date}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <p class="font-bold ${amountColor}">${amountPrefix} Rp ${ex.amount.toLocaleString('id-ID')}</p>
                    <div class="flex gap-2">
                        <button class="text-blue-500 hover:bg-blue-50 p-2 rounded edit-expense-btn" data-id="${ex.id}" aria-label="Ubah transaksi ${ex.title}"><i class="ti ti-edit" aria-hidden="true"></i></button>
                        <button class="text-red-500 hover:bg-red-50 p-2 rounded delete-expense-btn" data-id="${ex.id}" aria-label="Hapus transaksi ${ex.title}"><i class="ti ti-trash" aria-hidden="true"></i></button>
                    </div>
                </div>
            `;
            expenseList.appendChild(li);
        });
    }

    // Event Listener Tombol Edit
    document.querySelectorAll('.edit-expense-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const ex = expenses.find(item => item.id === id);
            if (ex) {
                exIdInput.value = ex.id;
                exTitleInput.value = ex.title;
                exCategoryInput.value = ex.category;
                exAmountInput.value = ex.amount;
                exTypeInput.value = ex.type;
                exDateInput.value = ex.date;
                document.getElementById('modal-expense-title').textContent = 'Ubah Transaksi';
                openModal('expense');
            }
        });
    });

    // Event Listener Tombol Delete
    document.querySelectorAll('.delete-expense-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            requestConfirm(() => {
                expenses = expenses.filter(item => item.id !== id);
                saveExpenses();
            });
        });
    });

    updateSummary();
}

function updateSummary() {
    let income = 0;
    let expense = 0;

    expenses.forEach(ex => {
        if (ex.type === 'income') income += Number(ex.amount);
        else expense += Number(ex.amount);
    });

    document.getElementById('total-income').textContent = `Rp ${income.toLocaleString('id-ID')}`;
    document.getElementById('total-expense').textContent = `Rp ${expense.toLocaleString('id-ID')}`;
    document.getElementById('total-balance').textContent = `Rp ${(income - expense).toLocaleString('id-ID')}`;
}

document.getElementById('btn-add-expense').addEventListener('click', () => {
    formExpense.reset();
    exIdInput.value = '';
    document.getElementById('modal-expense-title').textContent = 'Tambah Transaksi';
    openModal('expense');
});

formExpense.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = Number(exAmountInput.value);
    
    // Validasi angka > 0
    if (amount <= 0) {
        alert("Jumlah transaksi harus lebih dari 0!");
        return;
    }

    const newExpense = {
        id: exIdInput.value || `e-${Date.now()}`,
        title: exTitleInput.value,
        category: exCategoryInput.value,
        amount: amount,
        type: exTypeInput.value,
        date: exDateInput.value
    };

    if (exIdInput.value) {
        expenses = expenses.map(ex => ex.id === newExpense.id ? newExpense : ex);
    } else {
        expenses.push(newExpense);
    }

    saveExpenses();
    closeModal('expense');
});

// Event listener filter dan search
searchExpense.addEventListener('input', renderExpenses);
filterExpenseType.addEventListener('change', renderExpenses);
sortExpense.addEventListener('change', renderExpenses);


// ===== BOOKMARK MANAGER =====
const BOOKMARK_KEY = 'bookmark_manager_data';
let bookmarks = JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || [];

const bookmarkList = document.getElementById('bookmark-list');
const bookmarkEmpty = document.getElementById('bookmark-empty');
const formBookmark = document.getElementById('form-bookmark');
const searchBookmark = document.getElementById('search-bookmark');
const sortBookmark = document.getElementById('sort-bookmark');

const bmIdInput = document.getElementById('bookmark-id');
const bmTitleInput = document.getElementById('bookmark-title');
const bmUrlInput = document.getElementById('bookmark-url');
const bmCategoryInput = document.getElementById('bookmark-category');
const bmNoteInput = document.getElementById('bookmark-note');

function saveBookmarks() {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    renderBookmarks();
}

function renderBookmarks() {
    let filtered = bookmarks.filter(bm => {
        return bm.title.toLowerCase().includes(searchBookmark.value.toLowerCase()) || 
               bm.category.toLowerCase().includes(searchBookmark.value.toLowerCase());
    });

    const sortVal = sortBookmark.value;
    filtered.sort((a, b) => {
        if (sortVal === 'date-desc') return b.createdAt - a.createdAt;
        if (sortVal === 'title-asc') return a.title.localeCompare(b.title);
        if (sortVal === 'title-desc') return b.title.localeCompare(a.title);
    });

    bookmarkList.innerHTML = '';

    if (filtered.length === 0) {
        bookmarkEmpty.classList.remove('hidden');
    } else {
        bookmarkEmpty.classList.add('hidden');
        filtered.forEach(bm => {
            const div = document.createElement('div');
            div.className = 'bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow';
            
            div.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-gray-800 line-clamp-1" title="${bm.title}">${bm.title}</h3>
                        <span class="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium">${bm.category}</span>
                    </div>
                    <p class="text-sm text-blue-500 line-clamp-1 mb-2 hover:underline"><a href="${bm.url}" target="_blank" rel="noopener noreferrer">${bm.url}</a></p>
                    ${bm.note ? `<p class="text-sm text-gray-500 bg-gray-50 p-2 rounded mb-4 italic line-clamp-2">${bm.note}</p>` : ''}
                </div>
                <div class="flex justify-end gap-2 border-t border-gray-50 pt-3 mt-auto">
                    <button class="text-blue-500 hover:bg-blue-50 p-2 rounded text-sm edit-bookmark-btn" data-id="${bm.id}" aria-label="Ubah bookmark ${bm.title}"><i class="ti ti-edit" aria-hidden="true"></i> Ubah</button>
                    <button class="text-red-500 hover:bg-red-50 p-2 rounded text-sm delete-bookmark-btn" data-id="${bm.id}" aria-label="Hapus bookmark ${bm.title}"><i class="ti ti-trash" aria-hidden="true"></i> Hapus</button>
                </div>
            `;
            bookmarkList.appendChild(div);
        });
    }

    document.querySelectorAll('.edit-bookmark-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const bm = bookmarks.find(item => item.id === id);
            if (bm) {
                bmIdInput.value = bm.id;
                bmTitleInput.value = bm.title;
                bmUrlInput.value = bm.url;
                bmCategoryInput.value = bm.category;
                bmNoteInput.value = bm.note || '';
                document.getElementById('modal-bookmark-title').textContent = 'Ubah Bookmark';
                openModal('bookmark');
            }
        });
    });

    document.querySelectorAll('.delete-bookmark-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            requestConfirm(() => {
                bookmarks = bookmarks.filter(item => item.id !== id);
                saveBookmarks();
            });
        });
    });
}

document.getElementById('btn-add-bookmark').addEventListener('click', () => {
    formBookmark.reset();
    bmIdInput.value = '';
    document.getElementById('modal-bookmark-title').textContent = 'Tambah Bookmark';
    openModal('bookmark');
});

formBookmark.addEventListener('submit', (e) => {
    e.preventDefault();
    let url = bmUrlInput.value;
    
    // Validasi URL (harus http/https) menggunakan object URL
    try {
        new URL(url);
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error('Harus diawali http/https');
        }
    } catch (err) {
        alert("URL tidak valid. Pastikan diawali dengan http:// atau https://");
        return;
    }

    const newBm = {
        id: bmIdInput.value || `b-${Date.now()}`,
        title: bmTitleInput.value,
        url: url,
        category: bmCategoryInput.value,
        note: bmNoteInput.value,
        createdAt: bmIdInput.value ? bookmarks.find(b=>b.id === bmIdInput.value).createdAt : Date.now()
    };

    if (bmIdInput.value) {
        bookmarks = bookmarks.map(bm => bm.id === newBm.id ? newBm : bm);
    } else {
        bookmarks.push(newBm);
    }

    saveBookmarks();
    closeModal('bookmark');
});

searchBookmark.addEventListener('input', renderBookmarks);
sortBookmark.addEventListener('change', renderBookmarks);


// ===== QUIZ APP =====
const QUIZ_KEY = 'quiz_app_highscore';
let quizHighScore = parseInt(localStorage.getItem(QUIZ_KEY)) || 0;

// Data soal array of object
const quizQuestions = [
    {
        id: 1,
        question: "Apa kepanjangan dari DOM?",
        options: ["Document Object Model", "Data Object Management", "Digital Ordering Method", "Document Order Management"],
        answer: 0
    },
    {
        id: 2,
        question: "Method array apa yang digunakan untuk menambah elemen ke akhir array di JavaScript?",
        options: ["shift()", "unshift()", "push()", "pop()"],
        answer: 2
    },
    {
        id: 3,
        question: "Manakah yang BUKAN tipe data bawaan di JavaScript?",
        options: ["String", "Boolean", "Undefined", "Character"],
        answer: 3
    },
    {
        id: 4,
        question: "Fungsi apa yang digunakan untuk mengubah format string JSON menjadi object JavaScript?",
        options: ["JSON.stringify()", "JSON.parse()", "JSON.objectify()", "JSON.toObject()"],
        answer: 1
    },
    {
        id: 5,
        question: "Bagaimana cara mendeklarasikan variabel yang nilainya tidak dapat diubah lagi (konstan)?",
        options: ["var", "let", "const", "static"],
        answer: 2
    }
];

let currentQuestionIndex = 0;
let currentScore = 0;

const screenStart = document.getElementById('quiz-start-screen');
const screenQuestion = document.getElementById('quiz-question-screen');
const screenResult = document.getElementById('quiz-result-screen');
const elHighScore = document.getElementById('quiz-high-score');

document.getElementById('btn-start-quiz').addEventListener('click', startQuiz);
document.getElementById('btn-restart-quiz').addEventListener('click', startQuiz);
document.getElementById('btn-next-question').addEventListener('click', showNextQuestion);

function initQuiz() {
    elHighScore.textContent = quizHighScore;
}

function startQuiz() {
    currentQuestionIndex = 0;
    currentScore = 0;
    
    screenStart.classList.add('hidden');
    screenResult.classList.add('hidden');
    screenQuestion.classList.remove('hidden');
    
    document.getElementById('quiz-current-score').textContent = currentScore;
    renderQuestion();
}

function renderQuestion() {
    const q = quizQuestions[currentQuestionIndex];
    document.getElementById('quiz-progress').textContent = `Soal ${currentQuestionIndex + 1} dari ${quizQuestions.length}`;
    document.getElementById('quiz-question-text').textContent = q.question;
    
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';
    
    document.getElementById('quiz-feedback').classList.add('hidden');
    document.getElementById('quiz-next-container').classList.add('hidden');

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors bg-white font-medium option-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => handleAnswer(index, btn));
        optionsContainer.appendChild(btn);
    });
}

function handleAnswer(selectedIndex, btnElement) {
    // Matikan interaksi opsi lain
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('opacity-70', 'cursor-not-allowed');
        btn.classList.remove('hover:bg-blue-50', 'hover:border-blue-300');
    });

    const q = quizQuestions[currentQuestionIndex];
    const feedback = document.getElementById('quiz-feedback');
    feedback.classList.remove('hidden');

    if (selectedIndex === q.answer) {
        btnElement.classList.add('bg-green-100', 'border-green-500', 'text-green-800');
        btnElement.classList.remove('opacity-70');
        feedback.textContent = 'Jawaban Benar! +20 Poin';
        feedback.className = 'mt-6 p-4 rounded-lg font-medium text-center bg-green-100 text-green-800';
        currentScore += 20;
        document.getElementById('quiz-current-score').textContent = currentScore;
    } else {
        btnElement.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
        btnElement.classList.remove('opacity-70');
        
        // Highlight jawaban yang benar
        const btns = document.querySelectorAll('.option-btn');
        btns[q.answer].classList.add('bg-green-100', 'border-green-500', 'text-green-800');
        btns[q.answer].classList.remove('opacity-70');

        feedback.textContent = 'Jawaban Salah!';
        feedback.className = 'mt-6 p-4 rounded-lg font-medium text-center bg-red-100 text-red-800';
    }

    document.getElementById('quiz-next-container').classList.remove('hidden');
}

function showNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        renderQuestion();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    screenQuestion.classList.add('hidden');
    screenResult.classList.remove('hidden');
    
    document.getElementById('quiz-final-score').textContent = currentScore;
    
    let message = '';
    if (currentScore === 100) message = 'Sempurna! Pengetahuan JS Anda sangat baik.';
    else if (currentScore >= 60) message = 'Bagus! Anda memahami konsep dasar dengan baik.';
    else message = 'Jangan menyerah! Coba pelajari lagi konsep dasar JavaScript.';
    
    document.getElementById('quiz-result-message').textContent = message;

    // Update High Score di localStorage
    if (currentScore > quizHighScore) {
        quizHighScore = currentScore;
        localStorage.setItem(QUIZ_KEY, quizHighScore);
        elHighScore.textContent = quizHighScore;
    }
}

// ===== INISIALISASI SAAT HALAMAN DIMUAT =====
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    renderExpenses();
    renderBookmarks();
    initQuiz();
});
