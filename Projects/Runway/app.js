// Data State
let entries = JSON.parse(localStorage.getItem('runway_entries')) || [];

// DOM Elements
const balanceAmountEl = document.getElementById('balance-amount');
const runwayDaysEl = document.getElementById('runway-days');
const entriesListEl = document.getElementById('entries-list');

// Forms
const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');

// Inputs
const incomeDateInput = document.getElementById('income-date');
const expenseDateInput = document.getElementById('expense-date');

// Edit Modal
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditBtn = document.getElementById('cancel-edit');

// Helpers
const formatMoney = (cents) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
    }).format(cents / 100);
};

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9);

// Initialize Dates to Today
const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    incomeDateInput.value = today;
    expenseDateInput.value = today;
};

// Core Logic
const updateDashboard = () => {
    let totalIncome = 0;
    let totalExpense = 0;
    let recentExpense = 0;
    let earliestExpenseDate = null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    entries.forEach(entry => {
        if (entry.type === 'income') {
            totalIncome += entry.amount;
        } else if (entry.type === 'expense') {
            totalExpense += entry.amount;
            
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            
            if (!earliestExpenseDate || entryDate < earliestExpenseDate) {
                earliestExpenseDate = entryDate;
            }
            
            const timeDiff = today.getTime() - entryDate.getTime();
            const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
            
            if (daysDiff >= 0 && daysDiff < 14) {
                recentExpense += entry.amount;
            }
        }
    });

    const balance = totalIncome - totalExpense;
    balanceAmountEl.textContent = formatMoney(balance);
    
    // Formatting negative balance
    if (balance < 0) {
        balanceAmountEl.style.color = 'var(--danger)';
    } else {
        balanceAmountEl.style.color = 'var(--primary)';
    }

    // Runway Calculation (14-day average)
    if (recentExpense === 0 || balance <= 0) {
        runwayDaysEl.textContent = balance <= 0 && entries.length > 0 ? "0" : "--";
        if (balance <= 0 && entries.length > 0) {
            runwayDaysEl.style.color = 'var(--danger)';
            runwayDaysEl.style.textShadow = '0 0 20px rgba(248, 113, 113, 0.2)';
        } else {
            runwayDaysEl.style.color = 'var(--accent)';
            runwayDaysEl.style.textShadow = '0 0 20px var(--accent-glow)';
        }
    } else {
        let windowDays = 1;
        if (earliestExpenseDate) {
            const timeDiff = today.getTime() - earliestExpenseDate.getTime();
            const daysSinceFirst = Math.floor(timeDiff / (1000 * 3600 * 24));
            const totalDaysSinceFirstExpense = Math.max(1, daysSinceFirst + 1);
            
            windowDays = Math.min(14, totalDaysSinceFirstExpense);
        }
        
        const avgDailySpend = recentExpense / windowDays;
        const runway = Math.floor(balance / avgDailySpend);
        
        runwayDaysEl.textContent = runway;
        
        // Color coding runway based on health
        if (runway < 30) {
            runwayDaysEl.style.color = 'var(--danger)';
            runwayDaysEl.style.textShadow = '0 0 20px rgba(248, 113, 113, 0.2)';
        } else if (runway < 90) {
            runwayDaysEl.style.color = '#fbbf24'; // Warning yellow
            runwayDaysEl.style.textShadow = '0 0 20px rgba(251, 191, 36, 0.2)';
        } else {
            runwayDaysEl.style.color = 'var(--accent)';
            runwayDaysEl.style.textShadow = '0 0 20px var(--accent-glow)';
        }
    }
};

const renderEntries = () => {
    entriesListEl.innerHTML = '';
    
    // Sort descending by date
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentEntries = sortedEntries.slice(0, 10);
    
    if (recentEntries.length === 0) {
        entriesListEl.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem 0;">No entries yet. Start logging above!</p>';
        return;
    }

    recentEntries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'entry-item';
        
        const isIncome = entry.type === 'income';
        const amountClass = isIncome ? 'amount-income' : 'amount-expense';
        const prefix = isIncome ? '+' : '-';
        
        div.innerHTML = `
            <div class="entry-info">
                <div class="entry-title">${entry.description}</div>
                <div class="entry-date">${formatDate(entry.date)}</div>
            </div>
            <div class="entry-right">
                <div class="entry-amount ${amountClass}">${prefix}${formatMoney(entry.amount)}</div>
                <div class="entry-actions">
                    <button class="icon-btn edit-btn" onclick="openEditModal('${entry.id}')">Edit</button>
                    <button class="icon-btn delete-btn" onclick="deleteEntry('${entry.id}')">Del</button>
                </div>
            </div>
        `;
        entriesListEl.appendChild(div);
    });
};

const saveState = () => {
    localStorage.setItem('runway_entries', JSON.stringify(entries));
    updateDashboard();
    renderEntries();
};

// Actions
const addEntry = (type, amountCents, description, date) => {
    entries.push({
        id: generateId(),
        type,
        amount: amountCents,
        description,
        date
    });
    saveState();
};

window.deleteEntry = (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
        entries = entries.filter(e => e.id !== id);
        saveState();
    }
};

// Event Listeners
incomeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amountFloat = parseFloat(document.getElementById('income-amount').value);
    const amountCents = Math.round(amountFloat * 100);
    const source = document.getElementById('income-source').value;
    const date = document.getElementById('income-date').value;
    
    addEntry('income', amountCents, source, date);
    incomeForm.reset();
    setToday();
});

expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amountFloat = parseFloat(document.getElementById('expense-amount').value);
    const amountCents = Math.round(amountFloat * 100);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    
    addEntry('expense', amountCents, category, date);
    expenseForm.reset();
    setToday();
});

// Edit Flow
window.openEditModal = (id) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;
    
    document.getElementById('edit-id').value = entry.id;
    document.getElementById('edit-type').value = entry.type;
    document.getElementById('edit-amount').value = (entry.amount / 100).toFixed(2);
    document.getElementById('edit-date').value = entry.date;
    
    if (entry.type === 'income') {
        document.getElementById('edit-source-group').style.display = 'block';
        document.getElementById('edit-category-group').style.display = 'none';
        
        document.getElementById('edit-source').value = entry.description;
        document.getElementById('edit-source').required = true;
        document.getElementById('edit-category').required = false;
    } else {
        document.getElementById('edit-source-group').style.display = 'none';
        document.getElementById('edit-category-group').style.display = 'block';
        
        document.getElementById('edit-category').value = entry.description;
        document.getElementById('edit-category').required = true;
        document.getElementById('edit-source').required = false;
    }
    
    editModal.classList.add('active');
};

cancelEditBtn.addEventListener('click', () => {
    editModal.classList.remove('active');
});

editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('edit-id').value;
    const type = document.getElementById('edit-type').value;
    const amountFloat = parseFloat(document.getElementById('edit-amount').value);
    const amountCents = Math.round(amountFloat * 100);
    const date = document.getElementById('edit-date').value;
    
    let description = '';
    if (type === 'income') {
        description = document.getElementById('edit-source').value;
    } else {
        description = document.getElementById('edit-category').value;
    }
    
    // Update entry
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
        entries[index] = {
            ...entries[index],
            amount: amountCents,
            description,
            date
        };
        saveState();
        editModal.classList.remove('active');
    }
});

// Close modal on outside click
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.classList.remove('active');
    }
});

// Init
setToday();
updateDashboard();
renderEntries();
