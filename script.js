// =====================================================
// SMARTSPLIT DASHBOARD
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const totalOwe = document.getElementById("totalOwe");
const totalOwed = document.getElementById("totalOwed");
const netBalance = document.getElementById("netBalance");

const recentExpenses =
    document.getElementById("recentExpenses");

const dashboardGroupList =
    document.getElementById("dashboardGroupList");

const createGroupButton =
    document.getElementById("createGroupButton");


// =====================================================
// YOUR NAME
// =====================================================

const YOUR_NAME = "tanushree";


// =====================================================
// DISPLAY GROUPS
// =====================================================

function displayGroups() {

    const groups = SmartSplit.groups();

    dashboardGroupList.innerHTML = "";


    // No groups
    if (groups.length === 0) {

        dashboardGroupList.textContent =
            "No groups yet. Create your first group!";

        return;
    }


    // Display every group
    groups.forEach(function(group) {

        const groupCard =
            document.createElement("div");

        groupCard.className = "group-card";


        const totalExpenses =
            Number(group.totalExpenses) || 0;


        const memberCount =
            group.memberNames?.length ||
            group.members ||
            0;


        groupCard.innerHTML = `

            <h3>${group.name}</h3>

            <p>
                Members: ${memberCount}
            </p>

            <p>
                Total Expenses:
                ${SmartSplit.money(totalExpenses)}
            </p>

            <button
                type="button"
                class="open-group-button"
            >
                Open Group
            </button>

            <button
                type="button"
                class="delete-group-button"
            >
                Delete
            </button>

        `;


        // =================================================
        // OPEN GROUP
        // =================================================

        const openButton =
            groupCard.querySelector(
                ".open-group-button"
            );


        openButton.addEventListener(
            "click",
            function() {

                // Remember selected group
                SmartSplit.selectGroup(group.id);

                // Open group details
                window.location.href =
                    "group-details.html";

            }
        );


        // =================================================
        // DELETE GROUP
        // =================================================

        const deleteButton =
            groupCard.querySelector(
                ".delete-group-button"
            );


        deleteButton.addEventListener(
            "click",
            function() {

                const confirmed =
                    confirm(
                        `Delete "${group.name}"?\n\n` +
                        `This will also delete all expenses ` +
                        `belonging to this group.`
                    );


                // User cancelled
                if (!confirmed) {
                    return;
                }


                // -----------------------------------------
                // DELETE GROUP
                // -----------------------------------------

                const updatedGroups =
                    SmartSplit.groups().filter(
                        function(existingGroup) {

                            return String(existingGroup.id) !==
                                   String(group.id);

                        }
                    );


                SmartSplit.saveGroups(
                    updatedGroups
                );


                // -----------------------------------------
                // DELETE EXPENSES OF THIS GROUP
                // -----------------------------------------

                const updatedExpenses =
                    SmartSplit.expenses().filter(
                        function(expense) {

                            return String(expense.groupId) !==
                                   String(group.id);

                        }
                    );


                SmartSplit.saveExpenses(
                    updatedExpenses
                );


                // -----------------------------------------
                // CLEAR SELECTED GROUP
                // -----------------------------------------

                if (
                    String(
                        SmartSplit.selectedGroupId()
                    ) === String(group.id)
                ) {

                    localStorage.removeItem(
                        SmartSplit.keys.selectedGroupId
                    );

                }


                // -----------------------------------------
                // REFRESH DASHBOARD
                // -----------------------------------------

                displayGroups();

                calculateFinancialSummary();

                displayRecentExpenses();

            }
        );


        // Add card to dashboard
        dashboardGroupList.appendChild(
            groupCard
        );

    });

}


function calculateFinancialSummary() {

    const expenses = SmartSplit.expenses();
    const groups = SmartSplit.groups();

    // Only use expenses that belong to an existing group
    const validExpenses = expenses.filter(function(expense) {

        return groups.some(function(group) {

            return String(group.id) ===
                   String(expense.groupId);

        });

    });

    let totalYouOwe = 0;
    let totalOthersOweYou = 0;

    validExpenses.forEach(function(expense) {

        const yourShare =
            Number(expense.shares?.[YOUR_NAME] || 0);

        if (
            expense.paidBy &&
            expense.paidBy.toLowerCase() !==
            YOUR_NAME.toLowerCase()
        ) {

            totalYouOwe += yourShare;

        } else if (
            expense.paidBy &&
            expense.paidBy.toLowerCase() ===
            YOUR_NAME.toLowerCase()
        ) {

            const people =
                expense.people || [];

            people.forEach(function(person) {

                if (
                    person.toLowerCase() !==
                    YOUR_NAME.toLowerCase()
                ) {

                    const theirShare =
                        Number(
                            expense.shares?.[person] || 0
                        );

                    totalOthersOweYou +=
                        theirShare;

                }

            });

        }

    });

    const net =
        totalOthersOweYou - totalYouOwe;

    totalOwe.textContent =
        SmartSplit.money(totalYouOwe);

    totalOwed.textContent =
        SmartSplit.money(totalOthersOweYou);

    netBalance.textContent =
        SmartSplit.money(net);
}

// =====================================================
// DISPLAY RECENT EXPENSES
// =====================================================

function displayRecentExpenses() {

    const expenses =
        SmartSplit.expenses();


    recentExpenses.innerHTML = "";


    // No expenses
    if (expenses.length === 0) {

        recentExpenses.textContent =
            "No expenses yet.";

        return;
    }


    // Latest expenses first
    expenses
        .slice()
        .reverse()
        .forEach(function(expense) {


            // -----------------------------------------
            // FIND GROUP
            // -----------------------------------------

            const group =
                SmartSplit.groups().find(
                    function(existingGroup) {

                        return String(existingGroup.id) ===
                               String(expense.groupId);

                    }
                );


            // -----------------------------------------
            // IGNORE EXPENSES FROM DELETED GROUPS
            // -----------------------------------------

            if (!group) {
                return;
            }


            // -----------------------------------------
            // CREATE EXPENSE CARD
            // -----------------------------------------

            const expenseDiv =
                document.createElement("div");


            expenseDiv.className =
                "recent-expense-card";


            // Category fallback
            const category =
                expense.category &&
                expense.category.trim()
                    ? expense.category
                    : "Not specified";


            // Split fallback
            const splitMethod =
                expense.splitMethod &&
                expense.splitMethod.trim()
                    ? expense.splitMethod
                    : "Not specified";


            expenseDiv.innerHTML = `

                <h3>
                    ${expense.expenseName || "Expense"}
                </h3>

                <p>
                    <strong>Group:</strong>
                    ${group.name}
                </p>

                <p>
                    <strong>Amount:</strong>
                    ${SmartSplit.money(expense.amount)}
                </p>

                <p>
                    <strong>Paid by:</strong>
                    ${expense.paidBy}
                </p>

                <p>
                    <strong>Category:</strong>
                    ${category}
                </p>

                <p>
                    <strong>Split:</strong>
                    ${splitMethod}
                </p>

                <hr>

            `;


            recentExpenses.appendChild(
                expenseDiv
            );

        });


    // -----------------------------------------
    // CHECK IF ANY VALID EXPENSES REMAIN
    // -----------------------------------------

    if (!recentExpenses.children.length) {

        recentExpenses.textContent =
            "No expenses yet.";

    }

}


// =====================================================
// CREATE GROUP BUTTON
// =====================================================

createGroupButton.addEventListener(
    "click",
    function() {

        window.location.href =
            "create-group.html";

    }
);


// =====================================================
// INITIAL LOAD
// =====================================================

displayGroups();

calculateFinancialSummary();

displayRecentExpenses();