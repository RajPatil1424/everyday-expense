const initialTransactions = [
  { id: 1, name: "Whole Foods Market", note: "Grocery shopping", category: "Groceries", source: "Google Pay", date: "Today, 9:41 AM", day: 25, month: 10, account: "•• 4829", amount: -84.32, icon: "i-bag", color: "grocery-color" },
  { id: 2, name: "Salary · Acme Inc.", note: "Monthly salary", category: "Income", source: "Bank transfer", date: "Today, 8:00 AM", day: 25, month: 10, account: "•• 1092", amount: 4250, icon: "i-wallet", color: "income-icon" },
  { id: 3, name: "Blue Bottle Coffee", note: "Coffee & a little treat", category: "Dining out", source: "PhonePe", date: "Yesterday", day: 24, month: 10, account: "•• 4829", amount: -12.50, icon: "i-coffee", color: "dining-color" },
  { id: 4, name: "City Transit", note: "Monthly pass", category: "Transport", source: "Paytm", date: "Nov 22, 2026", day: 22, month: 10, account: "•• 4829", amount: -65, icon: "i-car", color: "transport-color" },
  { id: 5, name: "Studio June", note: "Subscription", category: "Lifestyle", source: "Debit card", date: "Nov 21, 2026", day: 21, month: 10, account: "•• 1092", amount: -24, icon: "i-film", color: "lifestyle-color" },
  { id: 6, name: "Freelance project", note: "Project payment", category: "Income", source: "Bank transfer", date: "Nov 20, 2026", day: 20, month: 10, account: "•• 1092", amount: 680, icon: "i-wallet", color: "income-icon" },
  { id: 7, name: "Market Street Grocer", note: "Weekly groceries", category: "Groceries", source: "Google Pay", date: "Nov 19, 2026", day: 19, month: 10, account: "•• 4829", amount: -56.70, icon: "i-bag", color: "grocery-color" },
  { id: 8, name: "Juniper & Rye", note: "Dinner with friends", category: "Dining out", source: "PhonePe", date: "Nov 18, 2026", day: 18, month: 10, account: "•• 4829", amount: -48.20, icon: "i-coffee", color: "dining-color" },
  { id: 9, name: "Ride share", note: "Trip across town", category: "Transport", source: "Paytm", date: "Nov 17, 2026", day: 17, month: 10, account: "•• 4829", amount: -18.40, icon: "i-car", color: "transport-color" },
  { id: 10, name: "Corner Market", note: "A few essentials", category: "Groceries", source: "Cash / manual", date: "Nov 16, 2026", day: 16, month: 10, account: "•• 4829", amount: -32.15, icon: "i-bag", color: "grocery-color" },
  { id: 11, name: "Paperback Bookshop", note: "Weekend reading", category: "Lifestyle", source: "Debit card", date: "Nov 14, 2026", day: 14, month: 10, account: "•• 1092", amount: -22.99, icon: "i-film", color: "lifestyle-color" },
  { id: 12, name: "Northside Bakery", note: "Sunday morning", category: "Dining out", source: "Google Pay", date: "Nov 13, 2026", day: 13, month: 10, account: "•• 4829", amount: -16.80, icon: "i-coffee", color: "dining-color" },
];

const iconByCategory = {
  "Food & Dining": ["i-coffee", "dining-color"],
  "Dining out": ["i-coffee", "dining-color"],
  Groceries: ["i-bag", "grocery-color"],
  Shopping: ["i-bag", "grocery-color"],
  Transport: ["i-car", "transport-color"],
  Housing: ["i-home", "transport-color"],
  Entertainment: ["i-film", "lifestyle-color"],
  Lifestyle: ["i-film", "lifestyle-color"],
  Health: ["i-sparkle", "dining-color"],
  Income: ["i-wallet", "income-icon"],
  Other: ["i-sparkle", "lifestyle-color"],
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const transactionList = document.querySelector("#transactionList");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#transactionSearch");
const modal = document.querySelector("#transactionModal");
const transactionForm = document.querySelector("#transactionForm");
const toast = document.querySelector("#toast");
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getSourceConnections() {
  try {
    const saved = JSON.parse(localStorage.getItem("everday-source-connections") || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch (error) {
    console.error("Could not load payment-source connection preferences.", error);
    return {};
  }
}

function getStoredTransactions() {
  try {
    const stored = localStorage.getItem("everday-transactions");
    if (!stored) return [...initialTransactions];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new TypeError("Saved transactions must be a list.");
    return parsed;
  } catch (error) {
    console.error("Could not load saved transactions.", error);
    return [...initialTransactions];
  }
}

let transactions = getStoredTransactions();
let activeFilter = "all";
let activePage = "Overview";
let showAllTransactions = false;
let sourceConnections = getSourceConnections();
let toastTimeout;

function saveTransactions() {
  try {
    localStorage.setItem("everday-transactions", JSON.stringify(transactions));
    return true;
  } catch (error) {
    console.error("Could not save your transaction.", error);
    return false;
  }
}

function formatCurrency(value) {
  return money.format(value);
}

function renderTransactions() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = transactions.filter((transaction) => {
    const matchesSearch = [transaction.name, transaction.note, transaction.category, transaction.source || "Manual entry", transaction.account]
      .join(" ").toLowerCase().includes(query);
    const matchesType = activeFilter === "all" || (activeFilter === "income" ? transaction.amount > 0 : transaction.amount < 0);
    return matchesSearch && matchesType;
  });
  const displayed = showAllTransactions || activePage === "Transactions" ? filtered : filtered.slice(0, 5);

  transactionList.innerHTML = displayed.map((transaction) => {
    const [icon, color] = iconByCategory[transaction.category] || [transaction.icon, transaction.color];
    const isIncome = transaction.amount > 0;
    const source = transaction.source || "Manual entry";
    return `<tr>
      <td><div class="merchant-cell"><span class="merchant-icon ${color}"><svg class="icon"><use href="#${icon}"></use></svg></span><span><span class="merchant-name">${escapeHtml(transaction.name)}</span><span class="merchant-note">${escapeHtml(transaction.note)}</span></span></div></td>
      <td><span class="source-pill" data-source="${escapeHtml(source)}">${escapeHtml(source)}</span></td>
      <td><span class="category-pill">${escapeHtml(transaction.category)}</span></td>
      <td><span class="date-cell">${escapeHtml(transaction.date)}</span></td>
      <td><span class="account-cell"><i class="account-dot"></i>${escapeHtml(transaction.account)}</span></td>
      <td><div class="amount-cell ${isIncome ? "is-income" : ""}">${isIncome ? "+" : "−"}${formatCurrency(Math.abs(transaction.amount))}</div></td>
      <td><button class="icon-button row-more" aria-label="More options for ${escapeHtml(transaction.name)}"><svg class="icon"><use href="#i-more"></use></svg></button></td>
    </tr>`;
  }).join("");

  emptyState.hidden = displayed.length > 0;
  document.querySelector("#transactionCount").textContent = query || activeFilter !== "all"
    ? displayed.length === filtered.length
      ? `Showing ${filtered.length} matching transaction${filtered.length === 1 ? "" : "s"}`
      : `Showing ${displayed.length} of ${filtered.length} matching transactions`
    : `Showing ${displayed.length} of ${transactions.length} transactions`;
}

function renderSourceConnections() {
  document.querySelectorAll(".source-app-card").forEach((card) => {
    const connected = sourceConnections[card.dataset.app] === true;
    card.classList.toggle("is-connected", connected);
    card.querySelector(".connection-status").textContent = connected ? "Demo linked" : "Not linked";
    const button = card.querySelector(".source-connect-button");
    button.textContent = connected ? "Disconnect demo" : "Connect demo";
    button.setAttribute("aria-pressed", String(connected));
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function updateSummary() {
  const now = new Date();
  const inThisMonth = transactions.filter((transaction) => transaction.month === now.getMonth());
  const seededThisMonth = initialTransactions.filter((transaction) => transaction.month === now.getMonth());
  const total = (items, isIncome) => items
    .filter((transaction) => isIncome ? transaction.amount > 0 : transaction.amount < 0)
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const income = 8450 + total(inThisMonth, true) - total(seededThisMonth, true);
  const expenses = 3240.58 + total(inThisMonth, false) - total(seededThisMonth, false);
  const balanceChange = transactions.reduce((sum, item) => sum + item.amount, 0)
    - initialTransactions.reduce((sum, item) => sum + item.amount, 0);
  const netBalance = 12680.42 + balanceChange;
  const savings = income > 0 ? Math.max(0, ((income - expenses) / income) * 100) : 0;

  document.querySelector("#totalBalance").innerHTML = `${formatCurrency(netBalance).slice(0, -3)}<span>${formatCurrency(netBalance).slice(-3)}</span>`;
  document.querySelector("#totalIncome").innerHTML = `${formatCurrency(income).slice(0, -3)}<span>${formatCurrency(income).slice(-3)}</span>`;
  document.querySelector("#totalExpenses").innerHTML = `${formatCurrency(expenses).slice(0, -3)}<span>${formatCurrency(expenses).slice(-3)}</span>`;
  document.querySelector("#savingsRate").innerHTML = `${savings.toFixed(1)}<span>%</span>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

function openModal() {
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  modal.querySelector('input[name="name"]').focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
  document.querySelector("#addTransactionButton").focus();
}

function switchPage(page) {
  activePage = page;
  document.querySelector(".page-content").className = `page-content page-${page.toLowerCase()}`;
  const pageTitle = page === "Sources" ? "Payment sources" : page;
  document.querySelectorAll(".nav-link[data-page]").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.page === page);
  });
  document.querySelector("#pageName").textContent = pageTitle;
  document.querySelector("#welcomeTitle").innerHTML = page === "Overview"
    ? `${greeting}, Jamie <span class="wave">✳</span>`
    : `${escapeHtml(pageTitle)}<span class="wave"> ✳</span>`;
  document.querySelector(".welcome-copy").textContent = page === "Overview"
    ? "Here’s what’s happening with your money."
    : page === "Transactions"
      ? "Every little thing, all in one place."
      : page === "Budgets"
        ? "Make room for the things that matter."
        : page === "Insights"
          ? "A clearer picture of where your money goes."
          : page === "Sources"
            ? "See which app or account each payment came from."
            : "Make your money feel a little more like yours.";
  document.querySelector("#settingsSection").hidden = page !== "Settings";
  document.querySelector("#sourcesSection").hidden = page !== "Sources";
  document.querySelector("#transactionsSection h2").textContent = page === "Transactions" ? "All transactions" : "Recent transactions";
  document.querySelector("#transactionsSection .panel-subtitle").textContent = page === "Transactions"
    ? "Every little thing, all in one place."
    : "The little things add up. Here’s the latest.";
  showAllTransactions = page === "Transactions";
  renderTransactions();
  if (page === "Transactions") document.querySelector("#transactionsSection").scrollIntoView({ behavior: "smooth", block: "start" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector("#sidebar").classList.remove("is-open");
}

document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("en-US", {
  weekday: "short", month: "short", day: "numeric",
}).format(new Date());
const currentHour = new Date().getHours();
const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";
document.querySelector("#welcomeTitle").innerHTML = `${greeting}, Jamie <span class="wave">✳</span>`;
document.querySelector("#transactionDate").value = [
  new Date().getFullYear(),
  String(new Date().getMonth() + 1).padStart(2, "0"),
  String(new Date().getDate()).padStart(2, "0"),
].join("-");
try {
  const preferences = JSON.parse(localStorage.getItem("everday-preferences") || "{}");
  document.querySelector("#monthlySummary").checked = !preferences || preferences.monthlySummary !== false;
  document.querySelector("#budgetReminders").checked = !preferences || preferences.budgetReminders !== false;
} catch (error) {
  console.error("Could not load saved preferences.", error);
}
renderTransactions();
updateSummary();
renderSourceConnections();

document.querySelector("#addTransactionButton").addEventListener("click", openModal);
document.querySelector("#closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) closeModal();
});

transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!transactionForm.reportValidity()) return;

  const formData = new FormData(transactionForm);
  const amount = Number(formData.get("amount"));
  const category = String(formData.get("type")) === "income" ? "Income" : String(formData.get("category"));
  const [icon, color] = iconByCategory[category];
  const date = new Date(`${formData.get("date")}T12:00:00`);
  const amountWithType = String(formData.get("type")) === "income" ? amount : -amount;

  transactions.unshift({
    id: Date.now(),
    name: String(formData.get("name")).trim(),
    note: category === "Income" ? "Money in" : category,
    category,
    source: String(formData.get("source")),
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    day: date.getDate(),
    month: date.getMonth(),
    account: "•• 4829",
    amount: amountWithType,
    icon,
    color,
  });

  const saved = saveTransactions();
  renderTransactions();
  updateSummary();
  transactionForm.reset();
  document.querySelector("#transactionDate").value = [
    new Date().getFullYear(),
    String(new Date().getMonth() + 1).padStart(2, "0"),
    String(new Date().getDate()).padStart(2, "0"),
  ].join("-");
  closeModal();
  showToast(saved ? "Transaction added. You’ve got this!" : "Transaction added, but could not be saved to this device.");
});

searchInput.addEventListener("input", renderTransactions);

document.querySelector("#filterButton").addEventListener("click", () => {
  activeFilter = activeFilter === "all" ? "expense" : activeFilter === "expense" ? "income" : "all";
  const label = activeFilter === "all" ? "All activity" : activeFilter === "expense" ? "Expenses" : "Income";
  document.querySelector("#filterButton span").textContent = label;
  renderTransactions();
});

document.querySelectorAll("[data-page]").forEach((element) => {
  element.addEventListener("click", () => switchPage(element.dataset.page));
});

document.querySelectorAll(".source-connect-button").forEach((button) => {
  button.addEventListener("click", () => {
    const app = button.closest(".source-app-card");
    const appName = app.querySelector("h3").textContent;
    const nextConnections = {
      ...sourceConnections,
      [app.dataset.app]: sourceConnections[app.dataset.app] !== true,
    };
    try {
      localStorage.setItem("everday-source-connections", JSON.stringify(nextConnections));
      sourceConnections = nextConnections;
      renderSourceConnections();
      showToast(`${appName} demo connection updated. No account data was accessed.`);
    } catch (error) {
      console.error("Could not save this demo connection.", error);
      showToast("Could not save this demo connection to this device.");
    }
  });
});

document.querySelector("#mobileMenu").addEventListener("click", () => {
  document.querySelector("#sidebar").classList.toggle("is-open");
});
document.querySelector("#exportButton").addEventListener("click", () => {
  const headers = ["Transaction", "Payment source", "Category", "Date", "Account", "Amount"];
  const rows = transactions.map((item) => [item.name, item.source || "Manual entry", item.category, item.date, item.account, item.amount.toFixed(2)]);
  const csv = [headers, ...rows].map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "everday-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Your transactions are ready to take with you.");
});
document.querySelector("#periodSelect").addEventListener("change", (event) => {
  const period = event.target.value;
  const labels = period === "week"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri"]
    : period === "year"
      ? ["Jan", "Apr", "Jul", "Oct", "Nov"]
      : [`${monthNames[new Date().getMonth()]} 1`, `${monthNames[new Date().getMonth()]} 7`, `${monthNames[new Date().getMonth()]} 14`, `${monthNames[new Date().getMonth()]} 21`, "Today"];
  labels.forEach((label, index) => {
    document.querySelector(`#xLabel${index + 1}`).textContent = label;
  });
  const isWeek = period === "week";
  document.querySelector("#legendIncome").textContent = isWeek ? "$2,180" : period === "year" ? "$82,640" : "$8,450";
  document.querySelector("#legendExpenses").textContent = isWeek ? "$784" : period === "year" ? "$38,872" : "$3,241";
  document.querySelector(".chart-highlight").setAttribute("cx", isWeek ? "672" : period === "year" ? "593" : "593");
  showToast(period === "week" ? "Showing your week at a glance." : period === "year" ? "Showing your year so far." : "Showing this month.");
});
document.querySelector(".notification-button").addEventListener("click", () => showToast("You’re all caught up. Nice work!"));
document.querySelector(".profile-more").addEventListener("click", () => showToast("Signed in as Jamie Parker."));
document.querySelector(".panel-more").addEventListener("click", () => showToast("Your monthly budget is looking good."));
document.querySelector("#settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const preferences = {
    monthlySummary: document.querySelector("#monthlySummary").checked,
    budgetReminders: document.querySelector("#budgetReminders").checked,
  };
  try {
    localStorage.setItem("everday-preferences", JSON.stringify(preferences));
    showToast("Your preferences are saved.");
  } catch (error) {
    console.error("Could not save your preferences.", error);
    showToast("Could not save your preferences to this device.");
  }
});
