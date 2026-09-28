<script setup>
import { computed, onMounted, reactive, ref } from "vue";

const activeTab = ref("import");
const categories = ref([]);
const rules = ref([]);
const transactions = ref([]);
const summary = ref(null);
const selectedFile = ref(null);
const loading = ref(false);
const error = ref("");
const success = ref("");
const showOnlyUncategorized = ref(true);
const manualCategories = reactive({});
const reviewedTransactions = reactive({});
const ruleModalOpen = ref(false);
const ruleModalTransactionId = ref(null);

const fields = [
  ["description", "Description"],
  ["cardMember", "Card Member"],
  ["amexCategory", "AmEx Category"],
  ["amount", "Amount"],
  ["statementDescription", "Statement Description"],
  ["cityState", "City / State"],
  ["country", "Country"]
];

const operators = [
  ["equals", "equals"],
  ["contains", "contains"],
  ["containsAny", "contains any"],
  ["startsWith", "starts with"],
  ["gt", "greater than"],
  ["gte", "greater than or equal"],
  ["lt", "less than"],
  ["lte", "less than or equal"]
];

function newRule() {
  return {
    id: null,
    name: "",
    categoryId: "",
    priority: 100,
    matchMode: "all",
    active: true,
    conditions: [
      { field: "description", operator: "contains", value: "" }
    ]
  };
}

const ruleDraft = reactive(newRule());
const categoryDraft = ref("");

const visibleTransactions = computed(() => {
  if (!showOnlyUncategorized.value) return transactions.value;
  return transactions.value.filter(transaction => !transaction.match);
});

const autoCategorized = computed(() =>
  transactions.value.filter(transaction => transaction.match).length
);

const needReviewCount = computed(() =>
  transactions.value.filter(
    transaction => !transaction.match && !reviewedTransactions[transaction.id]
  ).length
);

const formattedTotal = computed(() =>
  summary.value
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(summary.value.total)
    : "$0.00"
);

onMounted(async () => {
  await refreshSettings();
});

async function api(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Request failed.");
  }

  if (response.status === 204) return null;
  return response.json();
}

async function refreshSettings() {
  error.value = "";
  try {
    const [cats, ruleList] = await Promise.all([
      api("/api/categories"),
      api("/api/rules")
    ]);
    categories.value = cats;
    rules.value = ruleList;
  } catch (err) {
    error.value = err.message;
  }
}

function handleFile(event) {
  selectedFile.value = event.target.files?.[0] || null;
}

async function importCsv() {
  if (!selectedFile.value) {
    error.value = "Choose an AmEx CSV file first.";
    return;
  }

  loading.value = true;
  error.value = "";
  success.value = "";

  try {
    const formData = new FormData();
    formData.append("file", selectedFile.value);

    const result = await api("/api/import", {
      method: "POST",
      body: formData
    });

    summary.value = result.summary;
    transactions.value = result.transactions;

    for (const key of Object.keys(manualCategories)) {
      delete manualCategories[key];
    }

    for (const key of Object.keys(reviewedTransactions)) {
      delete reviewedTransactions[key];
    }

    ruleModalOpen.value = false;
    ruleModalTransactionId.value = null;
    success.value = "Import complete.";
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function addCategory() {
  const name = categoryDraft.value.trim();
  if (!name) return;

  error.value = "";
  success.value = "";

  try {
    await api("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    categoryDraft.value = "";
    await refreshSettings();
    success.value = "Category added.";
  } catch (err) {
    error.value = err.message;
  }
}

async function updateCategory(category) {
  error.value = "";
  success.value = "";

  try {
    await api("/api/categories/" + category.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: category.name,
        active: !!category.active
      })
    });

    success.value = "Category updated.";
  } catch (err) {
    error.value = err.message;
  }
}

function resetRuleDraft() {
  Object.assign(ruleDraft, newRule());
}

function editRule(rule) {
  Object.assign(ruleDraft, {
    id: rule.id,
    name: rule.name,
    categoryId: rule.category_id,
    priority: rule.priority,
    matchMode: rule.match_mode,
    active: !!rule.active,
    conditions: JSON.parse(JSON.stringify(rule.conditions || []))
  });

  activeTab.value = "rules";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function addCondition() {
  ruleDraft.conditions.push({
    field: "description",
    operator: "contains",
    value: ""
  });
}

function removeCondition(index) {
  if (ruleDraft.conditions.length === 1) return;
  ruleDraft.conditions.splice(index, 1);
}

function serializeCondition(condition) {
  if (condition.operator === "containsAny") {
    const values = Array.isArray(condition.value)
      ? condition.value
      : String(condition.value || "")
          .split("\n")
          .map(value => value.trim())
          .filter(Boolean);

    return { ...condition, value: values };
  }

  if (["gt", "gte", "lt", "lte"].includes(condition.operator)) {
    return { ...condition, value: Number(condition.value) };
  }

  return { ...condition };
}

function editValue(condition) {
  if (condition.operator === "containsAny" && Array.isArray(condition.value)) {
    return condition.value.join("\n");
  }
  return condition.value;
}

function setConditionValue(condition, value) {
  condition.value = value;
}

async function saveRule() {
  error.value = "";
  success.value = "";

  const payload = {
    name: ruleDraft.name,
    categoryId: Number(ruleDraft.categoryId),
    priority: Number(ruleDraft.priority),
    matchMode: ruleDraft.matchMode,
    active: ruleDraft.active,
    conditions: ruleDraft.conditions.map(serializeCondition)
  };

  try {
    if (ruleDraft.id) {
      await api("/api/rules/" + ruleDraft.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      success.value = "Rule updated.";
    } else {
      await api("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      success.value = "Rule added.";
    }

    const wasModalRule = ruleModalOpen.value;
    resetRuleDraft();
    await refreshSettings();

    if (wasModalRule) {
      ruleModalOpen.value = false;
      ruleModalTransactionId.value = null;
    }
  } catch (err) {
    error.value = err.message;
  }
}

async function deleteRule(rule) {
  if (!confirm('Delete rule "' + rule.name + '"?')) return;

  error.value = "";
  success.value = "";

  try {
    await api("/api/rules/" + rule.id, {
      method: "DELETE"
    });
    await refreshSettings();

    if (ruleDraft.id === rule.id) {
      resetRuleDraft();
    }

    success.value = "Rule deleted.";
  } catch (err) {
    error.value = err.message;
  }
}

function chooseManualCategory(transactionId, categoryId) {
  manualCategories[transactionId] = Number(categoryId);
}

function categoryNameById(id) {
  return categories.value.find(category => category.id === Number(id))?.name || "";
}

function transactionCategory(transaction) {
  if (manualCategories[transaction.id]) {
    return categoryNameById(manualCategories[transaction.id]);
  }
  return transaction.match?.categoryName || "";
}

function suggestedRuleFromTransaction(transaction) {
  const categoryId = manualCategories[transaction.id];
  if (!categoryId) return;

  Object.assign(ruleDraft, {
    id: null,
    name: transaction.description,
    categoryId,
    priority: 100,
    matchMode: "all",
    active: true,
    conditions: [
      {
        field: "description",
        operator: "contains",
        value: transaction.description
      }
    ]
  });

  ruleModalTransactionId.value = transaction.id;
  ruleModalOpen.value = true;
}

function closeRuleModal() {
  ruleModalOpen.value = false;
  ruleModalTransactionId.value = null;
  resetRuleDraft();
}

function markReviewed(transaction) {
  if (transaction.match || manualCategories[transaction.id]) {
    reviewedTransactions[transaction.id] = true;
  }
}

function undoReviewed(transaction) {
  delete reviewedTransactions[transaction.id];
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <div class="eyebrow">Twin Building Inc.</div>
        <h1>Cat Script</h1>
        <p>American Express transaction categorizer</p>
      </div>

      <nav class="tabs">
        <button :class="{ active: activeTab === 'import' }" @click="activeTab = 'import'">
          Categorize
        </button>
        <button :class="{ active: activeTab === 'rules' }" @click="activeTab = 'rules'">
          Rules
        </button>
        <button :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'">
          Categories
        </button>
      </nav>
    </header>

    <main>
      <div v-if="error" class="notice error">{{ error }}</div>
      <div v-if="success" class="notice success">{{ success }}</div>

      <section v-if="activeTab === 'import'" class="panel stack">
        <div class="section-header">
          <div>
            <h2>Monthly statement</h2>
            <p>Upload the AmEx CSV and let the rules do the first pass.</p>
          </div>
        </div>

        <div class="upload-card">
          <input type="file" accept=".csv,text/csv" @change="handleFile" />
          <button class="primary" :disabled="loading || !selectedFile" @click="importCsv">
            {{ loading ? "Importing..." : "Import CSV" }}
          </button>
        </div>

        <div v-if="summary" class="summary-grid">
          <article>
            <span>Total transactions</span>
            <strong>{{ summary.transactions }}</strong>
          </article>
          <article>
            <span>Auto-categorized</span>
            <strong>{{ autoCategorized }}</strong>
          </article>
          <article>
            <span>Need review</span>
            <strong>{{ needReviewCount }}</strong>
          </article>
          <article>
            <span>Statement total</span>
            <strong>{{ formattedTotal }}</strong>
          </article>
        </div>

        <div v-if="transactions.length" class="table-card">
          <div class="table-toolbar">
            <label class="checkbox-row">
              <input v-model="showOnlyUncategorized" type="checkbox" />
              Show only transactions needing review
            </label>
            <span>{{ visibleTransactions.length }} shown</span>
          </div>

          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Card Member</th>
                  <th class="money">Amount</th>
                  <th>AmEx Category</th>
                  <th>Category</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                    v-for="transaction in visibleTransactions"
                    :key="transaction.id"
                    :class="{ reviewed: reviewedTransactions[transaction.id] }"
                  >
                  <td>{{ transaction.date }}</td>
                  <td>
                    <div class="merchant">{{ transaction.description }}</div>
                    <div v-if="transaction.match" class="rule-hit">
                      Rule: {{ transaction.match.ruleName }}
                    </div>
                  </td>
                  <td>{{ transaction.cardMember }}</td>
                  <td class="money">
                    {{
                      new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD"
                      }).format(transaction.amount)
                    }}
                  </td>
                  <td>{{ transaction.amexCategory }}</td>
                  <td>
                    <span v-if="transaction.match" class="pill matched">
                      {{ transaction.match.categoryName }}
                    </span>

                    <select
                      v-else
                      :value="manualCategories[transaction.id] || ''"
                      @change="chooseManualCategory(transaction.id, $event.target.value)"
                    >
                      <option value="">Choose category…</option>
                      <option
                        v-for="category in categories.filter(category => category.active)"
                        :key="category.id"
                        :value="category.id"
                      >
                        {{ category.name }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <div
                      v-if="!transaction.match && manualCategories[transaction.id]"
                      class="row-actions"
                    >
                      <button
                        class="small secondary"
                        @click="suggestedRuleFromTransaction(transaction)"
                      >
                        Create rule
                      </button>

                      <button
                        v-if="!reviewedTransactions[transaction.id]"
                        class="small review-button"
                        @click="markReviewed(transaction)"
                      >
                        ✓ Reviewed
                      </button>

                      <button
                        v-else
                        class="small ghost"
                        @click="undoReviewed(transaction)"
                      >
                        Undo
                      </button>
                    </div>

                    <span
                      v-else-if="!transaction.match && reviewedTransactions[transaction.id]"
                      class="pill matched"
                    >
                      Reviewed
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'rules'" class="rules-layout">
        <div class="panel">
          <div class="section-header">
            <div>
              <h2>{{ ruleDraft.id ? "Edit rule" : "New rule" }}</h2>
              <p>Build the rule from conditions instead of editing JavaScript.</p>
            </div>
          </div>

          <div class="form-grid two">
            <label>
              <span>Rule name</span>
              <input v-model="ruleDraft.name" type="text" placeholder="Example: Jersey Mike's" />
            </label>

            <label>
              <span>Category</span>
              <select v-model="ruleDraft.categoryId">
                <option value="">Choose category…</option>
                <option
                  v-for="category in categories.filter(category => category.active)"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                </option>
              </select>
            </label>

            <label>
              <span>Priority</span>
              <input v-model.number="ruleDraft.priority" type="number" min="1" />
            </label>

            <label>
              <span>Match</span>
              <select v-model="ruleDraft.matchMode">
                <option value="all">ALL conditions</option>
                <option value="any">ANY condition</option>
              </select>
            </label>
          </div>

          <div class="conditions">
            <div
              v-for="(condition, index) in ruleDraft.conditions"
              :key="index"
              class="condition-row"
            >
              <select v-model="condition.field">
                <option v-for="[value, label] in fields" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>

              <select v-model="condition.operator">
                <option v-for="[value, label] in operators" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>

              <textarea
                v-if="condition.operator === 'containsAny'"
                rows="4"
                :value="editValue(condition)"
                placeholder="One value per line"
                @input="setConditionValue(condition, $event.target.value)"
              />

              <input
                v-else
                :type="['gt','gte','lt','lte'].includes(condition.operator) ? 'number' : 'text'"
                :value="editValue(condition)"
                @input="setConditionValue(condition, $event.target.value)"
              />

              <button class="icon-button" @click="removeCondition(index)">×</button>
            </div>
          </div>

          <div class="button-row">
            <button class="secondary" @click="addCondition">Add condition</button>
            <button class="primary" @click="saveRule">
              {{ ruleDraft.id ? "Save changes" : "Add rule" }}
            </button>
            <button v-if="ruleDraft.id" class="ghost" @click="resetRuleDraft">
              Cancel
            </button>
          </div>
        </div>

        <div class="panel">
          <div class="section-header">
            <div>
              <h2>Rules</h2>
              <p>Lower priority numbers run first.</p>
            </div>
          </div>

          <div class="rule-list">
            <article v-for="rule in rules" :key="rule.id" class="rule-card">
              <div class="rule-card-main">
                <div class="rule-title-row">
                  <strong>{{ rule.name }}</strong>
                  <span class="priority">#{{ rule.priority }}</span>
                  <span v-if="!rule.active" class="pill inactive">Inactive</span>
                </div>
                <div class="rule-category">→ {{ rule.category_name }}</div>
                <ul>
                  <li v-for="(condition, index) in rule.conditions" :key="index">
                    {{ condition.field }} {{ condition.operator }}
                    <template v-if="Array.isArray(condition.value)">
                      {{ condition.value.join(", ") }}
                    </template>
                    <template v-else>{{ condition.value }}</template>
                  </li>
                </ul>
              </div>

              <div class="rule-actions">
                <button class="small secondary" @click="editRule(rule)">Edit</button>
                <button class="small danger" @click="deleteRule(rule)">Delete</button>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section v-else class="panel">
        <div class="section-header">
          <div>
            <h2>Categories</h2>
            <p>Edit the categories available during monthly review.</p>
          </div>
        </div>

        <div class="add-category">
          <input
            v-model="categoryDraft"
            type="text"
            placeholder="New category name"
            @keyup.enter="addCategory"
          />
          <button class="primary" @click="addCategory">Add category</button>
        </div>

        <div class="category-list">
          <div v-for="category in categories" :key="category.id" class="category-row">
            <input v-model="category.name" type="text" />
            <label class="checkbox-row">
              <input v-model="category.active" :true-value="1" :false-value="0" type="checkbox" />
              Active
            </label>
            <button class="secondary" @click="updateCategory(category)">Save</button>
          </div>
        </div>
      </section>
    </main>

    <div v-if="ruleModalOpen" class="modal-backdrop" @click.self="closeRuleModal">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="rule-modal-title">
        <div class="modal-header">
          <div>
            <div class="eyebrow modal-eyebrow">Create categorization rule</div>
            <h2 id="rule-modal-title">New rule</h2>
          </div>
          <button class="icon-button" aria-label="Close" @click="closeRuleModal">×</button>
        </div>

        <div class="form-grid two">
          <label>
            <span>Rule name</span>
            <input v-model="ruleDraft.name" type="text" />
          </label>

          <label>
            <span>Category</span>
            <select v-model="ruleDraft.categoryId">
              <option value="">Choose category…</option>
              <option
                v-for="category in categories.filter(category => category.active)"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </label>

          <label>
            <span>Priority</span>
            <input v-model.number="ruleDraft.priority" type="number" min="1" />
          </label>

          <label>
            <span>Match</span>
            <select v-model="ruleDraft.matchMode">
              <option value="all">ALL conditions</option>
              <option value="any">ANY condition</option>
            </select>
          </label>
        </div>

        <div class="conditions">
          <div
            v-for="(condition, index) in ruleDraft.conditions"
            :key="index"
            class="condition-row"
          >
            <select v-model="condition.field">
              <option v-for="[value, label] in fields" :key="value" :value="value">
                {{ label }}
              </option>
            </select>

            <select v-model="condition.operator">
              <option v-for="[value, label] in operators" :key="value" :value="value">
                {{ label }}
              </option>
            </select>

            <textarea
              v-if="condition.operator === 'containsAny'"
              rows="4"
              :value="editValue(condition)"
              placeholder="One value per line"
              @input="setConditionValue(condition, $event.target.value)"
            />

            <input
              v-else
              :type="['gt','gte','lt','lte'].includes(condition.operator) ? 'number' : 'text'"
              :value="editValue(condition)"
              @input="setConditionValue(condition, $event.target.value)"
            />

            <button class="icon-button" @click="removeCondition(index)">×</button>
          </div>
        </div>

        <div class="modal-footer">
          <button class="secondary" @click="addCondition">Add condition</button>
          <div class="modal-footer-actions">
            <button class="ghost" @click="closeRuleModal">Cancel</button>
            <button class="primary" @click="saveRule">Save rule</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: #172033;
  background: #f4f6f8;
  font-synthesis: none;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f4f6f8;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
}

.topbar {
  background: #101827;
  color: white;
  padding: 28px 36px 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.topbar h1 {
  margin: 3px 0 4px;
  font-size: 32px;
  line-height: 1;
}

.topbar p {
  margin: 0 0 24px;
  color: #aeb8c7;
}

.eyebrow {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #7f8da3;
}

.tabs {
  display: flex;
  gap: 6px;
}

.tabs button {
  border: 0;
  background: transparent;
  color: #aeb8c7;
  padding: 14px 18px;
  border-radius: 10px 10px 0 0;
}

.tabs button.active {
  color: #172033;
  background: #f4f6f8;
}

main {
  padding: 28px 36px 48px;
}

.panel {
  background: white;
  border: 1px solid #e2e7ee;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(16, 24, 39, 0.05);
}

.stack {
  display: grid;
  gap: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.section-header h2 {
  margin: 0 0 4px;
  font-size: 22px;
}

.section-header p {
  margin: 0;
  color: #6b7280;
}

.notice {
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
}

.notice.error {
  background: #fff1f2;
  color: #9f1239;
  border: 1px solid #fecdd3;
}

.notice.success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.upload-card,
.add-category,
.button-row,
.table-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-card {
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #fafbfc;
}

button {
  border-radius: 9px;
  padding: 9px 13px;
  border: 1px solid transparent;
}

.primary {
  background: #2563eb;
  color: white;
}

.primary:disabled {
  opacity: 0.5;
  cursor: default;
}

.secondary {
  background: white;
  border-color: #cbd5e1;
  color: #24324a;
}

.ghost {
  background: transparent;
  color: #526074;
}

.danger {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #be123c;
}

.small {
  padding: 6px 10px;
  font-size: 13px;
}

.review-button {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.row-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}

tr.reviewed td {
  background: #f3f4f6;
  color: #8a94a3;
}

tr.reviewed .merchant {
  color: #697386;
}

tr.reviewed select {
  opacity: 0.72;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-grid article {
  padding: 16px;
  border: 1px solid #e2e7ee;
  border-radius: 12px;
  background: #fbfcfd;
}

.summary-grid span {
  display: block;
  color: #718096;
  font-size: 13px;
  margin-bottom: 8px;
}

.summary-grid strong {
  font-size: 24px;
}

.table-card {
  border: 1px solid #e2e7ee;
  border-radius: 12px;
  overflow: hidden;
}

.table-toolbar {
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e7ee;
  background: #fafbfc;
  color: #667085;
  font-size: 14px;
}

.table-scroll {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1080px;
}

th,
td {
  padding: 11px 12px;
  border-bottom: 1px solid #edf0f3;
  vertical-align: top;
  text-align: left;
}

th {
  font-size: 12px;
  color: #667085;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: white;
  position: sticky;
  top: 0;
}

td {
  font-size: 14px;
}

.money {
  text-align: right;
  white-space: nowrap;
}

.merchant {
  font-weight: 600;
}

.rule-hit {
  margin-top: 3px;
  font-size: 12px;
  color: #7c8798;
}

select,
input,
textarea {
  width: 100%;
  border: 1px solid #cfd7e3;
  border-radius: 8px;
  padding: 9px 10px;
  background: white;
  color: #172033;
}

textarea {
  resize: vertical;
}

.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  white-space: nowrap;
}

.pill.matched {
  background: #ecfdf5;
  color: #047857;
}

.pill.inactive {
  background: #f3f4f6;
  color: #6b7280;
}

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.checkbox-row input {
  width: auto;
}

.rules-layout {
  display: grid;
  grid-template-columns: minmax(340px, 0.9fr) minmax(460px, 1.2fr);
  gap: 20px;
  align-items: start;
}

.form-grid {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.form-grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid label > span {
  display: block;
  font-size: 13px;
  color: #667085;
  margin-bottom: 6px;
}

.conditions {
  display: grid;
  gap: 10px;
  margin: 18px 0;
}

.condition-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.4fr auto;
  gap: 8px;
  align-items: start;
}

.icon-button {
  width: 40px;
  height: 40px;
  padding: 0;
  background: white;
  border-color: #d7dde6;
  font-size: 22px;
  line-height: 1;
}

.rule-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.rule-card {
  border: 1px solid #e2e7ee;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.rule-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority {
  color: #7c8798;
  font-size: 12px;
}

.rule-category {
  margin-top: 4px;
  color: #2563eb;
  font-size: 14px;
}

.rule-card ul {
  margin: 10px 0 0;
  padding-left: 20px;
  color: #667085;
  font-size: 13px;
}

.rule-actions {
  display: flex;
  gap: 8px;
  align-items: start;
}

.category-list {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.category-row {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) auto auto;
  gap: 12px;
  align-items: center;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(3px);
}

.modal-card {
  width: min(900px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  background: white;
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}

.modal-header,
.modal-footer,
.modal-footer-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header {
  justify-content: space-between;
}

.modal-header h2 {
  margin: 4px 0 0;
}

.modal-eyebrow {
  color: #718096;
}

.modal-footer {
  justify-content: space-between;
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 900px) {
  .topbar {
    padding: 22px 18px 0;
    align-items: stretch;
    flex-direction: column;
  }

  .tabs {
    overflow-x: auto;
  }

  main {
    padding: 20px 14px 32px;
  }

  .summary-grid,
  .form-grid.two,
  .rules-layout {
    grid-template-columns: 1fr;
  }

  .condition-row {
    grid-template-columns: 1fr;
  }

  .category-row {
    grid-template-columns: 1fr;
  }
}
</style>
