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
// FIND SHARE CASE-INSENSITIVELY
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
// FIND ORIGINAL PERSON NAME
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
// FIND GROUP NAME
// ==========================================

function getGroupName(groupId) {

    const groups =
        SmartSplit.groups();

    const group =
        groups.find(function (g) {

            return String(g.id) ===
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
// CALCULATE DIRECT SETTLEMENT BALANCES
//
// Positive = You owe that person
// Negative = That person owes you
// ==========================================

function calculateSettlementBalances() {

    const expenses =
        SmartSplit.expenses();

    const groups =
        SmartSplit.groups();

    const yourName =
        getYourName();

    const balances = {};

    /*
        We also keep a breakdown.

        Example:

        breakdown["Sharvani"] = [
            {
                groupId: 1,
                groupName: "College Friends",
                amount: 200
            },
            {
                groupId: 2,
                groupName: "Trip",
                amount: 300
            }
        ]
    */

    const breakdown = {};


    // ======================================
    // PROCESS EVERY EXPENSE
    // ======================================

    expenses.forEach(function (expense) {

        // ======================================
        // CHECK GROUP
        // ======================================

        const groupExists =
            groups.some(function (group) {

                return String(group.id) ===
                    String(expense.groupId);

            });


        if (!groupExists) {
            return;
        }


        // ======================================
        // EXPENSE DATA
        // ======================================

        const people =
            expense.people || [];

        const shares =
            expense.shares || {};

        const paidBy =
            expense.paidBy;


        if (!paidBy) {
            return;
        }


        // ======================================
        // FIND YOUR SHARE
        // ======================================

        const yourShare =
            getShare(
                shares,
                yourName
            );


        // You are not part of this expense
        if (yourShare <= 0) {
            return;
        }


        // ======================================
        // SOMEONE ELSE PAID
        // ======================================

        if (
            paidBy.trim().toLowerCase() !==
            yourName.trim().toLowerCase()
        ) {

            const payer =
                getStoredPersonName(
                    shares,
                    paidBy
                );


            // Initialize balance
            if (!balances[payer]) {
                balances[payer] = 0;
            }


            // You owe payer
            balances[payer] +=
                yourShare;


            // ==================================
            // GROUP BREAKDOWN
            // ==================================

            if (!breakdown[payer]) {
                breakdown[payer] = [];
            }

            breakdown[payer].push({

                groupId:
                    expense.groupId,

                groupName:
                    getGroupName(
                        expense.groupId
                    ),

                amount:
                    yourShare,

                type:
                    "owe"

            });

        }


        // ======================================
        // YOU PAID
        // ======================================

        else {

            people.forEach(function (person) {

                // Ignore yourself
                if (
                    person.trim().toLowerCase() ===
                    yourName.trim().toLowerCase()
                ) {

                    return;

                }


                const theirShare =
                    getShare(
                        shares,
                        person
                    );


                if (theirShare <= 0) {
                    return;
                }


                const storedPerson =
                    getStoredPersonName(
                        shares,
                        person
                    );


                // Initialize balance
                if (!balances[storedPerson]) {
                    balances[storedPerson] = 0;
                }


                // They owe you
                balances[storedPerson] -=
                    theirShare;


                // ==================================
                // GROUP BREAKDOWN
                // ==================================

                if (!breakdown[storedPerson]) {
                    breakdown[storedPerson] = [];
                }

                breakdown[storedPerson].push({

                    groupId:
                        expense.groupId,

                    groupName:
                        getGroupName(
                            expense.groupId
                        ),

                    amount:
                        theirShare,

                    type:
                        "receive"

                });

            });

        }

    });


    return {
        balances: balances,
        breakdown: breakdown
    };
}


// ==========================================
// COMBINE SAME PERSON + SAME GROUP
// ==========================================

function combineBreakdownItems(items) {

    const combined = {};

    items.forEach(function (item) {

        const key =
            String(item.groupId) +
            "_" +
            item.type;

        if (!combined[key]) {

            combined[key] = {

                groupId:
                    item.groupId,

                groupName:
                    item.groupName,

                amount:
                    0,

                type:
                    item.type

            };

        }

        combined[key].amount +=
            Number(item.amount || 0);

    });


    return Object.values(combined);
}


// ==========================================
// PEOPLE YOU OWE
// ==========================================

function getPeopleYouOwe(balances) {

    const peopleYouOwe = [];


    Object.entries(balances).forEach(
        function ([person, balance]) {

            if (balance > 0.005) {

                peopleYouOwe.push({

                    person:
                        person,

                    amount:
                        balance

                });

            }

        }
    );


    peopleYouOwe.sort(
        function (a, b) {

            return b.amount -
                a.amount;

        }
    );


    return peopleYouOwe;
}


// ==========================================
// PEOPLE WHO OWE YOU
// ==========================================

function getPeopleWhoOweYou(balances) {

    const peopleWhoOweYou = [];


    Object.entries(balances).forEach(
        function ([person, balance]) {

            if (balance < -0.005) {

                peopleWhoOweYou.push({

                    person:
                        person,

                    amount:
                        Math.abs(balance)

                });

            }

        }
    );


    peopleWhoOweYou.sort(
        function (a, b) {

            return b.amount -
                a.amount;

        }
    );


    return peopleWhoOweYou;
}


// ==========================================
// CREATE PAYMENT REMINDER AREA
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

    area.style.marginBottom =
        "20px";


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


    // Put reminder before You Owe
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


    // ======================================
    // REMINDER DISABLED
    // ======================================

    if (!profile.reminder) {

        message.textContent =
            "Payment reminders are disabled in Profile.";

        button.textContent =
            "Enable in Profile";

        button.disabled =
            false;


        button.onclick =
            function () {

                window.location.href =
                    "profile.html";

            };


        return;
    }


    // ======================================
    // REMINDER ENABLED
    // ======================================

    button.disabled =
        false;


    const mutedUntil =
        Number(
            localStorage.getItem(
                MUTE_REMINDER_KEY
            )
        ) || 0;


    // ======================================
    // CURRENTLY MUTED
    // ======================================

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


                alert(
                    "Payment reminders are enabled again."
                );


                updateReminderArea();

            };


        return;
    }


    // ======================================
    // NOT MUTED
    // ======================================

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


            alert(
                "Payment reminders muted for 24 hours."
            );


            updateReminderArea();

        };

}


// ==========================================
// SHOW AUTOMATIC PAYMENT REMINDER
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


    // Muted
    if (
        now <
        mutedUntil
    ) {

        return;

    }


    // Already shown within 24 hours
    if (
        lastReminder &&
        now - lastReminder <
        REMINDER_INTERVAL
    ) {

        return;

    }


    const reminderLines =
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
        reminderLines.join("\n") +
        "\n\nPlease settle your pending payments."
    );


    localStorage.setItem(
        LAST_REMINDER_KEY,
        String(now)
    );

}


// ==========================================
// CREATE GROUP BREAKDOWN
// ==========================================

function createGroupBreakdown(
    person,
    breakdownItems
) {

    const container =
        document.createElement("div");

    container.style.marginTop =
        "10px";


    const heading =
        document.createElement("strong");

    heading.textContent =
        "Group breakdown:";


    container.appendChild(
        heading
    );


    const list =
        document.createElement("ul");


    const combined =
        combineBreakdownItems(
            breakdownItems
        );


    combined.forEach(function (item) {

        const li =
            document.createElement("li");


        li.textContent =
            item.groupName +
            " — " +
            SmartSplit.money(
                item.amount
            );


        list.appendChild(
            li
        );

    });


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


    // ======================================
    // PERSON
    // ======================================

    const title =
        document.createElement("h3");

    title.textContent =
        person;


    // ======================================
    // CLEAR MESSAGE
    // ======================================

    const message =
        document.createElement("p");

    message.textContent =
        `You owe ${person} ${SmartSplit.money(amount)}`;


    // ======================================
    // GROUP BREAKDOWN
    // ======================================

    const breakdown =
        createGroupBreakdown(
            person,
            breakdownItems
        );


    // ======================================
    // SETTLE BUTTON
    // ======================================

    const settleButton =
        document.createElement("button");

    settleButton.type =
        "button";

    settleButton.textContent =
        "Pay / Settle Up";


    // ======================================
    // PAYMENT AREA
    // ======================================

    const paymentBox =
        document.createElement("div");

    paymentBox.style.display =
        "none";

    paymentBox.style.marginTop =
        "10px";


    // ======================================
    // UPI LABEL
    // ======================================

    const upiLabel =
        document.createElement("label");

    upiLabel.textContent =
        `${person}'s UPI ID:`;


    // ======================================
    // UPI INPUT
    // ======================================

    const upiInput =
        document.createElement("input");

    upiInput.type =
        "text";

    upiInput.placeholder =
        "example@upi";


    // ======================================
    // AMOUNT DISPLAY
    // ======================================

    const amountText =
        document.createElement("p");

    amountText.textContent =
        `Payment amount: ${SmartSplit.money(amount)}`;


    // ======================================
    // PAY BUTTON
    // ======================================

    const payButton =
        document.createElement("button");

    payButton.type =
        "button";

    payButton.textContent =
        "Pay via PhonePe / UPI";


    // ======================================
    // OPEN / CLOSE PAYMENT AREA
    // ======================================

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

            }

            else {

                paymentBox.style.display =
                    "none";

                settleButton.textContent =
                    "Pay / Settle Up";

            }

        }
    );


    // ======================================
    // PAY
    // ======================================

    payButton.addEventListener(
        "click",
        function () {

            payWithPhonePe(
                person,
                amount,
                upiInput.value.trim()
            );

        }
    );


    paymentBox.appendChild(
        upiLabel
    );

    paymentBox.appendChild(
        document.createElement("br")
    );

    paymentBox.appendChild(
        upiInput
    );

    paymentBox.appendChild(
        document.createElement("br")
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


    // ======================================
    // PERSON
    // ======================================

    const title =
        document.createElement("h3");

    title.textContent =
        person;


    // ======================================
    // CLEAR MESSAGE
    // ======================================

    const message =
        document.createElement("p");

    message.textContent =
        `${person} owes you ${SmartSplit.money(amount)}`;


    // ======================================
    // GROUP BREAKDOWN
    // ======================================

    const breakdown =
        createGroupBreakdown(
            person,
            breakdownItems
        );


    // ======================================
    // SETTLE BUTTON
    // ======================================

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

    // ======================================
    // CHECK UPI
    // ======================================

    if (!upiId) {

        alert(
            `Please enter ${person}'s UPI ID first.`
        );

        return;

    }


    // ======================================
    // BASIC VALIDATION
    // ======================================

    if (!upiId.includes("@")) {

        alert(
            "Please enter a valid UPI ID."
        );

        return;

    }


    // ======================================
    // UPI PAYMENT URL
    // ======================================

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


    // ======================================
    // OPEN UPI APP
    // ======================================

    window.location.href =
        upiUrl;

}


// ==========================================
// DISPLAY SETTLEMENTS
// ==========================================

function displaySettlements() {

    // ======================================
    // CALCULATE
    // ======================================

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
    // CLEAR OLD DATA
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
    // EMPTY YOU OWE
    // ======================================

    if (
        !peopleYouOwe.length
    ) {

        youOweList.innerHTML =
            "<p>You don't owe anyone right now.</p>";

    }


    // ======================================
    // EMPTY OTHERS OWE YOU
    // ======================================

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
// UPDATE WHEN DATA CHANGES
// ==========================================

window.addEventListener(
    "smartsplit:updated",
    function () {

        displaySettlements();

    }
);