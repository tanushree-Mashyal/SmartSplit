// ===============================
// SmartSplit - Add / Edit Expense
// ===============================


const form =
    document.getElementById("expense-form");

const groupSelect =
    document.getElementById("group-select");

const paidBySelect =
    document.getElementById("paid-by");

const peopleContainer =
    document.getElementById("people-container");

const submitExpenseButton =
    document.getElementById(
        "submitExpenseButton"
    );

const pageSubtitle =
    document.getElementById(
        "pageSubtitle"
    );


// =================================================
// EDIT MODE
// =================================================

const editingExpenseId =
    localStorage.getItem(
        "editingExpenseId"
    );

let editingExpense = null;


if (editingExpenseId) {

    editingExpense =
        SmartSplit.expenses().find(
            function(expense) {

                return String(expense.id) ===
                       String(editingExpenseId);

            }
        );

}


// =================================================
// LOAD GROUPS
// =================================================

function populateGroups() {

    const groups =
        SmartSplit.groups();


    groupSelect.innerHTML =
        '<option value="">Select group</option>';


    groups.forEach(
        function(group) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                group.id;

            option.textContent =
                group.name;

            groupSelect.appendChild(
                option
            );

        }
    );


    // ---------------------------------------------
    // EDIT MODE
    // ---------------------------------------------

    if (editingExpense) {

        groupSelect.value =
            editingExpense.groupId;

        loadGroupMembers(
            true
        );

        return;
    }


    // ---------------------------------------------
    // NORMAL ADD MODE
    // ---------------------------------------------

    const selectedGroup =
        SmartSplit.selectedGroupId();


    if (selectedGroup) {

        groupSelect.value =
            selectedGroup;

        loadGroupMembers();

    }

}


// =================================================
// LOAD MEMBERS OF SELECTED GROUP
// =================================================

function loadGroupMembers(
    isEditing = false
) {

    const groupId =
        groupSelect.value;


    paidBySelect.innerHTML =
        '<option value="">Select person</option>';


    peopleContainer.innerHTML =
        "";


    document.getElementById(
        "unequal-inputs"
    ).innerHTML = "";


    if (!groupId) {

        peopleContainer.innerHTML =
            "<p>Select a group first.</p>";

        return;

    }


    const groups =
        SmartSplit.groups();


    const group =
        groups.find(
            function(g) {

                return String(g.id) ===
                       String(groupId);

            }
        );


    if (!group) {

        peopleContainer.innerHTML =
            "<p>Group not found.</p>";

        return;

    }


    const members =
        group.memberNames || [];


    if (members.length === 0) {

        peopleContainer.innerHTML =
            "<p>This group has no members.</p>";

        return;

    }


    // =================================================
    // PAID BY
    // =================================================

    members.forEach(
        function(member) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                member;

            option.textContent =
                member;

            paidBySelect.appendChild(
                option
            );

        }
    );


    // =================================================
    // PEOPLE INVOLVED
    // =================================================

    members.forEach(
        function(member, index) {

            const wrapper =
                document.createElement(
                    "div"
                );


            const checkbox =
                document.createElement(
                    "input"
                );


            checkbox.type =
                "checkbox";

            checkbox.id =
                "person-" + index;

            checkbox.name =
                "people";

            checkbox.value =
                member;


            const label =
                document.createElement(
                    "label"
                );


            label.htmlFor =
                "person-" + index;

            label.textContent =
                member;


            wrapper.appendChild(
                checkbox
            );

            wrapper.appendChild(
                label
            );

            peopleContainer.appendChild(
                wrapper
            );


            checkbox.addEventListener(
                "change",
                function() {

                    if (
                        document.getElementById(
                            "equal"
                        ).checked
                    ) {

                        calculateEqualSplit();

                    }


                    if (
                        document.getElementById(
                            "unequal"
                        ).checked
                    ) {

                        createUnequalInputs();

                    }

                }
            );

        }
    );


    // =================================================
    // FILL EDIT DATA
    // =================================================

    if (
        isEditing &&
        editingExpense
    ) {

        paidBySelect.value =
            editingExpense.paidBy;


        const selectedPeople =
            editingExpense.people || [];


        document
            .querySelectorAll(
                'input[name="people"]'
            )
            .forEach(
                function(checkbox) {

                    checkbox.checked =
                        selectedPeople.some(
                            function(person) {

                                return person
                                    .toLowerCase() ===
                                    checkbox.value
                                        .toLowerCase();

                            }
                        );

                }
            );


        if (
            editingExpense.splitMethod ===
            "equal"
        ) {

            document.getElementById(
                "equal"
            ).checked = true;

            calculateEqualSplit();

        }


        if (
            editingExpense.splitMethod ===
            "unequal"
        ) {

            document.getElementById(
                "unequal"
            ).checked = true;

            createUnequalInputs();

        }

    }

}


// =================================================
// GROUP CHANGE
// =================================================

groupSelect.addEventListener(
    "change",
    function() {

        SmartSplit.selectGroup(
            groupSelect.value
        );

        loadGroupMembers();

    }
);


// =================================================
// GET PEOPLE
// =================================================

function getPeople() {

    return [
        ...document.querySelectorAll(
            'input[name="people"]:checked'
        )
    ].map(
        function(input) {

            return input.value;

        }
    );

}


// =================================================
// EQUAL SPLIT
// =================================================

function calculateEqualSplit() {

    const amount =
        Number(
            document.getElementById(
                "amount"
            ).value
        );


    const people =
        getPeople();


    const result =
        document.getElementById(
            "split-result"
        );


    if (
        document.getElementById(
            "equal"
        ).checked &&
        amount > 0 &&
        people.length
    ) {

        result.textContent =
            `Each person pays: ${SmartSplit.money(
                amount / people.length
            )}`;

    }

    else {

        result.textContent =
            "Select people and enter an amount.";

    }

}


// =================================================
// UNEQUAL SPLIT
// =================================================

function createUnequalInputs() {

    const container =
        document.getElementById(
            "unequal-inputs"
        );


    container.innerHTML =
        "";


    const people =
        getPeople();


    people.forEach(
        function(person) {

            const label =
                document.createElement(
                    "label"
                );


            label.textContent =
                `${person}: ${SmartSplit.currencySymbol()} `;


            const input =
                document.createElement(
                    "input"
                );


            input.type =
                "number";

            input.min =
                "0";

            input.step =
                "0.01";

            input.className =
                "unequal-amount";

            input.dataset.person =
                person;


            // -----------------------------------------
            // If editing, load previous share
            // -----------------------------------------

            if (editingExpense) {

                const shares =
                    editingExpense.shares ||
                    {};

                const storedPerson =
                    Object.keys(shares)
                        .find(
                            function(name) {

                                return name
                                    .toLowerCase() ===
                                    person
                                        .toLowerCase();

                            }
                        );


                if (storedPerson) {

                    input.value =
                        shares[
                            storedPerson
                        ];

                }

            }


            input.addEventListener(
                "input",
                calculateUnequalTotal
            );


            container.appendChild(
                label
            );

            container.appendChild(
                input
            );

            container.appendChild(
                document.createElement(
                    "br"
                )
            );

            container.appendChild(
                document.createElement(
                    "br"
                )
            );

        }
    );


    calculateUnequalTotal();

}


// =================================================
// UNEQUAL TOTAL
// =================================================

function calculateUnequalTotal() {

    const amount =
        Number(
            document.getElementById(
                "amount"
            ).value
        );


    const inputs =
        document.querySelectorAll(
            ".unequal-amount"
        );


    let total =
        0;


    inputs.forEach(
        function(input) {

            total +=
                Number(
                    input.value || 0
                );

        }
    );


    const result =
        document.getElementById(
            "split-result"
        );


    result.textContent =
        `Total: ${SmartSplit.money(total)} / ${SmartSplit.money(amount)}`;


    if (
        Math.abs(
            total - amount
        ) <= 0.005 &&
        amount > 0
    ) {

        result.textContent +=
            " ✓ Split is valid";

    }

}


// =================================================
// AMOUNT CHANGE
// =================================================

document.getElementById(
    "amount"
).addEventListener(
    "input",
    function() {

        if (
            document.getElementById(
                "equal"
            ).checked
        ) {

            calculateEqualSplit();

        }


        if (
            document.getElementById(
                "unequal"
            ).checked
        ) {

            calculateUnequalTotal();

        }

    }
);


// =================================================
// EQUAL SELECTED
// =================================================

document.getElementById(
    "equal"
).addEventListener(
    "change",
    function() {

        document.getElementById(
            "unequal-inputs"
        ).innerHTML = "";


        calculateEqualSplit();

    }
);


// =================================================
// UNEQUAL SELECTED
// =================================================

document.getElementById(
    "unequal"
).addEventListener(
    "change",
    function() {

        document.getElementById(
            "split-result"
        ).textContent = "";


        createUnequalInputs();

    }
);


// =================================================
// READ RECEIPT
// =================================================

function readReceipt(file) {

    return new Promise(
        function(resolve, reject) {

            if (!file) {

                resolve(null);

                return;

            }


            // Maximum 2 MB
            if (
                file.size >
                2 * 1024 * 1024
            ) {

                reject(
                    new Error(
                        "Receipt must be smaller than 2 MB."
                    )
                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function() {

                    resolve({

                        name:
                            file.name,

                        type:
                            file.type,

                        size:
                            file.size,

                        data:
                            reader.result

                    });

                };


            reader.onerror =
                function() {

                    reject(
                        new Error(
                            "Could not read receipt."
                        )
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


// =================================================
// FORM SUBMISSION
// =================================================

form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        // ---------------------------------------------
        // BASIC VALUES
        // ---------------------------------------------

        const groupId =
            groupSelect.value;


        const expenseName =
            document.getElementById(
                "expense-name"
            ).value.trim();


        const amount =
            Number(
                document.getElementById(
                    "amount"
                ).value
            );


        const paidBy =
            paidBySelect.value;


        const date =
            document.getElementById(
                "date"
            ).value;


        const category =
            document.getElementById(
                "category"
            ).value;


        const notes =
            document.getElementById(
                "notes"
            ).value.trim();


        const people =
            getPeople();


        const splitMethod =
            document.querySelector(
                'input[name="split-method"]:checked'
            );


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!groupId) {

            alert(
                "Please select a group."
            );

            return;

        }


        if (
            !expenseName ||
            amount <= 0
        ) {

            alert(
                "Enter a valid expense name and amount."
            );

            return;

        }


        if (!paidBy) {

            alert(
                "Please select who paid."
            );

            return;

        }


        if (!date) {

            alert(
                "Please select a date."
            );

            return;

        }


        if (!people.length) {

            alert(
                "Please select at least one person involved."
            );

            return;

        }


        if (!splitMethod) {

            alert(
                "Please select a split method."
            );

            return;

        }


        if (
            !people.some(
                function(person) {

                    return person.toLowerCase() ===
                           paidBy.toLowerCase();

                }
            )
        ) {

            alert(
                "The person who paid must be included in People Involved."
            );

            return;

        }


        // ---------------------------------------------
        // CALCULATE SHARES
        // ---------------------------------------------

        const shares =
            {};


        if (
            splitMethod.value ===
            "equal"
        ) {

            const share =
                amount /
                people.length;


            people.forEach(
                function(person) {

                    shares[person] =
                        share;

                }
            );

        }


        if (
            splitMethod.value ===
            "unequal"
        ) {

            const inputs =
                document.querySelectorAll(
                    ".unequal-amount"
                );


            let total =
                0;


            inputs.forEach(
                function(input) {

                    const value =
                        Number(
                            input.value || 0
                        );


                    shares[
                        input.dataset.person
                    ] =
                        value;


                    total +=
                        value;

                }
            );


            if (
                Math.abs(
                    total - amount
                ) >
                0.005
            ) {

                alert(
                    "The unequal split amounts must equal the total expense."
                );

                return;

            }

        }


        // ---------------------------------------------
        // RECEIPT
        // ---------------------------------------------

        const receiptInput =
            document.getElementById(
                "receipt"
            );


        let receipt =
            null;


        try {

            if (
                receiptInput.files &&
                receiptInput.files.length > 0
            ) {

                receipt =
                    await readReceipt(
                        receiptInput.files[0]
                    );

            }

            else if (
                editingExpense &&
                editingExpense.receipt
            ) {

                // Keep old receipt if no new
                // receipt was selected.
                receipt =
                    editingExpense.receipt;

            }

        }

        catch (error) {

            alert(
                error.message
            );

            return;

        }


        // =================================================
        // EDIT EXISTING EXPENSE
        // =================================================

        if (editingExpense) {

            const expenses =
                SmartSplit.expenses();


            const index =
                expenses.findIndex(
                    function(existingExpense) {

                        return String(
                            existingExpense.id
                        ) === String(
                            editingExpense.id
                        );

                    }
                );


            if (index === -1) {

                alert(
                    "The expense could not be found."
                );


                localStorage.removeItem(
                    "editingExpenseId"
                );


                window.location.href =
                    "group-details.html";


                return;

            }


            // Keep original expense object
            // and update only editable fields.

            expenses[index] = {

                ...expenses[index],

                groupId:
                    groupId,

                expenseName:
                    expenseName,

                amount:
                    amount,

                paidBy:
                    paidBy,

                date:
                    date,

                category:
                    category,

                people:
                    people,

                splitMethod:
                    splitMethod.value,

                shares:
                    shares,

                notes:
                    notes,

                receipt:
                    receipt

            };


            SmartSplit.saveExpenses(
                expenses
            );


            SmartSplit.refreshGroupTotal(
                groupId
            );


            SmartSplit.selectGroup(
                groupId
            );


            localStorage.removeItem(
                "editingExpenseId"
            );


            alert(
                "Expense updated successfully!"
            );


            window.location.href =
                "group-details.html";


            return;

        }


        // =================================================
        // ADD NEW EXPENSE
        // =================================================

        const expense = {

            id:
                Date.now(),

            groupId:
                groupId,

            expenseName:
                expenseName,

            amount:
                amount,

            paidBy:
                paidBy,

            date:
                date,

            category:
                category,

            people:
                people,

            splitMethod:
                splitMethod.value,

            shares:
                shares,

            notes:
                notes,

            receipt:
                receipt

        };


        const expenses =
            SmartSplit.expenses();


        expenses.push(
            expense
        );


        SmartSplit.saveExpenses(
            expenses
        );


        SmartSplit.refreshGroupTotal(
            groupId
        );


        SmartSplit.selectGroup(
            groupId
        );


        alert(
            "Expense added successfully!"
        );


        window.location.href =
            "group-details.html";

    }
);


// =================================================
// INITIAL LOAD
// =================================================

populateGroups();


// =================================================
// FILL BASIC EDIT DETAILS
// =================================================

if (editingExpense) {

    document.getElementById(
        "expense-name"
    ).value =
        editingExpense.expenseName || "";


    document.getElementById(
        "amount"
    ).value =
        editingExpense.amount || "";


    document.getElementById(
        "date"
    ).value =
        editingExpense.date || "";


    document.getElementById(
        "category"
    ).value =
        editingExpense.category || "";


    document.getElementById(
        "notes"
    ).value =
        editingExpense.notes || "";


    submitExpenseButton.textContent =
        "Save Changes";


    pageSubtitle.textContent =
        "Edit Expense";

}