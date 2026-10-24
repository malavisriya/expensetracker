const categories = ["All", "Food", "Travel", "Study", "Bills", "Other"];
const storageKey = "student-expenses";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

const now = new Date();
const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);

let expenses = loadExpenses();
let selectedCategory = "All";
let selectedMonth = localDate.slice(0, 7);

const form = document.querySelector("#expense-form");
const monthPicker = document.querySelector("#month-picker");
const filters = document.querySelector("#filters");
const expenseList = document.querySelector("#expense-list");

form.elements.date.value = localDate;
monthPicker.value = selectedMonth;

function loadExpenses() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(storageKey, JSON.stringify(expenses));
}

function renderFilters() {
  filters.replaceChildren();

  for (const category of categories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      `filter${selectedCategory === category ? " active" : ""}`;
    button.textContent = category;

    button.addEventListener("click", () => {
      selectedCategory = category;
      render();
    });

    filters.append(button);
  }
}

function renderSummary(monthExpenses) {
  const total = monthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  document.querySelector("#month-total").textContent =
    currency.format(total);

  document.querySelector("#expense-count").textContent =
    `${monthExpenses.length} expense` +
    `${monthExpenses.length === 1 ? "" : "s"} recorded`;

  const totalsByCategory = new Map();

  for (const expense of monthExpenses) {
    const currentTotal = totalsByCategory.get(expense.category) || 0;
    totalsByCategory.set(expense.category, currentTotal + expense.amount);
  }

  const [biggestCategory, biggestTotal] =
    [...totalsByCategory.entries()].sort((a, b) => b[1] - a[1])[0] || [];

  document.querySelector("#biggest-category").textContent =
    biggestCategory || "—";

  document.querySelector("#biggest-total").textContent = biggestCategory
    ? `${currency.format(biggestTotal)} this month`
    : "Add an expense to begin";
}

function makeExpenseRow(expense) {
  const row = document.createElement("article");
  row.className = "expense-row";

  const icon = document.createElement("span");
  icon.className = `expense-icon ${expense.category.toLowerCase()}`;

  const icons = {
    Food: "◒",
    Travel: "↗",
    Study: "▤",
    Bills: "⌁",
    Other: "✳"
  };

  icon.textContent = icons[expense.category] || "✳";

  const details = document.createElement("div");
  details.className = "expense-info";

  const title = document.createElement("strong");
  title.textContent = expense.title;

  const date = new Date(`${expense.date}T00:00:00`).toLocaleDateString(
    "en-IN",
    { day: "numeric", month: "short", year: "numeric" }
  );

  const meta = document.createElement("span");
  meta.textContent = `${expense.category} · ${date}`;

  details.append(title, meta);

  if (expense.note) {
    const note = document.createElement("small");
    note.textContent = expense.note;
    details.append(note);
  }

  const amount = document.createElement("strong");
  amount.className = "expense-amount";
  amount.textContent = `−${currency.format(expense.amount)}`;

  const removeButton = document.createElement("button");
  removeButton.className = "delete";
  removeButton.type = "button";
  removeButton.textContent = "×";
  removeButton.setAttribute("aria-label", `Delete ${expense.title}`);

  removeButton.addEventListener("click", () => {
    expenses = expenses.filter((item) => item.id !== expense.id);
    saveExpenses();
    render();
  });

  row.append(icon, details, amount, removeButton);
  return row;
}

function renderExpenses(monthExpenses) {
  const visibleExpenses = selectedCategory === "All"
    ? monthExpenses
    : monthExpenses.filter(
        (expense) => expense.category === selectedCategory
      );

  expenseList.replaceChildren();

  if (visibleExpenses.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.innerHTML =
      "<span>✦</span><strong>Nothing here yet</strong>" +
      "<p>Your expenses will show up here.</p>";
    expenseList.append(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "expense-list";

  for (const expense of visibleExpenses) {
    list.append(makeExpenseRow(expense));
  }

  expenseList.append(list);
}

function render() {
  const monthExpenses = expenses
    .filter((expense) => expense.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  renderFilters();
  renderSummary(monthExpenses);
  renderExpenses(monthExpenses);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(form);

  expenses.unshift({
    id: crypto.randomUUID(),
    title: data.get("title").trim(),
    amount: Number(data.get("amount")),
    category: data.get("category"),
    date: data.get("date"),
    note: data.get("note").trim()
  });

  saveExpenses();

  selectedMonth = form.elements.date.value.slice(0, 7);
  monthPicker.value = selectedMonth;
  selectedCategory = "All";

  form.reset();
  form.elements.date.value = localDate;

  render();
});

monthPicker.addEventListener("change", () => {
  selectedMonth = monthPicker.value;
  render();
});

render();