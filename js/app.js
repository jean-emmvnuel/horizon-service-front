/**
 * HORIZON SERVICE — LOGIQUE APPLICATIVE (Vanilla JS)
 * - Authentification nominative (2 Utilisateurs : Fondateur & Associé)
 * - Graphiques SVG Réactifs & Interactifs (Performance mensuelle & Taux d'occupation)
 * - CRUD Complet sur toutes les ressources : Abonnements, Clients, Comptes, Profils, Caisse, Offres
 * - Journal d'Audit & Traçabilité
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.HorizonStore;
  let currentSession = null;
  let currentAdminTab = 'tab-dashboard';
  let activeFilterSub = 'all';

  // Initialisation
  initAuth();
  initAdmin();

  // -------------------------------------------------------------
  // 1. Authentification & Sessions (2 Utilisateurs)
  // -------------------------------------------------------------
  function initAuth() {
    const viewLogin = document.getElementById('view-login');
    const viewAdmin = document.getElementById('view-admin');
    const formLogin = document.getElementById('form-login');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const btnLogout = document.getElementById('btn-logout');
    const btnTogglePass = document.getElementById('btn-toggle-password');
    const passInput = document.getElementById('login-password');
    const eyeShow = document.getElementById('eye-icon-show');
    const eyeHide = document.getElementById('eye-icon-hide');

    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const emailEl = document.getElementById('login-email');
        const passEl = document.getElementById('login-password');
        const email = emailEl ? emailEl.value.trim() : '';
        const pass = passEl ? passEl.value : '';

        const btnSubmit = formLogin.querySelector('button[type="submit"]');
        if (btnSubmit) btnSubmit.disabled = true;

        try {
          const session = await store.authenticate(email, pass);
          if (session) {
            if (loginErrorMsg) {
              loginErrorMsg.style.display = 'none';
              loginErrorMsg.textContent = '';
            }
            currentSession = session;
            showDashboard();
            showToast(`Bienvenue, ${session.name} !`, 'success');
          } else {
            if (loginErrorMsg) {
              loginErrorMsg.textContent = store.lastAuthError || 'Identifiants incorrects. Veuillez vérifier votre adresse e-mail ou mot de passe.';
              loginErrorMsg.style.display = 'block';
            }
          }
        } catch (err) {
          console.error('Erreur soumission login:', err);
          showLoginBackendError(err.message || 'Impossible de contacter le serveur.', err.status);
        } finally {
          if (btnSubmit) btnSubmit.disabled = false;
        }
      });
    }

    // Bouton toggle show/hide password
    if (btnTogglePass && passInput) {
      btnTogglePass.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = passInput.type === 'password';
        passInput.type = isPassword ? 'text' : 'password';
        if (eyeShow) eyeShow.style.display = isPassword ? 'none' : '';
        if (eyeHide) eyeHide.style.display = isPassword ? '' : 'none';
        btnTogglePass.setAttribute('aria-label', isPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        store.clearSession();
        currentSession = null;
        showLogin();
        showToast('Vous avez été déconnecté.', 'info');
      });
    }

    function showLogin() {
      if (viewLogin) viewLogin.style.display = 'flex';
      if (viewAdmin) viewAdmin.style.display = 'none';
      if (formLogin) formLogin.reset();
      // Reset password visibility on logout
      if (passInput) passInput.type = 'password';
      if (eyeShow) eyeShow.style.display = '';
      if (eyeHide) eyeHide.style.display = 'none';
      window.scrollTo(0, 0);
    }

    async function showDashboard() {
      if (!currentSession) {
        showLogin();
        return;
      }
      if (viewLogin) viewLogin.style.display = 'none';
      if (viewAdmin) viewAdmin.style.display = 'flex';
      updateUserSessionUI();
      const initialData = await store.initialSync;
      if (!initialData) {
        try {
          await store.syncFromBackend();
        } catch (error) {
          console.error('Impossible de charger les données après connexion :', error);
        }
      }
      renderAdmin();
      window.scrollTo(0, 0);
    }

    // Initialisation de la vue selon session existante
    currentSession = store.getCurrentSession();
    if (currentSession) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function updateUserSessionUI() {
    if (!currentSession) return;
    const nameEl = document.getElementById('user-display-name');
    const badgeEl = document.getElementById('admin-role-badge');

    if (nameEl) nameEl.textContent = currentSession.name;
    if (badgeEl) badgeEl.textContent = currentSession.roleLabel || 'Administrateur';
  }

  // -------------------------------------------------------------
  // 2. Navigation et Rendu Général
  // -------------------------------------------------------------
  function initAdmin() {
    initAdminTabs();
    initMobileNav();
    initAdminModals();
    initAdminSearchAndFilters();
    initRefreshButtons();
  }

  /**
   * Affiche une erreur backend inline dans un modal.
   * @param {string} modalId    - ID de l'élément modal
   * @param {string} message    - Message d'erreur issu du backend
   * @param {number} [status]   - Code HTTP optionnel
   */
  function showModalError(modalId, message, status) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    let alertEl = modal.querySelector('.modal-backend-error-inline');
    if (!alertEl) {
      alertEl = document.createElement('div');
      alertEl.className = 'modal-backend-error-inline';
      const firstChild = modal.querySelector('.modal-body, .modal-content, form');
      if (firstChild) {
        firstChild.insertBefore(alertEl, firstChild.firstChild);
      } else {
        modal.appendChild(alertEl);
      }
    }
    alertEl.replaceChildren();
    const icon = document.createElement('span');
    icon.className = 'modal-err-icon';
    icon.textContent = '!';
    const text = document.createElement('span');
    text.className = 'modal-err-text';
    if (status) {
      const statusBadge = document.createElement('span');
      statusBadge.className = 'modal-err-code';
      statusBadge.textContent = String(status);
      text.appendChild(statusBadge);
    }
    text.appendChild(document.createTextNode(message));
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-err-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Fermer');
    closeButton.textContent = '✕';
    closeButton.addEventListener('click', () => alertEl.remove());
    alertEl.append(icon, text, closeButton);
    alertEl.style.display = 'flex';
    alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Affiche une erreur backend dans le formulaire de login.
   */
  function showLoginBackendError(message, status) {
    const loginErrorMsg = document.getElementById('login-error-msg');
    if (loginErrorMsg) {
      loginErrorMsg.replaceChildren();
      const label = document.createElement('strong');
      label.textContent = status ? `Erreur backend [${status}] — ` : 'Erreur backend — ';
      loginErrorMsg.append(label, document.createTextNode(message));
      loginErrorMsg.style.display = 'block';
    }
  }

  function initAdminTabs() {
    const tabBtns = document.querySelectorAll('.admin-tabs-bar .tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetTab = btn.dataset.tab;
        if (!targetTab) return;
        await switchTab(targetTab);
      });
    });
  }

  function renderAdmin() {
    updateBadgesAndKPIs();
    updateLastSyncLabel();
    renderAdminTabContent(currentAdminTab);
  }

  function renderAdminTabContent(tabId) {
    switch (tabId) {
      case 'tab-dashboard':
        renderDashboardTab();
        break;
      case 'tab-abonnements':
        renderAbonnementsTab();
        break;
      case 'tab-clients':
        renderClientsTab();
        break;
      case 'tab-comptes':
        renderComptesTab();
        break;
      case 'tab-finances':
        renderFinancesTab();
        break;
      case 'tab-settings':
        renderSettingsTab();
        break;
      case 'tab-audit':
        renderAuditTab();
        break;
    }
  }

  function updateBadgesAndKPIs() {
    const kpis = store.getKPIs();
    const urgentBadge = document.getElementById('badge-count-urgents');
    const tabSubCount = document.getElementById('tab-sub-count');
    const bnavBadge = document.getElementById('bnav-badge-urgents');
    if (urgentBadge) urgentBadge.textContent = kpis.urgentsCount || 0;
    if (bnavBadge) bnavBadge.textContent = kpis.urgentsCount || 0;
    if (tabSubCount) tabSubCount.textContent = (store.data.abonnements || []).length;
  }

  // --- Rafraîchissement global depuis la BDD ---
  async function doRefresh(btnEl) {
    if (btnEl) {
      btnEl.disabled = true;
      const icon = btnEl.querySelector('svg');
      if (icon) {
        icon.style.transition = 'transform 0.6s linear';
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => {
          icon.style.transition = '';
          icon.style.transform = '';
        }, 700);
      }
    }
    try {
      await store.syncFromBackend();
      renderAdmin();
      updateLastSyncLabel();
    } catch (e) {
      console.warn('Erreur rafraîchissement direct :', e);
    }
    if (btnEl) btnEl.disabled = false;
  }

  function updateLastSyncLabel() {
    const el = document.getElementById('dashboard-last-sync');
    if (!el) return;
    const now = new Date();
    const opts = { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    el.textContent = `Dernière synchronisation : ${now.toLocaleDateString('fr-FR', opts)} — Monnaie : Franc CFA (FCFA)`;
  }

  function initRefreshButtons() {
    const refreshMap = {
      'btn-refresh-dashboard': null,
      'btn-refresh-abonnements': null,
      'btn-refresh-clients': null,
      'btn-refresh-comptes': null,
      'btn-refresh-finances': null,
      'btn-refresh-settings': null,
      'btn-refresh-audit': null
    };
    Object.keys(refreshMap).forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => doRefresh(btn));
      }
    });
  }

  // -------------------------------------------------------------
  // 3. Graphiques SVG Réactifs & Visuels
  // -------------------------------------------------------------
  function renderCharts() {
    renderMonthlyBarChart();
    renderAccountsGaugeChart();
  }

  // Graphique 1 : Évolution Mensuelle (Multi-bar responsive SVG)
  function renderMonthlyBarChart() {
    const container = document.getElementById('container-chart-monthly');
    if (!container) return;

    const data = store.getHistoriqueMensuel();
    if (!data || data.length === 0) return;

    const maxVal = Math.max(0, ...data.map(d => Math.max(d.ca || 0, d.recharge || 0, d.benefice || 0)));
    const ceiling = Math.max(10000, Math.ceil(maxVal / 10000) * 10000); // Arrondi supérieur propre (minimum 10000 pour éviter division par zéro)

    const svgWidth = 600;
    const svgHeight = 260;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;
    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    const barGroupWidth = chartWidth / data.length;
    const barWidth = Math.min(14, (barGroupWidth - 10) / 3);

    // Lignes horizontales de repère
    let gridLinesSvg = '';
    for (let i = 0; i <= 4; i++) {
      const yVal = ceiling * (i / 4);
      const yPos = paddingTop + chartHeight - (chartHeight * (yVal / ceiling));
      gridLinesSvg += `
        <line x1="${paddingLeft}" y1="${yPos}" x2="${svgWidth - paddingRight}" y2="${yPos}" stroke="#242738" stroke-dasharray="3,3" />
        <text x="${paddingLeft - 8}" y="${yPos + 4}" text-anchor="end" class="chart-text">${(yVal / 1000).toFixed(0)}k</text>
      `;
    }

    // Barres de données
    let barsSvg = '';
    data.forEach((d, idx) => {
      const groupX = paddingLeft + (idx * barGroupWidth) + (barGroupWidth / 2);

      const hCA = (d.ca / ceiling) * chartHeight;
      const hBen = (Math.max(0, d.benefice) / ceiling) * chartHeight;
      const hRec = (d.recharge / ceiling) * chartHeight;

      const yCA = paddingTop + chartHeight - hCA;
      const yBen = paddingTop + chartHeight - hBen;
      const yRec = paddingTop + chartHeight - hRec;

      const shortLabel = d.shortLabel || d.label.split(' ')[0].substring(0, 4);

      barsSvg += `
        <!-- Groupe Mois ${d.label} -->
        <g class="chart-bar-group">
          <!-- Barre CA (Rouge) -->
          <rect class="chart-bar" x="${groupX - (barWidth * 1.5) - 2}" y="${yCA}" width="${barWidth}" height="${hCA}" rx="2" fill="var(--chart-color-ca)">
            <title>${d.label} - CA: ${formatFCFA(d.ca)} FCFA</title>
          </rect>
          <!-- Barre Bénéfice (Vert) -->
          <rect class="chart-bar" x="${groupX - (barWidth * 0.5)}" y="${yBen}" width="${barWidth}" height="${hBen}" rx="2" fill="var(--chart-color-benefice)">
            <title>${d.label} - Bénéfice: ${formatFCFA(d.benefice)} FCFA</title>
          </rect>
          <!-- Barre Recharge (Ambre) -->
          <rect class="chart-bar" x="${groupX + (barWidth * 0.5) + 2}" y="${yRec}" width="${barWidth}" height="${hRec}" rx="2" fill="var(--chart-color-recharge)">
            <title>${d.label} - Recharge: ${formatFCFA(d.recharge)} FCFA</title>
          </rect>
          <!-- Label du mois -->
          <text x="${groupX}" y="${svgHeight - 14}" text-anchor="middle" class="chart-text">${shortLabel}</text>
        </g>
      `;
    });

    container.innerHTML = `
      <svg class="svg-chart" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="xMidYMid meet">
        ${gridLinesSvg}
        ${barsSvg}
      </svg>
    `;
  }

  // Graphique 2 : Taux d'occupation par compte (Gauges circulaires SVG)
  function renderAccountsGaugeChart() {
    const container = document.getElementById('container-chart-accounts');
    if (!container) return;

    const comptes = store.data.comptes || [];
    if (comptes.length === 0) {
      container.innerHTML = '<div class="text-muted text-sm" style="padding: 1rem 0;">Aucun compte à afficher.</div>';
      return;
    }
    let itemsHtml = '';

    comptes.forEach(compte => {
      const placesOccupees = (store.data.abonnements || []).filter(ab => {
        const p = (store.data.profils || []).find(prof => prof.id === ab.profilId);
        return p && p.compteId === compte.id;
      }).length;

      const capacite = Number(compte.capacitePlaces || compte.capacite || 15);
      const pct = Math.min(100, Math.round((placesOccupees / capacite) * 100));
      const isOverflow = placesOccupees > capacite;

      let color = 'var(--status-success)';
      if (isOverflow) color = 'var(--status-danger)';
      else if (pct >= 85) color = 'var(--status-warning)';

      itemsHtml += `
        <div style="background-color: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-3);">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
            <strong style="font-size: var(--text-sm);">${escapeHtml(compte.libelle)}</strong>
            <span style="font-size: var(--text-xs); font-weight: 700; color: ${color};">
              ${placesOccupees} / ${capacite} places (${Math.round((placesOccupees/capacite)*100)}%)
            </span>
          </div>
          <div class="account-capacity-bar" style="margin: 0;">
            <div class="capacity-progress" style="width: ${pct}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-2); padding-top: var(--space-2);">
        ${itemsHtml}
      </div>
    `;
  }

  // -------------------------------------------------------------
  // 4. Onglet 1 : Dashboard Principal
  // -------------------------------------------------------------
  function renderDashboardTab() {
    const kpis = store.getKPIs();
    const urgents = store.getUrgentAbonnements();
    const codesARenouveler = store.getProfilesWithCodeToRenew();

    // KPI Cards
    const kpiCaMois = document.getElementById('kpi-ca-mois');
    const kpiBeneficeMois = document.getElementById('kpi-benefice-mois');
    const kpiMargeMois = document.getElementById('kpi-marge-mois');
    const kpiCaCumul = document.getElementById('kpi-ca-cumul');
    const kpiBeneficeCumul = document.getElementById('kpi-benefice-cumul');
    const kpiOccupation = document.getElementById('kpi-occupation');
    const kpiPlacesLibres = document.getElementById('kpi-places-libres');
    const kpiCaisseTheorique = document.getElementById('kpi-caisse-theorique');
    const kpiEcartCaisse = document.getElementById('kpi-ecart-caisse');

    if (kpiCaMois) kpiCaMois.textContent = `${formatFCFA(kpis.caMois)} FCFA`;
    if (kpiBeneficeMois) {
      kpiBeneficeMois.textContent = `${formatFCFA(kpis.beneficeMois)} FCFA`;
      kpiBeneficeMois.className = kpis.beneficeMois < 0 ? 'kpi-value text-danger' : 'kpi-value text-success';
    }
    if (kpiMargeMois) kpiMargeMois.textContent = `${kpis.margePctMois}%`;
    if (kpiCaCumul) kpiCaCumul.textContent = `Cycle du ${kpis.periodeMoisLabel}`;
    if (kpiBeneficeCumul) kpiBeneficeCumul.textContent = `Cycle du ${kpis.periodeMoisLabel} — après déduction des recharges`;
    if (kpiOccupation) kpiOccupation.textContent = `${kpis.tauxOccupationGlobal}% (${kpis.totalAbonnements}/${kpis.capaciteTotale})`;
    if (kpiPlacesLibres) kpiPlacesLibres.textContent = `${kpis.placesLibres} place${kpis.placesLibres > 1 ? 's' : ''} libre${kpis.placesLibres > 1 ? 's' : ''}`;
    if (kpiCaisseTheorique) kpiCaisseTheorique.textContent = `${formatFCFA(kpis.caisseTheorique)} FCFA`;
    if (kpiEcartCaisse) {
      kpiEcartCaisse.textContent = `${formatFCFA(kpis.ecartCaisse)} FCFA`;
      kpiEcartCaisse.className = kpis.ecartCaisse < 0 ? 'kpi-value text-danger' : 'kpi-value text-success';
    }

    // À traiter aujourd'hui (Alertes)
    const urgentsList = document.getElementById('dashboard-urgents-list');
    if (urgentsList) {
      if (urgents.length === 0) {
        urgentsList.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-muted" style="padding: 2rem;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 0.5rem; color: var(--status-success);"><polyline points="20 6 9 17 4 12"/></svg>
              <div>Aucune échéance urgente pour aujourd'hui. Tout est à jour !</div>
            </td>
          </tr>
        `;
      } else {
        urgentsList.innerHTML = urgents.map(item => `
          <tr class="${item.status.code === 'echu' ? 'row-danger' : 'row-urgent'}">
            <td>
              <strong>${escapeHtml(item.client.nom || 'Sans nom')}</strong>
              ${item.client.ancienId ? `<span class="badge badge-neutral" style="margin-left: 4px;">${escapeHtml(item.client.ancienId)}</span>` : ''}
              <div class="text-xs text-muted">${formatPhone(item.client.telephone)}</div>
            </td>
            <td>
              <strong>${escapeHtml(item.compte.libelle)}</strong>
              <div class="text-xs text-muted">Profil : ${escapeHtml(item.profil.nom)}</div>
            </td>
            <td>${formatDate(item.dateFin)}</td>
            <td><span class="badge ${item.status.badgeClass}">${item.status.label}</span></td>
            <td>${formatFCFA(item.tarif)} FCFA</td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-sm btn-secondary btn-renew-quick" data-sub-id="${item.id}" title="Renouveler immédiatement">
                  <span>Renouveler</span>
                </button>
              </div>
            </td>
          </tr>
        `).join('');

        urgentsList.querySelectorAll('.btn-renew-quick').forEach(btn => {
          btn.addEventListener('click', () => {
            renewSubscription(btn.dataset.subId);
          });
        });
      }
    }

    // Codes à renouveler (❌)
    const codesList = document.getElementById('dashboard-codes-list');
    if (codesList) {
      if (codesARenouveler.length === 0) {
        codesList.innerHTML = `<div class="text-muted text-sm" style="padding: 1rem 0;">Tous les codes de profils sont à jour.</div>`;
      } else {
        codesList.innerHTML = codesARenouveler.map(p => `
          <div class="profile-item" style="border-left: 3px solid var(--status-danger);">
            <div class="profile-info">
              <div class="profile-name">
                <span class="text-danger font-bold" style="margin-right: 4px;">❌</span>
                ${escapeHtml(p.nom)} (${escapeHtml(p.compte.libelle)})
              </div>
              <div class="profile-clients-count">${p.clientsCount} abonné(s) rattaché(s) - Code actuel : <span class="font-mono">••••</span></div>
            </div>
            <button class="btn btn-sm btn-primary btn-edit-profile-pin" data-profile-id="${p.id}">
              <span>Changer le code PIN</span>
            </button>
          </div>
        `).join('');

        codesList.querySelectorAll('.btn-edit-profile-pin').forEach(btn => {
          btn.addEventListener('click', () => {
            openProfilModal(btn.dataset.profileId);
          });
        });
      }
    }

    // Rendu des graphiques réactifs
    renderCharts();

    // Rendu du tableau certifié
    const historiqueMensuel = store.getHistoriqueMensuel();
    const tableBody = document.getElementById('table-historique-mensuel');
    if (tableBody) {
      tableBody.innerHTML = historiqueMensuel.map(m => `
        <tr>
          <td><strong>${escapeHtml(m.label)}</strong></td>
          <td>${formatFCFA(m.ca)} FCFA</td>
          <td>${formatFCFA(m.recharge)} FCFA</td>
          <td class="font-bold text-success">${formatFCFA(m.benefice)} FCFA</td>
          <td><span class="badge badge-neutral">${m.margePct}%</span></td>
        </tr>
      `).join('');
    }

    // Rendu mobile (cartes tactiles)
    renderMobileUrgents(urgents);
    renderMobileHistorique();
  }

  // -------------------------------------------------------------
  // 5. CRUD : Abonnements
  // -------------------------------------------------------------
  function renderAbonnementsTab() {
    const tbody = document.getElementById('table-abonnements-body');
    const mobileContainer = document.getElementById('mobile-abonnements-list');
    if (!tbody) return;

    const subs = store.data.abonnements.map(ab => {
      const client = store.data.clients.find(c => c.id === ab.clientId) || { nom: 'Inconnu', telephone: '' };
      const profil = store.data.profils.find(p => p.id === ab.profilId) || { nom: 'Inconnu', compteId: '' };
      const compte = store.data.comptes.find(c => c.id === profil.compteId) || { libelle: 'Inconnu' };
      const status = store.getAbonnementStatus(ab);
      return { ...ab, client, profil, compte, status };
    });

    let filtered = subs;
    if (activeFilterSub === 'urgent') {
      filtered = subs.filter(s => s.status.isUrgent);
    } else if (activeFilterSub === 'actif') {
      filtered = subs.filter(s => s.status.code === 'actif');
    } else if (activeFilterSub === 'echu') {
      filtered = subs.filter(s => s.status.code === 'echu');
    }

    tbody.innerHTML = filtered.map(item => `
      <tr class="${item.status.isUrgent ? (item.status.code === 'echu' ? 'row-danger' : 'row-urgent') : ''}">
        <td>
          <button class="btn-link btn-open-client-drawer" data-client-id="${item.client.id}" style="font-weight: 700; text-align: left; text-decoration: underline;">
            ${escapeHtml(item.client.nom || 'Sans nom')}
          </button>
          <div class="text-xs text-muted">${formatPhone(item.client.telephone)}</div>
        </td>
        <td>
          <strong>${escapeHtml(item.compte.libelle)}</strong>
          <div class="text-xs text-muted">Profil : ${escapeHtml(item.profil.nom)}</div>
        </td>
        <td>${formatDate(item.dateDebut)}</td>
        <td>${formatDate(item.dateFin)}</td>
        <td><span class="badge ${item.status.badgeClass}">${item.status.label}</span></td>
        <td>${formatFCFA(item.tarif)} FCFA</td>
        <td>
          <div class="btn-action-group">
            <button class="btn btn-xs btn-secondary btn-renew-quick" data-sub-id="${item.id}" title="Renouveler +1 mois">
              <span>+1m</span>
            </button>
            <button class="btn btn-xs btn-outline btn-edit-sub" data-sub-id="${item.id}" title="Modifier l'abonnement">
              <span>Éditer</span>
            </button>
            <button class="btn btn-xs btn-danger btn-delete-sub" data-sub-id="${item.id}" title="Supprimer l'abonnement">
              <span>✕</span>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-renew-quick').forEach(btn => {
      btn.addEventListener('click', () => renewSubscription(btn.dataset.subId));
    });

    tbody.querySelectorAll('.btn-edit-sub').forEach(btn => {
      btn.addEventListener('click', () => openAbonnementModal(btn.dataset.subId));
    });

    tbody.querySelectorAll('.btn-delete-sub').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.subId;
        const sub = store.data.abonnements.find(s => s.id === id);
        const cli = sub ? store.data.clients.find(c => c.id === sub.clientId) : null;
        const name = cli ? cli.nom : id;
        const ok = await showConfirmModal({
          title: 'Supprimer l\'abonnement',
          message: `Voulez-vous vraiment supprimer l'abonnement de <strong>${escapeHtml(name)}</strong> ? Cette action libérera la place et le profil associé.`,
          confirmText: 'Supprimer l\'abonnement',
          cancelText: 'Annuler',
          isDanger: true,
          icon: '🗑️'
        });
        if (!ok) return;

        await store.deleteAbonnement(id);
        store.logAction(currentSession?.name, 'SUPPRESSION_ABONNEMENT', `Abonnement ${id} supprimé`);
        showToast('Abonnement supprimé avec succès.', 'info');
        renderAdmin();
      });
    });

    tbody.querySelectorAll('.btn-open-client-drawer').forEach(btn => {
      btn.addEventListener('click', () => openClientDrawer(btn.dataset.clientId));
    });

    // Rendu mobile
    renderMobileAbonnements(filtered);
  }

  function openAbonnementModal(subId = null) {
    const modal = document.getElementById('modal-sub');
    const form = document.getElementById('form-sub');
    const title = document.getElementById('modal-sub-title');
    const inputEditId = document.getElementById('sub-edit-id');
    const selClient = document.getElementById('sub-client-select');
    const selCompte = document.getElementById('sub-compte-select');
    const selProfil = document.getElementById('sub-profil-select');
    const selDuree = document.getElementById('sub-duree-select');
    const inputTarif = document.getElementById('sub-tarif-input');
    const inputDateDebut = document.getElementById('sub-date-debut');
    const inputDateFin = document.getElementById('sub-date-fin');

    if (!modal) return;

    // Remplissage des sélecteurs : afficher l'identifiant client (ex. cl 100), pas le nom
    const orderedClients = [...store.data.clients].sort(compareClientReferences);
    selClient.innerHTML = orderedClients.map(c => {
      const clientRef = getClientReference(c);
      return `<option value="${c.id}">${escapeHtml(clientRef)}</option>`;
    }).join('');

    selCompte.innerHTML = store.data.comptes.map(c => `
      <option value="${c.id}">${escapeHtml(c.libelle)} (${c.capacitePlaces} places)</option>
    `).join('');

    function updateProfils() {
      const cId = selCompte.value;
      const profils = store.data.profils.filter(p => p.compteId === cId);
      selProfil.innerHTML = profils.map(p => {
        const count = store.data.abonnements.filter(ab => ab.profilId === p.id).length;
        return `<option value="${p.id}">${escapeHtml(p.nom)} (${count} clients)</option>`;
      }).join('');
    }
    selCompte.onchange = updateProfils;
    updateProfils();

    if (selDuree) {
      selDuree.onchange = () => {
        const opt = selDuree.options[selDuree.selectedIndex];
        if (opt.dataset.price) {
          inputTarif.value = opt.dataset.price;
        }
        if (inputDateDebut.value && opt.value !== 'custom') {
          const d = new Date(inputDateDebut.value);
          d.setMonth(d.getMonth() + Number(opt.value));
          inputDateFin.value = d.toISOString().split('T')[0];
        }
      };
    }

    inputDateDebut.onchange = () => {
      const opt = selDuree?.options[selDuree?.selectedIndex];
      if (inputDateDebut.value && opt && opt.value !== 'custom') {
        const d = new Date(inputDateDebut.value);
        d.setMonth(d.getMonth() + Number(opt.value || 1));
        inputDateFin.value = d.toISOString().split('T')[0];
      }
    };

    if (subId) {
      // Mode Édition
      const sub = store.data.abonnements.find(s => s.id === subId);
      if (!sub) return;
      title.textContent = 'Modifier l\'abonnement';
      inputEditId.value = sub.id;
      selClient.value = sub.clientId;
      const p = store.data.profils.find(prof => prof.id === sub.profilId);
      if (p) {
        selCompte.value = p.compteId;
        updateProfils();
        selProfil.value = p.id;
      }
      inputTarif.value = sub.tarif;
      inputDateDebut.value = sub.dateDebut;
      inputDateFin.value = sub.dateFin;
      if (selDuree) selDuree.value = 'custom';
    } else {
      // Mode Création
      title.textContent = 'Créer un nouvel abonnement';
      inputEditId.value = '';
      inputTarif.value = 1500;
      const today = new Date();
      inputDateDebut.value = today.toISOString().split('T')[0];
      const d = new Date(today);
      d.setMonth(d.getMonth() + 1);
      inputDateFin.value = d.toISOString().split('T')[0];
      if (selDuree) selDuree.value = '1';
    }

    modal.classList.add('active');
  }

  async function handleSaveAbonnement(e) {
    e.preventDefault();
    const editId = document.getElementById('sub-edit-id').value;
    const clientId = document.getElementById('sub-client-select').value;
    const profilId = document.getElementById('sub-profil-select').value;
    const tarif = parseInt(document.getElementById('sub-tarif-input').value, 10);
    const dateDebut = document.getElementById('sub-date-debut').value;
    const dateFin = document.getElementById('sub-date-fin').value;

    if (new Date(dateFin) <= new Date(dateDebut)) {
      showToast('La date de fin doit être postérieure à la date de début.', 'warning');
      return;
    }

    try {
      if (editId) {
        await store.updateAbonnement(editId, { clientId, profilId, tarif, dateDebut, dateFin });
        store.logAction(currentSession?.name, 'MODIFICATION_ABONNEMENT', `Abonnement ${editId} mis à jour`);
      } else {
        await store.createAbonnement({ clientId, profilId, tarif, dateDebut, dateFin });
        store.logAction(currentSession?.name, 'CREATION_ABONNEMENT', `Nouvel abonnement pour ${clientId}`);
      }

      document.getElementById('modal-sub').classList.remove('active');
      renderAdmin();
    } catch (err) {
      console.error('Erreur sauvegarde abonnement :', err);
      showModalError('modal-sub', err.message || 'Erreur inattendue', err.status);
    }
  }

  async function renewSubscription(subId) {
    const sub = store.data.abonnements.find(s => s.id === subId);
    const cli = sub ? store.data.clients.find(c => c.id === sub.clientId) : null;
    const clientName = cli ? cli.nom : 'ce client';
    const ok = await showConfirmModal({
      title: 'Renouveler l\'abonnement',
      message: `Voulez-vous prolonger l'abonnement de <strong>${escapeHtml(clientName)}</strong> pour 1 mois supplémentaire (+30 jours) ?`,
      confirmText: 'Confirmer le renouvellement',
      cancelText: 'Annuler',
      isDanger: false,
      icon: '🔄'
    });
    if (!ok) return;

    try {
      await store.renewSubscription(subId);
      store.logAction(currentSession?.name, 'RENOUVELLEMENT_ABONNEMENT', `Abonnement de ${clientName} renouvelé +1 mois`);
      renderAdmin();
    } catch (err) {
      console.error('Erreur renouvellement abonnement :', err);
      showToast(`Renouvellement échoué : ${err.message}`, 'danger', 6000);
    }
  }

  // -------------------------------------------------------------
  // 6. CRUD : Clients
  // -------------------------------------------------------------
  function getClientReference(client) {
    const raw = (client?.ancienId || '').trim();
    if (raw) return raw;
    const fallback = (client?.nom || '').trim();
    return fallback || 'Sans identifiant';
  }

  function compareClientReferences(a, b) {
    const refA = getClientReference(a).toLowerCase();
    const refB = getClientReference(b).toLowerCase();

    const extractNumber = (value) => {
      const match = value.match(/cl\s*(\d+)/i);
      return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
    };

    const numA = extractNumber(refA);
    const numB = extractNumber(refB);

    if (numA !== Number.MAX_SAFE_INTEGER || numB !== Number.MAX_SAFE_INTEGER) {
      if (numA !== numB) return numA - numB;
    }

    return refA.localeCompare(refB, 'fr', { numeric: true, sensitivity: 'base' });
  }

  function renderClientsTab() {
    const listContainer = document.getElementById('clients-table-body');
    if (!listContainer) return;

    const searchTerm = (document.getElementById('input-search-clients')?.value || '').toLowerCase().trim();

    let clients = [...store.data.clients].sort(compareClientReferences);
    if (searchTerm) {
      clients = clients.filter(c => {
        const ref = getClientReference(c).toLowerCase();
        return (
          ref.includes(searchTerm) ||
          (c.nom || '').toLowerCase().includes(searchTerm) ||
          (c.telephone && c.telephone.toLowerCase().includes(searchTerm)) ||
          (c.ancienId && c.ancienId.toLowerCase().includes(searchTerm))
        );
      });
    }

    listContainer.innerHTML = clients.map(c => {
      const clientSubs = store.data.abonnements.filter(ab => ab.clientId === c.id);
      const totalDepense = clientSubs.reduce((sum, ab) => sum + ab.tarif, 0);
      const clientRef = getClientReference(c);

      return `
        <tr>
          <td>
            <strong>${escapeHtml(clientRef)}</strong>
            ${c.ancienId ? `<span class="badge badge-neutral" style="margin-left: 4px;">${escapeHtml(c.ancienId)}</span>` : ''}
          </td>
          <td>${formatPhone(c.telephone)}</td>
          <td><span class="badge badge-info">${clientSubs.length} abonnement(s)</span></td>
          <td><strong>${formatFCFA(totalDepense)} FCFA</strong></td>
          <td>${c.origine ? escapeHtml(c.origine) : 'Non spécifié'}</td>
          <td>
            <div class="btn-action-group">
              <button class="btn btn-xs btn-outline btn-client-details" data-client-id="${c.id}" title="Voir fiche détaillée">
                <span>Fiche</span>
              </button>
              <button class="btn btn-xs btn-secondary btn-edit-client" data-client-id="${c.id}" title="Modifier le client">
                <span>Éditer</span>
              </button>
              <button class="btn btn-xs btn-danger btn-delete-client" data-client-id="${c.id}" title="Supprimer le client">
                <span>✕</span>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    listContainer.querySelectorAll('.btn-client-details').forEach(btn => {
      btn.addEventListener('click', () => openClientDrawer(btn.dataset.clientId));
    });

    listContainer.querySelectorAll('.btn-edit-client').forEach(btn => {
      btn.addEventListener('click', () => openClientModal(btn.dataset.clientId));
    });

    listContainer.querySelectorAll('.btn-delete-client').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.clientId;
        const client = store.data.clients.find(c => c.id === id);
        const name = client ? client.nom : id;
        const ok = await showConfirmModal({
          title: 'Supprimer le client',
          message: `Voulez-vous vraiment supprimer la fiche de <strong>${escapeHtml(name)}</strong> ? Tous ses abonnements associés seront également supprimés.`,
          confirmText: 'Supprimer définitivement',
          cancelText: 'Annuler',
          isDanger: true,
          icon: '🗑️'
        });
        if (!ok) return;

        try {
          await store.deleteClient(id);
          store.logAction(currentSession?.name, 'SUPPRESSION_CLIENT', `Client ${id} (${name}) supprimé`);
          renderAdmin();
        } catch (err) {
          console.warn('Erreur suppression client :', err);
        }
      });
    });

    // Rendu mobile
    renderMobileClients(clients);
  }

  function openClientModal(clientId = null) {
    const modal = document.getElementById('modal-client');
    const form = document.getElementById('form-client');
    const title = document.getElementById('modal-client-title');
    const inputEditId = document.getElementById('cli-edit-id');
    const inputNom = document.getElementById('cli-nom');
    const inputTel = document.getElementById('cli-tel');
    const inputAncienId = document.getElementById('cli-ancien-id');
    const selOrigine = document.getElementById('cli-origine');
    const inputNotes = document.getElementById('cli-notes');

    if (!modal) return;

    if (clientId) {
      const client = store.data.clients.find(c => c.id === clientId);
      if (!client) return;
      title.textContent = 'Modifier le client';
      inputEditId.value = client.id;
      inputNom.value = client.nom || '';
      inputTel.value = client.telephone || '';
      inputAncienId.value = client.ancienId || '';
      selOrigine.value = client.origine || 'autre';
      inputNotes.value = client.notes || '';
    } else {
      title.textContent = 'Ajouter un nouveau client';
      inputEditId.value = '';
      form.reset();
    }

    modal.classList.add('active');
  }

  async function handleSaveClient(e) {
    e.preventDefault();
    const editId = document.getElementById('cli-edit-id').value;
    const nom = document.getElementById('cli-nom').value.trim();
    const telephone = document.getElementById('cli-tel').value.trim();
    const ancienId = document.getElementById('cli-ancien-id').value.trim();
    const origine = document.getElementById('cli-origine').value;
    const notes = document.getElementById('cli-notes').value.trim();

    try {
      if (editId) {
        await store.updateClient(editId, { nom, telephone, ancienId, origine, notes });
        store.logAction(currentSession?.name, 'MODIFICATION_CLIENT', `Fiche client ${nom || 'sans nom'} mise à jour`);
      } else {
        await store.createClient({ nom, telephone, ancienId, origine, notes });
        store.logAction(currentSession?.name, 'CREATION_CLIENT', `Client ${nom || 'sans nom'} créé`);
      }

      document.getElementById('modal-client').classList.remove('active');
      renderAdmin();
    } catch (err) {
      console.error('Erreur sauvegarde client :', err);
      showModalError('modal-client', err.message || 'Erreur inattendue', err.status);
    }
  }

  // -------------------------------------------------------------
  // 7. CRUD : Comptes Netflix & Profils
  // -------------------------------------------------------------
  function renderComptesTab() {
    const container = document.getElementById('comptes-cards-container');
    if (!container) return;

    container.innerHTML = store.data.comptes.map(compte => {
      const profilsCompte = store.data.profils.filter(p => p.compteId === compte.id);
      const abonnementsCompte = store.data.abonnements.filter(ab => {
        const p = store.data.profils.find(prof => prof.id === ab.profilId);
        return p && p.compteId === compte.id;
      });

      const placesOccupees = abonnementsCompte.length;
      const capacite = compte.capacitePlaces;
      const pct = Math.min(100, Math.round((placesOccupees / capacite) * 100));

      let progressClass = 'normal';
      if (placesOccupees > capacite) progressClass = 'danger';
      else if (pct >= 85) progressClass = 'warning';

      return `
        <div class="card account-card">
          <div class="account-header">
            <div>
              <h3 class="card-title">${escapeHtml(compte.libelle)}</h3>
              <div class="text-xs text-muted">Prochain renouvellement : ${formatDate(compte.dateReabonnement)}</div>
            </div>
            <div style="display: flex; gap: 4px; align-items: center;">
              <span class="badge ${placesOccupees > capacite ? 'badge-danger' : 'badge-success'}">
                ${placesOccupees} / ${capacite} places
              </span>
              <button class="btn btn-xs btn-outline btn-edit-compte" data-compte-id="${compte.id}" title="Modifier le compte">
                <span>Éditer</span>
              </button>
              <button class="btn btn-xs btn-danger btn-delete-compte" data-compte-id="${compte.id}" title="Supprimer le compte">
                <span>✕</span>
              </button>
            </div>
          </div>

          <div class="account-capacity-bar">
            <div class="capacity-progress ${progressClass}" style="width: ${pct}%"></div>
          </div>

          <div style="background-color: var(--bg-surface-elevated); padding: var(--space-3); border-radius: var(--radius-md); font-size: var(--text-sm);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span class="text-muted">E-mail :</span>
              <span class="font-mono text-white">${escapeHtml(compte.email)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="text-muted">Mot de passe :</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span class="font-mono password-field" id="pwd-${compte.id}">••••••••••••</span>
                <button class="btn btn-xs btn-outline btn-reveal-pwd" data-compte-id="${compte.id}" data-pwd="${escapeHtml(compte.motDePasse)}">
                  <span>Voir</span>
                </button>
                <button class="btn btn-xs btn-outline btn-copy-pwd" data-pwd="${escapeHtml(compte.motDePasse)}">
                  <span>Copier</span>
                </button>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: var(--text-xs);">
              <span class="text-muted">Recharge mensuelle :</span>
              <span>${formatFCFA(compte.coutRechargeMensuel)} FCFA</span>
            </div>
          </div>

          <div class="profiles-list">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <h4 class="text-sm font-semibold text-secondary">Profils (${profilsCompte.length}/${compte.maxProfils}) :</h4>
              ${profilsCompte.length < compte.maxProfils ? `
                <button class="btn btn-xs btn-secondary btn-add-profil-to-compte" data-compte-id="${compte.id}">
                  <span>+ Profil</span>
                </button>
              ` : ''}
            </div>
            ${profilsCompte.map(p => {
              const clientsDuProfil = store.data.abonnements.filter(ab => ab.profilId === p.id).length;
              return `
                <div class="profile-item">
                  <div class="profile-info">
                    <div class="profile-name">
                      ${p.codeRenewNeeded ? '<span class="text-danger font-bold" title="Code à changer">❌</span>' : ''}
                      ${escapeHtml(p.nom)}
                    </div>
                    <div class="profile-clients-count">${clientsDuProfil} abonné(s)</div>
                  </div>
                  <div class="profile-pin-wrapper">
                    <span class="pin-display">PIN: ${p.codePin}</span>
                    <button class="btn btn-xs btn-outline btn-edit-profil" data-profil-id="${p.id}" title="Modifier profil / PIN">
                      <span>Éditer</span>
                    </button>
                    <button class="btn btn-xs btn-danger btn-delete-profil" data-profil-id="${p.id}" title="Supprimer ce profil">
                      <span>✕</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Actions Mots de Passe
    container.querySelectorAll('.btn-reveal-pwd').forEach(btn => {
      btn.addEventListener('click', () => {
        const span = document.getElementById(`pwd-${btn.dataset.compteId}`);
        if (!span) return;
        if (span.textContent.includes('•')) {
          span.textContent = btn.dataset.pwd;
          btn.querySelector('span').textContent = 'Masquer';
          store.logAction(currentSession?.name, 'CONSULTATION_PASSWORD', `Consultation mot de passe ${btn.dataset.compteId}`);
        } else {
          span.textContent = '••••••••••••';
          btn.querySelector('span').textContent = 'Voir';
        }
      });
    });

    container.querySelectorAll('.btn-copy-pwd').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.pwd);
        showToast('Mot de passe copié !', 'success');
        store.logAction(currentSession?.name, 'COPIE_PASSWORD', 'Mot de passe copié');
      });
    });

    // Actions CRUD Comptes
    container.querySelectorAll('.btn-edit-compte').forEach(btn => {
      btn.addEventListener('click', () => openCompteModal(btn.dataset.compteId));
    });

    container.querySelectorAll('.btn-delete-compte').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.compteId;
        const cpt = store.data.comptes.find(c => c.id === id);
        const name = cpt ? cpt.libelle : id;
        const ok = await showConfirmModal({
          title: 'Supprimer le compte Netflix',
          message: `Voulez-vous vraiment supprimer le compte <strong>${escapeHtml(name)}</strong> ? Tous les profils et abonnements rattachés seront supprimés.`,
          confirmText: 'Supprimer le compte',
          cancelText: 'Annuler',
          isDanger: true,
          icon: '🗑️'
        });
        if (!ok) return;

        try {
          await store.deleteCompte(id);
          store.logAction(currentSession?.name, 'SUPPRESSION_COMPTE', `Compte ${id} (${name}) supprimé`);
          renderAdmin();
        } catch (err) {
          console.warn('Erreur suppression compte :', err);
        }
      });
    });

    // Actions CRUD Profils
    container.querySelectorAll('.btn-add-profil-to-compte').forEach(btn => {
      btn.addEventListener('click', () => openProfilModal(null, btn.dataset.compteId));
    });

    container.querySelectorAll('.btn-edit-profil').forEach(btn => {
      btn.addEventListener('click', () => openProfilModal(btn.dataset.profilId));
    });

    container.querySelectorAll('.btn-delete-profil').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.profilId;
        const prof = store.data.profils.find(p => p.id === id);
        const name = prof ? prof.nom : id;
        const ok = await showConfirmModal({
          title: 'Supprimer le profil',
          message: `Voulez-vous vraiment supprimer le profil <strong>${escapeHtml(name)}</strong> ?`,
          confirmText: 'Supprimer le profil',
          cancelText: 'Annuler',
          isDanger: true,
          icon: '🗑️'
        });
        if (!ok) return;

        try {
          await store.deleteProfil(id);
          store.logAction(currentSession?.name, 'SUPPRESSION_PROFIL', `Profil ${id} (${name}) supprimé`);
          renderAdmin();
        } catch (err) {
          console.warn('Erreur suppression profil :', err);
        }
      });
    });
  }

  function openCompteModal(compteId = null) {
    const modal = document.getElementById('modal-compte');
    const form = document.getElementById('form-compte');
    const title = document.getElementById('modal-compte-title');
    const inputEditId = document.getElementById('cpt-edit-id');
    const inputLibelle = document.getElementById('cpt-libelle');
    const inputEmail = document.getElementById('cpt-email');
    const inputPassword = document.getElementById('cpt-password');
    const inputReabonnement = document.getElementById('cpt-date-reabonnement');
    const inputCout = document.getElementById('cpt-cout-recharge');
    const inputCapacite = document.getElementById('cpt-capacite');
    const inputMaxProfils = document.getElementById('cpt-max-profils');

    if (!modal) return;

    if (compteId) {
      const compte = store.data.comptes.find(c => c.id === compteId);
      if (!compte) return;
      title.textContent = 'Modifier le compte Netflix';
      inputEditId.value = compte.id;
      inputLibelle.value = compte.libelle;
      inputEmail.value = compte.email;
      inputPassword.value = compte.motDePasse;
      inputReabonnement.value = compte.dateReabonnement;
      inputCout.value = compte.coutRechargeMensuel;
      inputCapacite.value = compte.capacitePlaces;
      inputMaxProfils.value = compte.maxProfils;
    } else {
      title.textContent = 'Créer un nouveau compte Netflix';
      inputEditId.value = '';
      form.reset();
      inputCapacite.value = 15;
      inputMaxProfils.value = 5;
      inputCout.value = 6500;
      inputPassword.value = 'Hz#Nflx' + Math.floor(1000 + Math.random() * 9000);
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      inputReabonnement.value = d.toISOString().split('T')[0];
    }

    modal.classList.add('active');
  }

  async function handleSaveCompte(e) {
    e.preventDefault();
    const editId = document.getElementById('cpt-edit-id').value;
    const libelle = document.getElementById('cpt-libelle').value.trim();
    const email = document.getElementById('cpt-email').value.trim();
    const motDePasse = document.getElementById('cpt-password').value.trim();
    const dateReabonnement = document.getElementById('cpt-date-reabonnement').value;
    const coutRechargeMensuel = document.getElementById('cpt-cout-recharge').value;
    const capacitePlaces = document.getElementById('cpt-capacite').value;
    const maxProfils = document.getElementById('cpt-max-profils').value;

    try {
      if (editId) {
        await store.updateCompte(editId, { libelle, email, motDePasse, dateReabonnement, coutRechargeMensuel, capacitePlaces, maxProfils });
        store.logAction(currentSession?.name, 'MODIFICATION_COMPTE', `Compte ${libelle} mis à jour`);
      } else {
        const today = new Date().toISOString().slice(0, 10);
        await store.createCompte({ libelle, email, motDePasse, dateOuverture: today, dateReabonnement, coutRechargeMensuel, capacitePlaces, maxProfils });
        store.logAction(currentSession?.name, 'CREATION_COMPTE', `Compte ${libelle} créé`);
      }

      document.getElementById('modal-compte').classList.remove('active');
      renderAdmin();
    } catch (err) {
      console.error('Erreur sauvegarde compte :', err);
      showModalError('modal-compte', err.message || 'Erreur inattendue', err.status);
    }
  }

  function openProfilModal(profilId = null, compteId = null) {
    const modal = document.getElementById('modal-profil');
    const form = document.getElementById('form-profil');
    const title = document.getElementById('modal-profil-title');
    const inputEditId = document.getElementById('prf-edit-id');
    const inputCompteId = document.getElementById('prf-compte-id');
    const inputNom = document.getElementById('prf-nom');
    const inputPin = document.getElementById('prf-pin');
    const checkRenew = document.getElementById('prf-renew-needed');
    const btnGen = document.getElementById('btn-prf-gen-pin');

    if (!modal) return;

    if (btnGen) {
      btnGen.onclick = () => {
        inputPin.value = store.generateSafePin();
      };
    }

    if (profilId) {
      const p = store.data.profils.find(prof => prof.id === profilId);
      if (!p) return;
      title.textContent = `Modifier le profil : ${p.nom}`;
      inputEditId.value = p.id;
      inputCompteId.value = p.compteId;
      inputNom.value = p.nom;
      inputPin.value = p.codePin;
      checkRenew.checked = p.codeRenewNeeded;
    } else {
      title.textContent = 'Ajouter un profil';
      inputEditId.value = '';
      inputCompteId.value = compteId;
      form.reset();
      inputPin.value = store.generateSafePin();
      checkRenew.checked = false;
    }

    modal.classList.add('active');
  }

  async function handleSaveProfil(e) {
    e.preventDefault();
    const editId = document.getElementById('prf-edit-id').value;
    const compteId = document.getElementById('prf-compte-id').value;
    const nom = document.getElementById('prf-nom').value.trim();
    const codePin = document.getElementById('prf-pin').value.trim();
    const codeRenewNeeded = document.getElementById('prf-renew-needed').checked;

    try {
      if (editId) {
        await store.updateProfil(editId, { nom, codePin, codeRenewNeeded });
        store.logAction(currentSession?.name, 'MODIFICATION_PROFIL', `Profil ${nom} mis à jour`);
      } else {
        await store.createProfil({ compteId, nom, codePin, codeRenewNeeded });
        store.logAction(currentSession?.name, 'CREATION_PROFIL', `Profil ${nom} ajouté`);
      }

      document.getElementById('modal-profil').classList.remove('active');
      renderAdmin();
    } catch (err) {
      console.error('Erreur sauvegarde profil :', err);
      showModalError('modal-profil', err.message || 'Erreur inattendue', err.status);
    }
  }

  // -------------------------------------------------------------
  // 8. CRUD : Caisse & Finances
  // -------------------------------------------------------------
  function cashMovementTypeLabel(type) {
    const labels = {
      recharge: 'Dépense de recharge',
      prelevement: 'Dépense associé',
      depense_associe: 'Dépense associé',
      depense_justifiee: 'Dépense justifiée',
      autre: 'Autre dépense (ancienne catégorie)'
    };
    return labels[type] || type;
  }

  function renderFinancesTab() {
    const kpis = store.getKPIs();
    const mouvements = store.data.mouvementsCaisse || [];

    const elBeneficeCumule = document.getElementById('fin-benefice-cumule');
    if (elBeneficeCumule) {
      const beneficeTheorique = Math.max(0, kpis.caTotal - kpis.rechargesTotal);
      elBeneficeCumule.textContent = `${formatFCFA(beneficeTheorique)} FCFA`;
    }

    const rechargeTotal = mouvements
      .filter(m => m.type === 'recharge')
      .reduce((sum, m) => sum + (Number(m.montant) || 0), 0);
    const rechargesContainer = document.getElementById('fin-recharges-details');
    if (rechargesContainer) {
      rechargesContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
          <span class="text-muted">Dépenses de recharge :</span>
          <span class="text-danger font-bold">-${formatFCFA(rechargeTotal)} FCFA</span>
        </div>
      `;
    }

    const parAssocie = new Map([
      ['Emmanuel', 0],
      ['Malan Abdias', 0]
    ]);
    mouvements
      .filter(m => m.type === 'prelevement' || m.type === 'depense_associe')
      .forEach(m => {
        const nom = (m.beneficiaire || 'Associé').trim();
        parAssocie.set(nom, (parAssocie.get(nom) || 0) + (Number(m.montant) || 0));
      });
    const associesContainer = document.getElementById('fin-associes-details');
    if (associesContainer) {
      associesContainer.innerHTML = Array.from(parAssocie, ([nom, total]) => `
        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
          <span class="text-muted">Dépenses de ${escapeHtml(nom)} :</span>
          <span class="text-danger font-bold">-${formatFCFA(total)} FCFA</span>
        </div>
      `).join('');
    }

    const depensesJustifiees = mouvements.filter(m => m.type === 'depense_justifiee');
    const justifieesContainer = document.getElementById('fin-depenses-justifiees');
    if (justifieesContainer) {
      const total = depensesJustifiees.reduce((sum, m) => sum + (Number(m.montant) || 0), 0);
      justifieesContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
          <span class="text-muted">Dépenses justifiées (${depensesJustifiees.length}) :</span>
          <span class="text-danger font-bold">-${formatFCFA(total)} FCFA</span>
        </div>
      `;
    }

    const elCaisseTheo = document.getElementById('fin-caisse-theorique');
    const elEcart = document.getElementById('fin-caisse-ecart');

    if (elCaisseTheo) elCaisseTheo.textContent = `${formatFCFA(kpis.caisseTheorique)} FCFA`;
    if (elEcart) {
      elEcart.textContent = `${formatFCFA(kpis.ecartCaisse)} FCFA`;
      elEcart.className = kpis.ecartCaisse < 0 ? 'text-danger font-bold' : 'text-success font-bold';
    }

    const mvtBody = document.getElementById('table-mouvements-caisse-body');
    if (mvtBody) {
      mvtBody.innerHTML = mouvements.map(m => `
        <tr>
          <td>${formatDate(m.date)}</td>
          <td>
            <span class="badge ${m.type === 'recharge' ? 'badge-danger' : 'badge-warning'}">
              ${escapeHtml(cashMovementTypeLabel(m.type))}
            </span>
          </td>
          <td><strong>${escapeHtml(m.beneficiaire || '—')}</strong></td>
          <td class="font-bold text-danger">-${formatFCFA(m.montant)} FCFA</td>
          <td class="text-sm text-secondary">${escapeHtml(m.motif || '—')}</td>
          <td>
            <div class="btn-action-group">
              <button class="btn btn-xs btn-outline btn-edit-cash" data-cash-id="${m.id}" title="Modifier">
                <span>Éditer</span>
              </button>
              <button class="btn btn-xs btn-danger btn-delete-cash" data-cash-id="${m.id}" title="Supprimer">
                <span>✕</span>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      mvtBody.querySelectorAll('.btn-edit-cash').forEach(btn => {
        btn.addEventListener('click', () => openCashModal(btn.dataset.cashId));
      });

      mvtBody.querySelectorAll('.btn-delete-cash').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.cashId;
          const m = store.data.mouvementsCaisse.find(item => item.id === id);
          const motif = m ? `${m.beneficiaire} (${formatFCFA(m.montant)} FCFA)` : id;
          const ok = await showConfirmModal({
            title: 'Supprimer l\'opération de caisse',
            message: `Voulez-vous vraiment supprimer l'opération de caisse : <strong>${escapeHtml(motif)}</strong> ?`,
            confirmText: 'Supprimer l\'opération',
            cancelText: 'Annuler',
            isDanger: true,
            icon: '🗑️'
          });
          if (!ok) return;

          await store.deleteMouvementCaisse(id);
          store.logAction(currentSession?.name, 'SUPPRESSION_CAISSE', `Opération ${id} supprimée`);
          showToast('Mouvement supprimé avec succès.', 'info');
          renderAdmin();
        });
      });
    }
    renderMobileMouvements();
  }

  function openCashModal(cashId = null) {
    const modal = document.getElementById('modal-cash');
    const form = document.getElementById('form-cash-movement');
    const title = document.getElementById('modal-cash-title');
    const inputEditId = document.getElementById('cash-edit-id');
    const selType = document.getElementById('cash-type-select');
    const inputBenef = document.getElementById('cash-beneficiaire');
    const selAssocie = document.getElementById('cash-associe');
    const beneficiaryGroup = document.getElementById('cash-beneficiaire-group');
    const partnerGroup = document.getElementById('cash-associe-group');
    const inputDate = document.getElementById('cash-date');
    const inputMontant = document.getElementById('cash-montant');
    const inputMotif = document.getElementById('cash-motif');
    const motifLabel = document.getElementById('cash-motif-label');

    if (!modal) return;

    if (selAssocie) {
      selAssocie.querySelectorAll('[data-legacy-associate]').forEach(option => option.remove());
    }
    selType.querySelectorAll('[data-legacy-cash-type]').forEach(option => option.remove());

    if (cashId) {
      const m = store.data.mouvementsCaisse.find(mvt => mvt.id === cashId);
      if (!m) return;
      title.textContent = 'Modifier l\'opération de caisse';
      inputEditId.value = m.id;
      if (m.type === 'autre') {
        const legacyTypeOption = new Option(cashMovementTypeLabel(m.type), m.type);
        legacyTypeOption.dataset.legacyCashType = 'true';
        selType.add(legacyTypeOption);
      }
      selType.value = m.type === 'prelevement' ? 'depense_associe' : m.type;
      inputBenef.value = m.beneficiaire;
      if (selAssocie && m.beneficiaire && !Array.from(selAssocie.options).some(option => option.value === m.beneficiaire)) {
        const legacyOption = new Option(m.beneficiaire, m.beneficiaire);
        legacyOption.dataset.legacyAssociate = 'true';
        selAssocie.add(legacyOption);
      }
      if (selAssocie) selAssocie.value = m.beneficiaire;
      inputDate.value = m.date || new Date().toISOString().slice(0, 10);
      inputMontant.value = m.montant;
      inputMotif.value = m.motif;
    } else {
      title.textContent = 'Enregistrer une opération de caisse';
      inputEditId.value = '';
      form.reset();
      inputDate.value = new Date().toISOString().slice(0, 10);
      inputMontant.value = '';
    }

    const updateCashFields = () => {
      const isPointage = selType.value === 'pointage';
      const isPartnerExpense = selType.value === 'depense_associe';
      beneficiaryGroup.style.display = isPointage || isPartnerExpense ? 'none' : '';
      partnerGroup.style.display = isPartnerExpense ? '' : 'none';
      inputBenef.required = !isPointage && !isPartnerExpense;
      selAssocie.required = isPartnerExpense;
      inputMotif.required = selType.value === 'depense_justifiee' || selType.value === 'autre';
      motifLabel.textContent = inputMotif.required ? 'Motif / Justification *' : 'Motif / Justification';
      if (selType.value === 'recharge' && (!inputBenef.value || inputBenef.value === currentSession?.name)) {
        inputBenef.value = 'Netflix';
      }
    };
    selType.onchange = updateCashFields;
    updateCashFields();

    modal.classList.add('active');
  }

  async function handleSaveCash(e) {
    e.preventDefault();
    const editId = document.getElementById('cash-edit-id').value;
    const type = document.getElementById('cash-type-select').value;
    const date = document.getElementById('cash-date').value || new Date().toISOString().slice(0, 10);
    const beneficiaire = type === 'depense_associe'
      ? document.getElementById('cash-associe').value
      : document.getElementById('cash-beneficiaire').value.trim();
    const montant = parseInt(document.getElementById('cash-montant').value, 10);
    const motif = document.getElementById('cash-motif').value.trim();

    try {
      if ((type === 'depense_justifiee' || type === 'autre') && !motif) {
        showToast('Le motif est obligatoire pour une dépense justifiée.', 'warning');
        return;
      }
      if (editId) {
        await store.updateMouvementCaisse(editId, { type, beneficiaire, montant, motif, date });
        store.logAction(currentSession?.name, 'MODIFICATION_CAISSE', `Mouvement ${type} de ${montant} FCFA modifié`);
      } else {
        await store.createMouvementCaisse({ type, beneficiaire, montant, motif, date });
        store.logAction(currentSession?.name, 'MOUVEMENT_CAISSE', `Nouveau ${type} de ${montant} FCFA`);
      }

      document.getElementById('modal-cash').classList.remove('active');
      showToast('Opération enregistrée avec succès !', 'success');
      renderAdmin();
    } catch (err) {
      showToast('Erreur lors de l\'enregistrement en base : ' + (err.message || 'Erreur serveur'), 'danger');
    }
  }

  // -------------------------------------------------------------
  // 9. Onglet Exports
  // -------------------------------------------------------------
  function renderSettingsTab() {

    // Bouton Export PDF
    const btnExportPdf = document.getElementById('btn-export-pdf');
    if (btnExportPdf) {
      btnExportPdf.onclick = async () => {
        const ok = await showConfirmModal({
          title: 'Exporter les données en PDF',
          message: 'Voulez-vous générer et télécharger l\'état complet consolidé d\'Horizon Service au format PDF officiel (Clients, Abonnements, Comptes Netflix et Trésorerie) ?',
          confirmText: 'Générer le PDF',
          cancelText: 'Annuler',
          isDanger: false,
          icon: '📄'
        });
        if (!ok) return;

        exportAllDataToPDF();
      };
    }

    // Bouton Backup SQL
    const btnBackupSql = document.getElementById('btn-backup-sql');
    if (btnBackupSql) {
      btnBackupSql.onclick = async () => {
        const ok = await showConfirmModal({
          title: 'Sauvegarde de la Base de Données (SQL)',
          message: 'Voulez-vous télécharger le dump SQL complet de la base de données SQLite (horizon.db) contenant toutes les tables et données réelles ?',
          confirmText: 'Télécharger le Backup SQL',
          cancelText: 'Annuler',
          isDanger: false,
          icon: '💾'
        });
        if (!ok) return;

        downloadSqlBackup();
      };
    }
  }

  // -------------------------------------------------------------
  // 10. Onglet 7 : Journal d'Audit
  // -------------------------------------------------------------
  function renderAuditTab() {
    const tbody = document.getElementById('table-audit-logs-body');
    if (!tbody) return;

    tbody.innerHTML = (store.data.auditLogs || []).map(l => {
      const d = new Date(l.timestamp);
      const dateStr = Number.isNaN(d.getTime())
        ? '—'
        : d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR');
      return `
        <tr>
          <td class="font-mono text-xs text-muted">${dateStr}</td>
          <td><strong>${escapeHtml(l.userName || 'Système')}</strong></td>
          <td><span class="badge badge-info">${escapeHtml(l.action || '—')}</span></td>
          <td class="text-sm">${escapeHtml(l.detail || '—')}</td>
        </tr>
      `;
    }).join('');
    renderMobileAudit();
  }

  // -------------------------------------------------------------
  // 11. Initialisation des Modales et Écouteurs de formulaires
  // -------------------------------------------------------------
  function initAdminModals() {
    document.querySelectorAll('.modal-backdrop .btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-backdrop').classList.remove('active');
      });
    });

    // Formulaire Abonnement
    document.getElementById('btn-open-new-sub-modal')?.addEventListener('click', () => openAbonnementModal());
    document.getElementById('form-sub')?.addEventListener('submit', handleSaveAbonnement);

    // Formulaire Client
    document.getElementById('btn-open-new-client-modal')?.addEventListener('click', () => openClientModal());
    document.getElementById('form-client')?.addEventListener('submit', handleSaveClient);

    // Formulaire Compte
    document.getElementById('btn-open-new-compte-modal')?.addEventListener('click', () => openCompteModal());
    document.getElementById('form-compte')?.addEventListener('submit', handleSaveCompte);

    // Formulaire Profil
    document.getElementById('form-profil')?.addEventListener('submit', handleSaveProfil);

    // Formulaire Caisse
    document.getElementById('btn-open-cash-modal')?.addEventListener('click', () => openCashModal());
    document.getElementById('form-cash-movement')?.addEventListener('submit', handleSaveCash);

    // Tiroir Client
    const drawerBackdrop = document.getElementById('drawer-client-backdrop');
    const btnCloseDrawer = document.getElementById('btn-close-client-drawer');
    if (drawerBackdrop && btnCloseDrawer) {
      btnCloseDrawer.addEventListener('click', () => drawerBackdrop.classList.remove('active'));
      drawerBackdrop.addEventListener('click', (e) => {
        if (e.target === drawerBackdrop) drawerBackdrop.classList.remove('active');
      });
    }
  }

  function openClientDrawer(clientId) {
    const client = store.data.clients.find(c => c.id === clientId);
    if (!client) return;

    const drawer = document.getElementById('drawer-client-backdrop');
    const title = document.getElementById('drawer-client-name');
    const body = document.getElementById('drawer-client-content');

    if (title)     title.textContent = client.nom || 'Client sans nom';

    const subs = store.data.abonnements.filter(ab => ab.clientId === client.id);
    const totalPaye = subs.reduce((sum, ab) => sum + ab.tarif, 0);

    if (body) {
      body.innerHTML = `
        <div style="margin-bottom: var(--space-4);">
          <div style="font-size: var(--text-sm); color: var(--text-muted);">Numéro WhatsApp :</div>
          <div style="font-size: var(--text-base); font-weight: 700; color: #fff;">${formatPhone(client.telephone)}</div>
          ${client.ancienId ? `<div class="text-xs text-muted">Ancien identifiant : ${escapeHtml(client.ancienId)}</div>` : ''}
          ${client.notes ? `<div class="text-xs text-secondary" style="margin-top: 4px;">Note : ${escapeHtml(client.notes)}</div>` : ''}
        </div>

        <div style="background-color: var(--bg-surface-elevated); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-6);">
          <div style="display: flex; justify-content: space-between; font-size: var(--text-sm);">
            <span class="text-muted">Total versé :</span>
            <span class="font-bold text-success">${formatFCFA(totalPaye)} FCFA</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: var(--text-sm); margin-top: 4px;">
            <span class="text-muted">Abonnements enregistrés :</span>
            <span class="font-bold">${subs.length}</span>
          </div>
        </div>

        <h4 style="font-size: var(--text-sm); margin-bottom: var(--space-3);">Historique des abonnements :</h4>
        <div style="display: flex; flex-direction: column; gap: var(--space-2);">
          ${subs.length === 0 ? '<div class="text-muted text-xs">Aucun abonnement enregistré.</div>' : subs.map(ab => {
            const profil = store.data.profils.find(p => p.id === ab.profilId) || { nom: 'Inconnu' };
            const status = store.getAbonnementStatus(ab);
            return `
              <div style="background-color: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: var(--space-3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                  <strong style="font-size: var(--text-sm);">Profil : ${escapeHtml(profil.nom)}</strong>
                  <span class="badge ${status.badgeClass}">${status.label}</span>
                </div>
                <div class="text-xs text-muted">Du ${formatDate(ab.dateDebut)} au ${formatDate(ab.dateFin)}</div>
                <div class="text-xs font-bold" style="margin-top: 2px;">Tarif : ${formatFCFA(ab.tarif)} FCFA</div>
              </div>
            `;
          }).join('')}
        </div>
      `;

    }

    if (drawer) drawer.classList.add('active');
  }

  function initAdminSearchAndFilters() {
    document.querySelectorAll('.filter-pill[data-filter-sub]').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill[data-filter-sub]').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeFilterSub = pill.dataset.filterSub;
        renderAbonnementsTab();
      });
    });

    const inputSearchClients = document.getElementById('input-search-clients');
    if (inputSearchClients) {
      inputSearchClients.addEventListener('input', () => {
        renderClientsTab();
      });
    }
  }

  // Utilitaires
  function formatFCFA(val) {
    if (val === undefined || val === null) return '0';
    return Number(val).toLocaleString('fr-FR');
  }

  function formatDate(isoStr) {
    if (!isoStr) return '-';
    const parts = isoStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
  }

  function formatPhone(phone) {
    return phone || '-';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------
  // MODALE DE VALIDATION & CONFIRMATION (RESPONSIVE PC & MOBILE)
  // -------------------------------------------------------------
  function showConfirmModal({
    title = 'Confirmation requise',
    message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    isDanger = false,
    icon = '⚠️'
  }) {
    return new Promise((resolve) => {
      const modal = document.getElementById('modal-confirm');
      const titleEl = document.getElementById('confirm-modal-title');
      const msgEl = document.getElementById('confirm-modal-message');
      const iconEl = document.getElementById('confirm-modal-icon');
      const btnProceed = document.getElementById('btn-confirm-proceed');
      const btnCancel = document.getElementById('btn-confirm-cancel');
      const btnCloseX = document.getElementById('btn-confirm-cancel-x');

      if (!modal) {
        resolve(confirm(message));
        return;
      }

      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.innerHTML = message;
      if (iconEl) {
        iconEl.textContent = icon;
        iconEl.style.color = isDanger ? 'var(--status-danger)' : 'var(--color-brand-red)';
        iconEl.style.backgroundColor = isDanger ? 'var(--status-danger-bg)' : 'rgba(229, 9, 20, 0.15)';
      }

      if (btnProceed) {
        btnProceed.textContent = confirmText;
        btnProceed.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
      }
      if (btnCancel) btnCancel.textContent = cancelText;

      function cleanup() {
        modal.classList.remove('active');
        btnProceed.onclick = null;
        btnCancel.onclick = null;
        if (btnCloseX) btnCloseX.onclick = null;
        modal.onclick = null;
      }

      btnProceed.onclick = () => {
        cleanup();
        resolve(true);
      };

      btnCancel.onclick = () => {
        cleanup();
        resolve(false);
      };

      if (btnCloseX) {
        btnCloseX.onclick = () => {
          cleanup();
          resolve(false);
        };
      }

      modal.onclick = (e) => {
        if (e.target === modal) {
          cleanup();
          resolve(false);
        }
      };

      modal.classList.add('active');
    });
  }

  // -------------------------------------------------------------
  // EXPORT PDF & BACKUP SQL
  // -------------------------------------------------------------
  function downloadSqlBackup() {
    try {
      const downloadUrl = `${store.apiBase}/api/backup/sql`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `horizon_service_backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Sauvegarde SQL téléchargée avec succès !', 'success');
      store.logAction(currentSession?.name, 'BACKUP_SQL', 'Téléchargement du dump SQL complet de la base de données SQLite');
    } catch (e) {
      console.error('Erreur téléchargement SQL', e);
      showToast('Erreur lors du téléchargement de la sauvegarde SQL.', 'danger');
    }
  }

  function exportAllDataToPDF() {
    const data = store.data;
    const kpis = store.getKPIs();
    const urgents = store.getUrgentAbonnements();
    const nowStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const auditRef = 'HS-VERITE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    const currentUser = currentSession?.name || 'Administrateur';
    const currentRole = currentSession?.roleLabel || 'Fondateur';

    // 1. Analyse détaillée des clients & valeur
    const clientStats = (data.clients || []).map(cli => {
      const cliSubs = (data.abonnements || []).filter(s => s.clientId === cli.id);
      const activeSubs = cliSubs.filter(s => {
        const st = store.getAbonnementStatus(s);
        return st.code === 'actif' || st.code === 'echeance_proche';
      });
      const totalTarif = activeSubs.reduce((sum, s) => sum + (Number(s.tarif) || 0), 0);
      return {
        ...cli,
        subsCount: cliSubs.length,
        activeCount: activeSubs.length,
        totalTarif
      };
    }).sort((a, b) => b.totalTarif - a.totalTarif);

    // 2. Abonnements complets
    const subsRows = (data.abonnements || []).map(s => {
      const cli = (data.clients || []).find(c => c.id === s.clientId) || { nom: 'Client inconnu', telephone: '-' };
      const prf = (data.profils || []).find(p => p.id === s.profilId);
      const cpt = prf ? (data.comptes || []).find(c => c.id === prf.compteId) : null;
      const statusObj = store.getAbonnementStatus(s);

      let badgeStyle = 'background: #d1fae5; color: #065f46;';
      let statusLabel = 'Actif';
      if (statusObj.code === 'expire') {
        badgeStyle = 'background: #fee2e2; color: #991b1b;';
        statusLabel = `Expiré (${Math.abs(statusObj.daysLeft)}j)`;
      } else if (statusObj.code === 'echeance_proche') {
        badgeStyle = 'background: #fef3c7; color: #92400e;';
        statusLabel = `Échéance (${statusObj.daysLeft}j)`;
      }

      return `<tr>
        <td><strong>${escapeHtml(cli.nom)}</strong></td>
        <td>${escapeHtml(cli.telephone)}</td>
        <td>${escapeHtml((cpt ? cpt.libelle : 'Compte') + ' / ' + (prf ? prf.nom : 'Profil'))}</td>
        <td>${escapeHtml(s.dateDebut || '-')}</td>
        <td><strong>${escapeHtml(s.dateFin || '-')}</strong></td>
        <td style="text-align: right; font-weight: bold; color: #111;">${formatFCFA(s.tarif)}</td>
        <td><span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: bold; ${badgeStyle}">${escapeHtml(statusLabel)}</span></td>
      </tr>`;
    }).join('');

    // 3. Comptes & Profils détaillés
    const comptesRows = (data.comptes || []).map(c => {
      const profils = (data.profils || []).filter(p => p.compteId === c.id);
      const profilsDetails = profils.map(p => {
        const sub = (data.abonnements || []).find(a => a.profilId === p.id && a.statut === 'actif');
        const cli = sub ? (data.clients || []).find(cl => cl.id === sub.clientId) : null;
        const affectation = cli ? `Abonné: <strong>${escapeHtml(cli.nom)}</strong> (${escapeHtml(cli.telephone)})` : '<span style="color: #10b981; font-weight: bold;">DISPONIBLE (Libre)</span>';
        return `<div style="margin: 3px 0; padding: 3px 6px; background: #f8fafc; border-left: 2px solid #e50914; font-size: 10px;">
          <strong>${escapeHtml(p.nom)}</strong> (PIN: <code>${escapeHtml(p.codePin || '0000')}</code>) — ${affectation}
        </div>`;
      }).join('') || '<em style="color: #94a3b8;">Aucun profil configuré</em>';

      return `<div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 12px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 8px;">
          <div>
            <strong style="font-size: 12px; color: #0f172a;">${escapeHtml(c.libelle)}</strong>
            <span style="color: #64748b; font-size: 10px; margin-left: 8px;">(${escapeHtml(c.email)})</span>
          </div>
          <div style="text-align: right;">
            <span style="font-weight: bold; color: #e50914;">${formatFCFA(c.coutRechargeMensuel || 6500)} / mois</span>
            <span style="font-size: 10px; color: #64748b; margin-left: 10px;">Prochaine recharge: <strong>${escapeHtml(c.dateReabonnement || '-')}</strong></span>
          </div>
        </div>
        <div>
          <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; color: #475569; margin-bottom: 4px;">Profils associés & affectations (${profils.length} profils) :</div>
          ${profilsDetails}
        </div>
      </div>`;
    }).join('');

    // 4. Alertes critiques
    const urgentRows = (urgents || []).map(item => {
      const isExpired = item.status.code === 'expire';
      return `<tr style="background: ${isExpired ? '#fef2f2' : '#fffbeb'};">
        <td><strong style="color: ${isExpired ? '#b91c1c' : '#b45309'};">${escapeHtml(item.client.nom || 'Sans nom')}</strong></td>
        <td>${escapeHtml(item.client.telephone || '-')}</td>
        <td>${escapeHtml(item.compte.libelle)} / ${escapeHtml(item.profil.nom)}</td>
        <td><strong>${escapeHtml(item.dateFin)}</strong></td>
        <td><span style="font-weight: bold; color: ${isExpired ? '#dc2626' : '#d97706'};">${isExpired ? '⚠️ Expiré il y a ' + Math.abs(item.status.daysLeft) + 'j' : '⏳ Expire dans ' + item.status.daysLeft + 'j'}</span></td>
        <td style="text-align: right; font-weight: bold;">${formatFCFA(item.tarif)}</td>
      </tr>`;
    }).join('');

    // 5. Mouvements de caisse récents
    const mouvementsRows = (data.mouvementsCaisse || []).slice(0, 10).map(m => {
      const color = '#b91c1c';
      return `<tr>
        <td>${escapeHtml(m.date || '-')}</td>
        <td><span style="font-weight: bold; text-transform: uppercase; font-size: 9px; padding: 2px 5px; border-radius: 3px; background: #fee2e2; color: ${color};">${escapeHtml(cashMovementTypeLabel(m.type))}</span></td>
        <td><strong>${escapeHtml(m.beneficiaire || 'Horizon')}</strong></td>
        <td>${escapeHtml(m.motif || '-')}</td>
        <td style="text-align: right; font-weight: bold; color: ${color};">- ${formatFCFA(m.montant)}</td>
      </tr>`;
    }).join('');

    // 6. Journal d'audit récent
    const auditRows = (data.auditLogs || []).slice(0, 8).map(log => {
      const dateFormatted = log.timestamp ? new Date(log.timestamp).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      }) : '-';
      return `<tr>
        <td style="white-space: nowrap; font-size: 9px; color: #64748b;">${dateFormatted}</td>
        <td><strong>${escapeHtml(log.userName || 'Système')}</strong></td>
        <td><code style="font-size: 9px; background: #f1f5f9; padding: 2px 4px; border-radius: 3px;">${escapeHtml(log.action || '-')}</code></td>
        <td style="font-size: 10px; color: #334155;">${escapeHtml(log.detail || '-')}</td>
      </tr>`;
    }).join('');

    // Clé de répartition prévisionnelle (50% Emmanuel / 50% Malan)
    const partChacun = Math.round((kpis.beneficeMois || 0) * 0.5);

    const printHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Horizon Service — Carte de Vérité & Audit Consolidé</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            font-size: 10px;
            line-height: 1.4;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #e50914;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .brand-box { display: flex; align-items: center; gap: 10px; }
          .logo {
            font-size: 22px;
            font-weight: 900;
            color: #e50914;
            letter-spacing: 1.5px;
            line-height: 1;
          }
          .badge-cert {
            display: inline-block;
            background: #0f172a;
            color: #ffffff;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-top: 4px;
          }
          .header-meta {
            text-align: right;
            font-size: 10px;
            color: #475569;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .kpi-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 10px;
          }
          .kpi-box.highlight {
            background: #fff1f2;
            border-color: #fca5a5;
          }
          .kpi-box.success {
            background: #f0fdf4;
            border-color: #86efac;
          }
          .kpi-title {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 3px;
          }
          .kpi-value {
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
          }
          .kpi-sub {
            font-size: 8.5px;
            color: #64748b;
            margin-top: 2px;
          }
          h2 {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            border-left: 3px solid #e50914;
            padding-left: 8px;
            margin: 16px 0 8px 0;
            page-break-after: avoid;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            page-break-inside: auto;
          }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th {
            background: #f1f5f9;
            color: #1e293b;
            text-align: left;
            padding: 5px 7px;
            border: 1px solid #cbd5e1;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
          }
          td {
            padding: 5px 7px;
            border: 1px solid #e2e8f0;
            font-size: 9.5px;
            color: #334155;
          }
          tr:nth-child(even) { background: #fafafa; }
          .partner-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 14px;
            page-break-inside: avoid;
          }
          .partner-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 5px;
            padding: 8px 12px;
          }
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 25px;
            page-break-inside: avoid;
          }
          .signature-box {
            border: 1px dashed #94a3b8;
            border-radius: 6px;
            padding: 12px;
            height: 90px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .footer {
            text-align: center;
            color: #64748b;
            font-size: 8.5px;
            margin-top: 20px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <!-- EN-TÊTE OFFICIEL -->
        <div class="header-banner">
          <div>
            <div class="brand-box">
              <div class="logo">HORIZON SERVICE</div>
            </div>
            <div style="font-size: 11px; font-weight: bold; color: #1e293b; margin-top: 2px;">
              CARTE DE VÉRITÉ & AUDIT CONSOLIDÉ EN TEMPS RÉEL
            </div>
            <div class="badge-cert">BASE POSTGRESQL SUPABASE • ZERO CACHE LOCAL • SYNCHRONISÉ</div>
          </div>
          <div class="header-meta">
            <div><strong>Réf. Audit :</strong> <code>${auditRef}</code></div>
            <div><strong>Date & Heure :</strong> ${nowStr}</div>
            <div><strong>Opérateur :</strong> ${escapeHtml(currentUser)} (${escapeHtml(currentRole)})</div>
            <div style="color: #047857; font-weight: bold; margin-top: 2px;">● Système Opérationnel & Vérifié</div>
          </div>
        </div>

        <!-- SECTION 1 : VUE STRATÉGIQUE & 8 KPIS MAJEURS -->
        <h2>1. Vue Globale & Indicateurs Stratégiques (Carte de Vérité)</h2>
        <div class="kpi-grid">
          <div class="kpi-box highlight">
            <div class="kpi-title">Chiffre d'Affaires Mensuel (MRR)</div>
            <div class="kpi-value" style="color: #e50914;">${formatFCFA(kpis.caTotal)}</div>
            <div class="kpi-sub">${kpis.totalAbonnementsActifs} abonnements actifs</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Charges Recharges Netflix</div>
            <div class="kpi-value" style="color: #475569;">${formatFCFA(kpis.rechargesTotal)}</div>
            <div class="kpi-sub">${kpis.totalComptes} comptes opérationnels</div>
          </div>
          <div class="kpi-box success">
            <div class="kpi-title">Bénéfice Net Opérationnel</div>
            <div class="kpi-value" style="color: #047857;">${formatFCFA(kpis.beneficeMois)}</div>
            <div class="kpi-sub">Marge bénéficiaire nette : <strong>${kpis.margePctMois}%</strong></div>
          </div>
          <div class="kpi-box">
              <div class="kpi-title">Écart calculé</div>
              <div class="kpi-value">${formatFCFA(kpis.ecartCaisse)}</div>
              <div class="kpi-sub">CA total − dépenses enregistrées</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Taux d'Occupation du Parc</div>
            <div class="kpi-value" style="color: #0284c7;">${kpis.tauxRemplissage}%</div>
            <div class="kpi-sub">${kpis.totalAbonnementsActifs} places / ${kpis.capaciteTotale} places max</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Places Libres Immédiates</div>
            <div class="kpi-value" style="color: #d97706;">${kpis.placesLibres} places</div>
            <div class="kpi-sub">Potentiel commercial libre</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-title">Portefeuille Clients Actifs</div>
            <div class="kpi-value">${kpis.totalClients} clients</div>
            <div class="kpi-sub">Panier moyen : ${kpis.totalClients > 0 ? formatFCFA(Math.round(kpis.caTotal / kpis.totalClients)) : '0 FCFA'}</div>
          </div>
          <div class="kpi-box ${kpis.urgentsCount > 0 ? 'highlight' : ''}">
            <div class="kpi-title">Alertes & Échéances Urgentes</div>
            <div class="kpi-value" style="color: ${kpis.urgentsCount > 0 ? '#dc2626' : '#047857'};">${kpis.urgentsCount} urgences</div>
            <div class="kpi-sub">${kpis.codesCount} profils avec PIN à renouveler</div>
          </div>
        </div>

        <!-- SECTION 2 : TRÉSORERIE & RÉPARTITION ASSOCIÉS -->
        <h2>2. Trésorerie, Pointage & Répartition des Bénéfices</h2>
        <div class="partner-box">
          <div class="partner-card">
            <div style="font-weight: bold; font-size: 11px; color: #e50914; margin-bottom: 4px;">Part Associé : Jean Emmanuel (Fondateur 50%)</div>
            <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${formatFCFA(partChacun)}</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Lien Wave : pay.wave.com/m/horizon-service-emmanuel</div>
          </div>
          <div class="partner-card">
            <div style="font-weight: bold; font-size: 11px; color: #0284c7; margin-bottom: 4px;">Part Associé : Malan Abdias (Associé 50%)</div>
            <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${formatFCFA(partChacun)}</div>
            <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Lien Wave : pay.wave.com/m/horizon-service-malan</div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong>Chiffre d'affaires total :</strong> ${formatFCFA(kpis.caTotal)}
            </div>
            <div>
              <strong>Solde théorique calculé :</strong> ${formatFCFA(kpis.caisseTheorique)}
              <span style="margin-left: 8px; font-weight: bold; color: ${kpis.ecartCaisse >= 0 ? '#047857' : '#b91c1c'};">Écart : ${kpis.ecartCaisse >= 0 ? '+' : ''}${formatFCFA(kpis.ecartCaisse)}</span>
            </div>
          </div>
        </div>

        <!-- DERNIERS MOUVEMENTS DE CAISSE -->
        <div style="font-weight: bold; font-size: 10px; color: #334155; margin-bottom: 4px;">Derniers Flux de Trésorerie Enregistrés (10 derniers) :</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Bénéficiaire / Émetteur</th>
              <th>Motif</th>
              <th style="text-align: right;">Montant (FCFA)</th>
            </tr>
          </thead>
          <tbody>
            ${mouvementsRows || '<tr><td colspan="5" style="text-align:center;">Aucun mouvement de caisse enregistré</td></tr>'}
          </tbody>
        </table>

        <!-- SECTION 3 : ALERTES RENOUVELLEMENTS PRIORITAIRES -->
        <h2>3. Tableau d'Alerte Opérationnelle : Échéances Prioritaires (&lt; 7 jours &amp; expirés)</h2>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Contact WhatsApp</th>
              <th>Compte &amp; Profil Affecté</th>
              <th>Date d'Échéance</th>
              <th>Statut d'Alerte</th>
              <th style="text-align: right;">Montant abonnement</th>
            </tr>
          </thead>
          <tbody>
            ${urgentRows || '<tr><td colspan="6" style="text-align:center; color: #047857; font-weight: bold;">✅ Aucun abonnement en retard ni en échéance imminente. Situation saine !</td></tr>'}
          </tbody>
        </table>

        <!-- SECTION 4 : REGISTRE INTÉGRAL DES ABONNEMENTS -->
        <h2>4. Registre Intégral des Abonnements (${(data.abonnements || []).length} abonnements au total)</h2>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Téléphone WhatsApp</th>
              <th>Compte / Profil Netflix</th>
              <th>Début</th>
              <th>Échéance</th>
              <th style="text-align: right;">Tarif Mensuel</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${subsRows || '<tr><td colspan="7" style="text-align:center;">Aucun abonnement enregistré</td></tr>'}
          </tbody>
        </table>

        <!-- SECTION 5 : PARC NETFLIX & AFFECTATION DES PROFILS -->
        <h2>5. Inventaire du Parc de Comptes Netflix &amp; Affectation des Profils (${(data.comptes || []).length} comptes)</h2>
        ${comptesRows || '<div style="text-align:center; padding: 10px; color: #94a3b8;">Aucun compte Netflix enregistré</div>'}

        <!-- SECTION 6 : VALEUR CLIENTÈLE & ANNUAIRE -->
        <h2>6. Répertoire &amp; Valeur Commerciale des Clients (${(data.clients || []).length} clients)</h2>
        <table>
          <thead>
            <tr>
              <th>Nom &amp; Prénoms</th>
              <th>Numéro WhatsApp</th>
              <th>Ancien Réf.</th>
              <th style="text-align: center;">Abonnements Actifs</th>
              <th style="text-align: right;">Valeur Mensuelle</th>
              <th>Notes Internes</th>
            </tr>
          </thead>
          <tbody>
            ${clientStats.map(c => `<tr>
              <td><strong>${escapeHtml(c.nom || 'Sans nom')}</strong></td>
              <td>${escapeHtml(c.telephone || '-')}</td>
              <td>${escapeHtml(c.ancienId || '-')}</td>
              <td style="text-align: center; font-weight: bold;">${c.activeCount} actif(s)</td>
              <td style="text-align: right; font-weight: bold; color: #047857;">${formatFCFA(c.totalTarif)}</td>
              <td>${escapeHtml(c.notes || '-')}</td>
            </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;">Aucun client enregistré</td></tr>'}
          </tbody>
        </table>

        <!-- SECTION 7 : TRAÇABILITÉ & REGISTRE D'AUDIT RÉCENT -->
        <h2>7. Traçabilité Légale &amp; Journal d'Audit Récent</h2>
        <table>
          <thead>
            <tr>
              <th>Horodatage</th>
              <th>Opérateur</th>
              <th>Action Réalisée</th>
              <th>Détails &amp; Modifications</th>
            </tr>
          </thead>
          <tbody>
            ${auditRows || '<tr><td colspan="4" style="text-align:center;">Aucun journal d\'audit disponible</td></tr>'}
          </tbody>
        </table>

        <!-- SECTION 8 : SIGNATURES & VISAS DE CERTIFICATION -->
        <div class="signature-section">
          <div class="signature-box">
            <div>
              <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; color: #0f172a;">Visa Fondateur : Emmanuel</div>
              <div style="font-size: 8.5px; color: #64748b;">Responsable Technique &amp; Exploitation</div>
            </div>
            <div style="font-size: 8px; color: #94a3b8; border-top: 1px dotted #cbd5e1; padding-top: 3px;">
              Date &amp; Signature pour validation de l'état
            </div>
          </div>
          <div class="signature-box">
            <div>
              <div style="font-weight: bold; font-size: 10px; text-transform: uppercase; color: #0f172a;">Visa Associé : Malan Abdias</div>
              <div style="font-size: 8.5px; color: #64748b;">Responsable Commercial &amp; Partenariat</div>
            </div>
            <div style="font-size: 8px; color: #94a3b8; border-top: 1px dotted #cbd5e1; padding-top: 3px;">
              Date &amp; Signature pour validation de l'état
            </div>
          </div>
        </div>

        <div class="footer">
          <strong>HORIZON SERVICE</strong> — Plateforme certifiée de gestion de comptes partagés — Abidjan, Côte d'Ivoire.<br>
          Données extraites en direct de la base de données PostgreSQL Supabase (Réf. Audit <code>${auditRef}</code>). Document strictement confidentiel réservé aux associés.
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 400);
      showToast('Carte de Vérité PDF générée avec succès !', 'success');
      store.logAction(currentSession?.name, 'EXPORT_PDF_VERITE', 'Génération de la Carte de Vérité et Audit PDF complet');
    } else {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      iframe.contentDocument.write(printHtml);
      iframe.contentDocument.close();
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
      }, 400);
      showToast('Impression de la Carte de Vérité PDF lancée !', 'success');
    }
  }

  function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    }
  }
  // ==========================================================================
  // MOBILE : Navigation en bas & Rendu de cartes tactiles
  // ==========================================================================

  async function switchTab(targetTab) {
    // Synchroniser desktop tabs
    const tabBtns = document.querySelectorAll('.admin-tabs-bar .tab-btn');
    tabBtns.forEach(b => b.classList.remove('active'));
    const desktopBtn = document.querySelector(`.admin-tabs-bar .tab-btn[data-tab="${targetTab}"]`);
    if (desktopBtn) desktopBtn.classList.add('active');

    // Synchroniser bottom nav
    const bnavBtns = document.querySelectorAll('.mobile-bottom-nav .bnav-btn');
    bnavBtns.forEach(b => b.classList.remove('active'));
    const mobileBtn = document.querySelector(`.mobile-bottom-nav .bnav-btn[data-tab="${targetTab}"]`);
    if (mobileBtn) mobileBtn.classList.add('active');

    // Masquer toutes les sections
    document.querySelectorAll('.admin-tab-pane').forEach(pane => {
      pane.style.display = 'none';
    });

    const activePane = document.getElementById(targetTab);
    if (activePane) activePane.style.display = 'block';

    currentAdminTab = targetTab;
    if (targetTab === 'tab-finances' || targetTab === 'tab-audit') {
      try {
        await store.syncFromBackend();
        updateBadgesAndKPIs();
      } catch (error) {
        console.error(`Impossible d'actualiser l'onglet ${targetTab} :`, error);
      }
    }
    renderAdminTabContent(targetTab);
    window.scrollTo(0, 0);
  }

  function initMobileNav() {
    const bnavBtns = document.querySelectorAll('.mobile-bottom-nav .bnav-btn');
    bnavBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const targetTab = btn.dataset.tab;
        if (!targetTab) return;
        await switchTab(targetTab);
      });
    });
  }

  // --- Rendu mobile des cartes : Dashboard urgents ---
  function renderMobileUrgents(urgents) {
    const container = document.getElementById('mobile-urgents-list');
    if (!container) return;

    if (urgents.length === 0) {
      container.innerHTML = `<div class="m-card" style="text-align: center; padding: 2rem;"><span style="font-size: 2rem;">✅</span><div class="text-sm text-muted" style="margin-top: 0.5rem;">Aucune échéance urgente !</div></div>`;
      return;
    }

    container.innerHTML = urgents.map(item => `
      <div class="m-card ${item.status.code === 'echu' ? 'm-card-danger' : 'm-card-urgent'}">
        <div class="m-card-row">
          <div class="m-card-title">${escapeHtml(item.client.nom || 'Sans nom')}</div>
          <span class="badge ${item.status.badgeClass}">${item.status.label}</span>
        </div>
        <div class="m-card-subtitle">${formatPhone(item.client.telephone)}</div>
        <hr class="m-card-divider">
        <div class="m-card-row">
          <div>
            <div class="m-card-label">Compte & Profil</div>
            <div class="m-card-value">${escapeHtml(item.compte.libelle)} — ${escapeHtml(item.profil.nom)}</div>
          </div>
        </div>
        <div class="m-card-row">
          <div><span class="m-card-label">Échéance</span> <span class="m-card-value">${formatDate(item.dateFin)}</span></div>
          <div><span class="m-card-label">Tarif</span> <span class="m-card-value">${formatFCFA(item.tarif)} F</span></div>
        </div>
        <div class="m-card-actions">
          <button class="btn btn-secondary btn-renew-quick" data-sub-id="${item.id}">Renouveler</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-renew-quick').forEach(btn => {
      btn.addEventListener('click', () => renewSubscription(btn.dataset.subId));
    });
  }

  // --- Rendu mobile : Historique mensuel ---
  function renderMobileHistorique() {
    const container = document.getElementById('mobile-historique-list');
    if (!container) return;

    container.innerHTML = store.getHistoriqueMensuel().map(m => `
      <div class="m-card">
        <div class="m-card-row">
          <div class="m-card-title">${escapeHtml(m.label)}</div>
          <span class="badge badge-neutral">${m.margePct}%</span>
        </div>
        <hr class="m-card-divider">
        <div class="m-card-row">
          <div><div class="m-card-label">CA</div><div class="m-card-value">${formatFCFA(m.ca)} F</div></div>
          <div><div class="m-card-label">Recharge</div><div class="m-card-value">${formatFCFA(m.recharge)} F</div></div>
          <div><div class="m-card-label">Bénéfice</div><div class="m-card-value text-success">${formatFCFA(m.benefice)} F</div></div>
        </div>
      </div>
    `).join('');
  }

  // --- Rendu mobile : Abonnements ---
  function renderMobileAbonnements(filtered) {
    const container = document.getElementById('mobile-abonnements-list');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = '<div class="m-card" style="text-align:center; padding:2rem;"><div class="text-muted">Aucun abonnement trouvé</div></div>';
      return;
    }

    container.innerHTML = filtered.map(item => `
      <div class="m-card ${item.status.isUrgent ? (item.status.code === 'echu' ? 'm-card-danger' : 'm-card-urgent') : ''}">
        <div class="m-card-row">
          <div class="m-card-title">${escapeHtml(item.client.nom || 'Sans nom')}</div>
          <span class="badge ${item.status.badgeClass}">${item.status.label}</span>
        </div>
        <div class="m-card-subtitle">${formatPhone(item.client.telephone)}</div>
        <hr class="m-card-divider">
        <div class="m-card-row">
          <div><div class="m-card-label">Compte</div><div class="m-card-value">${escapeHtml(item.compte.libelle)}</div></div>
          <div><div class="m-card-label">Profil</div><div class="m-card-value">${escapeHtml(item.profil.nom)}</div></div>
        </div>
        <div class="m-card-row">
          <div><div class="m-card-label">Début</div><div class="m-card-value">${formatDate(item.dateDebut)}</div></div>
          <div><div class="m-card-label">Fin</div><div class="m-card-value">${formatDate(item.dateFin)}</div></div>
          <div><div class="m-card-label">Tarif</div><div class="m-card-value">${formatFCFA(item.tarif)} F</div></div>
        </div>
        <div class="m-card-actions">
          <button class="btn btn-secondary btn-renew-quick" data-sub-id="${item.id}">+1m</button>
          <button class="btn btn-outline btn-edit-sub" data-sub-id="${item.id}">Éditer</button>
          <button class="btn btn-danger btn-delete-sub" data-sub-id="${item.id}">✕</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-renew-quick').forEach(btn => {
      btn.addEventListener('click', () => renewSubscription(btn.dataset.subId));
    });
    container.querySelectorAll('.btn-edit-sub').forEach(btn => {
      btn.addEventListener('click', () => openAbonnementModal(btn.dataset.subId));
    });
    container.querySelectorAll('.btn-delete-sub').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.subId;
        const sub = store.data.abonnements.find(s => s.id === id);
        const cli = sub ? store.data.clients.find(c => c.id === sub.clientId) : null;
        const name = cli ? cli.nom : id;
        const ok = await showConfirmModal({
          title: 'Supprimer l\'abonnement',
          message: `Voulez-vous supprimer l'abonnement de <strong>${escapeHtml(name)}</strong> ?`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          isDanger: true,
          icon: '🗑️'
        });
        if (!ok) return;

        await store.deleteAbonnement(id);
        renderAdmin();
        showToast('Abonnement supprimé', 'success');
      });
    });
  }

  // --- Rendu mobile : Clients ---
  function renderMobileClients(clients) {
    const container = document.getElementById('mobile-clients-list');
    if (!container) return;

    if (clients.length === 0) {
      container.innerHTML = '<div class="m-card" style="text-align:center; padding:2rem;"><div class="text-muted">Aucun client trouvé</div></div>';
      return;
    }

    container.innerHTML = clients.map(c => {
      const clientSubs = store.data.abonnements.filter(ab => ab.clientId === c.id);
      const totalDepense = clientSubs.reduce((sum, ab) => sum + ab.tarif, 0);

      return `
        <div class="m-card">
          <div class="m-card-row">
            <div>
              <div class="m-card-title">${escapeHtml(c.nom || 'Sans nom')}</div>
              ${c.ancienId ? `<span class="badge badge-neutral">${escapeHtml(c.ancienId)}</span>` : ''}
            </div>
            <span class="badge badge-info">${clientSubs.length} ab.</span>
          </div>
          <div class="m-card-subtitle">${formatPhone(c.telephone)}</div>
          <hr class="m-card-divider">
          <div class="m-card-row">
            <div><div class="m-card-label">Total versé</div><div class="m-card-value">${formatFCFA(totalDepense)} F</div></div>
            <div><div class="m-card-label">Origine</div><div class="m-card-value">${c.origine || '—'}</div></div>
          </div>
          <div class="m-card-actions">
            <button class="btn btn-outline btn-client-details" data-client-id="${c.id}">Fiche</button>
            <button class="btn btn-secondary btn-edit-client" data-client-id="${c.id}">Éditer</button>
            <button class="btn btn-danger btn-delete-client" data-client-id="${c.id}">✕</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-client-details').forEach(btn => {
      btn.addEventListener('click', () => openClientDrawer(btn.dataset.clientId));
    });
    container.querySelectorAll('.btn-edit-client').forEach(btn => {
      btn.addEventListener('click', () => openClientModal(btn.dataset.clientId));
    });
    container.querySelectorAll('.btn-delete-client').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.clientId;
        const c = store.data.clients.find(item => item.id === id);
        const name = c ? c.nom : id;
        const ok = await showConfirmModal({
          title: 'Supprimer le client',
          message: `Voulez-vous supprimer le client <strong>${escapeHtml(name)}</strong> et ses abonnements ?`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          isDanger: true,
          icon: '🗑️'
        });
        if (!ok) return;

        await store.deleteClient(id);
        renderAdmin();
        showToast('Client supprimé', 'success');
      });
    });
  }

  // --- Rendu mobile : Mouvements de caisse ---
  function renderMobileMouvements() {
    const container = document.getElementById('mobile-mouvements-list');
    if (!container) return;

    const mvts = store.data.mouvementsCaisse || [];
    if (mvts.length === 0) {
      container.innerHTML = '<div class="m-card" style="text-align:center; padding:2rem;"><div class="text-muted">Aucun mouvement</div></div>';
      return;
    }

    container.innerHTML = mvts.map(m => `
      <div class="m-card m-card-danger">
        <div class="m-card-row">
          <div class="m-card-title">${escapeHtml(m.beneficiaire || '—')}</div>
          <span class="badge ${m.type === 'recharge' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(cashMovementTypeLabel(m.type))}</span>
        </div>
        <hr class="m-card-divider">
        <div class="m-card-row">
          <div><div class="m-card-label">Date</div><div class="m-card-value">${formatDate(m.date)}</div></div>
          <div><div class="m-card-label">Montant</div><div class="m-card-value text-danger">-${formatFCFA(m.montant)} F</div></div>
        </div>
        <div class="m-card-subtitle">${escapeHtml(m.motif || 'Aucun motif indiqué')}</div>
        <div class="m-card-actions">
          <button class="btn btn-outline btn-edit-mvt" data-mvt-id="${m.id}">Éditer</button>
          <button class="btn btn-danger btn-delete-mvt" data-mvt-id="${m.id}">✕</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-delete-mvt').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.mvtId;
        const m = store.data.mouvementsCaisse.find(item => item.id === id);
        const motif = m ? `${m.beneficiaire} (${formatFCFA(m.montant)} FCFA)` : id;
        const ok = await showConfirmModal({
          title: 'Supprimer le mouvement',
          message: `Voulez-vous supprimer ce mouvement : <strong>${escapeHtml(motif)}</strong> ?`,
          confirmText: 'Supprimer',
          cancelText: 'Annuler',
          isDanger: true,
          icon: '🗑️'
        });
        if (!ok) return;

        await store.deleteMouvementCaisse(id);
        renderAdmin();
        showToast('Mouvement supprimé', 'success');
      });
    });

    container.querySelectorAll('.btn-edit-mvt').forEach(btn => {
      btn.addEventListener('click', () => openCashModal(btn.dataset.mvtId));
    });
  }


  // --- Rendu mobile : Journal d'audit ---
  function renderMobileAudit() {
    const container = document.getElementById('mobile-audit-list');
    if (!container) return;

    const logs = store.data.auditLogs || [];
    if (logs.length === 0) {
      container.innerHTML = '<div class="m-card" style="text-align:center; padding:2rem;"><div class="text-muted">Aucune entrée de journal</div></div>';
      return;
    }

    container.innerHTML = logs.map(log => {
      const d = new Date(log.timestamp);
      const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="m-card">
          <div class="m-card-row">
            <div>
              <div class="m-card-value">${escapeHtml(log.userName)}</div>
              <div class="m-card-subtitle">${dateStr} à ${timeStr}</div>
            </div>
            <span class="badge badge-neutral">${escapeHtml(log.action)}</span>
          </div>
          <div class="m-card-subtitle">${escapeHtml(log.detail)}</div>
        </div>
      `;
    }).join('');
  }

});
