/**
 * HORIZON SERVICE — STORE ET MODÈLE DE DONNÉES DYNAMIQUE (RÉSEAU PUR / ZÉRO CACHE LOCAL)
 * Connecté directement au Backend SQLite via NestJS API
 * - ZÉRO cache local : aucune donnée persistée dans localStorage ou CacheStorage
 * - Notification automatique à chaque requête : SUCCÈS ou "LA REQUÊTE N'EST PAS PASSÉE"
 * - 2 Utilisateurs réels authentifiés par JWT : Emmanuel & Malan Abdias
 */

const API_BASE = (typeof window !== 'undefined' && window.HORIZON_CONFIG && window.HORIZON_CONFIG.API_URL)
  ? window.HORIZON_CONFIG.API_URL
  : 'https://horizon-service.onrender.com';

const SESSION_KEY = 'horizon_service_session_v2';

// Purge immédiate de toute ancienne BDD mise en cache
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('horizon_service_sqlite_cache_v2');
    localStorage.removeItem('horizon_service_db');
  }
} catch (e) {}

const EMPTY_DATA = {
  version: '2.1',
  users: [],
  comptes: [],
  profils: [],
  clients: [],
  abonnements: [],
  caisse: {
    dernierPointageReel: 0,
    dateDernierPointage: '2026-10-22',
    notes: ''
  },
  mouvementsCaisse: [],
  auditLogs: [],
  historiqueMensuel: [],
  relanceConfig: {
    messageTemplate: "Bonjour {nom}, votre abonnement Netflix Horizon Service arrive à échéance le {dateFin}.\n\nPour continuer à profiter de vos programmes sans coupure, vous pouvez effectuer le règlement de {tarif} FCFA via ce lien de paiement sécurisé :\n{lienPaiement}\n\nMerci pour votre fidélité !",
    lienPaiementDefaut: "https://pay.wave.com/m/horizon-service",
    lienPaiementEmmanuel: "https://pay.wave.com/m/M_ci_udY9cJUTQBDe/c/ci/",
    lienPaiementMalan: "https://pay.wave.com/m/horizon-service-malan",
    numeroWhatsAppRelance: ""
  }
};

class DataStore {
  constructor() {
    this.apiBase = API_BASE;
    // Données en mémoire vive pure, aucune lecture dans le cache local
    this.data = JSON.parse(JSON.stringify(EMPTY_DATA));
    this.syncFromBackend(true).catch(() => {});
  }

  /**
   * Moteur centralisé de requêtes HTTP :
   * 1. Garantit l'absence de cache (headers anti-cache & cache: 'no-store')
   * 2. Notifie l'utilisateur à chaque requête (succès ou non transmission)
   */
  async apiRequest(path, options = {}, actionLabel = 'Requête') {
    const url = path.startsWith('http') ? path : `${this.apiBase}${path}`;
    const opts = { ...options };

    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...(opts.headers || {})
    };

    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }

    opts.headers = headers;
    opts.cache = 'no-store';

    try {
      const res = await fetch(url, opts);

      let resData = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        resData = await res.json().catch(() => null);
      } else {
        resData = await res.text().catch(() => null);
      }

      if (!res.ok) {
        const errorMsg = (resData && (resData.message || resData.error)) || `Erreur serveur HTTP ${res.status}`;
        if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
          window.showToast(`La requête n'est pas passée (${actionLabel}) : ${errorMsg}`, 'danger', 5500);
        }
        const err = new Error(errorMsg);
        err.status = res.status;
        err.data = resData;
        throw err;
      }

      // Notification de succès pour l'action effectuée
      if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast(`Requête réussie : ${actionLabel}`, 'success', 3500);
      }

      return resData;
    } catch (err) {
      // Erreur réseau ou coupure de liaison (la requête n'a pas pu aboutir au serveur)
      if (!err.status) {
        const netMsg = `La requête n'est pas passée (${actionLabel}) : impossible de contacter le serveur backend.`;
        if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
          window.showToast(netMsg, 'danger', 6000);
        }
      }
      throw err;
    }
  }

  // --- Synchronisation directe avec l'API SQLite ---
  async syncFromBackend(isInitial = false) {
    try {
      const liveData = await this.apiRequest('/api/data', { method: 'GET' }, 'Synchronisation des données');
      if (liveData) {
        this.data = {
          ...EMPTY_DATA,
          ...liveData
        };
        console.log('✅ Données chargées depuis SQLite direct (sans cache local) :', {
          clients: this.data.clients?.length || 0,
          abonnements: this.data.abonnements?.length || 0,
          comptes: this.data.comptes?.length || 0,
          profils: this.data.profils?.length || 0
        });
        return this.data;
      }
    } catch (e) {
      if (!isInitial) {
        console.warn('Backend non joignable :', e.message);
      }
      throw e;
    }
    return this.data;
  }

  // --- GESTION RELANCES & PAIEMENTS ---
  getRelanceConfig() {
    if (!this.data.relanceConfig) {
      this.data.relanceConfig = { ...EMPTY_DATA.relanceConfig };
    }
    return this.data.relanceConfig;
  }

  async updateRelanceConfig(cfg) {
    const updated = {
      ...this.getRelanceConfig(),
      ...cfg
    };

    await this.apiRequest('/api/settings/relance', {
      method: 'POST',
      body: updated
    }, 'Sauvegarde configuration relance');

    this.data.relanceConfig = updated;
    return this.data.relanceConfig;
  }

  // --- Authentification & Session (Connecté à l'API) ---
  getCurrentSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  async authenticate(email, password) {
    this.lastAuthError = null;
    try {
      const result = await this.apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
      }, 'Connexion');

      if (result && result.data && result.data.user) {
        const u = result.data.user;
        const session = {
          userId: u.id,
          email: u.email,
          name: u.name || u.username,
          role: u.role,
          roleLabel: u.roleLabel,
          paymentLink: u.paymentLink || u.payment_link || '',
          token: result.data.token,
          loginTime: new Date().toISOString()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        await this.syncFromBackend(true).catch(() => {});
        return session;
      } else {
        const msg = (result && (result.message || result.error)) || 'Identifiants incorrects.';
        this.lastAuthError = msg;
        throw new Error(msg);
      }
    } catch (e) {
      this.lastAuthError = e.message || 'La requête de connexion a échoué.';
      return null;
    }
  }

  clearSession() {
    const current = this.getCurrentSession();
    if (current) {
      this.logAction(current.name, 'DÉCONNEXION', `Déconnexion de ${current.name}`).catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
  }

  // =============================================================
  // CRUD : ABONNEMENTS (Synchronisé SQLite)
  // =============================================================
  async createAbonnement(subData) {
    const newSub = {
      id: 'ab-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      clientId: subData.clientId,
      profilId: subData.profilId,
      dateDebut: subData.dateDebut,
      dateFin: subData.dateFin,
      tarif: Number(subData.tarif) || 1500,
      statut: subData.statut || 'actif'
    };

    await this.apiRequest('/api/abonnements', {
      method: 'POST',
      body: newSub
    }, 'Création abonnement');

    this.data.abonnements.unshift(newSub);
    return newSub;
  }

  async updateAbonnement(id, updatedFields) {
    const idx = this.data.abonnements.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Abonnement introuvable');

    const updated = { ...this.data.abonnements[idx], ...updatedFields };

    await this.apiRequest(`/api/abonnements/${id}`, {
      method: 'PUT',
      body: updated
    }, 'Mise à jour abonnement');

    this.data.abonnements[idx] = updated;
    return updated;
  }

  async deleteAbonnement(id) {
    await this.apiRequest(`/api/abonnements/${id}`, {
      method: 'DELETE'
    }, 'Suppression abonnement');

    this.data.abonnements = this.data.abonnements.filter(s => s.id !== id);
    return true;
  }

  async renewSubscription(id) {
    const sub = this.data.abonnements.find(s => s.id === id);
    if (!sub) throw new Error('Abonnement introuvable');

    await this.apiRequest(`/api/abonnements/${id}/renew`, {
      method: 'POST'
    }, 'Renouvellement abonnement');

    const oldEnd = new Date(sub.dateFin);
    const newEnd = new Date(oldEnd);
    newEnd.setMonth(newEnd.getMonth() + 1);
    sub.dateFin = newEnd.toISOString().split('T')[0];
    sub.statut = 'actif';
    return sub;
  }

  // =============================================================
  // CRUD : CLIENTS (Synchronisé SQLite)
  // =============================================================
  async createClient(clientData) {
    const newClient = {
      id: 'cli-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      nom: clientData.nom.trim(),
      telephone: clientData.telephone.trim(),
      ancienId: clientData.ancienId ? clientData.ancienId.trim() : '',
      notes: clientData.notes ? clientData.notes.trim() : ''
    };

    await this.apiRequest('/api/clients', {
      method: 'POST',
      body: newClient
    }, `Ajout client (${newClient.nom})`);

    this.data.clients.unshift(newClient);
    return newClient;
  }

  async updateClient(id, updatedFields) {
    const idx = this.data.clients.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Client introuvable');

    const updated = { ...this.data.clients[idx], ...updatedFields };

    await this.apiRequest(`/api/clients/${id}`, {
      method: 'PUT',
      body: updated
    }, `Mise à jour client (${updated.nom})`);

    this.data.clients[idx] = updated;
    return updated;
  }

  async deleteClient(id) {
    const cli = this.data.clients.find(c => c.id === id);
    const nom = cli ? cli.nom : id;

    await this.apiRequest(`/api/clients/${id}`, {
      method: 'DELETE'
    }, `Suppression client (${nom})`);

    this.data.clients = this.data.clients.filter(c => c.id !== id);
    this.data.abonnements = this.data.abonnements.filter(s => s.clientId !== id);
    return true;
  }

  // =============================================================
  // CRUD : COMPTES NETFLIX (Synchronisé SQLite)
  // =============================================================
  async createCompte(compteData) {
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const newCompte = {
      id: compteData.id || ('cpt-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4)),
      libelle: (compteData.libelle || 'Compte Netflix').trim(),
      email: (compteData.email || '').trim(),
      motDePasse: compteData.motDePasse || '',
      dateOuverture: compteData.dateOuverture || today,
      dateReabonnement: compteData.dateReabonnement || nextMonth,
      coutRechargeMensuel: Number(compteData.coutRechargeMensuel) || 6500,
      capacitePlaces: Number(compteData.capacitePlaces) || 15,
      maxProfils: Number(compteData.maxProfils) || 5,
      statut: compteData.statut || 'actif',
      notes: compteData.notes ? compteData.notes.trim() : ''
    };

    await this.apiRequest('/api/comptes', {
      method: 'POST',
      body: newCompte
    }, `Création compte (${newCompte.libelle})`);

    this.data.comptes.unshift(newCompte);
    return newCompte;
  }

  async updateCompte(id, updatedFields) {
    const idx = this.data.comptes.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Compte introuvable');

    const updated = { ...this.data.comptes[idx], ...updatedFields };

    await this.apiRequest(`/api/comptes/${id}`, {
      method: 'PUT',
      body: updated
    }, `Mise à jour compte (${updated.libelle})`);

    this.data.comptes[idx] = updated;
    return updated;
  }

  async deleteCompte(id) {
    const cpt = this.data.comptes.find(c => c.id === id);
    const libelle = cpt ? cpt.libelle : id;

    await this.apiRequest(`/api/comptes/${id}`, {
      method: 'DELETE'
    }, `Suppression compte (${libelle})`);

    this.data.comptes = this.data.comptes.filter(c => c.id !== id);
    const profilsToDelete = this.data.profils.filter(p => p.compteId === id).map(p => p.id);
    this.data.profils = this.data.profils.filter(p => p.compteId !== id);
    this.data.abonnements = this.data.abonnements.filter(s => !profilsToDelete.includes(s.profilId));
    return true;
  }

  // =============================================================
  // CRUD : PROFILS (Synchronisé SQLite)
  // =============================================================
  async createProfil(profilData) {
    const newProfil = {
      id: 'prof-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      nom: profilData.nom.trim(),
      codePin: profilData.codePin ? String(profilData.codePin).trim() : this.generateSafePin(),
      statut: profilData.statut || 'ok',
      compteId: profilData.compteId
    };

    await this.apiRequest('/api/profils', {
      method: 'POST',
      body: newProfil
    }, `Création profil (${newProfil.nom})`);

    this.data.profils.push(newProfil);
    return newProfil;
  }

  async updateProfil(id, updatedFields) {
    const idx = this.data.profils.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Profil introuvable');

    const updated = { ...this.data.profils[idx], ...updatedFields };

    await this.apiRequest(`/api/profils/${id}`, {
      method: 'PUT',
      body: updated
    }, `Mise à jour profil (${updated.nom})`);

    this.data.profils[idx] = updated;
    return updated;
  }

  async deleteProfil(id) {
    const prof = this.data.profils.find(p => p.id === id);
    const nom = prof ? prof.nom : id;

    await this.apiRequest(`/api/profils/${id}`, {
      method: 'DELETE'
    }, `Suppression profil (${nom})`);

    this.data.profils = this.data.profils.filter(p => p.id !== id);
    this.data.abonnements = this.data.abonnements.filter(s => s.profilId !== id);
    return true;
  }

  // =============================================================
  // CAISSE & MOUVEMENTS (Synchronisé SQLite)
  // =============================================================
  async createMouvementCaisse(mvtData) {
    const newMvt = {
      id: 'mvt-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      type: mvtData.type,
      beneficiaire: (mvtData.beneficiaire || 'Associé').trim(),
      montant: Number(mvtData.montant),
      date: mvtData.date || new Date().toISOString().split('T')[0],
      motif: mvtData.motif ? mvtData.motif.trim() : ''
    };

    await this.apiRequest('/api/caisse/mouvements', {
      method: 'POST',
      body: newMvt
    }, `Enregistrement caisse (${newMvt.type} ${newMvt.montant} FCFA)`);

    this.data.mouvementsCaisse.unshift(newMvt);
    return newMvt;
  }

  async updateMouvementCaisse(id, mvtData) {
    const idx = this.data.mouvementsCaisse.findIndex(m => m.id === id);
    const payload = {
      ...mvtData,
      date: mvtData.date || (idx !== -1 ? this.data.mouvementsCaisse[idx].date : new Date().toISOString().split('T')[0])
    };

    await this.apiRequest(`/api/caisse/mouvements/${id}`, {
      method: 'PUT',
      body: payload
    }, 'Modification mouvement caisse');

    if (idx !== -1) {
      this.data.mouvementsCaisse[idx] = {
        ...this.data.mouvementsCaisse[idx],
        ...mvtData,
        montant: Number(mvtData.montant),
        date: payload.date
      };
    }
    return true;
  }

  async deleteMouvementCaisse(id) {
    await this.apiRequest(`/api/caisse/mouvements/${id}`, {
      method: 'DELETE'
    }, 'Suppression mouvement caisse');

    this.data.mouvementsCaisse = this.data.mouvementsCaisse.filter(m => m.id !== id);
    return true;
  }

  async updateCaissePointage(reel, notes = '') {
    const payload = {
      dernierPointageReel: Number(reel),
      dateDernierPointage: new Date().toISOString().split('T')[0],
      notes
    };

    await this.apiRequest('/api/caisse/pointage', {
      method: 'POST',
      body: payload
    }, 'Mise à jour pointage caisse');

    this.data.caisse.dernierPointageReel = payload.dernierPointageReel;
    this.data.caisse.dateDernierPointage = payload.dateDernierPointage;
    this.data.caisse.notes = notes;
    return this.data.caisse;
  }

  // =============================================================
  // MÉTRIQUES ET CALCULS EN TEMPS RÉEL SUR LA BASE
  // =============================================================
  getAbonnementStatus(abonnement, referenceDateStr = '2026-10-22') {
    const ref = new Date(referenceDateStr).getTime();
    const end = new Date(abonnement.dateFin).getTime();
    const diffDays = Math.ceil((end - ref) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { code: 'expire', label: 'Expiré (⚠️)', daysLeft: diffDays, badgeClass: 'badge-danger' };
    } else if (diffDays <= 7) {
      return { code: 'echeance_proche', label: `Échéance proche (${diffDays}j)`, daysLeft: diffDays, badgeClass: 'badge-warning' };
    }
    return { code: 'actif', label: 'Actif', daysLeft: diffDays, badgeClass: 'badge-success' };
  }

  getUrgentAbonnements(referenceDateStr = '2026-10-22') {
    return (this.data.abonnements || [])
      .map(ab => {
        const client = (this.data.clients || []).find(c => c.id === ab.clientId);
        const profil = (this.data.profils || []).find(p => p.id === ab.profilId);
        const compte = profil ? (this.data.comptes || []).find(c => c.id === profil.compteId) : null;
        const status = this.getAbonnementStatus(ab, referenceDateStr);
        return { ...ab, client, profil, compte, status };
      })
      .filter(item => item.client && item.profil && item.compte && (item.status.code === 'expire' || item.status.code === 'echeance_proche'))
      .sort((a, b) => a.status.daysLeft - b.status.daysLeft);
  }

  getProfilesWithCodeToRenew() {
    return (this.data.profils || [])
      .filter(p => p.statut === 'a_renouveler')
      .map(p => {
        const compte = (this.data.comptes || []).find(c => c.id === p.compteId);
        const ab = (this.data.abonnements || []).find(a => a.profilId === p.id);
        const client = ab ? (this.data.clients || []).find(c => c.id === ab.clientId) : null;
        return { ...p, compte, client, ab };
      });
  }

  getHistoriqueMensuel() {
    const caTotal = (this.data.abonnements || []).reduce((sum, a) => sum + (Number(a.tarif) || 0), 0);
    const rechargesTotal = (this.data.mouvementsCaisse || [])
      .filter(m => m.type === 'recharge')
      .reduce((sum, m) => sum + (Number(m.montant) || 0), 0);
    const benefice = Math.max(0, caTotal - rechargesTotal);
    const margePct = caTotal > 0 ? Math.round((benefice / caTotal) * 100) : 0;

    if (this.data.historiqueMensuel && this.data.historiqueMensuel.length > 0) {
      return this.data.historiqueMensuel.map(m => ({
        ...m,
        margePct: m.ca > 0 ? Math.round(((m.benefice || 0) / m.ca) * 100) : 0
      }));
    }

    const now = new Date();
    const moisId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const moisLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return [{
      id: moisId,
      label: moisLabel.charAt(0).toUpperCase() + moisLabel.slice(1),
      ca: caTotal,
      recharge: rechargesTotal,
      benefice,
      margePct
    }];
  }

  getKPIs() {
    const totalAbonnementsActifs = (this.data.abonnements || []).filter(a => {
      const s = this.getAbonnementStatus(a);
      return s.code === 'actif' || s.code === 'echeance_proche';
    }).length;

    const totalClients = (this.data.clients || []).length;
    const totalComptes = (this.data.comptes || []).length;
    const placesMax = (this.data.comptes || []).reduce((sum, c) => sum + (c.capacitePlaces || c.capacite || 15), 0);
    const tauxRemplissage = placesMax > 0 ? Math.round((totalAbonnementsActifs / placesMax) * 100) : 0;
    const placesLibres = Math.max(0, placesMax - totalAbonnementsActifs);

    const caTotal = (this.data.abonnements || []).reduce((sum, a) => sum + (Number(a.tarif) || 0), 0);
    const rechargesTotal = (this.data.mouvementsCaisse || [])
      .filter(m => m.type === 'recharge')
      .reduce((sum, m) => sum + (Number(m.montant) || 0), 0);
    const prelevementsTotal = (this.data.mouvementsCaisse || [])
      .filter(m => m.type === 'prelevement')
      .reduce((sum, m) => sum + (Number(m.montant) || 0), 0);

    const caisseTheorique = caTotal - rechargesTotal - prelevementsTotal;
    const caisseReelle = (this.data.caisse && this.data.caisse.dernierPointageReel) || 0;
    const ecartCaisse = caisseReelle - caisseTheorique;
    const beneficeMois = Math.max(0, caTotal - rechargesTotal);
    const margePctMois = caTotal > 0 ? Math.round((beneficeMois / caTotal) * 100) : 0;

    return {
      caMois: caTotal,
      beneficeMois,
      margePctMois,
      tauxOccupationGlobal: tauxRemplissage,
      totalAbonnements: totalAbonnementsActifs,
      capaciteTotale: placesMax,
      placesLibres,
      totalAbonnementsActifs,
      totalClients,
      totalComptes,
      placesMax,
      tauxRemplissage,
      caTotal,
      rechargesTotal,
      prelevementsTotal,
      caisseTheorique,
      caisseReelle,
      ecartCaisse,
      urgentsCount: this.getUrgentAbonnements().length,
      codesCount: this.getProfilesWithCodeToRenew().length
    };
  }

  generateSafePin() {
    let pin = '';
    do {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
    } while (
      pin === '1234' || pin === '0000' || pin === '1111' || pin === '2222' ||
      pin[0] === pin[1] && pin[1] === pin[2]
    );
    return pin;
  }

  async logAction(userName, action, detail) {
    const newLog = {
      id: 'log-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      userName: userName || 'Système',
      action,
      detail
    };
    this.data.auditLogs.unshift(newLog);

    try {
      await this.apiRequest('/api/audit', {
        method: 'POST',
        body: newLog
      }, 'Journalisation audit');
    } catch (e) {
      // Échec silencieux pour l'audit pour ne pas bloquer l'utilisateur
    }
    return newLog;
  }
}

// Instance singleton
const store = new DataStore();
window.HorizonStore = store;
