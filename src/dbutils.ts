import { get, readable } from 'svelte/store';
import * as duckdb from '@duckdb/duckdb-wasm';
import type { AsyncDuckDBConnection } from '@duckdb/duckdb-wasm';
import { type GameItem, type Skill, type ArmorSkill } from './types';

const DATASETS = [
    { name: 'items', path: '/static/data/items.csv' },
    { name: 'materials_gen', path: '/static/data/materials_gen.csv' },
    { name: 'materials_gu', path: '/static/data/materials_gu.csv' },
    { name: 'combinations', path: '/static/data/combinations.csv' },
    { name: 'yields', path: '/static/data/gathering_yields.csv' },
    { name: 'skills', path: '/static/data/skills.csv' },
    { name: 'armor_skills', path: '/static/data/armor_skills.csv' },
];

async function initDB() {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    // FIX: Fetch the worker script and create a local Blob URL
    const workerRes = await fetch(bundle.mainWorker!);
    const workerBlob = await workerRes.blob();
    const workerUrl = URL.createObjectURL(workerBlob);

    const worker = new Worker(workerUrl);
    const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);

    // Remember to revoke the URL later if needed, though usually not necessary for a singleton
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    const conn = await db.connect();

    for (const { name, path } of DATASETS) {
        // 1. Fetch the file manually to ensure it's loaded
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to fetch ${path}`);
        const buffer = await response.arrayBuffer();

        // 2. Register as a Buffer (Immediate availability)
        await db.registerFileBuffer(`${name}.csv`, new Uint8Array(buffer));

        // 3. Create the table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS ${name} AS 
            SELECT * FROM read_csv_auto('${name}.csv')
        `);

        // 4. Optional: Drop the file from memory once the table is internal
        await db.dropFile(`${name}.csv`);
    }
    // Perform the UNION logic immediately after sources are ready
    await conn.query(`
        CREATE TABLE IF NOT EXISTS materials AS
        SELECT * FROM materials_gen UNION ALL SELECT * FROM materials_gu
    `);

    return { db, conn };
}

let initPromise;

function getDB() {
    if (!initPromise) {
        initPromise = initDB();
    }
    return initPromise;
}

export const dbStore = readable(null, (set) => {
    getDB().then(set).catch(err => console.error("DuckDB Init Failed:", err));
    // No-op stop function: we want to keep the DB alive even if subscribers hit 0
    return () => { };
});

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const instance = await getDB();
    const conn = await instance.db.connect();

    try {
        let result;
        if (params.length > 0) {
            // Use prepared statements for parameterized queries
            const stmt = await conn.prepare(sql);
            result = await stmt.query(...params);
            await stmt.close(); // Clean up the statement
        } else {
            // Use direct query for simple SQL strings
            result = await conn.query(sql);
        }

        return result.toArray().map((row) => row.toJSON()) as T[];
    } finally {
        await conn.close();
    }
}

export async function getItems(searchText: string): Promise<GameItem[]> {
    const tmpResults = await query(
        `
        WITH rank_aggregation AS (
            SELECT 
                name,
                map,
                area,
                string_agg(DISTINCT left(rank, 1), '' ORDER BY left(rank, 1) DESC) AS rank_str
            FROM yields
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

export async function getMaterials(searchText: string): Promise<GameItem[]> {
    const results = await query(
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


export async function getSkills(searchText: string): Promise<Skill[]> {
    const results = await query(
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

export async function getArmorSkills(skills: string[]): Promise<ArmorSkill[]> {
    const results = await query(
        `
        SELECT 
            skill_tree, 
            map_from_entries(
                list_transform(
                    list_distinct(list(armor_set_id)),
                    id -> {
                        'key': id, 
                        'value': map_from_entries(
                            list_transform(
                                list_filter(
                                    list({'set_id': armor_set_id, 'armor': armor, 'points': total_points}),
                                    x -> x.set_id = id
                                ),
                                y -> {'key': y.armor, 'value': y.points}
                            )
                        )
                    }
                )
            ) AS armor_distribution
        FROM (
            SELECT 
                skill_tree, 
                armor,
                armor_set_id,
                CAST(SUM(points) AS INTEGER) AS total_points
            FROM armor_skills
            WHERE list_contains(?, skill_tree)
            GROUP BY skill_tree, armor, armor_set_id
            HAVING total_points > 0
        ) sub
        GROUP BY skill_tree
        `,
        [JSON.stringify(skills)] // Pass the raw array
    );
    return results as ArmorSkill[];
}