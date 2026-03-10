/**
 * Service Google Sheets - Service dédié à l'interaction avec Google Sheets
 * Gère toute la logique de connexion, récupération et parsing des données
 */

const fetch = require('node-fetch');

class GoogleSheetsService {
  constructor() {
    this.baseUrls = {
      csv: 'https://docs.google.com/spreadsheets/d/{spreadsheetId}/gviz/tq?tqx=out:csv',
      json: 'https://docs.google.com/spreadsheets/d/{spreadsheetId}/gviz/tq?tqx=out:json'
    };
  }

  /**
   * Valide et extrait l'ID d'un spreadsheet depuis différentes formes d'URL
   * @param {string} spreadsheetId - ID ou URL complet du spreadsheet
   * @returns {string|null} - L'ID du spreadsheet ou null si invalide
   */
  extractSpreadsheetId(spreadsheetId) {
    if (!spreadsheetId) return null;
    
    // Si c'est déjà un ID (format: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms)
    if (/^[a-zA-Z0-9_-]+$/.test(spreadsheetId) && spreadsheetId.length >= 30) {
      return spreadsheetId;
    }
    
    // Extraire depuis une URL complète
    const patterns = [
      /\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /spreadsheets\/d\/([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = spreadsheetId.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  /**
   * Vérifie la validité d'un spreadsheet
   * @param {string} spreadsheetId - ID du spreadsheet
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  async validateSpreadsheet(spreadsheetId) {
    try {
      const id = this.extractSpreadsheetId(spreadsheetId);
      if (!id) {
        return { valid: false, error: 'ID de spreadsheet invalide' };
      }
      
      const url = this.baseUrls.json.replace('{spreadsheetId}', id);
      const response = await fetch(url, { 
        timeout: 10000,
        headers: { 'User-Agent': 'Ecom-Import-Service/1.0' }
      });
      
      if (!response.ok) {
        return { 
          valid: false, 
          error: `Accès refusé (${response.status}): ${response.statusText}` 
        };
      }
      
      const text = await response.text();
      const jsonStr = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?$/);
      
      if (!jsonStr) {
        return { valid: false, error: 'Format de réponse invalide' };
      }
      
      const json = JSON.parse(jsonStr[1]);
      
      if (json.status === 'error') {
        return { 
          valid: false, 
          error: json.errors?.[0]?.message || 'Erreur inconnue du spreadsheet' 
        };
      }
      
      const table = json.table;
      if (!table || !table.rows || table.rows.length === 0) {
        return { valid: false, error: 'Spreadsheet vide ou inaccessible' };
      }
      
      return {
        valid: true,
        id,
        title: json.table?.cols?.[0]?.label || 'Spreadsheet',
        rowCount: table.rows.length,
        columnCount: table.cols?.length || 0
      };
      
    } catch (error) {
      console.error('Erreur validation spreadsheet:', error);
      return { 
        valid: false, 
        error: `Erreur de connexion: ${error.message}` 
      };
    }
  }

  /**
   * Récupère les données brutes d'un spreadsheet
   * @param {string} spreadsheetId - ID du spreadsheet
   * @param {Object} options - Options de récupération
   * @returns {Promise<Object>} - Données brutes et métadonnées
   */
  async fetchSpreadsheetData(spreadsheetId, options = {}) {
    const {
      sheetName = null,
      headerRow = 0,
      maxRows = 10000,
      timeout = 30000
    } = options;
    
    try {
      const id = this.extractSpreadsheetId(spreadsheetId);
      if (!id) {
        throw new Error('ID de spreadsheet invalide');
      }
      
      // Construire l'URL avec les paramètres
      let url = this.baseUrls.json.replace('{spreadsheetId}', id);
      if (sheetName) {
        url += `&sheet=${encodeURIComponent(sheetName)}`;
      }
      
      console.log(`📥 Récupération données depuis: ${url}`);
      
      const response = await fetch(url, { 
        timeout,
        headers: { 'User-Agent': 'Ecom-Import-Service/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      const jsonStr = text.match(/google\.visualization\.Query\.setResponse\((.+)\);?$/);
      
      if (!jsonStr) {
        throw new Error('Format de réponse invalide');
      }
      
      const json = JSON.parse(jsonStr[1]);
      
      if (json.status === 'error') {
        throw new Error(json.errors?.[0]?.message || 'Erreur du spreadsheet');
      }
      
      const table = json.table;
      
      // Limiter le nombre de lignes si demandé
      let rows = table.rows;
      if (rows.length > maxRows) {
        rows = rows.slice(0, maxRows);
        console.log(`📊 Limité à ${maxRows} lignes sur ${table.rows.length}`);
      }
      
      return {
        success: true,
        data: {
          id,
          title: json.table?.cols?.[0]?.label || 'Spreadsheet',
          cols: table.cols || [],
          rows,
          totalRows: table.rows.length,
          limitedRows: rows.length,
          headerRow
        }
      };
      
    } catch (error) {
      console.error('Erreur récupération données:', error);
      throw error;
    }
  }

  /**
   * Convertit les données brutes en format structuré
   * @param {Object} rawData - Données brutes du spreadsheet
   * @param {Object} options - Options de parsing
   * @returns {Object} - Données structurées avec métadonnées
   */
  parseSpreadsheetData(rawData, options = {}) {
    const {
      headerRow = 0,
      skipEmptyRows = true,
      trimValues = true
    } = options;
    
    const { cols, rows, headerRow: dataHeaderRow = headerRow } = rawData;
    
    // Extraire les en-têtes
    const headers = cols.map(col => col.label || '');
    
    // Détecter la ligne de départ des données
    const dataStartRow = Math.max(0, dataHeaderRow);
    
    // Parser chaque ligne
    const parsedRows = [];
    const errors = [];
    
    for (let i = dataStartRow; i < rows.length; i++) {
      const row = rows[i];
      
      // Skipper les lignes vides si demandé
      if (skipEmptyRows && (!row.c || row.c.every(cell => !cell || !cell.v))) {
        continue;
      }
      
      try {
        const parsedRow = this.parseRow(row, cols, { trimValues });
        parsedRow._rowIndex = i;
        parsedRow._originalRow = row;
        parsedRows.push(parsedRow);
      } catch (error) {
        errors.push({
          row: i,
          error: error.message,
          data: row
        });
      }
    }
    
    return {
      headers,
      rows: parsedRows,
      errors,
      metadata: {
        totalRows: rows.length,
        parsedRows: parsedRows.length,
        errorRows: errors.length,
        headerRow: dataHeaderRow,
        columns: cols.map(col => ({
          id: col.id,
          label: col.label,
          type: col.type || 'string'
        }))
      }
    };
  }

  /**
   * Parse une ligne individuelle
   * @param {Object} row - Ligne brute du spreadsheet
   * @param {Array} cols - Définition des colonnes
   * @param {Object} options - Options de parsing
   * @returns {Object} - Ligne parsée
   */
  parseRow(row, cols, options = {}) {
    const { trimValues = true } = options;
    
    if (!row.c) {
      throw new Error('Ligne vide ou invalide');
    }
    
    const parsed = {};
    
    for (let colIndex = 0; colIndex < cols.length; colIndex++) {
      const col = cols[colIndex];
      const cell = row.c[colIndex];
      
      let value = '';
      
      if (cell && cell.v !== null && cell.v !== undefined) {
        // Utiliser la valeur formatée si disponible, sinon la valeur brute
        value = cell.f || String(cell.v);
        
        // Nettoyer la valeur si demandé
        if (trimValues && typeof value === 'string') {
          value = value.trim();
        }
      }
      
      parsed[col.label || `col_${colIndex}`] = value;
    }
    
    return parsed;
  }

  /**
   * Détecte automatiquement le mapping des colonnes pour les commandes
   * @param {Array} headers - En-têtes du spreadsheet
   * @returns {Object} - Mapping des colonnes détecté
   */
  detectOrderColumnMapping(headers) {
    const mapping = {};
    const patterns = {
      orderId: ['id', 'order id', 'commande id', 'numéro', 'référence', 'ref'],
      clientName: ['nom', 'client', 'client name', 'nom client', 'prénom', 'first name'],
      clientPhone: ['téléphone', 'phone', 'tel', 'tél', 'mobile', 'contact'],
      clientEmail: ['email', 'mail', 'e-mail', 'adresse email'],
      city: ['ville', 'city', 'localité', 'localite'],
      address: ['adresse', 'address', 'rue', 'street'],
      productName: ['produit', 'product', 'article', 'item'],
      quantity: ['quantité', 'quantity', 'qté', 'qty'],
      price: ['prix', 'price', 'montant', 'amount', 'total'],
      status: ['statut', 'status', 'état', 'etat'],
      date: ['date', 'created', 'commande date', 'order date']
    };
    
    // Normaliser les headers pour la recherche
    const normalizedHeaders = headers.map(h => 
      h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    );
    
    // Détecter chaque champ
    Object.entries(patterns).forEach(([field, fieldPatterns]) => {
      for (const pattern of fieldPatterns) {
        const index = normalizedHeaders.findIndex(h => 
          h.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(h)
        );
        
        if (index !== -1) {
          mapping[field] = index;
          break;
        }
      }
    });
    
    return mapping;
  }

  /**
   * Génère un aperçu des données pour validation
   * @param {Object} spreadsheetData - Données du spreadsheet
   * @param {Object} options - Options de génération
   * @returns {Object} - Aperçu structuré
   */
  generatePreview(spreadsheetData, options = {}) {
    const { maxPreviewRows = 5, includeMetadata = true } = options;
    
    const parsed = this.parseSpreadsheetData(spreadsheetData);
    const columnMapping = this.detectOrderColumnMapping(parsed.headers);
    
    const previewRows = parsed.rows.slice(0, maxPreviewRows);
    
    return {
      headers: parsed.headers,
      columnMapping,
      preview: previewRows,
      metadata: includeMetadata ? parsed.metadata : null,
      detectedFormat: this.detectOrderFormat(columnMapping),
      recommendations: this.generateRecommendations(parsed, columnMapping)
    };
  }

  /**
   * Détecte le format de commande basé sur le mapping
   * @param {Object} mapping - Mapping des colonnes
   * @returns {string} - Format détecté
   */
  detectOrderFormat(mapping) {
    const requiredFields = ['orderId', 'clientName', 'clientPhone'];
    const hasRequired = requiredFields.every(field => mapping[field] !== undefined);
    
    if (hasRequired) {
      return 'standard';
    } else if (mapping.clientName && mapping.clientPhone) {
      return 'minimal';
    } else {
      return 'unknown';
    }
  }

  /**
   * Génère des recommandations basées sur l'analyse
   * @param {Object} parsed - Données parsées
   * @param {Object} mapping - Mapping des colonnes
   * @returns {Array} - Liste de recommandations
   */
  generateRecommendations(parsed, mapping) {
    const recommendations = [];
    
    // Vérifier les colonnes manquantes importantes
    const importantFields = ['orderId', 'clientName', 'clientPhone'];
    const missingFields = importantFields.filter(field => mapping[field] === undefined);
    
    if (missingFields.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `Colonnes importantes non détectées: ${missingFields.join(', ')}`,
        action: 'Vérifiez que vos colonnes contiennent ces informations'
      });
    }
    
    // Vérifier la qualité des données
    if (parsed.errorRows > 0) {
      recommendations.push({
        type: 'error',
        message: `${parsed.errorRows} lignes contiennent des erreurs`,
        action: 'Corrigez les données avant import'
      });
    }
    
    // Recommandations basées sur le volume
    if (parsed.parsedRows > 1000) {
      recommendations.push({
        type: 'info',
        message: `Grand volume de données (${parsed.parsedRows} lignes)`,
        action: "L'import peut prendre plusieurs minutes"
      });
    }
    
    return recommendations;
  }
}

module.exports = new GoogleSheetsService();
