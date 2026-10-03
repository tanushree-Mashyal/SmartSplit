// ==========================================
// SmartSplit - Settlements
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const youOweList =
    document.getElementById("youOweList");

const othersOweYouList =
    document.getElementById("othersOweYouList");

const totalYouOwe =
    document.getElementById("totalYouOwe");

const totalOthersOweYou =
    document.getElementById("totalOthersOweYou");

const netBalance =
    document.getElementById("netBalance");


// ==========================================
// REMINDER SETTINGS
// ==========================================

const REMINDER_INTERVAL =
    24 * 60 * 60 * 1000;

const LAST_REMINDER_KEY =
    "smartsplit_last_payment_reminder";

const MUTE_REMINDER_KEY =
    "smartsplit_payment_reminder_muted_until";


// ==========================================
// CURRENT USER
// ==========================================

function getYourName() {

    const profile =
        SmartSplit.profile();

    return (
        profile.name ||
        "Tanushree"
    ).trim();
}


// ==========================================
// GET SHARE
// Case-insensitive
// ==========================================

function getShare(shares, personName) {

    if (!shares || !personName) {
        return 0;
    }

    const target =
        personName.trim().toLowerCase();

    for (
        const [name, amount]
        of Object.entries(shares)
    ) {

        if (
            name.trim().toLowerCase() ===
            target
        ) {

            return Number(amount || 0);

        }

    }

    return 0;
}


// ==========================================
// GET ORIGINAL STORED PERSON NAME
// ==========================================

function getStoredPersonName(
    shares,
    personName
) {

    if (!shares || !personName) {
        return personName;
    }

    const target =
        personName.trim().toLowerCase();

    for (
        const name
        of Object.keys(shares)
    ) {

        if (
            name.trim().toLowerCase() ===
            target
        ) {

            return name;

        }

    }

    return personName;
}


// ==========================================
// GET GROUP NAME
// ==========================================

function getGroupName(groupId) {

    // Old expenses may not have a groupId.
    if (!groupId) {
        return "Unassigned Group";
    }

    const groups =
        SmartSplit.groups();

    const group =
        groups.find(function (group) {

            return String(group.id) ===
                String(groupId);

        });


    if (group) {

        return (
            group.name ||
            group.groupName ||
            "Unnamed Group"
        );

    }


    return "Unknown Group";
}


// ==========================================
// CALCULATE SETTLEMENTS
//
// Positive balance:
// You owe that person.
//
// Negative balance:
// That person owes you.
//
// Also stores every expense so that
// the UI can show the reason.
// ==========================================

function calculateSettlementBalances() {

    const expenses =
        SmartSplit.expenses();

    const yourName =
        getYourName();

    const yourNameLower =
        yourName.toLowerCase();


    const balances = {};

    const breakdown = {};


    // ======================================
    // PROCESS EVERY EXPENSE
    // ======================================

    expenses.forEach(function (expense) {

        const people =
            expense.people || [];

        const shares =
            expense.shares || {};

        const paidBy =
            (expense.paidBy || "").trim();


        if (!paidBy) {
            return;
        }


        const paidByLower =
            paidBy.toLowerCase();


        // ==================================
        // SOMEONE ELSE PAID
        // ==================================

        if (
            paidByLower !==
            yourNameLower
        ) {

            const yourShare =
                getShare(
                    shares,
                    yourName
                );


            if (yourShare <= 0) {
                return;
            }


            const payer =
                getStoredPersonName(
                    shares,
                    paidBy
                );


            if (
                balances[payer] ===
                undefined
            ) {

                balances[payer] = 0;

            }


            // You owe the payer
            balances[payer] +=
                yourShare;


            // Create breakdown entry
            if (!breakdown[payer]) {
                breakdown[payer] = [];
            }


            breakdown[payer].push({

                expenseName:
                    expense.expenseName ||
                    "Expense",

                amount:
                    yourShare,

                type:
                    "owe",

                paidBy:
                    paidBy,

                groupName:
                    getGroupName(
                        expense.groupId
                    ),

                date:
                    expense.date || ""

            });

        }


        // ==================================
        // YOU PAID
        // ==================================

        else {

            people.forEach(function (person) {

                const personName =
                    (person || "").trim();


                if (!personName) {
                    return;
                }


                // Ignore yourself
                if (
                    personName.toLowerCase() ===
                    yourNameLower
                ) {

                    return;

                }


                const theirShare =
                    getShare(
                        shares,
                        personName
                    );


                if (theirShare <= 0) {
                    return;
                }


                const storedPerson =
                    getStoredPersonName(
                        shares,
                        personName
                    );


                if (
                    balances[storedPerson] ===
                    undefined
                ) {

                    balances[storedPerson] = 0;

                }


                // They owe you
                balances[storedPerson] -=
                    theirShare;


                // Create breakdown entry
                if (
                    !breakdown[storedPerson]
                ) {

                    breakdown[storedPerson] = [];

                }


                breakdown[storedPerson].push({

                    expenseName:
                        expense.expenseName ||
                        "Expense",

                    amount:
                        theirShare,

                    type:
                        "receive",

                    paidBy:
                        paidBy,

                    groupName:
                        getGroupName(
                            expense.groupId
                        ),

                    date:
                        expense.date || ""

                });

            });

        }

    });


    return {

        balances:
            balances,

        breakdown:
            breakdown

    };
}


// ==========================================
// PEOPLE YOU OWE
// ==========================================

function getPeopleYouOwe(balances) {

    const result = [];


    Object.entries(balances).forEach(
        function ([person, balance]) {

            if (balance > 0.005) {

                result.push({

                    person:
                        person,

                    amount:
                        balance

                });

            }

        }
    );


    result.sort(
        function (a, b) {

            return b.amount -
                a.amount;

        }
    );


    return result;
}


// ==========================================
// PEOPLE WHO OWE YOU
// ==========================================

function getPeopleWhoOweYou(balances) {

    const result = [];


    Object.entries(balances).forEach(
        function ([person, balance]) {

            if (balance < -0.005) {

                result.push({

                    person:
                        person,

                    amount:
                        Math.abs(balance)

                });

            }

        }
    );


    result.sort(
        function (a, b) {

            return b.amount -
                a.amount;

        }
    );


    return result;
}


// ==========================================
// CREATE REMINDER AREA
// ==========================================

function createReminderArea() {

    let area =
        document.getElementById(
            "paymentReminderArea"
        );


    if (area) {
        return area;
    }


    area =
        document.createElement("div");

    area.id =
        "paymentReminderArea";


    const heading =
        document.createElement("h3");

    heading.textContent =
        "Payment Reminders";


    const message =
        document.createElement("p");

    message.id =
        "paymentReminderMessage";


    const button =
        document.createElement("button");

    button.type =
        "button";

    button.id =
        "paymentReminderButton";


    area.appendChild(
        heading
    );

    area.appendChild(
        message
    );

    area.appendChild(
        button
    );


    youOweList.parentElement.insertBefore(
        area,
        youOweList
    );


    return area;
}


// ==========================================
// UPDATE REMINDER AREA
// ==========================================

function updateReminderArea() {

    createReminderArea();


    const message =
        document.getElementById(
            "paymentReminderMessage"
        );

    const button =
        document.getElementById(
            "paymentReminderButton"
        );


    const profile =
        SmartSplit.profile();


    if (!profile.reminder) {

        message.textContent =
            "Payment reminders are disabled in Profile.";

        button.textContent =
            "Enable in Profile";

        button.onclick =
            function () {

                window.location.href =
                    "profile.html";

            };

        return;
    }


    const mutedUntil =
        Number(
            localStorage.getItem(
                MUTE_REMINDER_KEY
            )
        ) || 0;


    if (
        Date.now() <
        mutedUntil
    ) {

        const remaining =
            mutedUntil -
            Date.now();


        const hours =
            Math.ceil(
                remaining /
                (60 * 60 * 1000)
            );


        message.textContent =
            `Reminders are muted for about ${hours} hour(s).`;


        button.textContent =
            "Unmute Reminders";


        button.onclick =
            function () {

                localStorage.removeItem(
                    MUTE_REMINDER_KEY
                );

                updateReminderArea();

            };


        return;
    }


    message.textContent =
        "You will receive a reminder every 24 hours while you have pending payments.";


    button.textContent =
        "Mute for 24 Hours";


    button.onclick =
        function () {

            localStorage.setItem(
                MUTE_REMINDER_KEY,
                String(
                    Date.now() +
                    REMINDER_INTERVAL
                )
            );


            updateReminderArea();

        };
}


// ==========================================
// PAYMENT REMINDER
// ==========================================

function showPaymentReminder(
    peopleYouOwe
) {

    if (!peopleYouOwe.length) {
        return;
    }


    const profile =
        SmartSplit.profile();


    if (!profile.reminder) {
        return;
    }


    const now =
        Date.now();


    const lastReminder =
        Number(
            localStorage.getItem(
                LAST_REMINDER_KEY
            )
        ) || 0;


    const mutedUntil =
        Number(
            localStorage.getItem(
                MUTE_REMINDER_KEY
            )
        ) || 0;


    if (
        now <
        mutedUntil
    ) {

        return;
    }


    if (
        lastReminder &&
        now - lastReminder <
        REMINDER_INTERVAL
    ) {

        return;
    }


    const lines =
        peopleYouOwe.map(
            function (item) {

                return (
                    item.person +
                    " - " +
                    SmartSplit.money(
                        item.amount
                    )
                );

            }
        );


    alert(
        "Payment Reminder\n\n" +
        "You still owe:\n\n" +
        lines.join("\n")
    );


    localStorage.setItem(
        LAST_REMINDER_KEY,
        String(now)
    );
}


// ==========================================
// CREATE EXPENSE BREAKDOWN
// ==========================================

function createExpenseBreakdown(
    person,
    breakdownItems
) {

    const container =
        document.createElement("div");


    const heading =
        document.createElement("strong");

    heading.textContent =
        "Expense breakdown:";


    container.appendChild(
        heading
    );


    const list =
        document.createElement("ul");


    breakdownItems.forEach(
        function (item) {

            const li =
                document.createElement("li");


            const direction =
                item.type === "owe"
                    ? "You owe"
                    : "You paid for";


            let text =
                `${item.expenseName} — ${direction} ${SmartSplit.money(item.amount)}`;


            if (item.groupName) {

                text +=
                    ` (${item.groupName})`;

            }


            if (item.date) {

                text +=
                    ` — ${item.date}`;

            }


            li.textContent =
                text;


            list.appendChild(
                li
            );

        }
    );


    container.appendChild(
        list
    );


    return container;
}


// ==========================================
// CREATE "YOU OWE" CARD
// ==========================================

function createYouOweCard(
    person,
    amount,
    breakdownItems
) {

    const card =
        document.createElement("div");

    card.className =
        "settlement-card";


    const title =
        document.createElement("h3");

    title.textContent =
        person;


    const message =
        document.createElement("p");

    message.textContent =
        `You owe ${person} ${SmartSplit.money(amount)}`;


    const breakdown =
        createExpenseBreakdown(
            person,
            breakdownItems
        );


    // ======================================
    // PAYMENT BUTTON
    // ======================================

    const settleButton =
        document.createElement("button");

    settleButton.type =
        "button";

    settleButton.textContent =
        "Pay / Settle Up";


    // ======================================
    // PAYMENT BOX
    // ======================================

    const paymentBox =
        document.createElement("div");

    paymentBox.className =
        "payment-box";

    paymentBox.style.display =
        "none";


    const label =
        document.createElement("label");

    label.textContent =
        `${person}'s UPI ID:`;


    const input =
        document.createElement("input");

    input.type =
        "text";

    input.placeholder =
        "example@upi";


    const amountText =
        document.createElement("p");

    amountText.textContent =
        `Payment amount: ${SmartSplit.money(amount)}`;


    const payButton =
        document.createElement("button");

    payButton.type =
        "button";

    payButton.textContent =
        "Pay via PhonePe / UPI";


    settleButton.addEventListener(
        "click",
        function () {

            if (
                paymentBox.style.display ===
                "none"
            ) {

                paymentBox.style.display =
                    "block";

                settleButton.textContent =
                    "Close Payment";

            } else {

                paymentBox.style.display =
                    "none";

                settleButton.textContent =
                    "Pay / Settle Up";

            }

        }
    );


    payButton.addEventListener(
        "click",
        function () {

            payWithPhonePe(
                person,
                amount,
                input.value.trim()
            );

        }
    );


    paymentBox.appendChild(
        label
    );

    paymentBox.appendChild(
        input
    );

    paymentBox.appendChild(
        amountText
    );

    paymentBox.appendChild(
        payButton
    );


    card.appendChild(
        title
    );

    card.appendChild(
        message
    );

    card.appendChild(
        breakdown
    );

    card.appendChild(
        settleButton
    );

    card.appendChild(
        paymentBox
    );


    return card;
}


// ==========================================
// CREATE "OTHERS OWE YOU" CARD
// ==========================================

function createOthersOweCard(
    person,
    amount,
    breakdownItems
) {

    const card =
        document.createElement("div");

    card.className =
        "settlement-card";


    const title =
        document.createElement("h3");

    title.textContent =
        person;


    const message =
        document.createElement("p");

    message.textContent =
        `${person} owes you ${SmartSplit.money(amount)}`;


    const breakdown =
        createExpenseBreakdown(
            person,
            breakdownItems
        );


    const settleButton =
        document.createElement("button");

    settleButton.type =
        "button";

    settleButton.textContent =
        "Mark as Settled";


    settleButton.addEventListener(
        "click",
        function () {

            const confirmed =
                confirm(
                    `Have you received ${SmartSplit.money(amount)} from ${person}?`
                );


            if (!confirmed) {
                return;
            }


            alert(
                "Settlement recording will be connected to the backend later."
            );

        }
    );


    card.appendChild(
        title
    );

    card.appendChild(
        message
    );

    card.appendChild(
        breakdown
    );

    card.appendChild(
        settleButton
    );


    return card;
}


// ==========================================
// PHONEPE / UPI PAYMENT
// ==========================================

function payWithPhonePe(
    person,
    amount,
    upiId
) {

    if (!upiId) {

        alert(
            `Please enter ${person}'s UPI ID first.`
        );

        return;
    }


    if (!upiId.includes("@")) {

        alert(
            "Please enter a valid UPI ID."
        );

        return;
    }


    const upiUrl =
        "upi://pay" +
        "?pa=" +
        encodeURIComponent(upiId) +
        "&pn=" +
        encodeURIComponent(person) +
        "&am=" +
        encodeURIComponent(
            Number(amount).toFixed(2)
        ) +
        "&cu=INR";


    window.location.href =
        upiUrl;
}


// ==========================================
// DISPLAY SETTLEMENTS
// ==========================================

function displaySettlements() {

    const result =
        calculateSettlementBalances();


    const balances =
        result.balances;

    const breakdown =
        result.breakdown;


    const peopleYouOwe =
        getPeopleYouOwe(
            balances
        );


    const peopleWhoOweYou =
        getPeopleWhoOweYou(
            balances
        );


    // ======================================
    // CLEAR OLD CARDS
    // ======================================

    youOweList.innerHTML =
        "";

    othersOweYouList.innerHTML =
        "";


    let youOweAmount =
        0;

    let othersOweYouAmount =
        0;


    // ======================================
    // YOU OWE
    // ======================================

    peopleYouOwe.forEach(
        function (item) {

            youOweAmount +=
                item.amount;


            const card =
                createYouOweCard(
                    item.person,
                    item.amount,
                    breakdown[item.person] || []
                );


            youOweList.appendChild(
                card
            );

        }
    );


    // ======================================
    // OTHERS OWE YOU
    // ======================================

    peopleWhoOweYou.forEach(
        function (item) {

            othersOweYouAmount +=
                item.amount;


            const card =
                createOthersOweCard(
                    item.person,
                    item.amount,
                    breakdown[item.person] || []
                );


            othersOweYouList.appendChild(
                card
            );

        }
    );


    // ======================================
    // EMPTY STATES
    // ======================================

    if (
        !peopleYouOwe.length
    ) {

        youOweList.innerHTML =
            "<p>You don't owe anyone right now.</p>";

    }


    if (
        !peopleWhoOweYou.length
    ) {

        othersOweYouList.innerHTML =
            "<p>No one owes you money right now.</p>";

    }


    // ======================================
    // TOTAL YOU OWE
    // ======================================

    totalYouOwe.textContent =
        SmartSplit.money(
            youOweAmount
        );


    // ======================================
    // TOTAL OTHERS OWE YOU
    // ======================================

    totalOthersOweYou.textContent =
        SmartSplit.money(
            othersOweYouAmount
        );


    // ======================================
    // NET BALANCE
    // ======================================

    const net =
        othersOweYouAmount -
        youOweAmount;


    if (net > 0.005) {

        netBalance.textContent =
            "You should receive " +
            SmartSplit.money(net);

    }

    else if (net < -0.005) {

        netBalance.textContent =
            "You need to pay " +
            SmartSplit.money(
                Math.abs(net)
            );

    }

    else {

        netBalance.textContent =
            "Settled";

    }


    // ======================================
    // REMINDERS
    // ======================================

    updateReminderArea();

    showPaymentReminder(
        peopleYouOwe
    );
}


// ==========================================
// INITIAL LOAD
// ==========================================

displaySettlements();


// ==========================================
// UPDATE WHEN SMARTSPLIT DATA CHANGES
// ==========================================

window.addEventListener(
    "smartsplit:updated",
    function () {

        displaySettlements();

    }
);