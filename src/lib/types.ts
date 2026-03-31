interface Item {
    icon: string;
    name: string;
    category: string;
    value: number | string;
    rarity: string;
    capacity: number | string;
    how_to_get: string;
}

type RankString = string;

/**
 * Key: Area ID or Name
 * Value: The concatenated RankString
 */
type AreaData = Record<string, RankString>;

/**
 * Key: Map ID or Name
 * Value: An object containing AreaData
 */
export type YieldData = Record<string, AreaData>;

interface Craftable {
    first_ingredient: string;
    second_ingredient: string;
}

interface Gatherable {
    yields_json: YieldData;
}

export type GameItem = Item & Partial<Craftable & Gatherable>;


export function isCraftable(item: GameItem): item is GameItem & Craftable {
    let result = "first_ingredient" in item && item.first_ingredient !== null;
    return result;
}

export function isGatherable(item: GameItem): item is GameItem & Gatherable {
    let result = "yields_json" in item && item.yields_json !== null;
    return result;
}

export interface Skill {
    skill: string;
    ability: string;
    points: number;
    description: string;
}

export interface ArmorSkill {
    skill_tree: string,
    armor_set_id: number,
    armor_distribution: Record<string, number>
}