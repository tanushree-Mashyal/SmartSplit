const nameInput = document.getElementById("name");
const upiInput = document.getElementById("upi");
const currencyInput = document.getElementById("currency");
const reminderInput = document.getElementById("payment-reminder");
const saveButton = document.getElementById("save-profile-button");
const logoutButton = document.getElementById("logout-button");


// ===============================
// LOAD PROFILE
// ===============================

function loadProfile() {

    const profile = SmartSplit.profile();

    nameInput.value = profile.name || "";
    upiInput.value = profile.upi || "";
    currencyInput.value = profile.currency || "inr";
    reminderInput.checked = Boolean(profile.reminder);

}


// ===============================
// SAVE PROFILE
// ===============================

saveButton.addEventListener("click", function() {

    const profile = {
        name: nameInput.value.trim() || "Tanushree",
        upi: upiInput.value.trim(),
        currency: currencyInput.value,
        reminder: reminderInput.checked
    };

    SmartSplit.saveProfile(profile);

    alert("Changes saved successfully!");

});


// ===============================
// LOGOUT
// ===============================

logoutButton.addEventListener("click", function() {

    const confirmed = confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmed) return;

    alert(
        "Logout will be connected to the login system later."
    );

});


// ===============================
// INITIAL LOAD
// ===============================

loadProfile();


// ===============================
// UPDATE WHEN PROFILE CHANGES
// ===============================

window.addEventListener(
    "smartsplit:updated",
    function(event) {

        if (
            event.detail &&
            event.detail.key === SmartSplit.keys.profile
        ) {
            loadProfile();
        }

    }
);