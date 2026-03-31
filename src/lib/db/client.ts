import * as duckdb from '@duckdb/duckdb-wasm';
import type { ArmorSkill, Skill, GameItem } from "$lib/types"

export class DbClient {
    private conn?: duckdb.AsyncDuckDBConnection;

    private constructor() { }

    /**
     * Entry point: Orchestrates the environment setup and connection.
     */
    static async create(): Promise<DbClient> {
        const instance = new DbClient();

        const bundle = await instance.getBestBundle();
        const worker = await instance.createWorker(bundle);

        const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        // 1. Register the single database file
        // The 'false' flag ensures we use Range Requests instead of downloading the whole DB
        await db.registerFileURL(
            'mhgu.duckdb',
            import.meta.env.VITE_DB_URL,
            duckdb.DuckDBDataProtocol.HTTP,
            false
        );

        // 2. Connect to the instance
        instance.conn = await db.connect();

        // 3. Attach the registered file so its tables are accessible
        // After this, your existing queries (e.g., SELECT * FROM items) will work
        await instance.conn.query(`ATTACH 'mhgu.duckdb' AS mhgu (READ_ONLY)`);
        await instance.conn.query(`USE mhgu`);

        return instance;
    }

    /**
     * Selects the most performant WASM bundle based on browser capabilities.
     */
    private async getBestBundle() {
        const bundles = duckdb.getJsDelivrBundles();
        return await duckdb.selectBundle(bundles);
    }

    /**
     * Fetches the worker script and initializes a Web Worker.
     */
    private async createWorker(bundle: duckdb.DuckDBBundle): Promise<Worker> {
        const workerRes = await fetch(bundle.mainWorker!);
        const workerBlob = await workerRes.blob();
        const workerUrl = URL.createObjectURL(workerBlob);
        return new Worker(workerUrl);
    }

    /**
     * Loads and executes the initial schema/data.
     */
    private async runSetupScript() {
        if (!this.conn) return;
        const response = await fetch("/static/data/setup.sql");
        const sql = await response.text();
        await this.conn.query(sql);
    }

    async close() {
        if (this.conn) await this.conn.close();
    }

    private get connection(): duckdb.AsyncDuckDBConnection {
        if (!this.conn) throw new Error("Database not initialized");
        return this.conn;
    }

    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        if (!this.conn) throw new Error("Database not initialized");
        let result;
        if (params.length > 0) {
            // Use prepared statements for parameterized queries
            const stmt = await this.conn.prepare(sql);
            result = await stmt.query(...params);
            await stmt.close(); // Clean up the statement
        } else {
            // Use direct query for simple SQL strings
            result = await this.conn.query(sql);
        }

        return result.toArray().map((row) => row.toJSON()) as T[];
    }

    async getSkills(searchText: string): Promise<Skill[]> {
        if (searchText.trim() === "") return [];
        const results = await this.query(
            `
            SELECT *
            FROM skills
            WHERE regexp_replace(lower(skill), '[^a-z0-9]', '', '')
            LIKE '%' || regexp_replace(lower(?), '[^a-z0-9]', '', 'g') || '%'
            `,
            [`${searchText}`],
        );
        return results as Skill[];
    }

    async getArmorSkills(skills: string[]): Promise<ArmorSkill[]> {
        const results = await this.query(
            `
            SELECT 
                skill_tree, 
                json_group_object(
                    armor_set_id, 
                    armor_distribution
                ) as armor_distribution
            FROM (
                SELECT 
                    skill_tree, 
                    armor_set_id,
                    json_group_object(armor, total_points) AS armor_distribution
                FROM (
                    SELECT 
                        skill_tree, 
                        armor,
                        armor_set_id,
                        CAST(SUM(points) AS INTEGER) AS total_points
                    FROM armor_skills
                    WHERE list_contains(?, skill_tree)
                    GROUP BY ALL
                    HAVING total_points > 0
                )
                GROUP BY skill_tree, armor_set_id
            )
            GROUP BY skill_tree;
            `,
            [JSON.stringify(skills)] // Pass the raw array
        );
        return results.map((row) => {
            return {
                skill_tree: row.skill_tree,
                armor_distribution: JSON.parse(row.armor_distribution)
            } as ArmorSkill;
        });
    }

    async getItems(searchText: string): Promise<GameItem[]> {
        if (searchText.trim() === "") return [];
        const tmpResults = await this.query(
            `
            WITH rank_aggregation AS (
                SELECT 
                    name,
                    map,
                    area,
                    string_agg(DISTINCT left(rank, 1), '' ORDER BY left(rank, 1) DESC) AS rank_str
                FROM gathering_yields
                WHERE map IS NOT NULL
                GROUP BY name, map, area
            ),
            map_aggregation AS (
                SELECT 
                    name,
                    map,
                    json_group_object(area, rank_str) AS area_map
                FROM rank_aggregation
                GROUP BY name, map
            ),
            final_yields AS (
                SELECT 
                    name,
                    json_group_object(map, area_map) AS yields_json
                FROM map_aggregation
                GROUP BY name
            )
            SELECT
                items.*,
                combinations.first_ingredient,
                combinations.second_ingredient,
                final_yields.yields_json
            FROM items
            LEFT JOIN combinations ON items.name = combinations.result
            LEFT JOIN final_yields ON items.name = final_yields.name
            WHERE regexp_replace(lower(items.name), '[^a-z0-9]', '', 'g') 
                LIKE '%' || regexp_replace(lower(?), '[^a-z0-9]', '', 'g') || '%'
            GROUP BY ALL;
            `,
            [`${searchText}`],
        );
        tmpResults.forEach((item) => {
            if (item.yields_json !== null) {
                item.yields_json = JSON.parse(item.yields_json);
            }
        });
        const results = tmpResults as GameItem[];
        return results;
    }

    async getMaterials(searchText: string): Promise<GameItem[]> {
        if (searchText.trim() === "") return [];
        const results = await this.query(
            `
            SELECT *
            FROM materials
            WHERE regexp_replace(lower(name), '[^a-z0-9]', '', '')
            LIKE '%' || regexp_replace(lower(?), '[^a-z0-9]', '', 'g') || '%'
            `,
            [`${searchText}`],
        );
        return results as GameItem[];
    }
}