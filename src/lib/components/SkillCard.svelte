<script lang="ts">
    import { type Skill } from "$lib/types";

    let {
        skill: skill,
        armorMap: armorMap,
    }: { skill: Skill; armorMap: Record<string, number> } = $props();
</script>

<div class="card custom-card-dark d-flex flex-row align-items-center mt-3">
    <div class="col-md-4">
        <div class="card-body">
            <h5 class="card-title mt-2 text-warning">{skill.ability}</h5>
            <p class="text-muted"><i>{skill.skill} {skill.points}</i></p>
        </div>
    </div>
    <div class="col-md-4 border-start border-secondary">
        <div class="card-body d-flex flex-column justify-content-center h-100">
            <div class="mb-1">
                <h6 class="d-inline small text-warning">Description</h6>
            </div>
            <div class="mb-1">
                <span>{skill.description}</span>
            </div>
        </div>
    </div>
    <div class="col-md-4 border-start border-secondary">
        <div class="card-body d-flex flex-column justify-content-center h-100">
            <div class="mb-1">
                <h6 class="d-inline small text-warning">Armor</h6>
            </div>
            <div class="mb-1">
                {#each Object.values(armorMap) as armorSet}
                    <div class="mb-2 d-flex flex-row align-items-center">
                        {#each Object.entries(armorSet) as [piece, points]}
                            <div
                                class="text-uppercase fw-bold text-body-secondary me-2"
                                style="font-size: 0.65rem; letter-spacing: 0.05rem;"
                            >
                                {piece}: {points}
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
