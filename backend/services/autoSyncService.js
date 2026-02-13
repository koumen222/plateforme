/**
 * Service de synchronisation automatique Google Sheets
 * Surveille et synchronise automatiquement les modifications des Google Sheets
 */

import cron from 'node-cron';
import Order from '../ecom/models/Order.js';
import WorkspaceSettings from '../ecom/models/WorkspaceSettings.js';
import { fetchSheetData, autoDetectColumns, parseOrderRow } from '../ecom/services/googleSheetsImport.js';
import { sendPushNotification } from './pushService.js';

class AutoSyncService {
  constructor() {
    this.isRunning = false;
    this.syncJobs = new Map(); // workspace -> cron job
    this.lastSyncHashes = new Map(); // workspace_source -> hash
    this.syncIntervals = {
      '1min': '*/1 * * * *',
      '5min': '*/5 * * * *', 
      '15min': '*/15 * * * *',
      '30min': '*/30 * * * *',
      '1hour': '0 * * * *'
    };
  }

  /**
   * Démarre le service de synchronisation automatique
   */
  async start() {
    if (this.isRunning) {
      console.log('🔄 AutoSyncService déjà en cours d\'exécution');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Démarrage du service de synchronisation automatique');

    // Charger toutes les configurations de workspace
    await this.loadAllWorkspaceConfigs();

    // Démarrer la surveillance des configurations (toutes les 5 minutes)
    cron.schedule('*/5 * * * *', () => {
      this.loadAllWorkspaceConfigs().catch(console.error);
    });

    console.log('✅ AutoSyncService démarré avec succès');
  }

  /**
   * Arrête le service de synchronisation automatique
   */
  stop() {
    if (!this.isRunning) return;

    console.log('🛑 Arrêt du service de synchronisation automatique');
    
    // Arrêter tous les jobs cron
    for (const [workspaceId, job] of this.syncJobs) {
      job.destroy();
      console.log(`🛑 Job de sync arrêté pour workspace: ${workspaceId}`);
    }
    
    this.syncJobs.clear();
    this.lastSyncHashes.clear();
    this.isRunning = false;
    
    console.log('✅ AutoSyncService arrêté');
  }

  /**
   * Charge les configurations de tous les workspaces
   */
  async loadAllWorkspaceConfigs() {
    try {
      const allSettings = await WorkspaceSettings.find({
        $or: [
          { 'googleSheets.spreadsheetId': { $exists: true, $ne: '' } },
          { 'sources.0': { $exists: true } }
        ]
      });

      console.log(`🔍 ${allSettings.length} workspaces avec Google Sheets trouvés`);

      for (const settings of allSettings) {
        await this.setupWorkspaceSync(settings);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des configurations:', error);
    }
  }

  /**
   * Configure la synchronisation pour un workspace
   */
  async setupWorkspaceSync(settings) {
    const workspaceId = settings.workspaceId.toString();
    
    // Arrêter le job existant s'il y en a un
    if (this.syncJobs.has(workspaceId)) {
      this.syncJobs.get(workspaceId).destroy();
    }

    // Vérifier si l'auto-sync est activé
    const autoSyncEnabled = settings.autoSync?.enabled !== false; // Par défaut activé
    const syncInterval = settings.autoSync?.interval || '5min';

    if (!autoSyncEnabled) {
      console.log(`⏸️ Auto-sync désactivé pour workspace: ${workspaceId}`);
      return;
    }

    const cronPattern = this.syncIntervals[syncInterval] || this.syncIntervals['5min'];
    
    // Créer le job cron
    const job = cron.schedule(cronPattern, async () => {
      await this.syncWorkspace(workspaceId);
    }, {
      scheduled: true,
      timezone: 'Europe/Paris'
    });

    this.syncJobs.set(workspaceId, job);
    console.log(`⏰ Auto-sync configuré pour workspace ${workspaceId} (${syncInterval})`);
  }

  /**
   * Synchronise un workspace spécifique
   */
  async syncWorkspace(workspaceId) {
    try {
      console.log(`🔄 [AutoSync] Début sync workspace: ${workspaceId}`);
      
      const settings = await WorkspaceSettings.findOne({ workspaceId });
      if (!settings) {
        console.log(`⚠️ [AutoSync] Settings non trouvés pour workspace: ${workspaceId}`);
        return;
      }

      let syncCount = 0;
      let totalImported = 0;
      let totalUpdated = 0;

      // Synchroniser la source legacy si configurée
      if (settings.googleSheets?.spreadsheetId) {
        const result = await this.syncSource(workspaceId, {
          _id: 'legacy',
          name: 'Commandes Zendo',
          spreadsheetId: settings.googleSheets.spreadsheetId,
          sheetName: settings.googleSheets.sheetName || 'Sheet1'
        });
        
        if (result.hasChanges) {
          syncCount++;
          totalImported += result.imported;
          totalUpdated += result.updated;
        }
      }

      // Synchroniser toutes les sources actives
      for (const source of settings.sources || []) {
        if (!source.isActive) continue;

        const result = await this.syncSource(workspaceId, source);
        if (result.hasChanges) {
          syncCount++;
          totalImported += result.imported;
          totalUpdated += result.updated;
        }
      }

      // Envoyer notification si des changements ont été détectés
      if (syncCount > 0) {
        console.log(`✅ [AutoSync] ${syncCount} sources synchronisées: ${totalImported} nouvelles, ${totalUpdated} mises à jour`);
        
        try {
          await sendPushNotification(workspaceId, {
            title: '🔄 Synchronisation automatique',
            body: `${totalImported} nouvelles commandes, ${totalUpdated} mises à jour`,
            tag: 'auto-sync',
            data: {
              type: 'auto-sync',
              imported: totalImported,
              updated: totalUpdated,
              sources: syncCount
            }
          });
        } catch (pushError) {
          console.error('❌ [AutoSync] Erreur notification push:', pushError);
        }
      }

    } catch (error) {
      console.error(`❌ [AutoSync] Erreur sync workspace ${workspaceId}:`, error);
    }
  }

  /**
   * Synchronise une source spécifique
   */
  async syncSource(workspaceId, source) {
    const sourceKey = `${workspaceId}_${source._id}`;
    
    try {
      // Récupérer les données du sheet
      const sheetData = await fetchSheetData(source.spreadsheetId, source.sheetName);
      const { headers, rows, dataStartIndex } = sheetData;

      if (!rows || rows.length <= dataStartIndex) {
        return { hasChanges: false, imported: 0, updated: 0 };
      }

      // Calculer un hash des données pour détecter les changements
      const dataHash = this.calculateDataHash(rows.slice(dataStartIndex));
      const lastHash = this.lastSyncHashes.get(sourceKey);

      if (lastHash === dataHash) {
        // Aucun changement détecté
        return { hasChanges: false, imported: 0, updated: 0 };
      }

      console.log(`📊 [AutoSync] Changements détectés dans ${source.name}`);

      // Détecter les colonnes
      const columnMap = autoDetectColumns(headers);
      
      // Traiter les lignes
      const bulkOps = [];
      const existingOrders = await Order.find(
        { 
          workspaceId, 
          $or: [
            { sheetRowId: { $regex: `^source_${source._id}_` } },
            { tags: source.name }
          ]
        },
        { sheetRowId: 1, orderId: 1, statusModifiedManually: 1 }
      ).lean();

      const existingByRowId = new Map(existingOrders.map(o => [o.sheetRowId, o]));

      for (let i = dataStartIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row.c || row.c.every(cell => !cell || !cell.v)) continue;

        const parsed = parseOrderRow(row, i + 1, columnMap, headers, source.name);
        if (!parsed.success) continue;

        const doc = parsed.data;
        const sheetRowId = `source_${source._id}_row_${i + 1}`;
        
        // Vérifier si la commande existe et si le statut a été modifié manuellement
        const existingOrder = existingByRowId.get(sheetRowId);
        if (existingOrder?.statusModifiedManually) {
          delete doc.status; // Ne pas écraser le statut modifié manuellement
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

      // Exécuter les opérations en lot
      let imported = 0;
      let updated = 0;

      if (bulkOps.length > 0) {
        const result = await Order.bulkWrite(bulkOps);
        imported = result.upsertedCount || 0;
        updated = result.modifiedCount || 0;
      }

      // Mettre à jour le hash
      this.lastSyncHashes.set(sourceKey, dataHash);

      return { hasChanges: true, imported, updated };

    } catch (error) {
      console.error(`❌ [AutoSync] Erreur sync source ${source.name}:`, error);
      return { hasChanges: false, imported: 0, updated: 0 };
    }
  }

  /**
   * Calcule un hash des données pour détecter les changements
   */
  calculateDataHash(rows) {
    const crypto = require('crypto');
    const dataString = JSON.stringify(rows.map(row => 
      row.c ? row.c.map(cell => cell?.v || '') : []
    ));
    return crypto.createHash('md5').update(dataString).digest('hex');
  }

  /**
   * Active/désactive l'auto-sync pour un workspace
   */
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

      if (enabled) {
        // Recharger la configuration pour ce workspace
        const settings = await WorkspaceSettings.findOne({ workspaceId });
        if (settings) {
          await this.setupWorkspaceSync(settings);
        }
      } else {
        // Arrêter le job pour ce workspace
        const job = this.syncJobs.get(workspaceId.toString());
        if (job) {
          job.destroy();
          this.syncJobs.delete(workspaceId.toString());
        }
      }

      console.log(`🔄 Auto-sync ${enabled ? 'activé' : 'désactivé'} pour workspace: ${workspaceId}`);
      return true;
    } catch (error) {
      console.error('❌ Erreur toggle auto-sync:', error);
      return false;
    }
  }

  /**
   * Obtient le statut de l'auto-sync pour un workspace
   */
  async getAutoSyncStatus(workspaceId) {
    try {
      const settings = await WorkspaceSettings.findOne({ workspaceId });
      const hasJob = this.syncJobs.has(workspaceId.toString());
      
      return {
        enabled: settings?.autoSync?.enabled !== false,
        interval: settings?.autoSync?.interval || '5min',
        isRunning: hasJob,
        lastUpdate: settings?.autoSync?.updatedAt,
        sourcesCount: (settings?.sources?.filter(s => s.isActive) || []).length + 
                     (settings?.googleSheets?.spreadsheetId ? 1 : 0)
      };
    } catch (error) {
      console.error('❌ Erreur get auto-sync status:', error);
      return { enabled: false, isRunning: false };
    }
  }
}

// Instance singleton
const autoSyncService = new AutoSyncService();

export default autoSyncService;
