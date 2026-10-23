/**
 * HORIZON SERVICE — STORE ET MODÈLE DE DONNÉES DYNAMIQUE
 * Connecté directement au Backend SQLite (horizon.db) via NestJS API
 * - 2 Utilisateurs réels authentifiés par JWT : Emmanuel (Fondateur) & Malan Abdias (Associé)
 * - Base SQLite dynamique sans données fictives en dur
 * - Synchronisation en temps réel avec l'API
 */

const API_BASE = (typeof window !== 'undefined' && window.HORIZON_CONFIG && window.HORIZON_CONFIG.API_URL)
  ? window.HORIZON_CONFIG.API_URL
  : 'https://horizon-service.onrender.com';
const STORAGE_KEY = 'horizon_service_sqlite_cache_v2';
const SESSION_KEY = 'horizon_service_session_v2';

const EMPTY_DATA = {
  version: '2.0',
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
    this.data = this.loadLocalCache();
    this.syncFromBackend();
  }

  loadLocalCache() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Erreur lecture cache local', e);
    }
    return JSON.parse(JSON.stringify(EMPTY_DATA));
  }

  saveLocalCache() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Erreur sauvegarde cache local', e);
    }
  }

  save(dataToSave = this.data) {
    this.data = dataToSave;
    this.saveLocalCache();
  }

  // --- Synchronisation directe avec l'API SQLite ---
  async syncFromBackend() {
    try {
      const res = await fetch(`${API_BASE}/api/data`);
      if (res.ok) {
        const liveData = await res.json();
        this.data = {
          ...EMPTY_DATA,
          ...liveData
        };
        this.saveLocalCache();
        console.log('✅ Synchronisé avec la base SQLite :', {
          clients: this.data.clients.length,
          abonnements: this.data.abonnements.length,
          comptes: this.data.comptes.length,
          profils: this.data.profils.length
        });
        return this.data;
      }
    } catch (e) {
      console.warn('Backend non joignable, utilisation du cache local:', e.message);
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
    this.data.relanceConfig = {
      ...this.getRelanceConfig(),
      ...cfg
    };
    this.saveLocalCache();
    try {
      await fetch(`${API_BASE}/api/settings/relance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data.relanceConfig)
      });
    } catch (e) {
      console.error('Erreur synchro relanceConfig', e);
    }
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
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result.data && result.data.user) {
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
        await this.syncFromBackend();
        return session;
      } else {
        this.lastAuthError = (result && (result.message || result.error)) || 'Identifiants incorrects. Veuillez vérifier votre adresse e-mail ou mot de passe.';
      }
    } catch (e) {
      console.error('Erreur authentification backend:', e);
      this.lastAuthError = `Impossible de joindre le serveur backend (${API_BASE}). Vérifiez qu'il est en cours d'exécution.`;
    }
    return null;
  }

  clearSession() {
    const current = this.getCurrentSession();
    if (current) {
      this.logAction(current.name, 'DÉCONNEXION', `Déconnexion de ${current.name}`);
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

    this.data.abonnements.unshift(newSub);
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/abonnements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      });
    } catch (e) {
      console.error('Erreur synchro createAbonnement', e);
    }

    return newSub;
  }

  async updateAbonnement(id, updatedFields) {
    const idx = this.data.abonnements.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.abonnements[idx] = { ...this.data.abonnements[idx], ...updatedFields };
      this.saveLocalCache();

      try {
        await fetch(`${API_BASE}/api/abonnements/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data.abonnements[idx])
        });
      } catch (e) {
        console.error('Erreur synchro updateAbonnement', e);
      }
      return this.data.abonnements[idx];
    }
    return null;
  }

  async deleteAbonnement(id) {
    this.data.abonnements = this.data.abonnements.filter(s => s.id !== id);
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/abonnements/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Erreur synchro deleteAbonnement', e);
    }
    return true;
  }

  async renewSubscription(id) {
    const sub = this.data.abonnements.find(s => s.id === id);
    if (!sub) return null;

    const oldEnd = new Date(sub.dateFin);
    const newEnd = new Date(oldEnd);
    newEnd.setMonth(newEnd.getMonth() + 1);
    sub.dateFin = newEnd.toISOString().split('T')[0];
    sub.statut = 'actif';
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/abonnements/${id}/renew`, { method: 'POST' });
    } catch (e) {
      console.error('Erreur synchro renewSubscription', e);
    }
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

    this.data.clients.unshift(newClient);
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
    } catch (e) {
      console.error('Erreur synchro createClient', e);
    }
    return newClient;
  }

  async updateClient(id, updatedFields) {
    const idx = this.data.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clients[idx] = { ...this.data.clients[idx], ...updatedFields };
      this.saveLocalCache();

      try {
        await fetch(`${API_BASE}/api/clients/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data.clients[idx])
        });
      } catch (e) {
        console.error('Erreur synchro updateClient', e);
      }
      return this.data.clients[idx];
    }
    return null;
  }

  async deleteClient(id) {
    this.data.clients = this.data.clients.filter(c => c.id !== id);
    this.data.abonnements = this.data.abonnements.filter(s => s.clientId !== id);
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/clients/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Erreur synchro deleteClient', e);
    }
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

    this.data.comptes.unshift(newCompte);
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/comptes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCompte)
      });
    } catch (e) {
      console.error('Erreur synchro createCompte', e);
    }
    return newCompte;
  }

  async updateCompte(id, updatedFields) {
    const idx = this.data.comptes.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.comptes[idx] = { ...this.data.comptes[idx], ...updatedFields };
      this.saveLocalCache();

      try {
        await fetch(`${API_BASE}/api/comptes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data.comptes[idx])
        });
      } catch (e) {
        console.error('Erreur synchro updateCompte', e);
      }
      return this.data.comptes[idx];
    }
    return null;
  }

  async deleteCompte(id) {
    this.data.comptes = this.data.comptes.filter(c => c.id !== id);
    const profilsToDelete = this.data.profils.filter(p => p.compteId === id).map(p => p.id);
    this.data.profils = this.data.profils.filter(p => p.compteId !== id);
    this.data.abonnements = this.data.abonnements.filter(s => !profilsToDelete.includes(s.profilId));
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/comptes/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Erreur synchro deleteCompte', e);
    }
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

    this.data.profils.push(newProfil);
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/profils`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfil)
      });
    } catch (e) {
      console.error('Erreur synchro createProfil', e);
    }
    return newProfil;
  }

  async updateProfil(id, updatedFields) {
    const idx = this.data.profils.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.profils[idx] = { ...this.data.profils[idx], ...updatedFields };
      this.saveLocalCache();

      try {
        await fetch(`${API_BASE}/api/profils/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data.profils[idx])
        });
      } catch (e) {
        console.error('Erreur synchro updateProfil', e);
      }
      return this.data.profils[idx];
    }
    return null;
  }

  async deleteProfil(id) {
    this.data.profils = this.data.profils.filter(p => p.id !== id);
    this.data.abonnements = this.data.abonnements.filter(s => s.profilId !== id);
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/profils/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Erreur synchro deleteProfil', e);
    }
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

    this.data.mouvementsCaisse.unshift(newMvt);
    this.saveLocalCache();

    try {
      const res = await fetch(`${API_BASE}/api/caisse/mouvements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMvt)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('Erreur synchro createMouvement', e);
      throw e;
    }
    return newMvt;
  }

  async updateMouvementCaisse(id, mvtData) {
    const idx = this.data.mouvementsCaisse.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.data.mouvementsCaisse[idx] = {
        ...this.data.mouvementsCaisse[idx],
        ...mvtData,
        montant: Number(mvtData.montant),
        date: mvtData.date || this.data.mouvementsCaisse[idx].date || new Date().toISOString().split('T')[0]
      };
      this.saveLocalCache();
    }

    try {
      const res = await fetch(`${API_BASE}/api/caisse/mouvements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mvtData,
          date: mvtData.date || (idx !== -1 ? this.data.mouvementsCaisse[idx].date : new Date().toISOString().split('T')[0])
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('Erreur synchro updateMouvement', e);
      throw e;
    }
    return true;
  }

  async deleteMouvementCaisse(id) {
    this.data.mouvementsCaisse = this.data.mouvementsCaisse.filter(m => m.id !== id);
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/caisse/mouvements/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Erreur synchro deleteMouvement', e);
    }
    return true;
  }

  async updateCaissePointage(reel, notes = '') {
    this.data.caisse.dernierPointageReel = Number(reel);
    this.data.caisse.dateDernierPointage = new Date().toISOString().split('T')[0];
    this.data.caisse.notes = notes;
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/caisse/pointage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data.caisse)
      });
    } catch (e) {
      console.error('Erreur synchro pointage', e);
    }
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
    return this.data.abonnements
      .map(ab => {
        const client = this.data.clients.find(c => c.id === ab.clientId);
        const profil = this.data.profils.find(p => p.id === ab.profilId);
        const compte = profil ? this.data.comptes.find(c => c.id === profil.compteId) : null;
        const status = this.getAbonnementStatus(ab, referenceDateStr);
        return { ...ab, client, profil, compte, status };
      })
      .filter(item => item.client && item.profil && item.compte && (item.status.code === 'expire' || item.status.code === 'echeance_proche'))
      .sort((a, b) => a.status.daysLeft - b.status.daysLeft);
  }

  getProfilesWithCodeToRenew() {
    return this.data.profils
      .filter(p => p.statut === 'a_renouveler')
      .map(p => {
        const compte = this.data.comptes.find(c => c.id === p.compteId);
        const ab = this.data.abonnements.find(a => a.profilId === p.id);
        const client = ab ? this.data.clients.find(c => c.id === ab.clientId) : null;
        return { ...p, compte, client, ab };
      });
  }

  getHistoriqueMensuel() {
    // Calcul réel depuis la BDD uniquement — aucune donnée fictive
    const caTotal = (this.data.abonnements || []).reduce((sum, a) => sum + (Number(a.tarif) || 0), 0);
    const rechargesTotal = (this.data.mouvementsCaisse || [])
      .filter(m => m.type === 'recharge')
      .reduce((sum, m) => sum + (Number(m.montant) || 0), 0);
    const benefice = Math.max(0, caTotal - rechargesTotal);
    const margePct = caTotal > 0 ? Math.round((benefice / caTotal) * 100) : 0;

    // Si l'API fournit un historique mensuel, on le retourne directement
    if (this.data.historiqueMensuel && this.data.historiqueMensuel.length > 0) {
      return this.data.historiqueMensuel.map(m => ({
        ...m,
        margePct: m.ca > 0 ? Math.round(((m.benefice || 0) / m.ca) * 100) : 0
      }));
    }

    // Sinon : uniquement le mois en cours, calculé depuis la BDD
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
      // Propriétés requises pour l'affichage Dashboard
      caMois: caTotal,
      beneficeMois,
      margePctMois,
      tauxOccupationGlobal: tauxRemplissage,
      totalAbonnements: totalAbonnementsActifs,
      capaciteTotale: placesMax,
      placesLibres,

      // Statistiques globales
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
    this.saveLocalCache();

    try {
      await fetch(`${API_BASE}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
    } catch (e) {}
    return newLog;
  }
}

// Instance singleton
const store = new DataStore();
window.HorizonStore = store;
