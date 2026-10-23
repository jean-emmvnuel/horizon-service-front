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
          if (loginErrorMsg) {
            loginErrorMsg.textContent = 'Erreur lors de la connexion. Vérifiez la console ou le serveur.';
            loginErrorMsg.style.display = 'block';
          }
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

    function showDashboard() {
      if (!currentSession) {
        showLogin();
        return;
      }
      if (viewLogin) viewLogin.style.display = 'none';
      if (viewAdmin) viewAdmin.style.display = 'flex';
      updateUserSessionUI();
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

  function initAdminTabs() {
    const tabBtns = document.querySelectorAll('.admin-tabs-bar .tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        if (!targetTab) return;
        switchTab(targetTab);
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
      showToast('Données rafraîchies depuis la base de données.', 'success');
    } catch (e) {
      showToast('Impossible de contacter le serveur. Les données locales sont affichées.', 'warning');
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

    const data = store.data.historiqueMensuel;
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
      const hBen = (d.benefice / ceiling) * chartHeight;
      const hRec = (d.recharge / ceiling) * chartHeight;

      const yCA = paddingTop + chartHeight - hCA;
      const yBen = paddingTop + chartHeight - hBen;
      const yRec = paddingTop + chartHeight - hRec;

      const shortLabel = d.label.split(' ')[0].substring(0, 4);

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

    const comptes = store.data.comptes;
    let itemsHtml = '';

    comptes.forEach(compte => {
      const placesOccupees = store.data.abonnements.filter(ab => {
        const p = store.data.profils.find(prof => prof.id === ab.profilId);
        return p && p.compteId === compte.id;
      }).length;

      const capacite = compte.capacitePlaces;
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
    const kpiOccupation = document.getElementById('kpi-occupation');
    const kpiPlacesLibres = document.getElementById('kpi-places-libres');
    const kpiCaisseTheorique = document.getElementById('kpi-caisse-theorique');
    const kpiEcartCaisse = document.getElementById('kpi-ecart-caisse');

    if (kpiCaMois) kpiCaMois.textContent = `${formatFCFA(kpis.caMois)} FCFA`;
    if (kpiBeneficeMois) kpiBeneficeMois.textContent = `${formatFCFA(kpis.beneficeMois)} FCFA`;
    if (kpiMargeMois) kpiMargeMois.textContent = `${kpis.margePctMois}%`;
    if (kpiOccupation) kpiOccupation.textContent = `${kpis.tauxOccupationGlobal}% (${kpis.totalAbonnements}/${kpis.capaciteTotale})`;
    if (kpiPlacesLibres) kpiPlacesLibres.textContent = `${kpis.placesLibres} place${kpis.placesLibres > 1 ? 's' : ''} libre${kpis.placesLibres > 1 ? 's' : ''}`;
    if (kpiCaisseTheorique) kpiCaisseTheorique.textContent = `${formatFCFA(kpis.caisseTheorique)} FCFA`;
    if (kpiEcartCaisse) {
      kpiEcartCaisse.textContent = `${formatFCFA(kpis.ecartCaisse)} FCFA`;
      kpiEcartCaisse.className = kpis.ecartCaisse > 0 ? 'kpi-value text-danger' : 'kpi-value text-success';
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
              <strong>${escapeHtml(item.client.nom)}</strong>
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
                <button class="btn btn-sm btn-whatsapp btn-relance-wa" data-client-phone="${item.client.telephone}" data-client-nom="${escapeHtml(item.client.nom)}" data-date-fin="${formatDate(item.dateFin)}" data-tarif="${item.tarif}" data-compte="${escapeHtml(item.compte.libelle)}" data-profil="${escapeHtml(item.profil.nom)}" title="Envoyer rappel WhatsApp personnalisé">
                  <span>Relancer</span>
                </button>
                <button class="btn btn-sm btn-secondary btn-renew-quick" data-sub-id="${item.id}" title="Renouveler immédiatement">
                  <span>Renouveler</span>
                </button>
              </div>
            </td>
          </tr>
        `).join('');

        urgentsList.querySelectorAll('.btn-relance-wa').forEach(btn => {
          btn.addEventListener('click', () => {
            openRelanceModal({
              clientNom: btn.dataset.clientNom,
              clientPhone: btn.dataset.clientPhone,
              dateFin: btn.dataset.dateFin,
              tarif: Number(btn.dataset.tarif) || 1500,
              compteLibelle: btn.dataset.compte,
              profilNom: btn.dataset.profil
            });
          });
        });

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
    const tableBody = document.getElementById('table-historique-mensuel');
    if (tableBody) {
      tableBody.innerHTML = store.data.historiqueMensuel.map(m => `
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
            ${escapeHtml(item.client.nom)}
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

    // Remplissage des sélecteurs
    selClient.innerHTML = store.data.clients.map(c => `
      <option value="${c.id}">${escapeHtml(c.nom)} (${c.telephone})</option>
    `).join('');

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
      inputDateDebut.value = '2026-10-22';
      const d = new Date('2026-10-22');
      d.setMonth(d.getMonth() + 1);
      inputDateFin.value = d.toISOString().split('T')[0];
      if (selDuree) selDuree.value = '1';
    }

    modal.classList.add('active');
  }

  function handleSaveAbonnement(e) {
    e.preventDefault();
    const editId = document.getElementById('sub-edit-id').value;
    const clientId = document.getElementById('sub-client-select').value;
    const profilId = document.getElementById('sub-profil-select').value;
    const tarif = parseInt(document.getElementById('sub-tarif-input').value, 10);
    const dateDebut = document.getElementById('sub-date-debut').value;
    const dateFin = document.getElementById('sub-date-fin').value;

    if (new Date(dateFin) <= new Date(dateDebut)) {
      alert('La date de fin doit être postérieure à la date de début.');
      return;
    }

    if (editId) {
      store.updateAbonnement(editId, { clientId, profilId, tarif, dateDebut, dateFin });
      store.logAction(currentSession?.name, 'MODIFICATION_ABONNEMENT', `Abonnement ${editId} mis à jour`);
      showToast('Abonnement modifié avec succès !', 'success');
    } else {
      store.createAbonnement({ clientId, profilId, tarif, dateDebut, dateFin });
      store.logAction(currentSession?.name, 'CREATION_ABONNEMENT', `Nouvel abonnement pour ${clientId}`);
      showToast('Abonnement créé avec succès !', 'success');
    }

    document.getElementById('modal-sub').classList.remove('active');
    renderAdmin();
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

    await store.renewSubscription(subId);
    store.logAction(currentSession?.name, 'RENOUVELLEMENT_ABONNEMENT', `Abonnement de ${clientName} renouvelé +1 mois`);
    showToast(`Abonnement de ${clientName} prolongé avec succès !`, 'success');
    renderAdmin();
  }

  // -------------------------------------------------------------
  // 6. CRUD : Clients
  // -------------------------------------------------------------
  function renderClientsTab() {
    const listContainer = document.getElementById('clients-table-body');
    if (!listContainer) return;

    const searchTerm = (document.getElementById('input-search-clients')?.value || '').toLowerCase().trim();

    let clients = store.data.clients;
    if (searchTerm) {
      clients = clients.filter(c => 
        c.nom.toLowerCase().includes(searchTerm) ||
        (c.telephone && c.telephone.toLowerCase().includes(searchTerm)) ||
        (c.ancienId && c.ancienId.toLowerCase().includes(searchTerm))
      );
    }

    listContainer.innerHTML = clients.map(c => {
      const clientSubs = store.data.abonnements.filter(ab => ab.clientId === c.id);
      const totalDepense = clientSubs.reduce((sum, ab) => sum + ab.tarif, 0);

      return `
        <tr>
          <td>
            <strong>${escapeHtml(c.nom)}</strong>
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

        await store.deleteClient(id);
        store.logAction(currentSession?.name, 'SUPPRESSION_CLIENT', `Client ${id} (${name}) supprimé`);
        showToast('Client supprimé avec succès.', 'info');
        renderAdmin();
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
      inputNom.value = client.nom;
      inputTel.value = client.telephone;
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

  function handleSaveClient(e) {
    e.preventDefault();
    const editId = document.getElementById('cli-edit-id').value;
    const nom = document.getElementById('cli-nom').value.trim();
    const telephone = document.getElementById('cli-tel').value.trim();
    const ancienId = document.getElementById('cli-ancien-id').value.trim();
    const origine = document.getElementById('cli-origine').value;
    const notes = document.getElementById('cli-notes').value.trim();

    if (editId) {
      store.updateClient(editId, { nom, telephone, ancienId, origine, notes });
      store.logAction(currentSession?.name, 'MODIFICATION_CLIENT', `Fiche client ${nom} mise à jour`);
      showToast(`Client ${nom} mis à jour avec succès !`, 'success');
    } else {
      store.createClient({ nom, telephone, ancienId, origine, notes });
      store.logAction(currentSession?.name, 'CREATION_CLIENT', `Client ${nom} créé`);
      showToast(`Client ${nom} ajouté avec succès !`, 'success');
    }

    document.getElementById('modal-client').classList.remove('active');
    renderAdmin();
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

        await store.deleteCompte(id);
        store.logAction(currentSession?.name, 'SUPPRESSION_COMPTE', `Compte ${id} (${name}) supprimé`);
        showToast('Compte supprimé avec succès.', 'info');
        renderAdmin();
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

        await store.deleteProfil(id);
        store.logAction(currentSession?.name, 'SUPPRESSION_PROFIL', `Profil ${id} (${name}) supprimé`);
        showToast('Profil supprimé.', 'info');
        renderAdmin();
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
      const d = new Date('2026-10-22');
      d.setMonth(d.getMonth() + 1);
      inputReabonnement.value = d.toISOString().split('T')[0];
    }

    modal.classList.add('active');
  }

  function handleSaveCompte(e) {
    e.preventDefault();
    const editId = document.getElementById('cpt-edit-id').value;
    const libelle = document.getElementById('cpt-libelle').value.trim();
    const email = document.getElementById('cpt-email').value.trim();
    const motDePasse = document.getElementById('cpt-password').value.trim();
    const dateReabonnement = document.getElementById('cpt-date-reabonnement').value;
    const coutRechargeMensuel = document.getElementById('cpt-cout-recharge').value;
    const capacitePlaces = document.getElementById('cpt-capacite').value;
    const maxProfils = document.getElementById('cpt-max-profils').value;

    if (editId) {
      store.updateCompte(editId, { libelle, email, motDePasse, dateReabonnement, coutRechargeMensuel, capacitePlaces, maxProfils });
      store.logAction(currentSession?.name, 'MODIFICATION_COMPTE', `Compte ${libelle} mis à jour`);
      showToast(`Compte ${libelle} modifié !`, 'success');
    } else {
      const today = new Date().toISOString().slice(0, 10);
      store.createCompte({ libelle, email, motDePasse, dateOuverture: today, dateReabonnement, coutRechargeMensuel, capacitePlaces, maxProfils });
      store.logAction(currentSession?.name, 'CREATION_COMPTE', `Compte ${libelle} créé`);
      showToast(`Compte ${libelle} créé !`, 'success');
    }

    document.getElementById('modal-compte').classList.remove('active');
    renderAdmin();
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

  function handleSaveProfil(e) {
    e.preventDefault();
    const editId = document.getElementById('prf-edit-id').value;
    const compteId = document.getElementById('prf-compte-id').value;
    const nom = document.getElementById('prf-nom').value.trim();
    const codePin = document.getElementById('prf-pin').value.trim();
    const codeRenewNeeded = document.getElementById('prf-renew-needed').checked;

    if (editId) {
      store.updateProfil(editId, { nom, codePin, codeRenewNeeded });
      store.logAction(currentSession?.name, 'MODIFICATION_PROFIL', `Profil ${nom} mis à jour`);
      showToast(`Profil ${nom} modifié !`, 'success');
    } else {
      try {
        store.createProfil({ compteId, nom, codePin, codeRenewNeeded });
        store.logAction(currentSession?.name, 'CREATION_PROFIL', `Profil ${nom} ajouté`);
        showToast(`Profil ${nom} créé avec succès !`, 'success');
      } catch (err) {
        alert(err.message);
        return;
      }
    }

    document.getElementById('modal-profil').classList.remove('active');
    renderAdmin();
  }

  // -------------------------------------------------------------
  // 8. CRUD : Caisse & Finances
  // -------------------------------------------------------------
  function renderFinancesTab() {
    const kpis = store.getKPIs();

    const elBeneficeCumule = document.getElementById('fin-benefice-cumule');
    if (elBeneficeCumule) {
      const beneficeTheorique = Math.max(0, kpis.caTotal - kpis.rechargesTotal);
      elBeneficeCumule.textContent = `${formatFCFA(beneficeTheorique)} FCFA`;
    }

    const prelevementsContainer = document.getElementById('fin-prelevements-details');
    if (prelevementsContainer) {
      const prelevements = (store.data.mouvementsCaisse || []).filter(m => m.type === 'prelevement');
      const parBeneficiaire = {};
      prelevements.forEach(m => {
        const nom = (m.beneficiaire || (currentSession?.name || 'Utilisateur')).trim();
        parBeneficiaire[nom] = (parBeneficiaire[nom] || 0) + (Number(m.montant) || 0);
      });

      const noms = Object.keys(parBeneficiaire);
      if (noms.length === 0) {
        const defaultName = currentSession?.name || 'Utilisateur';
        prelevementsContainer.innerHTML = `
          <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
            <span class="text-muted">Total Prélèvements (${escapeHtml(defaultName)}) :</span>
            <span class="font-bold">0 FCFA</span>
          </div>
        `;
      } else {
        prelevementsContainer.innerHTML = noms.map(nom => `
          <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
            <span class="text-muted">Total Prélèvements (${escapeHtml(nom)}) :</span>
            <span class="text-danger font-bold">-${formatFCFA(parBeneficiaire[nom])} FCFA</span>
          </div>
        `).join('');
      }
    }

    const elCaisseTheo = document.getElementById('fin-caisse-theorique');
    const elCaisseReelle = document.getElementById('fin-caisse-reelle');
    const elEcart = document.getElementById('fin-caisse-ecart');

    if (elCaisseTheo) elCaisseTheo.textContent = `${formatFCFA(kpis.caisseTheorique)} FCFA`;
    if (elCaisseReelle) elCaisseReelle.textContent = `${formatFCFA(kpis.caisseReelle)} FCFA`;
    if (elEcart) {
      elEcart.textContent = `${formatFCFA(kpis.ecartCaisse)} FCFA`;
      elEcart.className = kpis.ecartCaisse > 0 ? 'text-danger font-bold' : 'text-success font-bold';
    }

    const mvtBody = document.getElementById('table-mouvements-caisse-body');
    if (mvtBody) {
      mvtBody.innerHTML = store.data.mouvementsCaisse.map(m => `
        <tr>
          <td>${formatDate(m.date)}</td>
          <td>
            <span class="badge ${m.type === 'prelevement' ? 'badge-warning' : 'badge-danger'}">
              ${m.type === 'prelevement' ? 'Prélèvement' : 'Recharge'}
            </span>
          </td>
          <td><strong>${escapeHtml(m.beneficiaire)}</strong></td>
          <td class="font-bold text-danger">-${formatFCFA(m.montant)} FCFA</td>
          <td class="text-sm text-secondary">${escapeHtml(m.motif)}</td>
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
  }

  function openCashModal(cashId = null) {
    const modal = document.getElementById('modal-cash');
    const form = document.getElementById('form-cash-movement');
    const title = document.getElementById('modal-cash-title');
    const inputEditId = document.getElementById('cash-edit-id');
    const selType = document.getElementById('cash-type-select');
    const inputBenef = document.getElementById('cash-beneficiaire');
    const inputMontant = document.getElementById('cash-montant');
    const inputMotif = document.getElementById('cash-motif');

    if (!modal) return;

    if (cashId) {
      const m = store.data.mouvementsCaisse.find(mvt => mvt.id === cashId);
      if (!m) return;
      title.textContent = 'Modifier l\'opération de caisse';
      inputEditId.value = m.id;
      selType.value = m.type;
      inputBenef.value = m.beneficiaire;
      inputMontant.value = m.montant;
      inputMotif.value = m.motif;
    } else {
      title.textContent = 'Enregistrer une opération de caisse';
      inputEditId.value = '';
      form.reset();
      inputMontant.value = '';
      if (selType.value === 'prelevement') {
        inputBenef.value = currentSession?.name || '';
      }
    }

    selType.onchange = () => {
      if (selType.value === 'prelevement' && (!inputBenef.value || inputBenef.value === 'Netflix')) {
        inputBenef.value = currentSession?.name || '';
      } else if (selType.value === 'recharge' && (!inputBenef.value || inputBenef.value === (currentSession?.name || ''))) {
        inputBenef.value = 'Netflix';
      }
    };

    modal.classList.add('active');
  }

  async function handleSaveCash(e) {
    e.preventDefault();
    const editId = document.getElementById('cash-edit-id').value;
    const type = document.getElementById('cash-type-select').value;
    const beneficiaire = document.getElementById('cash-beneficiaire').value.trim();
    const montant = parseInt(document.getElementById('cash-montant').value, 10);
    const motif = document.getElementById('cash-motif').value.trim();

    try {
      if (type === 'pointage') {
        await store.updateCaissePointage(montant, motif);
        store.logAction(currentSession?.name, 'POINTAGE_CAISSE', `Pointage caisse réelle : ${montant} FCFA`);
      } else {
        if (editId) {
          await store.updateMouvementCaisse(editId, { type, beneficiaire: beneficiaire || (type === 'recharge' ? 'Netflix' : (currentSession?.name || 'Utilisateur')), montant, motif });
          store.logAction(currentSession?.name, 'MODIFICATION_CAISSE', `Mouvement ${type} de ${montant} FCFA modifié`);
        } else {
          await store.createMouvementCaisse({ type, beneficiaire: beneficiaire || (type === 'recharge' ? 'Netflix' : (currentSession?.name || 'Utilisateur')), montant, motif });
          store.logAction(currentSession?.name, 'MOUVEMENT_CAISSE', `Nouveau ${type} de ${montant} FCFA`);
        }
      }

      document.getElementById('modal-cash').classList.remove('active');
      showToast('Opération enregistrée avec succès !', 'success');
      renderAdmin();
    } catch (err) {
      showToast('Erreur lors de l\'enregistrement en base : ' + (err.message || 'Erreur serveur'), 'danger');
    }
  }

  // -------------------------------------------------------------
  // 9. RELANCES WHATSAPP & LIENS DE PAIEMENT (PERSONNALISABLES)
  // -------------------------------------------------------------
  function buildRelanceMessage({ clientNom = '', dateFin = '', tarif = 0, paymentLink = '', compteLibelle = '', profilNom = '' }) {
    const cfg = store.getRelanceConfig();
    let template = cfg.messageTemplate || '';
    const lien = paymentLink || cfg.lienPaiementDefaut || '';

    return template
      .replace(/\{nom\}/g, clientNom || 'Client')
      .replace(/\{dateFin\}/g, dateFin || '')
      .replace(/\{tarif\}/g, formatFCFA(tarif || 1500))
      .replace(/\{lienPaiement\}/g, lien)
      .replace(/\{compte\}/g, compteLibelle || '')
      .replace(/\{profil\}/g, profilNom || '');
  }

  function openRelanceModal({ clientNom, clientPhone, dateFin, tarif, compteLibelle = '', profilNom = '' }) {
    const modal = document.getElementById('modal-relance');
    const title = document.getElementById('modal-relance-title');
    const inputNom = document.getElementById('relance-client-nom');
    const inputDateFin = document.getElementById('relance-date-fin');
    const inputTarif = document.getElementById('relance-tarif');
    const inputCompte = document.getElementById('relance-compte');
    const inputProfil = document.getElementById('relance-profil');
    const inputPhone = document.getElementById('relance-phone');
    const senderSelect = document.getElementById('relance-sender-select');
    const inputPaymentLink = document.getElementById('relance-payment-link');
    const textareaMsg = document.getElementById('relance-message-content');
    const charCount = document.getElementById('relance-char-count');
    const saveCheck = document.getElementById('relance-save-template-check');

    if (!modal) return;

    if (title) title.textContent = `Relance WhatsApp — ${clientNom}`;
    inputNom.value = clientNom || '';
    inputDateFin.value = dateFin || '';
    inputTarif.value = tarif || '';
    inputCompte.value = compteLibelle || '';
    inputProfil.value = profilNom || '';

    // Nettoyer et formater numéro
    let cleanPhone = (clientPhone || '').replace(/\D/g, '');
    if (cleanPhone && !cleanPhone.startsWith('225') && cleanPhone.length === 10) {
      cleanPhone = '225' + cleanPhone;
    }
    inputPhone.value = cleanPhone;

    const cfg = store.getRelanceConfig();

    // Sélection automatique de l'associé connecté
    let defaultSender = 'emmanuel';
    if (currentSession && (currentSession.email?.toLowerCase().includes('malan') || currentSession.name?.toLowerCase().includes('malan'))) {
      defaultSender = 'malan';
    }
    if (senderSelect) {
      senderSelect.value = defaultSender;
    }

    function getLinkForSender(sender) {
      // Priorité 1 : lien personnel chargé depuis la BDD via la session courante
      if (currentSession && sender === defaultSender && currentSession.paymentLink) {
        return currentSession.paymentLink;
      }
      // Priorité 2 : config de relance locale (modifiée via paramètres)
      if (sender === 'malan') {
        return cfg.lienPaiementMalan || 'https://pay.wave.com/m/horizon-service-malan';
      }
      return cfg.lienPaiementEmmanuel || 'https://pay.wave.com/m/horizon-service-emmanuel';
    }

    inputPaymentLink.value = getLinkForSender(senderSelect ? senderSelect.value : defaultSender);
    if (saveCheck) saveCheck.checked = false;

    function refreshMessage() {
      textareaMsg.value = buildRelanceMessage({
        clientNom: inputNom.value,
        dateFin: inputDateFin.value,
        tarif: inputTarif.value,
        paymentLink: inputPaymentLink.value.trim(),
        compteLibelle: inputCompte.value,
        profilNom: inputProfil.value
      });
      if (charCount) charCount.textContent = `${textareaMsg.value.length} caractères`;
    }

    refreshMessage();

    if (senderSelect) {
      senderSelect.onchange = () => {
        inputPaymentLink.value = getLinkForSender(senderSelect.value);
        refreshMessage();
      };
    }

    textareaMsg.oninput = () => {
      if (charCount) charCount.textContent = `${textareaMsg.value.length} caractères`;
    };

    inputPaymentLink.oninput = () => {
      refreshMessage();
    };

    modal.classList.add('active');
  }

  function initRelanceModalEvents() {
    const modal = document.getElementById('modal-relance');
    const form = document.getElementById('form-relance-send');
    const senderSelect = document.getElementById('relance-sender-select');
    const inputPaymentLink = document.getElementById('relance-payment-link');
    const textareaMsg = document.getElementById('relance-message-content');
    const btnEmmanuel = document.getElementById('btn-relance-insert-emmanuel');
    const btnMalan = document.getElementById('btn-relance-insert-malan');
    const btnNoLink = document.getElementById('btn-relance-remove-link');
    const btnCopy = document.getElementById('btn-relance-copy-text');

    btnEmmanuel?.addEventListener('click', () => {
      const cfg = store.getRelanceConfig();
      if (senderSelect) senderSelect.value = 'emmanuel';
      inputPaymentLink.value = cfg.lienPaiementEmmanuel || 'https://pay.wave.com/m/horizon-service-emmanuel';
      inputPaymentLink.dispatchEvent(new Event('input'));
    });

    btnMalan?.addEventListener('click', () => {
      const cfg = store.getRelanceConfig();
      if (senderSelect) senderSelect.value = 'malan';
      inputPaymentLink.value = cfg.lienPaiementMalan || 'https://pay.wave.com/m/horizon-service-malan';
      inputPaymentLink.dispatchEvent(new Event('input'));
    });

    btnNoLink?.addEventListener('click', () => {
      inputPaymentLink.value = '';
      inputPaymentLink.dispatchEvent(new Event('input'));
    });

    btnCopy?.addEventListener('click', () => {
      if (textareaMsg && textareaMsg.value) {
        navigator.clipboard.writeText(textareaMsg.value).then(() => {
          showToast('Message copié dans le presse-papier !', 'info');
        }).catch(() => {
          textareaMsg.select();
          document.execCommand('copy');
          showToast('Message copié !', 'info');
        });
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const phone = document.getElementById('relance-phone').value.replace(/\D/g, '');
      const msg = textareaMsg.value.trim();
      const clientNom = document.getElementById('relance-client-nom').value;
      const saveCheck = document.getElementById('relance-save-template-check');

      if (!phone) {
        showToast('Veuillez renseigner un numéro de téléphone valide.', 'warning');
        return;
      }

      if (saveCheck && saveCheck.checked) {
        store.updateRelanceConfig({ messageTemplate: msg });
        showToast('Nouveau modèle de relance mémorisé !', 'info');
      }

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
      store.logAction(currentSession?.name, 'RELANCE_WHATSAPP', `Relance WhatsApp envoyée à ${clientNom || phone}`);
      showToast(`Relance envoyée à ${clientNom || phone} !`, 'success');
      modal?.classList.remove('active');
    });
  }

  // -------------------------------------------------------------
  // 9bis. Onglet 6 : Paramètres & Relances WhatsApp
  // -------------------------------------------------------------
  function renderSettingsTab() {
    const cfg = store.getRelanceConfig();
    const inputPaymentEmmanuel = document.getElementById('setting-payment-link-emmanuel');
    const inputPaymentMalan = document.getElementById('setting-payment-link-malan');
    const previewSenderSelect = document.getElementById('setting-preview-sender-select');
    const textareaTemplate = document.getElementById('setting-message-template');
    const previewBox = document.getElementById('preview-relance-box');
    const formSettings = document.getElementById('form-relance-settings');

    if (inputPaymentEmmanuel) {
      // Priorité : lien depuis la BDD (store.data.users), puis config relance
      const usersDb = store.data.users || [];
      const emmDb = usersDb.find(u => u.email && u.email.toLowerCase().includes('emmanuelahossi'));
      const malanDb = usersDb.find(u => u.email && u.email.toLowerCase().includes('malan'));
      inputPaymentEmmanuel.value = (emmDb && emmDb.paymentLink) || cfg.lienPaiementEmmanuel || 'https://pay.wave.com/m/horizon-service-emmanuel';
      if (inputPaymentMalan) {
        inputPaymentMalan.value = (malanDb && malanDb.paymentLink) || cfg.lienPaiementMalan || 'https://pay.wave.com/m/horizon-service-malan';
      }
    }
    if (textareaTemplate) {
      textareaTemplate.value = cfg.messageTemplate || '';
    }

    function updatePreview() {
      if (!previewBox) return;
      const tpl = textareaTemplate ? textareaTemplate.value : '';
      const selectedSender = previewSenderSelect ? previewSenderSelect.value : 'emmanuel';
      const payment = selectedSender === 'malan' 
        ? (inputPaymentMalan ? inputPaymentMalan.value.trim() : '')
        : (inputPaymentEmmanuel ? inputPaymentEmmanuel.value.trim() : '');

      const rendered = tpl
        .replace(/\{nom\}/g, 'Kouassi Jean')
        .replace(/\{dateFin\}/g, '25/10/2026')
        .replace(/\{tarif\}/g, '1 500')
        .replace(/\{lienPaiement\}/g, payment || 'https://pay.wave.com/m/horizon-service')
        .replace(/\{compte\}/g, 'Compte 1')
        .replace(/\{profil\}/g, 'Orion');

      previewBox.textContent = rendered;
    }

    updatePreview();

    if (textareaTemplate) textareaTemplate.oninput = updatePreview;
    if (inputPaymentEmmanuel) inputPaymentEmmanuel.oninput = updatePreview;
    if (inputPaymentMalan) inputPaymentMalan.oninput = updatePreview;
    if (previewSenderSelect) previewSenderSelect.onchange = updatePreview;

    // Insertion des tags à l'emplacement du curseur
    document.querySelectorAll('.btn-tag').forEach(btn => {
      btn.onclick = () => {
        if (!textareaTemplate) return;
        const tag = btn.dataset.tag;
        const start = textareaTemplate.selectionStart || 0;
        const end = textareaTemplate.selectionEnd || 0;
        const text = textareaTemplate.value;
        textareaTemplate.value = text.substring(0, start) + tag + text.substring(end);
        textareaTemplate.selectionStart = textareaTemplate.selectionEnd = start + tag.length;
        textareaTemplate.focus();
        updatePreview();
      };
    });

    // Rétablir le modèle par défaut avec modal de confirmation
    const btnResetTpl = document.getElementById('btn-reset-relance-template');
    if (btnResetTpl) {
      btnResetTpl.onclick = async () => {
        const ok = await showConfirmModal({
          title: 'Rétablir le modèle par défaut',
          message: 'Voulez-vous rétablir le modèle officiel de relance WhatsApp ?',
          confirmText: 'Rétablir le texte',
          cancelText: 'Annuler',
          isDanger: false,
          icon: '↩️'
        });
        if (!ok) return;

        const defaultTemplate = "Bonjour {nom}, votre abonnement Netflix Horizon Service arrive à échéance le {dateFin}.\n\nPour continuer à profiter de vos programmes sans coupure, vous pouvez effectuer le règlement de {tarif} FCFA via ce lien de paiement sécurisé :\n{lienPaiement}\n\nMerci pour votre fidélité !";
        if (textareaTemplate) textareaTemplate.value = defaultTemplate;
        updatePreview();
        showToast('Modèle de relance restauré par défaut.', 'info');
      };
    }

    if (formSettings) {
      formSettings.onsubmit = async (e) => {
        e.preventDefault();
        const linkEmmanuel = inputPaymentEmmanuel ? inputPaymentEmmanuel.value.trim() : '';
        const linkMalan = inputPaymentMalan ? inputPaymentMalan.value.trim() : '';
        const messageTemplate = textareaTemplate ? textareaTemplate.value.trim() : '';

        const ok = await showConfirmModal({
          title: 'Enregistrer les paramètres',
          message: 'Voulez-vous appliquer ces nouveaux liens de paiement et ce modèle de relance ?',
          confirmText: 'Enregistrer',
          cancelText: 'Annuler',
          isDanger: false,
          icon: '💾'
        });
        if (!ok) return;

        // 1. Sauvegarder le config local de relance
        await store.updateRelanceConfig({
          lienPaiementEmmanuel: linkEmmanuel,
          lienPaiementMalan: linkMalan,
          lienPaiementDefaut: linkEmmanuel,
          messageTemplate: messageTemplate
        });

        // 2. Sauvegarder les liens de paiement en base de données pour chaque utilisateur
        const users = store.data.users || [];
        const userEmmanuel = users.find(u => u.email && u.email.toLowerCase().includes('emmanuelahossi'));
        const userMalan = users.find(u => u.email && u.email.toLowerCase().includes('malan'));

        const savePaymentLink = async (userId, link) => {
          if (!userId || !link) return;
          try {
            const base = store.apiBase;
            await fetch(`${base}/api/users/${userId}/payment-link`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentLink: link })
            });
          } catch (err) {
            console.warn('Erreur sauvegarde lien paiement en BDD :', err);
          }
        };

        if (userEmmanuel) await savePaymentLink(userEmmanuel.id, linkEmmanuel);
        if (userMalan) await savePaymentLink(userMalan.id, linkMalan);

        // Si l'utilisateur connecté est Emmanuel ou Malan, mettre à jour aussi par session
        if (currentSession) {
          const myLink = currentSession.email && currentSession.email.toLowerCase().includes('malan')
            ? linkMalan
            : linkEmmanuel;
          await savePaymentLink(currentSession.userId, myLink);
        }

        store.logAction(currentSession?.name, 'MODIFICATION_PARAMETRES', 'Liens de paiement (Wave/OM) et modèle de relance WhatsApp mis à jour en base de données');
        showToast('Paramètres enregistrés et synchronisés avec la base de données !', 'success');
      };
    }

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

    tbody.innerHTML = store.data.auditLogs.map(l => {
      const d = new Date(l.timestamp);
      const dateStr = d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR');
      return `
        <tr>
          <td class="font-mono text-xs text-muted">${dateStr}</td>
          <td><strong>${escapeHtml(l.userName)}</strong></td>
          <td><span class="badge badge-info">${escapeHtml(l.action)}</span></td>
          <td class="text-sm">${escapeHtml(l.detail)}</td>
        </tr>
      `;
    }).join('');
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

    // Modale Relance WhatsApp
    initRelanceModalEvents();

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

    if (title) title.textContent = client.nom;

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

        <div style="display: flex; gap: 8px; margin-bottom: var(--space-6);">
          <button class="btn btn-sm btn-whatsapp btn-drawer-wa" style="flex: 1;">
            <span>Écrire sur WhatsApp</span>
          </button>
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

      body.querySelector('.btn-drawer-wa')?.addEventListener('click', () => {
        const lastSub = subs[0];
        const lastProfil = lastSub ? store.data.profils.find(p => p.id === lastSub.profilId) : null;
        const lastCompte = lastProfil ? store.data.comptes.find(c => c.id === lastProfil.compteId) : null;
        openRelanceModal({
          clientNom: client.nom,
          clientPhone: client.telephone,
          dateFin: lastSub ? formatDate(lastSub.dateFin) : '',
          tarif: lastSub ? lastSub.tarif : 1500,
          compteLibelle: lastCompte ? lastCompte.libelle : '',
          profilNom: lastProfil ? lastProfil.nom : ''
        });
      });
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
    const nowStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const subsRows = data.abonnements.map(s => {
      const cli = data.clients.find(c => c.id === s.clientId) || { nom: 'Inconnu', telephone: '-' };
      const cpt = data.comptes.find(c => c.id === s.compteId) || { libelle: '-' };
      const prf = data.profils.find(p => p.id === s.profilId) || { nom: '-' };
      return `<tr>
        <td><strong>${escapeHtml(cli.nom)}</strong></td>
        <td>${escapeHtml(cli.telephone)}</td>
        <td>${escapeHtml(cpt.libelle)} / ${escapeHtml(prf.nom)}</td>
        <td>${escapeHtml(s.dateDebut)}</td>
        <td>${escapeHtml(s.dateFin)}</td>
        <td style="text-align: right; font-weight: bold;">${formatFCFA(s.tarif)}</td>
        <td><span class="badge ${s.statut === 'actif' ? 'badge-success' : 'badge-danger'}">${escapeHtml(s.statut)}</span></td>
      </tr>`;
    }).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Horizon Service — Rapport Consolidé Officiel</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 25px; color: #111; font-size: 11px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e50914; padding-bottom: 12px; margin-bottom: 16px; }
          .logo { font-size: 20px; font-weight: 900; color: #e50914; letter-spacing: 1px; }
          .subtitle { font-size: 11px; color: #666; margin-top: 2px; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge-success { background: #d1fae5; color: #065f46; }
          .badge-danger { background: #fee2e2; color: #991b1b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #f3f4f6; color: #111; text-align: left; padding: 6px 8px; border: 1px solid #e5e7eb; font-weight: bold; font-size: 10px; text-transform: uppercase; }
          td { padding: 6px 8px; border: 1px solid #e5e7eb; font-size: 10px; }
          tr:nth-child(even) { background: #fafafa; }
          h2 { font-size: 13px; margin: 18px 0 8px 0; border-left: 3px solid #e50914; padding-left: 8px; color: #111; }
          .footer { text-align: center; color: #888; font-size: 9px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          @media print {
            body { margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">HORIZON SERVICE</div>
            <div class="subtitle">Gestion d'abonnements Netflix partagés — Rapport consolidé certifié</div>
          </div>
          <div style="text-align: right;">
            <div><strong>Date d'export :</strong> ${nowStr}</div>
            <div style="color: #666;">Émis par : ${escapeHtml(currentSession?.name || 'Administrateur')}</div>
          </div>
        </div>

        <h2>1. Registre des Abonnements (${data.abonnements.length} abonnés)</h2>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Contact WhatsApp</th>
              <th>Compte / Profil</th>
              <th>Début</th>
              <th>Échéance</th>
              <th style="text-align: right;">Tarif</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${subsRows || '<tr><td colspan="7" style="text-align:center;">Aucun abonnement enregistré</td></tr>'}
          </tbody>
        </table>

        <h2>2. Comptes Netflix & Profils (${data.comptes.length} comptes)</h2>
        <table>
          <thead>
            <tr>
              <th>Libellé</th>
              <th>E-mail</th>
              <th>Recharge Mensuelle</th>
              <th>Prochain Réabonnement</th>
              <th>Capacité</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${data.comptes.map(c => `<tr>
              <td><strong>${escapeHtml(c.libelle)}</strong></td>
              <td>${escapeHtml(c.email)}</td>
              <td>${formatFCFA(c.coutRechargeMensuel || 6500)}</td>
              <td>${escapeHtml(c.dateReabonnement || '-')}</td>
              <td>${c.capacitePlaces || 15} places (${c.maxProfils || 5} profils max)</td>
              <td>${escapeHtml(c.statut || 'actif')}</td>
            </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;">Aucun compte enregistré</td></tr>'}
          </tbody>
        </table>

        <h2>3. Registre des Clients (${data.clients.length} clients)</h2>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone WhatsApp</th>
              <th>Ancien Identifiant</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${data.clients.map(c => `<tr>
              <td><strong>${escapeHtml(c.nom)}</strong></td>
              <td>${escapeHtml(c.telephone)}</td>
              <td>${escapeHtml(c.ancienId || '-')}</td>
              <td>${escapeHtml(c.notes || '-')}</td>
            </tr>`).join('') || '<tr><td colspan="4" style="text-align:center;">Aucun client enregistré</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Horizon Service — Document de gestion certifié — Abidjan, Côte d'Ivoire.
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
      showToast('Fenêtre d\'impression PDF générée !', 'success');
      store.logAction(currentSession?.name, 'EXPORT_PDF', 'Génération du rapport PDF consolidé');
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
      showToast('Impression PDF lancée !', 'success');
    }
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div style="flex-grow: 1;">${escapeHtml(message)}</div>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 3500);
  }
  // ==========================================================================
  // MOBILE : Navigation en bas & Rendu de cartes tactiles
  // ==========================================================================

  function switchTab(targetTab) {
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
    renderAdminTabContent(targetTab);
    window.scrollTo(0, 0);
  }

  function initMobileNav() {
    const bnavBtns = document.querySelectorAll('.mobile-bottom-nav .bnav-btn');
    bnavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        if (!targetTab) return;
        switchTab(targetTab);
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
          <div class="m-card-title">${escapeHtml(item.client.nom)}</div>
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
          <button class="btn btn-whatsapp btn-relance-wa" data-client-phone="${item.client.telephone}" data-client-nom="${escapeHtml(item.client.nom)}" data-date-fin="${formatDate(item.dateFin)}" data-tarif="${item.tarif}" data-compte="${escapeHtml(item.compte.libelle)}" data-profil="${escapeHtml(item.profil.nom)}">Relancer</button>
          <button class="btn btn-secondary btn-renew-quick" data-sub-id="${item.id}">Renouveler</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-relance-wa').forEach(btn => {
      btn.addEventListener('click', () => {
        openRelanceModal({
          clientNom: btn.dataset.clientNom,
          clientPhone: btn.dataset.clientPhone,
          dateFin: btn.dataset.dateFin,
          tarif: Number(btn.dataset.tarif) || 1500,
          compteLibelle: btn.dataset.compte,
          profilNom: btn.dataset.profil
        });
      });
    });

    container.querySelectorAll('.btn-renew-quick').forEach(btn => {
      btn.addEventListener('click', () => renewSubscription(btn.dataset.subId));
    });
  }

  // --- Rendu mobile : Historique mensuel ---
  function renderMobileHistorique() {
    const container = document.getElementById('mobile-historique-list');
    if (!container) return;

    container.innerHTML = store.data.historiqueMensuel.map(m => `
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
          <div class="m-card-title">${escapeHtml(item.client.nom)}</div>
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
              <div class="m-card-title">${escapeHtml(c.nom)}</div>
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
      <div class="m-card ${m.type === 'prelevement' ? 'm-card-danger' : ''}">
        <div class="m-card-row">
          <div class="m-card-title">${escapeHtml(m.beneficiaire)}</div>
          <span class="badge ${m.type === 'prelevement' ? 'badge-danger' : 'badge-success'}">${m.type === 'prelevement' ? '↑ Prélèvement' : '↓ Recharge'}</span>
        </div>
        <hr class="m-card-divider">
        <div class="m-card-row">
          <div><div class="m-card-label">Date</div><div class="m-card-value">${formatDate(m.date)}</div></div>
          <div><div class="m-card-label">Montant</div><div class="m-card-value ${m.type === 'prelevement' ? 'text-danger' : 'text-success'}">${m.type === 'prelevement' ? '-' : '+'}${formatFCFA(m.montant)} F</div></div>
        </div>
        <div class="m-card-subtitle">${escapeHtml(m.motif || '')}</div>
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
