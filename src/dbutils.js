import * as duckdb from '@duckdb/duckdb-wasm';


let db = null;
let conn = null;

/**
 * Initializes DuckDB-WASM with the required worker and wasm bundles.
 */
export async function initDB() {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

    // Select a bundle based on browser capability
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const workerResponse = await fetch(bundle.mainWorker);
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
export async function loadAppData() {
    if (!conn) await initDB();

    const datasets = [
        { name: 'items', path: '/static/data/items.csv' },
        { name: 'materials', path: '/static/data/materials.csv' }
    ];

    for (const data of datasets) {
        // Fetch and register the file in the virtual file system
        const response = await fetch(data.path);
        const buffer = await response.arrayBuffer();
        await db.registerFileBuffer(`${data.name}.csv`, new Uint8Array(buffer));

        // Create table from the registered CSV
        await conn.query(`
            CREATE TABLE ${data.name} AS 
            SELECT * FROM read_csv_auto('${data.name}.csv')
        `);

        console.log(`Loaded table: ${data.name}`);
    }
}

/**
 * Helper to run a query and return results as objects.
 */
/**
 * Executes a parameterized query using '?' placeholders.
 */
export async function queryDB(sql, params = []) {
    if (!conn) throw new Error("Database not initialized");

    // Create a prepared statement
    const statement = await conn.prepare(sql);

    // Bind parameters and execute
    const result = await statement.query(...params);


    // Cleanup the statement to free memory
    await statement.close();

    return result.toArray().map(row => row.toJSON());
}