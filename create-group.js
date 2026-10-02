// ===============================
// SmartSplit - Create Group
// ===============================

const createGroupForm =
    document.getElementById("createGroupForm");

const membersInput =
    document.getElementById("members");

const memberInputs =
    document.getElementById("memberInputs");


// ===============================
// CREATE MEMBER NAME FIELDS
// ===============================

membersInput.addEventListener("input", function () {

    const count = parseInt(membersInput.value);

    memberInputs.innerHTML = "";

    if (isNaN(count) || count < 1) {
        return;
    }

    for (let i = 1; i <= count; i++) {

        const label = document.createElement("label");

        label.textContent = "Member " + i + " Name";

        const input = document.createElement("input");

        input.type = "text";
        input.placeholder = "Enter member " + i + " name";
        input.className = "member-name";
        input.required = true;

        memberInputs.appendChild(label);
        memberInputs.appendChild(input);
    }

});


// ===============================
// CREATE GROUP
// ===============================

createGroupForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const groupName =
        document.getElementById("groupName").value.trim();

    const members =
        parseInt(membersInput.value);

    const memberNameInputs =
        document.querySelectorAll(".member-name");

    const memberNames = [];

    memberNameInputs.forEach(function (input) {

        memberNames.push(input.value.trim());

    });


    // ===============================
    // VALIDATION
    // ===============================

    if (groupName === "" || members < 1) {

        alert("Please enter valid group details.");

        return;
    }


    // ===============================
    // CREATE GROUP OBJECT
    // ===============================

    const newGroup = {

        id: Date.now(),

        name: groupName,

        members: members,

        memberNames: memberNames,

        totalExpenses: 0

    };


    // ===============================
    // SEND GROUP TO FLASK
    // ===============================

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/groups",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(newGroup)
            }
        );


        const data = await response.json();

        console.log("Flask response:", data);


        // ===============================
        // CHECK FLASK RESPONSE
        // ===============================

        if (!response.ok) {

            alert("Failed to send group to backend.");

            return;
        }


        // ===============================
        // KEEP LOCALSTORAGE FOR NOW
        // ===============================

        let groups =
            JSON.parse(localStorage.getItem("groups")) || [];

        groups.push(newGroup);

        localStorage.setItem(
            "groups",
            JSON.stringify(groups)
        );


        // ===============================
        // SUCCESS
        // ===============================

        alert("Group created successfully!");

        window.location.href = "group.html";


    } catch (error) {

        console.error("Backend error:", error);

        alert("Could not connect to Flask backend.");

    }

});