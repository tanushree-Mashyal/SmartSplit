// =====================================================
// SMARTSPLIT DASHBOARD
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const totalOwe =
    document.getElementById("totalOwe");

const totalOwed =
    document.getElementById("totalOwed");

const netBalance =
    document.getElementById("netBalance");

const recentExpenses =
    document.getElementById("recentExpenses");

const dashboardGroupList =
    document.getElementById("dashboardGroupList");

const createGroupButton =
    document.getElementById("createGroupButton");


// =====================================================
// YOUR NAME
// =====================================================

function getYourName() {

    const profile =
        SmartSplit.profile();

    return (
        profile.name ||
        "Tanushree"
    ).trim();

}


// =====================================================
// FIND SHARE BY PERSON NAME
// Case-insensitive
// =====================================================

function getPersonShare(
    shares,
    personName
) {

    if (
        !shares ||
        !personName
    ) {

        return 0;

    }


    const targetName =
        personName
            .trim()
            .toLowerCase();


    for (
        const [name, amount]
        of Object.entries(shares)
    ) {

        if (
            name
                .trim()
                .toLowerCase() ===
            targetName
        ) {

            return Number(
                amount || 0
            );

        }

    }


    return 0;

}


// =====================================================
// DISPLAY GROUPS
// =====================================================

function displayGroups() {

    const groups =
        SmartSplit.groups();

    dashboardGroupList.innerHTML =
        "";


    // No groups
    if (
        groups.length === 0
    ) {

        dashboardGroupList.textContent =
            "No groups yet. Create your first group!";

        return;

    }


    // Display every group
    groups.forEach(
        function(group) {

            const groupCard =
                document.createElement(
                    "div"
                );

            groupCard.className =
                "group-card";


            const totalExpenses =
                Number(
                    group.totalExpenses
                ) || 0;


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

                    SmartSplit.selectGroup(
                        group.id
                    );


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


                    if (!confirmed) {

                        return;

                    }


                    // -----------------------------------------
                    // DELETE GROUP
                    // -----------------------------------------

                    const updatedGroups =
                        SmartSplit.groups().filter(
                            function(existingGroup) {

                                return (
                                    String(
                                        existingGroup.id
                                    ) !==
                                    String(
                                        group.id
                                    )
                                );

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

                                return (
                                    String(
                                        expense.groupId
                                    ) !==
                                    String(
                                        group.id
                                    )
                                );

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
                        ) ===
                        String(
                            group.id
                        )
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


            dashboardGroupList.appendChild(
                groupCard
            );

        }
    );

}


// =====================================================
// CALCULATE FINANCIAL SUMMARY
// =====================================================

function calculateFinancialSummary() {

    const expenses =
        SmartSplit.expenses();

    const groups =
        SmartSplit.groups();

    const YOUR_NAME =
        getYourName();


    const yourNameLower =
        YOUR_NAME
            .trim()
            .toLowerCase();


    // Only use expenses that belong
    // to an existing group
    const validExpenses =
        expenses.filter(
            function(expense) {

                return groups.some(
                    function(group) {

                        return (
                            String(
                                group.id
                            ) ===
                            String(
                                expense.groupId
                            )
                        );

                    }
                );

            }
        );


    let totalYouOwe =
        0;

    let totalOthersOweYou =
        0;


    // =================================================
    // CHECK EVERY EXPENSE
    // =================================================

    validExpenses.forEach(
        function(expense) {

            const paidBy =
                (
                    expense.paidBy ||
                    ""
                ).trim();


            const paidByLower =
                paidBy.toLowerCase();


            const people =
                expense.people || [];


            const shares =
                expense.shares || {};


            // =================================================
            // YOUR SHARE
            // Find it case-insensitively
            // =================================================

            const yourShare =
                getPersonShare(
                    shares,
                    YOUR_NAME
                );


            // =================================================
            // CASE 1:
            // SOMEONE ELSE PAID
            // =================================================

            if (
                paidBy &&
                paidByLower !==
                yourNameLower
            ) {

                totalYouOwe +=
                    yourShare;

            }


            // =================================================
            // CASE 2:
            // YOU PAID
            // =================================================

            else if (
                paidBy &&
                paidByLower ===
                yourNameLower
            ) {

                people.forEach(
                    function(person) {

                        const personName =
                            (
                                person ||
                                ""
                            ).trim();


                        if (
                            personName &&
                            personName.toLowerCase() !==
                            yourNameLower
                        ) {

                            const theirShare =
                                getPersonShare(
                                    shares,
                                    personName
                                );


                            totalOthersOweYou +=
                                theirShare;

                        }

                    }
                );

            }

        }
    );


    // =================================================
    // NET BALANCE
    // =================================================

    const net =
        totalOthersOweYou -
        totalYouOwe;


    // =================================================
    // DISPLAY
    // =================================================

    totalOwe.textContent =
        SmartSplit.money(
            totalYouOwe
        );


    totalOwed.textContent =
        SmartSplit.money(
            totalOthersOweYou
        );


    netBalance.textContent =
        SmartSplit.money(
            net
        );

}


// =====================================================
// DISPLAY RECENT EXPENSES
// =====================================================

function displayRecentExpenses() {

    const expenses =
        SmartSplit.expenses();


    recentExpenses.innerHTML =
        "";


    // No expenses
    if (
        expenses.length === 0
    ) {

        recentExpenses.textContent =
            "No expenses yet.";

        return;

    }


    // Latest expenses first
    expenses
        .slice()
        .reverse()
        .forEach(
            function(expense) {

                // -----------------------------------------
                // FIND GROUP
                // -----------------------------------------

                const group =
                    SmartSplit.groups().find(
                        function(existingGroup) {

                            return (
                                String(
                                    existingGroup.id
                                ) ===
                                String(
                                    expense.groupId
                                )
                            );

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
                    document.createElement(
                        "div"
                    );


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

            }
        );


    // -----------------------------------------
    // CHECK IF ANY VALID EXPENSES REMAIN
    // -----------------------------------------

    if (
        !recentExpenses.children.length
    ) {

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


// =====================================================
// UPDATE WHEN DATA CHANGES
// =====================================================

window.addEventListener(
    "smartsplit:updated",
    function() {

        displayGroups();

        calculateFinancialSummary();

        displayRecentExpenses();

    }
);