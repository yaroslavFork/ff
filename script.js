import {
  Client,
  Databases,
  ID,
  Query
} from "https://cdn.jsdelivr.net/npm/appwrite@13.0.1/+esm";

const client = new Client()
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("695f9aae003cc43e58d4");
const databases = new Databases(client);
const DB = "695f9bbc00302230a3eb",
  COL = "users";

const app = {
  user: null,

  async init() {
    console.log("Система инициирована...");
    const saved = localStorage.getItem("fork_session");
    if (saved) {
      try {
        const { n, p } = JSON.parse(saved);
        await this.login(n, p, true);
      } catch (e) {
        localStorage.removeItem("fork_session");
      }
    }
  },

  async login(passedName, passedPass, isAuto = false) {
    const n = passedName || document.getElementById("username").value.trim();
    const p = passedPass || document.getElementById("userpass").value.trim();
    if (!n || !p) return;

    try {
      const res = await databases.listDocuments(DB, COL, [
        Query.equal("name", n)
      ]);
      if (res.documents.length > 0) {
        if (res.documents[0].passworld !== p) {
          if (!isAuto) alert("Пароль неверный!");
          return;
        }
        this.user = res.documents[0];
      } else {
        if (isAuto) return;
        this.user = await databases.createDocument(DB, COL, ID.unique(), {
          name: n,
          passworld: p,
          balance: 100,
          user_id: Math.floor(Math.random() * 900) + 100
        });
      }
      localStorage.setItem("fork_session", JSON.stringify({ n, p }));
      this.showMainScreen();
    } catch (e) {
      console.error("Ошибка входа:", e);
    }
  },

  showMainScreen() {
    const loginSc = document.getElementById("screen-login");
    const mainSc = document.getElementById("screen-main");
    if (loginSc) loginSc.style.display = "none";
    if (mainSc) mainSc.classList.remove("hidden");
    this.updateUI();
  },

  updateUI() {
    if (!this.user) return;
    const balEl = document.getElementById("balance");
    const infoEl = document.getElementById("user-info");
    if (balEl) balEl.innerText = this.user.balance;
    if (infoEl)
      infoEl.innerText = `${this.user.name} (ID: ${this.user.user_id})`;
  },

  async sendMoney() {
    const targetId = prompt("ID получателя:");
    const amount = parseInt(prompt("Сумма:"));
    if (!targetId || isNaN(amount) || amount <= 0 || amount > this.user.balance)
      return alert("Ошибка ввода!");

    try {
      const res = await databases.listDocuments(DB, COL, [
        Query.equal("user_id", parseInt(targetId))
      ]);
      if (res.documents.length === 0) return alert("Не найден!");
      const target = res.documents[0];
      await databases.updateDocument(DB, COL, this.user.$id, {
        balance: this.user.balance - amount
      });
      await databases.updateDocument(DB, COL, target.$id, {
        balance: target.balance + amount
      });
      this.user.balance -= amount;
      this.updateUI();
      alert("Успешно!");
    } catch (e) {
      alert("Ошибка транзакции");
    }
  },

  // --- ПРЕЗИДЕНТСКИЕ ФУНКЦИИ ---
  checkAdmin() {
    const code = prompt("Введите код доступа:");
    if (code === "VYA_chsv") {
      const btn = document.getElementById("admin-btn");
      if (btn) {
        btn.classList.remove("hidden");
        btn.style.display = "block";
      }
      alert("Доступ открыт, Хозяин.");
    }
  },

  adminMenu() {
    const ov = document.getElementById("overlay");
    const pan = document.getElementById("admin-panel");
    if (ov && pan) {
      ov.style.display = "block";
      pan.style.display = "block";
    } else {
      // Если элементов нет в HTML, используем старый метод, чтобы не висло
      const a = prompt("1-Баланс, 2-Налог, 3-Удалить, 4-Выход");
      if (a === "1") this.adminEditBalance();
      if (a === "2") this.adminGlobalTax();
      if (a === "4") this.logout();
    }
  },

  closeAdmin() {
    const ov = document.getElementById("overlay");
    const pan = document.getElementById("admin-panel");
    if (ov) ov.style.display = "none";
    if (pan) pan.style.display = "none";
  },

  async adminEditBalance() {
    this.closeAdmin();
    const id = prompt("ID:");
    const diff = parseInt(prompt("Сумма (+/-):"));
    if (!id || isNaN(diff)) return;
    const res = await databases.listDocuments(DB, COL, [
      Query.equal("user_id", parseInt(id))
    ]);
    if (res.documents.length > 0) {
      await databases.updateDocument(DB, COL, res.documents[0].$id, {
        balance: res.documents[0].balance + diff
      });
      alert("Готово");
    }
  },

  async adminGlobalTax() {
    this.closeAdmin();
    const res = await databases.listDocuments(DB, COL);
    for (let doc of res.documents) {
      if (doc.user_id !== this.user.user_id) {
        await databases.updateDocument(DB, COL, doc.$id, {
          balance: Math.max(0, doc.balance - 50)
        });
      }
    }
    alert("Налог собран");
  },

  logout() {
    localStorage.removeItem("fork_session");
    location.reload();
  }
};

// Совместимость со старой кнопкой в HTML
app.showAccess = function () {
  this.checkAdmin();
};

document.addEventListener("DOMContentLoaded", () => app.init());
window.app = app;