
const form = document.getElementById("transactionForm");
const itemName = document.getElementById("itemName");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const transactionList = document.getElementById("transactionList");
const totalBalance = document.getElementById("totalBalance");
const transactionCount = document.getElementById("transactionCount");
const monthlySummary = document.getElementById("monthlySummary");
const themeToggle = document.getElementById("themeToggle");
const newCategoryInput = document.getElementById("newCategory");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const sortTransactions = document.getElementById("sortTransactions");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let customCategories = JSON.parse(localStorage.getItem("customCategories")) || [];
let spendingChart = null;

const defaultCategories = ["Food", "Transport", "Fun"];

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveCategories() {
    localStorage.setItem("customCategories", JSON.stringify(customCategories));
}

function formatRupiah(amount) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(amount);
}

// Display all categories
function renderCategories() {
    categoryInput.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select Category";
    categoryInput.appendChild(placeholder);

    const allCategories = [...defaultCategories, ...customCategories];

    allCategories.forEach(function(category) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryInput.appendChild(option);
    });
}

// Add custom category
addCategoryBtn.addEventListener("click", function() {
    const categoryName = newCategoryInput.value.trim();

    if (!categoryName) {
        alert("Please enter a category name.");
        return;
    }

    const allCategories = [...defaultCategories, ...customCategories];

    const alreadyExists = allCategories.some(function(category) {
        return category.toLowerCase() === categoryName.toLowerCase();
    });

    if (alreadyExists) {
        alert("This category already exists.");
        return;
    }

    customCategories.push(categoryName);
    saveCategories();
    renderCategories();

    newCategoryInput.value = "";
    alert("New category added successfully!");
});

// Add transaction
form.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = itemName.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;

    if (!name || !category || !Number.isFinite(amount) || amount <= 0) {
        alert("Please complete all fields with a valid amount.");
        return;
    }

    const transaction = {
        id: Date.now() + Math.random(),
        name: name,
        amount: amount,
        category: category,
        date: new Date().toISOString()
    };

    transactions.push(transaction);

    saveTransactions();
    renderTransactions();
    form.reset();
});

// Display transactions with sorting
function renderTransactions() {
    transactionList.replaceChildren();

    let sortedTransactions = [...transactions];

    const sortValue = sortTransactions.value;

    if (sortValue === "newest") {
        sortedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortValue === "oldest") {
        sortedTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortValue === "highest") {
        sortedTransactions.sort((a, b) => b.amount - a.amount);
    } else if (sortValue === "lowest") {
        sortedTransactions.sort((a, b) => a.amount - b.amount);
    }

    sortedTransactions.forEach(function(transaction) {
        const item = document.createElement("div");
        item.className = "transaction-item";

        const details = document.createElement("div");

        const name = document.createElement("h4");
        name.textContent = transaction.name;

        const category = document.createElement("p");
        category.textContent = transaction.category;

        details.append(name, category);

        const rightSide = document.createElement("div");

        const amount = document.createElement("strong");
        amount.textContent = formatRupiah(transaction.amount);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function() {
            transactions = transactions.filter(function(item) {
                return item.id !== transaction.id;
            });

            saveTransactions();
            renderTransactions();
        });

        rightSide.append(amount, deleteButton);
        item.append(details, rightSide);
        transactionList.appendChild(item);
    });

    updateSummary();
    updateChart();
}

// Update total and monthly summary
function updateSummary() {
    const total = transactions.reduce(function(sum, transaction) {
        return sum + transaction.amount;
    }, 0);

    const now = new Date();

    const monthlyTotal = transactions
        .filter(function(transaction) {
            const date = new Date(transaction.date);

            return date.getMonth() === now.getMonth() &&
                   date.getFullYear() === now.getFullYear();
        })
        .reduce(function(sum, transaction) {
            return sum + transaction.amount;
        }, 0);

    totalBalance.textContent = formatRupiah(total);
    transactionCount.textContent = transactions.length + " transactions";
    monthlySummary.textContent = formatRupiah(monthlyTotal);
}

// Update pie chart
function updateChart() {
    const canvas = document.getElementById("spendingChart");

    if (!canvas || typeof Chart === "undefined") return;

    const categories = [...defaultCategories, ...customCategories];

    const categoryTotals = categories.map(function(category) {
        return transactions
            .filter(function(transaction) {
                return transaction.category === category;
            })
            .reduce(function(sum, transaction) {
                return sum + transaction.amount;
            }, 0);
    });

    if (spendingChart) {
        spendingChart.destroy();
    }

    spendingChart = new Chart(canvas, {
        type: "pie",
        data: {
            labels: categories,
            datasets: [{
                data: categoryTotals,
                backgroundColor: [
                    "#6366f1",
                    "#14b8a6",
                    "#f59e0b",
                    "#ec4899",
                    "#8b5cf6",
                    "#06b6d4",
                    "#84cc16",
                    "#f97316"
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}

// Sorting selection
sortTransactions.addEventListener("change", renderTransactions);

// Dark and light mode
themeToggle.addEventListener("click", function() {
    document.body.classList.toggle("dark");
});

// Load saved data
renderCategories();
renderTransactions();
