// SmartSplit - Shared Data Layer
// Single source of truth for the frontend.
// Later, this can be replaced by a Flask API without changing page UI logic.

const SmartSplit = {
    keys: {
        groups: "groups",
        expenses: "expenses",
        settlements: "settlements",
        profile: "profile",
        selectedGroupId: "selectedGroupId"
    },

    get(key, fallback = []) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value ?? fallback;
        } catch {
            return fallback;
        }
    },

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        window.dispatchEvent(new CustomEvent("smartsplit:updated", { detail: { key, value } }));
    },

    groups() { return this.get(this.keys.groups, []); },
    expenses() { return this.get(this.keys.expenses, []); },
    settlements() { return this.get(this.keys.settlements, []); },
    profile() {
        return this.get(this.keys.profile, {
            name: "Tanushree",
            upi: "",
            currency: "inr",
            reminder: false
        });
    },

    saveGroups(groups) { this.set(this.keys.groups, groups); },
    saveExpenses(expenses) { this.set(this.keys.expenses, expenses); },
    saveSettlements(settlements) { this.set(this.keys.settlements, settlements); },
    saveProfile(profile) { this.set(this.keys.profile, profile); },

    selectedGroupId() {
        return localStorage.getItem(this.keys.selectedGroupId);
    },

    selectGroup(id) {
        localStorage.setItem(this.keys.selectedGroupId, String(id));
    },

    selectedGroup() {
        const id = this.selectedGroupId();
        return this.groups().find(g => String(g.id) === String(id)) || null;
    },

    currencySymbol() {
        const c = this.profile().currency;
        return { inr: "₹", usd: "$", eur: "€", gbp: "£" }[c] || "₹";
    },

    money(value) {
        return this.currencySymbol() + Number(value || 0).toFixed(2);
    },

    getGroupExpenses(groupId) {
        return this.expenses().filter(e => String(e.groupId) === String(groupId));
    },

    refreshGroupTotal(groupId) {
        const groups = this.groups();
        const group = groups.find(g => String(g.id) === String(groupId));
        if (!group) return;
        group.totalExpenses = this.getGroupExpenses(groupId)
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        this.saveGroups(groups);
    },

    calculateBalances(expenses = this.expenses()) {
        const balances = {};
        expenses.forEach(e => {
            const people = e.people || [];
            const shares = e.shares || {};
            people.forEach(person => {
                balances[person] = (balances[person] || 0) - Number(shares[person] || 0);
            });
            balances[e.paidBy] = (balances[e.paidBy] || 0) + Number(e.amount || 0);
        });
        return balances;
    }
};

// Keep open pages in sync (including multiple tabs).
window.addEventListener("storage", () => location.reload());
window.addEventListener("smartsplit:updated", () => {
    if (typeof window.renderSmartSplit === "function") window.renderSmartSplit();
});
