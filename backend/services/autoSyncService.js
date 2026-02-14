/**
 * Service de synchronisation automatique Google Sheets
 * Synchronise toutes les 10 secondes en arrière-plan.
 * - Hash-based delta detection (ne refetch que si les données ont changé)
 * - Aucune duplication (upsert par sheetRowId)
 * - Erreurs silencieuses (log uniquement, jamais de crash)
 * - lastSyncedAt tracking par workspace
 */

import crypto from 'crypto';
import Order from '../ecom/models/Order.js';
import WorkspaceSettings from '../ecom/models/WorkspaceSettings.js';
import { fetchSheetData, autoDetectColumns, parseOrderRow } from '../ecom/services/googleSheetsImport.js';

const SYNC_INTERVAL_MS = 10_000; // 10 secondes
const CONFIG_RELOAD_MS = 60_000; // Recharger les configs toutes les 60s

class AutoSyncService {
  constructor() {
    this.isRunning = false;
    this._syncTimer = null;
    this._configTimer = null;
    this._syncing = false; // guard contre les exécutions concurrentes
    this.lastSyncHashes = new Map(); // workspace_source -> md5 hash
    this._workspaceConfigs = []; // cache des settings
  }

  /**
   * Démarre le service de synchronisation automatique (10s interval)
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('🚀 [AutoSync] Service démarré (intervalle: 10s)');
    console.log(`📊 [AutoSync] SYNC_INTERVAL_MS = ${SYNC_INTERVAL_MS}ms, CONFIG_RELOAD_MS = ${CONFIG_RELOAD_MS}ms`);

    // Charger les configs immédiatement
    console.log('🔍 [AutoSync] Chargement initial des configurations...');
    await this._loadConfigs();
    console.log(`✅ [AutoSync] ${this._workspaceConfigs.length} workspace(s) configuré(s) pour la sync`);

    // Timer principal : sync toutes les 10s
    console.log('⏰ [AutoSync] Démarrage du timer principal de synchronisation...');
    this._syncTimer = setInterval(() => {
      console.log('🔄 [AutoSync] Cycle de synchronisation lancé...');
      this._runSyncCycle().catch(err => {
        console.error('❌ [AutoSync] Erreur cycle sync:', err.message);
      });
    }, SYNC_INTERVAL_MS);

    // Timer secondaire : recharger les configs toutes les 60s
    console.log('⏰ [AutoSync] Démarrage du timer de rechargement des configs...');
    this._configTimer = setInterval(() => {
      console.log('🔄 [AutoSync] Rechargement des configurations...');
      this._loadConfigs().catch(() => {});
    }, CONFIG_RELOAD_MS);
    
    console.log('✅ [AutoSync] Service entièrement démarré et opérationnel');
  }

  /**
   * Arrête le service proprement
   */
  stop() {
    if (!this.isRunning) return;
    if (this._syncTimer) clearInterval(this._syncTimer);
    if (this._configTimer) clearInterval(this._configTimer);
    this._syncTimer = null;
    this._configTimer = null;
    this.lastSyncHashes.clear();
    this._workspaceConfigs = [];
    this.isRunning = false;
    console.log('[AutoSync] Service arrêté');
  }

  // ─── Internal: charger toutes les configs workspace ──────────────────────
  async _loadConfigs() {
    try {
      const configs = await WorkspaceSettings.find({
        $or: [
          { 'googleSheets.spreadsheetId': { $exists: true, $ne: '' } },
          { 'sources.0': { $exists: true } }
        ]
      }).lean();
      this._workspaceConfigs = configs;
      console.log(`📋 [AutoSync] ${configs.length} workspace(s) trouvé(s) avec Google Sheets`);
      configs.forEach((ws, idx) => {
        const sourcesCount = (ws.sources?.filter(s => s.isActive) || []).length + (ws.googleSheets?.spreadsheetId ? 1 : 0);
        console.log(`   ${idx + 1}. Workspace ${ws.workspaceId} - ${sourcesCount} source(s) active(s)`);
      });
    } catch (err) {
      console.error('❌ [AutoSync] Erreur chargement configs:', err.message);
      // Silencieux — on garde l'ancien cache
    }
  }

  // ─── Internal: cycle de sync principal ───────────────────────────────────
  async _runSyncCycle() {
    // Guard: ne pas lancer un cycle si le précédent tourne encore
    if (this._syncing) {
      console.log('⏸️ [AutoSync] Cycle déjà en cours, ignoré');
      return;
    }
    this._syncing = true;

    try {
      console.log(`🔄 [AutoSync] Début cycle de sync pour ${this._workspaceConfigs.length} workspace(s)`);
      const startTime = Date.now();
      
      for (const settings of this._workspaceConfigs) {
        // Vérifier si auto-sync activé pour ce workspace
        if (settings.autoSync?.enabled === false) {
          console.log(`⏸️ [AutoSync] Auto-sync désactivé pour workspace ${settings.workspaceId}`);
          continue;
        }

        const workspaceId = settings.workspaceId.toString();
        console.log(`🔄 [AutoSync] Traitement workspace ${workspaceId}...`);

        try {
          await this._syncWorkspace(workspaceId, settings);
        } catch (err) {
          // Erreur silencieuse par workspace — on continue les autres
          console.error(`❌ [AutoSync] Erreur workspace ${workspaceId}:`, err.message);
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ [AutoSync] Cycle terminé en ${duration}ms`);
    } finally {
      this._syncing = false;
    }
  }

  // ─── Internal: sync un workspace ─────────────────────────────────────────
  async _syncWorkspace(workspaceId, settings) {
    let totalImported = 0;
    let totalUpdated = 0;

    // Source legacy
    if (settings.googleSheets?.spreadsheetId) {
      const result = await this._syncSource(workspaceId, {
        _id: 'legacy',
        name: 'Commandes Zendo',
        spreadsheetId: settings.googleSheets.spreadsheetId,
        sheetName: settings.googleSheets.sheetName || 'Sheet1'
      });
      totalImported += result.imported;
      totalUpdated += result.updated;
    }

    // Sources custom
    for (const source of settings.sources || []) {
      if (!source.isActive) continue;
      const result = await this._syncSource(workspaceId, source);
      totalImported += result.imported;
      totalUpdated += result.updated;
    }

    // Mettre à jour lastSyncedAt si des changements
    if (totalImported > 0 || totalUpdated > 0) {
      console.log(`📈 [AutoSync] ${workspaceId}: +${totalImported} nouvelles, ${totalUpdated} mises à jour`);
      try {
        await WorkspaceSettings.updateOne(
          { workspaceId },
          { $set: { 'autoSync.lastRunAt': new Date() } }
        );
      } catch (_) { /* silencieux */ }
    } else {
      console.log(`📭 [AutoSync] ${workspaceId}: Aucun changement détecté`);
    }
  }

  // ─── Internal: sync une source ───────────────────────────────────────────
  async _syncSource(workspaceId, source) {
    const sourceKey = `${workspaceId}_${source._id}`;

    try {
      // 1) Fetch les données du sheet
      const sheetData = await fetchSheetData(source.spreadsheetId, source.sheetName);
      const { headers, rows, dataStartIndex } = sheetData;

      if (!rows || rows.length <= dataStartIndex) {
        console.log(`📭 [AutoSync] Source "${source.name}": Sheet vide ou sans données`);
        return { imported: 0, updated: 0 };
      }

      // 2) Hash delta — skip si rien n'a changé
      const dataRows = rows.slice(dataStartIndex);
      const dataHash = this._hash(dataRows);
      if (this.lastSyncHashes.get(sourceKey) === dataHash) {
        console.log(`⏭️ [AutoSync] Source "${source.name}": Données inchangées, sync ignorée`);
        return { imported: 0, updated: 0 };
      }

      console.log(`📊 [AutoSync] Source "${source.name}": Changements détectés, début sync...`);

      // 3) Détecter les colonnes
      const columnMap = autoDetectColumns(headers);

      // 4) Charger les commandes existantes (pour respecter statusModifiedManually)
      const existingOrders = await Order.find(
        { workspaceId, sheetRowId: { $regex: `^source_${source._id}_` } },
        { sheetRowId: 1, statusModifiedManually: 1 }
      ).lean();
      const manualSet = new Set(
        existingOrders.filter(o => o.statusModifiedManually).map(o => o.sheetRowId)
      );

      // 5) Construire les opérations bulk
      const bulkOps = [];
      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row.c || row.c.every(cell => !cell || !cell.v)) continue;

        const parsed = parseOrderRow(row, i + 1, columnMap, headers, source.name);
        if (!parsed.success) continue;

        const doc = parsed.data;
        const sheetRowId = `source_${source._id}_row_${i + 1}`;

        // Ne pas écraser le statut modifié manuellement
        if (manualSet.has(sheetRowId)) {
          delete doc.status;
        }

        bulkOps.push({
          updateOne: {
            filter: { workspaceId, sheetRowId },
            update: {
              $set: {
                ...doc,
                workspaceId,
                sheetRowId,
                source: 'google_sheets'
              }
            },
            upsert: true
          }
        });
      }

      // 6) Exécuter en batch
      let imported = 0;
      let updated = 0;

      if (bulkOps.length > 0) {
        const BATCH = 500;
        for (let b = 0; b < bulkOps.length; b += BATCH) {
          const result = await Order.bulkWrite(bulkOps.slice(b, b + BATCH));
          imported += result.upsertedCount || 0;
          updated += result.modifiedCount || 0;
        }
      }

      // 7) Mettre à jour le hash seulement après succès
      this.lastSyncHashes.set(sourceKey, dataHash);

      // 8) Mettre à jour lastSyncAt sur la source
      if (imported > 0 || updated > 0) {
        console.log(`✅ [AutoSync] Source "${source.name}": ${imported} nouvelles, ${updated} mises à jour`);
        try {
          if (source._id === 'legacy') {
            await WorkspaceSettings.updateOne(
              { workspaceId },
              { $set: { 'googleSheets.lastSyncAt': new Date() } }
            );
          } else {
            await WorkspaceSettings.updateOne(
              { workspaceId, 'sources._id': source._id },
              { $set: { 'sources.$.lastSyncAt': new Date() } }
            );
          }
        } catch (_) { /* silencieux */ }
      }

      return { imported, updated };

    } catch (err) {
      // Erreur silencieuse — on ne bloque rien
      console.error(`❌ [AutoSync] Erreur source "${source.name}":`, err.message);
      return { imported: 0, updated: 0 };
    }
  }

  // ─── Utilitaire: hash MD5 des données pour delta detection ───────────────
  _hash(rows) {
    const str = JSON.stringify(rows.map(r => r.c ? r.c.map(c => c?.v || '') : []));
    return crypto.createHash('md5').update(str).digest('hex');
  }

  // ─── API publique: toggle auto-sync ──────────────────────────────────────
  async toggleAutoSync(workspaceId, enabled, interval = '5min') {
    try {
      await WorkspaceSettings.updateOne(
        { workspaceId },
        {
          $set: {
            'autoSync.enabled': enabled,
            'autoSync.interval': interval,
            'autoSync.updatedAt': new Date()
          }
        },
        { upsert: true }
      );
      // Recharger les configs pour prendre en compte le changement
      await this._loadConfigs();
      return true;
    } catch (err) {
      console.error('[AutoSync] Erreur toggle:', err.message);
      return false;
    }
  }

  // ─── API publique: statut ────────────────────────────────────────────────
  async getAutoSyncStatus(workspaceId) {
    try {
      const settings = await WorkspaceSettings.findOne({ workspaceId }).lean();
      return {
        enabled: settings?.autoSync?.enabled !== false,
        interval: '10s',
        isRunning: this.isRunning,
        lastRunAt: settings?.autoSync?.lastRunAt || null,
        lastUpdate: settings?.autoSync?.updatedAt,
        sourcesCount: (settings?.sources?.filter(s => s.isActive) || []).length +
                     (settings?.googleSheets?.spreadsheetId ? 1 : 0)
      };
    } catch (err) {
      return { enabled: false, isRunning: false };
    }
  }

  // ─── API publique: forcer une sync immédiate ─────────────────────────────
  async syncWorkspace(workspaceId) {
    try {
      const settings = await WorkspaceSettings.findOne({ workspaceId }).lean();
      if (settings) {
        await this._syncWorkspace(workspaceId, settings);
      }
    } catch (err) {
      console.error(`[AutoSync] Erreur sync forcée ${workspaceId}:`, err.message);
    }
  }
}

// Instance singleton
const autoSyncService = new AutoSyncService();

export default autoSyncService;
