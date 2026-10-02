// =====================================================
// SMARTSPLIT ANALYTICS
// =====================================================


// =====================================================
// YOUR NAME
// =====================================================

const YOUR_NAME = "tanushree";


// =====================================================
// ELEMENTS
// =====================================================

const totalGroupSpending =
    document.getElementById("totalGroupSpending");

const yourContribution =
    document.getElementById("yourContribution");

const categoryBreakdown =
    document.getElementById("categoryBreakdown");

const spendingOverTime =
    document.getElementById("spendingOverTime");

const highestSpender =
    document.getElementById("highestSpender");

const yourSpending =
    document.getElementById("yourSpending");


// =====================================================
// GET VALID EXPENSES
// =====================================================

function getValidExpenses() {

    const expenses =
        SmartSplit.expenses();

    const groups =
        SmartSplit.groups();


    // Only keep expenses whose group still exists
    return expenses.filter(function(expense) {

        return groups.some(function(group) {

            return String(group.id) ===
                   String(expense.groupId);

        });

    });

}


// =====================================================
// OVERALL SPENDING
// =====================================================

function displayOverallSpending(expenses) {

    let total = 0;

    let contribution = 0;


    expenses.forEach(function(expense) {

        const amount =
            Number(expense.amount || 0);


        // Total amount spent
        total += amount;


        // Amount actually paid by you
        if (
            expense.paidBy &&
            expense.paidBy.toLowerCase() ===
            YOUR_NAME.toLowerCase()
        ) {

            contribution += amount;

        }

    });


    totalGroupSpending.textContent =
        SmartSplit.money(total);


    yourContribution.textContent =
        SmartSplit.money(contribution);

}


// =====================================================
// CATEGORY BREAKDOWN
// =====================================================

function displayCategoryBreakdown(expenses) {

    categoryBreakdown.innerHTML = "";


    if (expenses.length === 0) {

        categoryBreakdown.innerHTML =
            "<p>No expenses yet.</p>";

        return;

    }


    const categories = {};


    expenses.forEach(function(expense) {

        const category =
            expense.category &&
            expense.category.trim()
                ? expense.category
                : "Other";


        if (!categories[category]) {
            categories[category] = 0;
        }


        categories[category] +=
            Number(expense.amount || 0);

    });


    Object.entries(categories).forEach(
        function([category, amount]) {

            const p =
                document.createElement("p");


            p.innerHTML = `
                <strong>${category}:</strong>
                ${SmartSplit.money(amount)}
            `;


            categoryBreakdown.appendChild(p);

        }
    );

}


// =====================================================
// SPENDING OVER TIME
// =====================================================

function displaySpendingOverTime(expenses) {

    spendingOverTime.innerHTML = "";


    if (expenses.length === 0) {

        spendingOverTime.innerHTML =
            "<p>No expense data yet.</p>";

        return;

    }


    const spendingByDate = {};


    expenses.forEach(function(expense) {

        // Support different possible date fields
        const date =
            expense.date ||
            expense.expenseDate ||
            expense.createdAt;


        if (!date) {
            return;
        }


        const formattedDate =
            new Date(date).toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "long"
                }
            );


        if (!spendingByDate[formattedDate]) {
            spendingByDate[formattedDate] = 0;
        }


        spendingByDate[formattedDate] +=
            Number(expense.amount || 0);

    });


    const entries =
        Object.entries(spendingByDate);


    if (entries.length === 0) {

        spendingOverTime.innerHTML =
            "<p>Date information is not available for these expenses.</p>";

        return;

    }


    entries.forEach(
        function([date, amount]) {

            const p =
                document.createElement("p");


            p.innerHTML = `
                <strong>${date}:</strong>
                ${SmartSplit.money(amount)}
            `;


            spendingOverTime.appendChild(p);

        }
    );

}


// =====================================================
// HIGHEST SPENDER
// =====================================================

function displayHighestSpender(expenses) {

    const spenderTotals = {};


    expenses.forEach(function(expense) {

        const person =
            expense.paidBy;


        if (!person) {
            return;
        }


        if (!spenderTotals[person]) {
            spenderTotals[person] = 0;
        }


        spenderTotals[person] +=
            Number(expense.amount || 0);

    });


    const entries =
        Object.entries(spenderTotals);


    if (entries.length === 0) {

        highestSpender.textContent =
            "None - ₹0.00";

        return;

    }


    entries.sort(
        function(a, b) {
            return b[1] - a[1];
        }
    );


    const topSpender =
        entries[0];


    highestSpender.textContent =
        `${topSpender[0]} - ` +
        `${SmartSplit.money(topSpender[1])}`;

}


// =====================================================
// YOUR SPENDING
// =====================================================

function displayYourSpending(expenses) {

    let total = 0;


    expenses.forEach(function(expense) {

        if (
            expense.paidBy &&
            expense.paidBy.toLowerCase() ===
            YOUR_NAME.toLowerCase()
        ) {

            total +=
                Number(expense.amount || 0);

        }

    });


    yourSpending.textContent =
        `You have spent ${SmartSplit.money(total)} in total.`;

}


// =====================================================
// RENDER ANALYTICS
// =====================================================

function renderAnalytics() {

    const expenses =
        getValidExpenses();


    displayOverallSpending(expenses);

    displayCategoryBreakdown(expenses);

    displaySpendingOverTime(expenses);

    displayHighestSpender(expenses);

    displayYourSpending(expenses);

}


// =====================================================
// INITIAL LOAD
// =====================================================

renderAnalytics();


// =====================================================
// UPDATE WHEN DATA CHANGES
// =====================================================

window.addEventListener(
    "smartsplit:updated",
    function() {

        renderAnalytics();

    }
);