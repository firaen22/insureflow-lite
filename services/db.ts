import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

// Initialize the Database Engine
export const initDB = async (): Promise<Database> => {
    if (db) return db;

    if (!SQL) {
        SQL = await initSqlJs({
            // Vite serves files from public/ at root
            locateFile: file => `./${file}`
        });
    }

    db = new SQL.Database();
    await createTables(db);
    return db;
};

// Create Schema
const createTables = async (database: Database) => {
    const schema = `
        CREATE TABLE IF NOT EXISTS clients (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            phone TEXT,
            status TEXT DEFAULT 'New',
            birthday TEXT,
            last_contact TEXT,
            tags TEXT, -- JSON string
            created_at TEXT
        );

        CREATE TABLE IF NOT EXISTS policies (
            id TEXT PRIMARY KEY,
            client_id TEXT NOT NULL,
            policy_number TEXT,
            type TEXT,
            status TEXT,
            premium REAL,
            mode TEXT,
            anniversary_date TEXT,
            extracted_tags TEXT, -- JSON string
            specifics TEXT, -- JSON string
            FOREIGN KEY(client_id) REFERENCES clients(id)
        );
    `;
    database.run(schema);
};

// Export the entire DB as a binary array (Uint8Array)
export const exportDB = (): Uint8Array => {
    if (!db) throw new Error("Database not initialized");
    return db.export();
};

// Import DB from binary array
export const importDB = async (data: Uint8Array): Promise<Database> => {
    if (!SQL) {
        SQL = await initSqlJs({
            locateFile: file => `./${file}`
        });
    }
    db = new SQL.Database(data);

    // Ensure schema is up to date (migrations)
    await createTables(db);

    return db;
};

export const getDB = () => {
    if (!db) throw new Error("Database not initialized. Call initDB() or importDB() first.");
    return db;
};

// Helper for running queries with typed results
export const runQuery = (sql: string, params: any[] = []) => {
    const database = getDB();
    return database.exec(sql, params);
};

export const getAllData = (): { clients: any[], policies: any[] } => {
    try {
        const clientRes = runQuery("SELECT * FROM clients");
        const clients = clientRes.length ? clientRes[0].values.map(row => {
            const obj: any = {};
            clientRes[0].columns.forEach((col, i) => obj[col] = row[i]);
            // Parse JSON fields
            if (obj.tags) obj.tags = JSON.parse(obj.tags as string);
            return obj;
        }) : [];

        const policyRes = runQuery("SELECT * FROM policies");
        const policies = policyRes.length ? policyRes[0].values.map(row => {
            const obj: any = {};
            policyRes[0].columns.forEach((col, i) => obj[col] = row[i]);
            // Parse JSON fields
            if (obj.extracted_tags) obj.extractedTags = JSON.parse(obj.extracted_tags as string);
            if (obj.specifics) Object.assign(obj, JSON.parse(obj.specifics as string));
            return obj;
        }) : [];

        return { clients, policies };
    } catch (e) {
        console.error("Error fetching data", e);
        return { clients: [], policies: [] };
    }
};

export const saveFullState = (clients: any[], policies: any[]) => {
    const db = getDB();
    db.run("BEGIN TRANSACTION");
    try {
        db.run("DELETE FROM policies");
        db.run("DELETE FROM clients");

        const clientStmt = db.prepare("INSERT INTO clients (id, name, email, phone, status, birthday, last_contact, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        clients.forEach(c => {
            clientStmt.run([
                c.id, c.name, c.email, c.phone, c.status, c.birthday, c.lastContact,
                JSON.stringify(c.tags || []), new Date().toISOString()
            ]);
        });
        clientStmt.free();

        const policyStmt = db.prepare("INSERT INTO policies (id, client_id, policy_number, type, status, premium, mode, anniversary_date, extracted_tags, specifics) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        policies.forEach(p => {
            // Find client ID by name (since current app links by Name, sadly)
            const client = clients.find(c => c.name === p.holderName);
            const clientId = client ? client.id : 'orphaned';

            // Extract specifics
            const { id, holderName, policyNumber, type, status, premiumAmount, paymentMode, policyAnniversaryDate, extractedTags, ...specifics } = p;

            policyStmt.run([
                p.id, clientId, p.policyNumber, p.type, p.status, p.premiumAmount, p.paymentMode, p.policyAnniversaryDate,
                JSON.stringify(p.extractedTags || []), JSON.stringify(specifics)
            ]);
        });
        policyStmt.free();

        db.run("COMMIT");
    } catch (e) {
        db.run("ROLLBACK");
        throw e;
    }
};
