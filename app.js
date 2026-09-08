const state = {
  balance: Number(localStorage.getItem("obsc_balance") || 2500),
  inventory: JSON.parse(localStorage.getItem("obsc_inventory") || "[]")
};

const items = [
  { name: "Carbon Fade", rarity: "common", value: 70, icon: "◼", weight: 34 },
  { name: "Neon Wire", rarity: "uncommon", value: 120, icon: "⌁", weight: 26 },
  { name: "Violet Circuit", rarity: "rare", value: 220, icon: "✦", weight: 18 },
  { name: "Obsidian Pulse", rarity: "epic", value: 420, icon: "◆", weight: 12 },
  { name: "Solar Fracture", rarity: "legendary", value: 850, icon: "✹", weight: 7 },
  { name: "Void Crown", rarity: "mythic", value: 1750, icon: "♛", weight: 3 }
];

const cases = [
  {
    id: "static",
    name: "Static Case",
    price: 180,
    icon: "▧",
    description: "Базовая коллекция Obscgrader",
    pool: ["common", "uncommon", "rare", "epic"]
  },
  {
    id: "obscura",
    name: "Obscura Case",
    price: 320,
    icon: "◆",
    description: "Повышенный шанс редких предметов",
    pool: ["uncommon", "rare", "epic", "legendary"]
  },
  {
    id: "void",
    name: "Void Case",
    price: 550,
    icon: "◈",
    description: "Самая редкая виртуальная коллекция",
    pool: ["rare", "epic", "legendary", "mythic"]
  }
];

function save() {
  localStorage.setItem("obsc_balance", state.balance);
  localStorage.setItem("obsc_inventory", JSON.stringify(state.inventory));
  renderAll();
}

function makeId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return String(Date.now() + Math.random());
}

function weightedPick(pool) {
  const filtered = items.filter(item => pool.includes(item.rarity));

  const totalWeight = filtered.reduce(
    (sum, item) => sum + item.weight,
    0
  );

  let random = Math.random() * totalWeight;

  for (const item of filtered) {
    random -= item.weight;

    if (random <= 0) {
      return {
        ...item,
        uid: makeId()
      };
    }
  }

  return {
    ...filtered[0],
    uid: makeId()
  };
}

function rarityLabel(rarity) {
  const labels = {
    common: "Обычный",
    uncommon: "Необычный",
    rare: "Редкий",
    epic: "Эпический",
    legendary: "Легендарный",
    mythic: "Мифический"
  };

  return labels[rarity] || rarity;
}

function toast(message) {
  const element = document.getElementById("toast");

  element.textContent = message;
  element.classList.add("show");

  setTimeout(() => {
    element.classList.remove("show");
  }, 1800);
}

function renderCases() {
  const grid = document.getElementById("caseGrid");

  grid.innerHTML = cases.map(caseData => `
    <article class="case-card">

      <div>
        <div class="case-art">
          ${caseData.icon}
        </div>

        <div class="case-name">
          ${caseData.name}
        </div>

        <div class="case-desc">
          ${caseData.description}
        </div>
      </div>

      <div class="case-bottom">

        <div class="case-price">
          ${caseData.price} OP
        </div>

        <button
          class="case-open-btn"
          onclick="openCase('${caseData.id}')"
        >
          ОТКРЫТЬ
        </button>

      </div>

    </article>
  `).join("");
}

window.openCase = function(id) {
  const selectedCase = cases.find(item => item.id === id);

  if (!selectedCase) {
    return;
  }

  if (state.balance < selectedCase.price) {
    toast("Недостаточно OP");
    return;
  }

  state.balance -= selectedCase.price;

  const drop = weightedPick(selectedCase.pool);

  state.inventory.push(drop);

  const panel = document.getElementById("caseResult");

  panel.classList.remove("hidden");

  panel.innerHTML = `
    <div class="drop-result">

      <div class="drop-icon">
        ${drop.icon}
      </div>

      <div>
        <div class="drop-title">
          ${drop.name}
        </div>

        <div class="drop-meta">
          ${rarityLabel(drop.rarity)}
          ·
          ${drop.value} OP
        </div>
      </div>

    </div>
  `;

  save();
};

function renderInventory() {
  const grid = document.getElementById("inventoryGrid");

  document.getElementById("inventoryCount").textContent =
    state.inventory.length;

  if (!state.inventory.length) {
    grid.innerHTML = `
      <div class="muted">
        Инвентарь пока пуст. Открой первый кейс.
      </div>
    `;

    return;
  }

  grid.innerHTML = state.inventory.map(item => `
    <article class="item-card">

      <div class="item-rarity">
        ${rarityLabel(item.rarity)}
      </div>

      <div class="item-icon">
        ${item.icon}
      </div>

      <div class="item-name">
        ${item.name}
      </div>

      <div class="item-value">
        ${item.value} OP
      </div>

    </article>
  `).join("");
}

function renderUpgradeSelect() {
  const select = document.getElementById("upgradeSource");

  const oldValue = select.value;

  select.innerHTML = `
    <option value="">
      Выбери предмет...
    </option>
  ` + state.inventory.map((item, index) => `
    <option value="${index}">
      ${item.name} — ${item.value} OP
    </option>
  `).join("");

  if (
    oldValue !== "" &&
    state.inventory[Number(oldValue)]
  ) {
    select.value = oldValue;
  }

  updateUpgradePreview();
}

function updateUpgradePreview() {
  const select = document.getElementById("upgradeSource");

  const index = select.value;

  const chance = Number(
    document.getElementById("chanceSlider").value
  );

  const source =
    index === ""
      ? null
      : state.inventory[Number(index)];

  document.getElementById("chanceValue").textContent =
    chance + "%";

  const ring = document.querySelector(".chance-ring");

  ring.style.background = `
    conic-gradient(
      var(--accent) 0deg ${chance * 3.6}deg,
      #22283a ${chance * 3.6}deg 360deg
    )
  `;

  const sourcePreview =
    document.getElementById("sourcePreview");

  const targetPreview =
    document.getElementById("targetPreview");

  const button =
    document.getElementById("upgradeBtn");

  if (!source) {
    sourcePreview.innerHTML =
      "Выбери предмет";

    targetPreview.innerHTML =
      "—";

    button.disabled = true;

    return;
  }

  const targetValue = Math.round(
    source.value *
    (100 / chance) *
    0.93
  );

  sourcePreview.innerHTML = `
    <div>
      <div style="font-size:48px">
        ${source.icon}
      </div>

      <strong>
        ${source.name}
      </strong>

      <div class="muted">
        ${source.value} OP
      </div>
    </div>
  `;

  targetPreview.innerHTML = `
    <div>
      <div style="font-size:48px">
        ✦
      </div>

      <strong>
        Target Item
      </strong>

      <div class="muted">
        ≈ ${targetValue} OP
      </div>
    </div>
  `;

  button.disabled = false;
}

function doUpgrade() {
  const select =
    document.getElementById("upgradeSource");

  if (select.value === "") {
    return;
  }

  const index =
    Number(select.value);

  const source =
    state.inventory[index];

  if (!source) {
    return;
  }

  const chance =
    Number(
      document.getElementById("chanceSlider").value
    );

  state.inventory.splice(index, 1);

  const status =
    document.getElementById("upgradeStatus");

  if (Math.random() * 100 < chance) {

    const targetValue =
      Math.round(
        source.value *
        (100 / chance) *
        0.93
      );

    const candidates =
      items
        .slice()
        .sort(
          (a, b) =>
            Math.abs(a.value - targetValue) -
            Math.abs(b.value - targetValue)
        );

    const template =
      candidates[0] ||
      items[items.length - 1];

    const upgradedItem = {
      ...template,
      uid: makeId()
    };

    state.inventory.push(upgradedItem);

    status.textContent =
      `УСПЕХ — ${upgradedItem.name}`;

    toast("Апгрейд успешен");

  } else {

    status.textContent =
      "НЕУДАЧА — предмет исчез";

    toast("Апгрейд не прошёл");
  }

  save();
}

function doBattle() {
  const cost = 300;

  if (state.balance < cost) {
    toast("Недостаточно OP");
    return;
  }

  state.balance -= cost;

  const pool = [
    "uncommon",
    "rare",
    "epic",
    "legendary"
  ];

  const you =
    weightedPick(pool);

  const bot =
    weightedPick(pool);

  document.getElementById(
    "yourBattleDrop"
  ).innerHTML = `
    <div>
      <div style="font-size:36px">
        ${you.icon}
      </div>

      <small>
        ${you.name}<br>
        ${you.value} OP
      </small>
    </div>
  `;

  document.getElementById(
    "botBattleDrop"
  ).innerHTML = `
    <div>
      <div style="font-size:36px">
        ${bot.icon}
      </div>

      <small>
        ${bot.name}<br>
        ${bot.value} OP
      </small>
    </div>
  `;

  const status =
    document.getElementById("battleStatus");

  if (you.value >= bot.value) {

    state.inventory.push(you);

    status.textContent =
      `Победа! ${you.value} OP против ${bot.value} OP`;

  } else {

    status.textContent =
      `ObscBot победил: ${you.value} OP против ${bot.value} OP`;
  }

  save();
}

function renderAll() {
  document.getElementById(
    "balance"
  ).textContent = state.balance;

  renderCases();
  renderInventory();
  renderUpgradeSelect();
}

document
  .querySelectorAll(".nav-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".nav-btn")
        .forEach(item =>
          item.classList.remove("active")
        );

      document
        .querySelectorAll(".view")
        .forEach(view =>
          view.classList.remove("active-view")
        );

      button.classList.add("active");

      document
        .getElementById(button.dataset.view)
        .classList.add("active-view");
    });
  });

document
  .getElementById("chanceSlider")
  .addEventListener(
    "input",
    updateUpgradePreview
  );

document
  .getElementById("upgradeSource")
  .addEventListener(
    "change",
    updateUpgradePreview
  );

document
  .getElementById("upgradeBtn")
  .addEventListener(
    "click",
    doUpgrade
  );

document
  .getElementById("battleBtn")
  .addEventListener(
    "click",
    doBattle
  );

document
  .getElementById("adRewardBtn")
  .addEventListener("click", () => {

    state.balance += 250;

    save();

    toast(
      "+250 OP — тестовая награда"
    );
  });

renderAll();
/* =========================================
   OBSCGRADER VISUAL UPDATE v1.1
   ========================================= */

(() => {

  const rarityNames = {
    common: "Обычный",
    uncommon: "Необычный",
    rare: "Редкий",
    epic: "Эпический",
    legendary: "Легендарный",
    mythic: "Мифический"
  };

  function decorateVisuals() {

    document
      .querySelectorAll(".item-card")
      .forEach((card, index) => {

        const item = state.inventory[index];

        if (!item) return;

        card.dataset.rarity = item.rarity;

        const icon = card.querySelector(".item-icon");

        if (icon) {
          icon.classList.add("skin-texture");
        }

      });

  }

  function createOpeningOverlay() {

    let overlay =
      document.querySelector(".case-opening-overlay");

    if (overlay) {
      return overlay;
    }

    overlay = document.createElement("div");

    overlay.className =
      "case-opening-overlay";

    overlay.innerHTML = `
      <div class="case-opening-box">

        <div class="opening-title">
          OPENING OBSCGRADER CASE
        </div>

        <div class="roulette-window">
          <div class="roulette-track"></div>
        </div>

        <div class="opening-result">

          <div class="opening-result-icon">
            ◆
          </div>

          <div class="opening-result-name">
            Item
          </div>

          <div class="opening-result-rarity">
            Drop
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    return overlay;
  }

  function createRouletteItems(overlay) {

    const track =
      overlay.querySelector(".roulette-track");

    track.innerHTML = "";

    for (let i = 0; i < 26; i++) {

      const item =
        items[
          Math.floor(
            Math.random() * items.length
          )
        ];

      const element =
        document.createElement("div");

      element.className =
        "roulette-item";

      element.innerHTML = `
        <div class="roulette-icon">
          ${item.icon}
        </div>

        <div class="roulette-name">
          ${item.name}
        </div>
      `;

      track.appendChild(element);
    }

  }

  function particles(overlay, rarity) {

    if (
      rarity !== "legendary" &&
      rarity !== "mythic"
    ) {
      return;
    }

    const count =
      rarity === "mythic"
        ? 42
        : 26;

    for (let i = 0; i < count; i++) {

      const particle =
        document.createElement("div");

      particle.className =
        "obsc-particle";

      const angle =
        Math.random() *
        Math.PI *
        2;

      const distance =
        70 +
        Math.random() *
        240;

      particle.style.setProperty(
        "--x",
        `${Math.cos(angle) * distance}px`
      );

      particle.style.setProperty(
        "--y",
        `${Math.sin(angle) * distance}px`
      );

      if (rarity === "mythic") {

        particle.style.background =
          Math.random() > .5
            ? "#ff4fa0"
            : "#8b6cff";

      } else {

        particle.style.background =
          Math.random() > .5
            ? "#ffb84d"
            : "#fff0a8";

      }

      overlay
        .querySelector(".case-opening-box")
        .appendChild(particle);

      setTimeout(
        () => particle.remove(),
        1000
      );

    }

  }

  const originalOpenCase =
    window.openCase;

  let openingLocked = false;

  window.openCase = function(id) {

    if (openingLocked) {
      return;
    }

    const selectedCase =
      cases.find(
        item => item.id === id
      );

    if (
      !selectedCase ||
      state.balance <
        selectedCase.price
    ) {

      originalOpenCase(id);

      return;
    }

    openingLocked = true;

    const overlay =
      createOpeningOverlay();

    createRouletteItems(overlay);

    overlay.classList.remove("result");

    overlay.classList.add("show");

    setTimeout(() => {

      overlay.classList.add("rolling");

    }, 30);

    setTimeout(() => {

      const before =
        state.inventory.length;

      originalOpenCase(id);

      const drop =
        state.inventory[
          state.inventory.length - 1
        ];

      overlay.classList.remove("rolling");

      if (
        drop &&
        state.inventory.length > before
      ) {

        overlay.classList.add("result");

        overlay
          .querySelector(
            ".opening-result-icon"
          )
          .textContent =
            drop.icon;

        overlay
          .querySelector(
            ".opening-result-name"
          )
          .textContent =
            drop.name;

        overlay
          .querySelector(
            ".opening-result-rarity"
          )
          .textContent =
            `${rarityNames[drop.rarity]} · ${drop.value} OP`;

        particles(
          overlay,
          drop.rarity
        );

      }

      setTimeout(() => {

        overlay.classList.remove(
          "show",
          "result",
          "rolling"
        );

        openingLocked = false;

      }, 1500);

    }, 1080);

  };

  const observer =
    new MutationObserver(() => {

      requestAnimationFrame(
        decorateVisuals
      );

    });

  observer.observe(
    document.body,
    {
      childList: true,
      subtree: true
    }
  );

  decorateVisuals();

})();
