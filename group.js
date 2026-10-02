// =====================================================
// SMARTSPLIT GROUPS
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const addGroupButton =
    document.getElementById("addGroupButton");

const groupList =
    document.getElementById("groupList");


// =====================================================
// DISPLAY GROUPS
// =====================================================

function renderSmartSplit() {

    const groups =
        SmartSplit.groups();


    groupList.innerHTML = "";


    // =================================================
    // NO GROUPS
    // =================================================

    if (groups.length === 0) {

        groupList.textContent =
            "No groups yet. Create your first group!";

        return;
    }


    // =================================================
    // DISPLAY EACH GROUP
    // =================================================

    groups.forEach(function(group) {

        const card =
            document.createElement("div");


        card.className =
            "group-card";


        const memberCount =
            group.memberNames?.length ||
            group.members ||
            0;


        const totalExpenses =
            Number(group.totalExpenses) || 0;


        card.innerHTML = `

            <h3>
                ${group.name}
            </h3>

            <p>
                Members: ${memberCount}
            </p>

            <p>
                Total Expenses:
                ${SmartSplit.money(totalExpenses)}
            </p>

            <button
                type="button"
                class="view-group-button"
            >
                View Group
            </button>

            <button
                type="button"
                class="delete-group-button"
            >
                Delete
            </button>

        `;


        // =================================================
        // VIEW GROUP
        // =================================================

        const viewButton =
            card.querySelector(
                ".view-group-button"
            );


        viewButton.addEventListener(
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
            card.querySelector(
                ".delete-group-button"
            );


        deleteButton.addEventListener(
            "click",
            function() {


                const confirmed =
                    confirm(
                        `Delete "${group.name}"?\n\n` +
                        `This will also delete all ` +
                        `expenses belonging to this group.`
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

                            return String(
                                existingGroup.id
                            ) !== String(group.id);

                        }
                    );


                SmartSplit.saveGroups(
                    updatedGroups
                );


                // -----------------------------------------
                // DELETE GROUP EXPENSES
                // -----------------------------------------

                const updatedExpenses =
                    SmartSplit.expenses().filter(
                        function(expense) {

                            return String(
                                expense.groupId
                            ) !== String(group.id);

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
                // REFRESH PAGE
                // -----------------------------------------

                renderSmartSplit();

            }
        );


        // Add card
        groupList.appendChild(card);

    });

}


// =====================================================
// CREATE NEW GROUP
// =====================================================

addGroupButton.addEventListener(
    "click",
    function() {

        window.location.href =
            "create-group.html";

    }
);


// =====================================================
// INITIAL LOAD
// =====================================================

renderSmartSplit();


// =====================================================
// UPDATE WHEN DATA CHANGES
// =====================================================

window.addEventListener(
    "smartsplit:updated",
    function() {

        renderSmartSplit();

    }
);