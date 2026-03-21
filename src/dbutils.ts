import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

/**
 * Initializes DuckDB-WASM with the required worker and wasm bundles.
 */
export async function initDB(): Promise<duckdb.AsyncDuckDBConnection> {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

    // Select a bundle based on browser capability
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const workerResponse = await fetch(bundle.mainWorker!);
    const workerBlob = new Blob([await workerResponse.text()], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);

    const worker = new Worker(workerUrl);
    const logger = new duckdb.ConsoleLogger();

    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    conn = await db.connect();
    console.log("DuckDB-Wasm Initialized");
    return conn;
}

/**
 * Loads the items and materials CSV files into the database.
 */
export async function loadAppData(): Promise<void> {
    if (!conn) await initDB();
    if (!db || !conn) return;

    const datasets = [
        { name: 'items', path: '/static/data/items.csv' },
        { name: 'materials_gen', path: '/static/data/materials_gen.csv' },
        { name: 'materials_gu', path: '/static/data/materials_gu.csv' },
        { name: 'combinations', path: '/static/data/combinations.csv' },
        { name: 'yields', path: '/static/data/gathering_yields.csv' },
    ];

    for (const data of datasets) {
        const response = await fetch(data.path);
        const buffer = await response.arrayBuffer();

        // Register the file in the virtual file system
        await db.registerFileBuffer(`${data.name}.csv`, new Uint8Array(buffer));

        // Create table from the registered CSV
        await conn.query(`
            CREATE TABLE IF NOT EXISTS ${data.name} AS 
            SELECT * FROM read_csv_auto('${data.name}.csv')
        `);

        console.log(`Loaded table: ${data.name}`);
    }

    await conn.query(`
        CREATE TABLE IF NOT EXISTS materials AS
        SELECT * FROM materials_gen
        UNION ALL
        SELECT * FROM materials_gu
    `);

    console.log("Loaded materials table");
}

/**
 * Executes a parameterized query using '?' placeholders.
 */
export async function queryDB<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!conn) throw new Error("Database not initialized");

    const statement = await conn.prepare(sql);
    const result = await statement.query(...params);

    // Convert to array and force-spread each row into a new object
    const rows = result.toArray().map(row => ({ ...row })) as T[];

    await statement.close();
    return rows;
}