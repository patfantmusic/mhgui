<script lang="ts">
    import { type Skill } from "$lib/types";
    import { db } from "$lib/db/dbStore";

    import SkillCard from "./SkillCard.svelte";

    let debounceTimer: ReturnType<typeof setTimeout>;
    let results: Skill[] = $state([]);
    let armorSkillMap: Record<string, Record<string, number>> = $state({});
    let searchText: string = $state("");

    async function populateResults(): Promise<void> {
        if (!$db) {
            console.warn("Database is still initializing...");
            return;
        }
        const skills = await $db.getSkills(searchText);
        const skillTrees = skills.map((skill) => skill.skill);
        const armorSkills = await $db.getArmorSkills(skillTrees);
        const tmpArmorSkillMap: Record<string, Record<string, number>> = {};
        armorSkills.forEach((entry) => {
            if (!tmpArmorSkillMap[entry.skill_tree]) {
                tmpArmorSkillMap[entry.skill_tree] = {};
            }
            tmpArmorSkillMap[entry.skill_tree] = entry.armor_distribution;
        });
        results = skills;
        armorSkillMap = tmpArmorSkillMap;
    }

    function handleInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            populateResults();
        }, 300); // Adjust delay as needed
    }
</script>

<form>
    <div class="mb-3">
        <input
            class="form-control"
            id="item-search"
            type="text"
            list="item-suggestions"
            bind:value={searchText}
            oninput={handleInput}
        />
    </div>
</form>
<div class="my-1 border-bottom border-secondary opacity-25"></div>
<div id="item-results">
    {#each results as result}
        <SkillCard
            skill={result}
            armorMap={armorSkillMap[result.skill] || {}}
        />
    {/each}
</div>
