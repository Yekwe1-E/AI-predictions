/**
 * BetVision AI — Official Application Logic (Vanilla JavaScript)
 * Author: Antigravity AI Engine
 */

// Global State
let allMatches = [];
let filteredMatches = [];
let selectedLeague = 'All';
let selectedMarket = 'all';
let selectedTimeframe = 'today';
let currentViewMode = 'table';
let searchQuery = '';

const LEAGUE_GROUPS = [
  {
    group: "Europe — Top 5",
    leagues: ["Premier League", "La Liga", "Bundesliga", "Serie A", "Ligue 1"]
  },
  {
    group: "UEFA Competitions",
    leagues: ["UEFA Champions League", "UEFA Europa League", "UEFA Conference League"]
  },
  {
    group: "Americas",
    leagues: ["MLS", "Liga MX", "Brasileirão Serie A", "Argentine LPF"]
  },
  {
    group: "Middle East & Asia",
    leagues: ["Saudi Pro League", "J1 League", "K League 1"]
  },
  {
    group: "Europe — Other",
    leagues: ["Eredivisie", "Primeira Liga", "Scottish Premiership", "Belgian Pro League", "Süper Lig", "Championship"]
  }
];

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  renderLeagueSidebar();
  fetchMatches();
});

// Live UTC Clock
function initClock() {
  const clockEl = document.getElementById('live-clock');
  const dateEl = document.getElementById('current-date-display');
  
  function update() {
    const now = new Date();
    if (clockEl) {
      clockEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' GMT';
    }
    if (dateEl) {
      dateEl.innerText = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' · Live Synchronized';
    }
  }
  update();
  setInterval(update, 1000);
}

// Fetch matches from FastAPI backend
async function fetchMatches() {
  showLoading(true);
  try {
    const params = new URLSearchParams({
      timeframe: selectedTimeframe,
      market: selectedMarket
    });
    if (selectedLeague !== 'All') {
      params.set('league', selectedLeague);
    }

    const response = await fetch(`http://localhost:8000/api/v1/matches/?${params.toString()}`);
    if (response.ok) {
      allMatches = await response.json();
    } else {
      console.warn("Backend response not ok, fallback to stored matches");
    }
  } catch (err) {
    console.error("Error fetching matches from API:", err);
  } finally {
    showLoading(false);
    applyFilters();
    updateHeaderCounters();
  }
}

// Trigger Live Sync via API
async function triggerLiveSync() {
  const syncBtn = document.getElementById('btn-sync-top');
  const syncIcon = document.getElementById('sync-icon');
  if (syncIcon) syncIcon.classList.add('fa-spin');
  
  showLoading(true);
  try {
    const response = await fetch('http://localhost:8000/api/v1/matches/sync', { method: 'POST' });
    if (response.ok) {
      allMatches = await response.json();
    }
  } catch (err) {
    console.error("Error syncing matches:", err);
  } finally {
    if (syncIcon) syncIcon.classList.remove('fa-spin');
    showLoading(false);
    applyFilters();
    updateHeaderCounters();
  }
}

// Filter matches locally
function applyFilters() {
  filteredMatches = allMatches.filter(m => {
    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText = `${m.home_team} ${m.away_team} ${m.league}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  renderMatches();
}

// Render dynamic match table / grid
function renderMatches() {
  const showingCount = document.getElementById('showing-count');
  if (showingCount) showingCount.innerText = filteredMatches.length;

  const emptyState = document.getElementById('empty-state');
  const tableContainer = document.getElementById('table-container');
  const cardsContainer = document.getElementById('cards-container');

  if (filteredMatches.length === 0) {
    if (tableContainer) tableContainer.style.display = 'none';
    if (cardsContainer) cardsContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  if (currentViewMode === 'table') {
    if (tableContainer) tableContainer.style.display = 'block';
    if (cardsContainer) cardsContainer.style.display = 'none';
    renderTable();
  } else {
    if (tableContainer) tableContainer.style.display = 'none';
    if (cardsContainer) cardsContainer.style.display = 'grid';
    renderCards();
  }
}

// Render Forebet Style Table View
function renderTable() {
  const tbody = document.getElementById('matches-table-body');
  if (!tbody) return;

  tbody.innerHTML = filteredMatches.map(match => {
    const pred = (match.predictions && match.predictions[0]) || {};
    const hProb = Math.round((pred.ai_home_win_prob || 0) * 100);
    const dProb = Math.round((pred.ai_draw_prob || 0) * 100);
    const aProb = Math.round((pred.ai_away_win_prob || 0) * 100);
    const maxProb = Math.max(hProb, dProb, aProb);
    const conf = Math.round((pred.confidence_score || 0) * 100);
    const hasValue = pred.value_bet && pred.value_bet !== "No Value Edge";
    
    const hForm = (match.home_form || "W,D,L").split(',').slice(-3);
    const aForm = (match.away_form || "W,D,L").split(',').slice(-3);

    const matchDate = new Date(match.match_date);
    const timeStr = matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = matchDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

    let confClass = 'conf-med';
    if (conf >= 78) confClass = 'conf-high';
    else if (conf < 65) confClass = 'conf-low';

    return `
      <tr onclick="openMatchModal(${match.id})">
        <td>
          <div style="font-weight: 900; color: #FFF;">${timeStr}</div>
          <div style="font-size: 10px; color: var(--primary); font-weight: 700;">${match.league}</div>
          <div style="font-size: 9px; color: var(--text-dark);">${dateStr}</div>
        </td>

        <td>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="font-weight: 800; color: #FFF; font-size: 13px;">
                <span class="team-crest">${match.home_team.substring(0, 2).toUpperCase()}</span>
                ${match.home_team}
              </div>
              <div>${hForm.map(r => `<span class="form-badge ${r}">${r}</span>`).join('')}</div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="font-weight: 800; color: #FFF; font-size: 13px;">
                <span class="team-crest away">${match.away_team.substring(0, 2).toUpperCase()}</span>
                ${match.away_team}
              </div>
              <div>${aForm.map(r => `<span class="form-badge ${r}">${r}</span>`).join('')}</div>
            </div>
          </div>
          ${hasValue ? `<div class="value-tag"><i class="fa-solid fa-bolt"></i> +EV Edge</div>` : ''}
        </td>

        <td>
          <div class="prob-bar-container">
            <div class="prob-labels">
              <span style="color: ${hProb === maxProb ? 'var(--primary)' : 'var(--text-muted)'}">1: ${hProb}%</span>
              <span style="color: ${dProb === maxProb ? 'var(--accent-yellow)' : 'var(--text-muted)'}">X: ${dProb}%</span>
              <span style="color: ${aProb === maxProb ? 'var(--accent-pink)' : 'var(--text-muted)'}">2: ${aProb}%</span>
            </div>
            <div class="prob-bar">
              <div class="prob-seg-home" style="width: ${hProb}%;"></div>
              <div class="prob-seg-draw" style="width: ${dProb}%;"></div>
              <div class="prob-seg-away" style="width: ${aProb}%;"></div>
            </div>
            <div class="prob-odds">
              <span>@${match.home_odds}</span>
              <span>@${match.draw_odds}</span>
              <span>@${match.away_odds}</span>
            </div>
          </div>
        </td>

        <td style="text-align: center;">
          <span class="score-chip">${pred.ai_suggested_score || '1-0'}</span>
        </td>

        <td style="text-align: center; font-weight: 900; color: ${ (pred.ai_over_2_5_prob || 0) > 0.55 ? 'var(--accent-green)' : 'var(--text-muted)' }">
          ${Math.round((pred.ai_over_2_5_prob || 0) * 100)}%
        </td>

        <td style="text-align: center; font-weight: 900; color: ${ (pred.ai_btts_prob || 0) > 0.55 ? 'var(--accent-green)' : 'var(--text-muted)' }">
          ${Math.round((pred.ai_btts_prob || 0) * 100)}%
        </td>

        <td style="text-align: center; font-weight: 800; color: var(--primary);">
          ${pred.ht_ft_pred || '1/1'}
        </td>

        <td style="text-align: center;">
          <div class="conf-badge ${confClass}">${conf}%</div>
        </td>

        <td style="text-align: right;">
          <button class="btn-analyze" onclick="event.stopPropagation(); openMatchModal(${match.id})">
            Analyze
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Render Match Cards Grid View
function renderCards() {
  const cardsContainer = document.getElementById('cards-container');
  if (!cardsContainer) return;

  cardsContainer.innerHTML = filteredMatches.map(match => {
    const pred = (match.predictions && match.predictions[0]) || {};
    const hProb = Math.round((pred.ai_home_win_prob || 0) * 100);
    const dProb = Math.round((pred.ai_draw_prob || 0) * 100);
    const aProb = Math.round((pred.ai_away_win_prob || 0) * 100);
    const matchDate = new Date(match.match_date);

    return `
      <div class="match-card" onclick="openMatchModal(${match.id})">
        <div class="card-header">
          <span class="league-name">${match.league}</span>
          <span class="match-time">${matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div class="card-matchup">
          <div class="team-col">
            <span class="team-crest">${match.home_team.substring(0, 2).toUpperCase()}</span>
            <span class="team-name">${match.home_team}</span>
            <span class="team-odds">@${match.home_odds}</span>
          </div>

          <div>
            <span class="score-chip">${pred.ai_suggested_score || 'VS'}</span>
          </div>

          <div class="team-col">
            <span class="team-crest away">${match.away_team.substring(0, 2).toUpperCase()}</span>
            <span class="team-name">${match.away_team}</span>
            <span class="team-odds">@${match.away_odds}</span>
          </div>
        </div>

        <div class="prob-bar-container" style="width: 100%; margin-top: 12px;">
          <div class="prob-labels">
            <span>1: ${hProb}%</span>
            <span>X: ${dProb}%</span>
            <span>2: ${aProb}%</span>
          </div>
          <div class="prob-bar">
            <div class="prob-seg-home" style="width: ${hProb}%;"></div>
            <div class="prob-seg-draw" style="width: ${dProb}%;"></div>
            <div class="prob-seg-away" style="width: ${aProb}%;"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Dynamic League Sidebar
function renderLeagueSidebar() {
  const container = document.getElementById('league-groups-container');
  if (!container) return;

  container.innerHTML = LEAGUE_GROUPS.map(g => `
    <div class="league-group-title">${g.group}</div>
    ${g.leagues.map(l => `
      <button class="league-btn" data-league="${l}" onclick="selectLeague('${l}')">
        <span>${l}</span>
      </button>
    `).join('')}
  `).join('');
}

// UI Event Handlers
function selectLeague(league) {
  selectedLeague = league;
  document.querySelectorAll('.league-btn').forEach(btn => {
    if (btn.dataset.league === league) btn.classList.add('active');
    else btn.classList.remove('active');
  });

  const activeTag = document.getElementById('active-league-tag');
  if (activeTag) {
    activeTag.innerText = league !== 'All' ? `· League: ${league}` : '';
  }
  fetchMatches();
}

function filterMarket(market) {
  selectedMarket = market;
  document.querySelectorAll('.market-pill').forEach(pill => {
    if (pill.dataset.market === market) pill.classList.add('active');
    else pill.classList.remove('active');
  });
  fetchMatches();
}

function filterTimeframe(tf) {
  selectedTimeframe = tf;
  selectedLeague = 'All'; // Automatically show all leagues for selected timeframe
  document.querySelectorAll('.tf-btn').forEach(btn => {
    if (btn.dataset.tf === tf) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  document.querySelectorAll('.league-btn').forEach(btn => {
    if (btn.dataset.league === 'All') btn.classList.add('active');
    else btn.classList.remove('active');
  });
  const activeTag = document.getElementById('active-league-tag');
  if (activeTag) activeTag.innerText = '';
  fetchMatches();
}

function setViewMode(mode) {
  currentViewMode = mode;
  document.getElementById('view-table-btn').classList.toggle('active', mode === 'table');
  document.getElementById('view-cards-btn').classList.toggle('active', mode === 'cards');
  renderMatches();
}

function handleMatchSearch() {
  const input = document.getElementById('match-search');
  const clearBtn = document.getElementById('clear-search-btn');
  searchQuery = input.value;
  if (clearBtn) clearBtn.style.display = searchQuery ? 'block' : 'none';
  applyFilters();
}

function clearMatchSearch() {
  const input = document.getElementById('match-search');
  input.value = '';
  searchQuery = '';
  document.getElementById('clear-search-btn').style.display = 'none';
  applyFilters();
}

function resetFilters() {
  selectedLeague = 'All';
  selectedMarket = 'all';
  selectedTimeframe = 'all';
  searchQuery = '';
  selectLeague('All');
  filterMarket('all');
  filterTimeframe('all');
  clearMatchSearch();
}

function updateHeaderCounters() {
  const totalEl = document.getElementById('total-matches-count');
  const matchesVal = document.getElementById('stat-matches-val');
  const liveVal = document.getElementById('stat-live-val');
  const valueVal = document.getElementById('stat-value-val');

  if (totalEl) totalEl.innerText = allMatches.length;
  if (matchesVal) matchesVal.innerHTML = `${allMatches.length} <small>Fixtures</small>`;

  const liveCount = allMatches.filter(m => m.status === 'live').length;
  if (liveVal) liveVal.innerHTML = `${liveCount} <small class="text-red">Live</small>`;

  const valueCount = allMatches.filter(m => m.predictions?.[0]?.value_bet && m.predictions[0].value_bet !== "No Value Edge").length;
  if (valueVal) valueVal.innerHTML = `${valueCount} <small class="text-green">Edges</small>`;

  const countAll = document.getElementById('count-all');
  if (countAll) countAll.innerText = allMatches.length;
  const countLive = document.getElementById('count-live');
  if (countLive) countLive.innerText = liveCount;
}

function showLoading(show) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.style.display = show ? 'flex' : 'none';
}

// Modal Handlers
function openMatchModal(matchId) {
  const match = allMatches.find(m => m.id === matchId);
  if (!match) return;

  const pred = (match.predictions && match.predictions[0]) || {};
  document.getElementById('modal-league').innerText = match.league;
  document.getElementById('modal-match-title').innerText = `${match.home_team} vs ${match.away_team}`;

  const hProb = Math.round((pred.ai_home_win_prob || 0) * 100);
  const dProb = Math.round((pred.ai_draw_prob || 0) * 100);
  const aProb = Math.round((pred.ai_away_win_prob || 0) * 100);

  const content = document.getElementById('modal-match-content');
  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
      <div style="background: rgba(255,255,255,0.04); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
        <h4 style="font-size: 11px; text-transform: uppercase; color: var(--text-dark);">Dixon-Coles Win Probability</h4>
        <div style="font-size: 24px; font-weight: 900; color: var(--primary); margin-top: 4px;">
          ${hProb}% Home Win
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
          Draw: <strong>${dProb}%</strong> | Away Win: <strong>${aProb}%</strong>
        </p>
      </div>

      <div style="background: rgba(255,255,255,0.04); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
        <h4 style="font-size: 11px; text-transform: uppercase; color: var(--text-dark);">Expected Goals (xG)</h4>
        <div style="font-size: 24px; font-weight: 900; color: #FFF; margin-top: 4px;">
          ${pred.home_xg || 1.65} - ${pred.away_xg || 0.95}
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
          Confidence Score: <strong style="color: var(--accent-green);">${Math.round((pred.confidence_score || 0.82) * 100)}%</strong>
        </p>
      </div>
    </div>

    <div style="background: rgba(0, 229, 255, 0.05); border: 1px solid var(--border-highlight); padding: 16px; border-radius: 12px; margin-bottom: 20px;">
      <h4 style="font-size: 12px; font-weight: 900; color: var(--primary); margin-bottom: 6px;">
        <i class="fa-solid fa-brain"></i> AI Quantitative Insight
      </h4>
      <p style="font-size: 13px; color: var(--text-main); line-height: 1.6;">
        ${pred.ai_explanation || "The Dixon-Coles model predicts a dominant performance based on home offensive rating and low defensive regression."}
      </p>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); pt-16; margin-top: 20px;">
      <div>
        <span style="font-size: 11px; color: var(--text-dark);">Suggested Exact Score:</span>
        <strong style="font-size: 16px; color: #FFF; margin-left: 6px;">${pred.ai_suggested_score || '2 - 1'}</strong>
      </div>
      <div>
        <span style="font-size: 11px; color: var(--text-dark);">Value Edge:</span>
        <strong style="font-size: 14px; color: var(--accent-green); margin-left: 6px;">${pred.value_bet || 'No Value Edge'}</strong>
      </div>
    </div>
  `;

  openModal('analysis-modal');
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
}

function closeModalOnOverlay(e, id) {
  if (e.target.id === id) closeModal(id);
}
