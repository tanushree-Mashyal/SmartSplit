// =================================================
// SmartSplit - Group Details
// =================================================


// =================================================
// ELEMENTS
// =================================================

const groupName =
    document.getElementById(
        "groupName"
    );

const groupMemberCount =
    document.getElementById(
        "groupMemberCount"
    );

const memberList =
    document.getElementById(
        "memberList"
    );

const paidList =
    document.getElementById(
        "paidList"
    );

const oweList =
    document.getElementById(
        "oweList"
    );

const settlementStatus =
    document.getElementById(
        "settlementStatus"
    );

const settleButton =
    document.getElementById(
        "settleButton"
    );

const addExpenseButton =
    document.getElementById(
        "addExpenseButton"
    );


// =================================================
// GET CURRENT USER
// =================================================

function getYourName() {

    const profile =
        SmartSplit.profile();

    return (
        profile.name ||
        "Tanushree"
    ).trim();

}


// =================================================
// FORMAT RECEIPT
// =================================================

function openReceipt(receipt) {

    if (!receipt || !receipt.data) {

        alert(
            "Receipt is not available."
        );

        return;

    }


    const newWindow =
        window.open(
            "",
            "_blank"
        );


    if (!newWindow) {

        alert(
            "Please allow pop-ups to view the receipt."
        );

        return;

    }


    newWindow.document.write(
        `
        <!DOCTYPE html>

        <html>

        <head>

            <title>
                ${receipt.name || "Receipt"}
            </title>

            <style>

                body {
                    margin: 0;
                    padding: 20px;
                    background: #0f172a;
                    color: white;
                    font-family: Arial, sans-serif;
                    text-align: center;
                }

                img {
                    max-width: 95%;
                    max-height: 90vh;
                    border-radius: 10px;
                }

                iframe {
                    width: 95%;
                    height: 90vh;
                    border: none;
                }

            </style>

        </head>

        <body>

            <h2>
                ${receipt.name || "Receipt"}
            </h2>

            ${
                receipt.type === "application/pdf"

                ?

                `<iframe
                    src="${receipt.data}">
                </iframe>`

                :

                `<img
                    src="${receipt.data}"
                    alt="Receipt">
                `
            }

        </body>

        </html>
        `
    );


    newWindow.document.close();

}


// =================================================
// RENDER PAGE
// =================================================

function renderSmartSplit() {

    const group =
        SmartSplit.selectedGroup();


    // =================================================
    // NO GROUP SELECTED
    // =================================================

    if (!group) {

        groupName.textContent =
            "No group selected";


        groupMemberCount.textContent =
            "";


        memberList.innerHTML =
            "<li>No group selected.</li>";


        paidList.innerHTML =
            "<p>No expenses yet.</p>";


        oweList.innerHTML =
            "<p>No outstanding balances.</p>";


        settlementStatus.textContent =
            "Nothing to settle yet.";


        settleButton.disabled =
            true;


        return;

    }


    settleButton.disabled =
        false;


    // =================================================
    // GROUP INFORMATION
    // =================================================

    groupName.textContent =
        group.name;


    const members =
        group.memberNames || [];


    groupMemberCount.textContent =
        `${members.length} member${
            members.length === 1
                ? ""
                : "s"
        }`;


    // =================================================
    // MEMBER LIST
    // =================================================

    memberList.innerHTML =
        "";


    if (!members.length) {

        memberList.innerHTML =
            "<li>No members added yet.</li>";

    }

    else {

        members.forEach(
            function(member) {

                const li =
                    document.createElement(
                        "li"
                    );


                li.textContent =
                    member;


                memberList.appendChild(
                    li
                );

            }
        );

    }


    // =================================================
    // GROUP EXPENSES ONLY
    // =================================================

    const expenses =
        SmartSplit.getGroupExpenses(
            group.id
        );


    // =================================================
    // DEBUG - TEMPORARY
    // =================================================

    console.log("GROUP:", group);
    console.log("ALL EXPENSES:", SmartSplit.expenses());
    console.log("GROUP EXPENSES:", expenses);
    console.log("SELECTED GROUP:", SmartSplit.selectedGroupId());


    // =================================================
    // PAID LIST
    // =================================================

    paidList.innerHTML =
        "";


    if (!expenses.length) {

        paidList.innerHTML =
            "<p>No expenses yet.</p>";

    }

    else {

        expenses.forEach(
            function(expense) {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.style.position =
                    "relative";


                // =================================================
                // EXPENSE TEXT
                // =================================================

                const p =
                    document.createElement(
                        "p"
                    );


                p.textContent =
                    `${expense.expenseName || "Expense"}: ` +
                    `${expense.paidBy} paid ` +
                    `${SmartSplit.money(
                        expense.amount
                    )}`;


                wrapper.appendChild(
                    p
                );


                // =================================================
                // EDIT EXPENSE
                // =================================================

                const editButton =
                    document.createElement(
                        "button"
                    );


                editButton.type =
                    "button";


                editButton.textContent =
                    "Edit";


                editButton.addEventListener(
                    "click",
                    function() {

                        localStorage.setItem(
                            "editingExpenseId",
                            String(
                                expense.id
                            )
                        );


                        SmartSplit.selectGroup(
                            group.id
                        );


                        window.location.href =
                            "add-expense.html";

                    }
                );


                wrapper.appendChild(
                    editButton
                );


                // =================================================
                // DELETE EXPENSE
                // =================================================

                const deleteButton =
                    document.createElement(
                        "button"
                    );


                deleteButton.type =
                    "button";


                deleteButton.textContent =
                    "Delete";


                deleteButton.addEventListener(
                    "click",
                    function() {

                        const confirmed =
                            confirm(
                                `Delete "${
                                    expense.expenseName ||
                                    "this expense"
                                }"?\n\n` +
                                `This expense will be permanently removed.`
                            );


                        if (!confirmed) {

                            return;

                        }


                        const updatedExpenses =
                            SmartSplit.expenses()
                                .filter(
                                    function(
                                        existingExpense
                                    ) {

                                        return String(
                                            existingExpense.id
                                        ) !== String(
                                            expense.id
                                        );

                                    }
                                );


                        SmartSplit.saveExpenses(
                            updatedExpenses
                        );


                        SmartSplit.refreshGroupTotal(
                            group.id
                        );


                        renderSmartSplit();

                    }
                );


                wrapper.appendChild(
                    deleteButton
                );


                // =================================================
                // VIEW RECEIPT
                // =================================================

                if (
                    expense.receipt &&
                    expense.receipt.data
                ) {

                    const receiptButton =
                        document.createElement(
                            "button"
                        );


                    receiptButton.type =
                        "button";


                    receiptButton.textContent =
                        "View Receipt";


                    receiptButton.addEventListener(
                        "click",
                        function() {

                            openReceipt(
                                expense.receipt
                            );

                        }
                    );


                    wrapper.appendChild(
                        receiptButton
                    );

                }


                paidList.appendChild(
                    wrapper
                );

            }
        );

    }


    // =================================================
    // WHO OWES WHOM
    // =================================================
    //
    // IMPORTANT:
    // We calculate debts from EACH EXPENSE separately.
    //
    // Example:
    //
    // Dinner = ₹2500
    // Shravani paid ₹2500
    // 5 people involved
    // Each share = ₹500
    //
    // Tanushree owes Shravani ₹500
    //
    // We do NOT cancel this against another expense.
    //
    // =================================================

    oweList.innerHTML =
        "";


    const yourName =
        getYourName();


    let outstanding =
        false;


    // =================================================
    // PROCESS EVERY EXPENSE
    // =================================================

    expenses.forEach(
        function(expense) {

            const people =
                expense.people || [];


            const shares =
                expense.shares || {};


            const paidBy =
                expense.paidBy;


            if (
                !paidBy ||
                people.length === 0
            ) {

                return;

            }


            // ---------------------------------------------
            // Check every person involved
            // ---------------------------------------------

            people.forEach(
                function(person) {

                    // Payer does not owe themselves
                    if (
                        person.toLowerCase() ===
                        paidBy.toLowerCase()
                    ) {

                        return;

                    }


                    const share =
                        Number(
                            shares[person] || 0
                        );


                    if (
                        share <= 0.005
                    ) {

                        return;

                    }


                    outstanding =
                        true;


                    const p =
                        document.createElement(
                            "p"
                        );


                    // -----------------------------------------
                    // If YOU owe the payer
                    // -----------------------------------------

                    if (
                        person.toLowerCase() ===
                        yourName.toLowerCase()
                    ) {

                        p.textContent =
                            `You owe ${paidBy} ` +
                            `${SmartSplit.money(
                                share
                            )}`;

                    }


                    // -----------------------------------------
                    // If another person owes YOU
                    // -----------------------------------------

                    else if (
                        paidBy.toLowerCase() ===
                        yourName.toLowerCase()
                    ) {

                        p.textContent =
                            `${person} owes you ` +
                            `${SmartSplit.money(
                                share
                            )}`;

                    }


                    // -----------------------------------------
                    // If neither is YOU
                    // -----------------------------------------

                    else {

                        p.textContent =
                            `${person} owes ` +
                            `${paidBy} ` +
                            `${SmartSplit.money(
                                share
                            )}`;

                    }


                    oweList.appendChild(
                        p
                    );

                }
            );

        }
    );


    // =================================================
    // NO OUTSTANDING BALANCES
    // =================================================

    if (!outstanding) {

        oweList.innerHTML =
            "<p>No outstanding balances.</p>";

    }


    // =================================================
    // SETTLEMENT STATUS
    // =================================================

    if (!expenses.length) {

        settlementStatus.textContent =
            "Nothing to settle yet.";

    }

    else if (!outstanding) {

        settlementStatus.textContent =
            "All expenses are settled.";

    }

    else {

        settlementStatus.textContent =
            "There are outstanding balances.";

    }

}


// =================================================
// ADD EXPENSE BUTTON
// =================================================

addExpenseButton.addEventListener(
    "click",
    function() {

        localStorage.removeItem(
            "editingExpenseId"
        );


        window.location.href =
            "add-expense.html";

    }
);


// =================================================
// SETTLE UP BUTTON
// =================================================

settleButton.addEventListener(
    "click",
    function() {

        const group =
            SmartSplit.selectedGroup();


        if (!group) {

            alert(
                "Please select a group first."
            );

            return;

        }


        const expenses =
            SmartSplit.getGroupExpenses(
                group.id
            );


        if (!expenses.length) {

            alert(
                "There are no expenses to settle."
            );

            return;

        }


        window.location.href =
            "settlements.html";

    }
);


// =================================================
// INITIAL LOAD
// =================================================

renderSmartSplit();


// =================================================
// REFRESH WHEN DATA CHANGES
// =================================================

window.addEventListener(
    "smartsplit:updated",
    function() {

        renderSmartSplit();

    }
);
