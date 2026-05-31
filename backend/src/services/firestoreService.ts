import fs from 'fs';
import path from 'path';
import { CloudLogger } from './cloudLogger.js';

export class FirestoreService {
  private static localDbFile = path.join(process.cwd(), 'firestore_simulation_db.json');

  private static readLocalDb(): Record<string, any[]> {
    try {
      if (fs.existsSync(this.localDbFile)) {
        const raw = fs.readFileSync(this.localDbFile, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      CloudLogger.error('Failed to read simulated Firestore local database file', e);
    }
    return {};
  }

  private static writeLocalDb(data: Record<string, any[]>) {
    try {
      fs.writeFileSync(this.localDbFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      CloudLogger.error('Failed to write simulated Firestore local database file', e);
    }
  }

  public static async saveDocument(collection: string, documentId: string, data: any): Promise<boolean> {
    try {
      CloudLogger.info(`Simulating Firestore WRITE on collection [${collection}] ID [${documentId}]`, data);
      
      const db = this.readLocalDb();
      if (!db[collection]) {
        db[collection] = [];
      }
      
      // Update existing or push new
      const idx = db[collection].findIndex((doc: any) => doc.id === documentId);
      const newDoc = { id: documentId, ...data, updatedAt: new Date().toISOString() };
      
      if (idx > -1) {
        db[collection][idx] = newDoc;
      } else {
        db[collection].push(newDoc);
      }
      
      this.writeLocalDb(db);
      CloudLogger.info(`Successfully synchronized document [${documentId}] in simulated Firestore`);
      return true;
    } catch (e) {
      CloudLogger.error(`Error saving document to collection [${collection}]`, e);
      return false;
    }
  }

  public static async getDocuments(collection: string): Promise<any[]> {
    try {
      CloudLogger.info(`Simulating Firestore GET on collection [${collection}]`);
      const db = this.readLocalDb();
      return db[collection] || [];
    } catch (e) {
      CloudLogger.error(`Error fetching collection [${collection}] from simulated Firestore`, e);
      return [];
    }
  }
}
