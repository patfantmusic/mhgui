<script lang="ts">
    import Items from "$lib/components/Items.svelte";
    import Skills from "$lib/components/Skills.svelte";
    import { onMount } from "svelte";
    import { db } from "$lib/db/dbStore";

    onMount(() => {
        db.init();
    });

    let currentView = $state("items");
</script>

<nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="container-fluid">
        <a class="navbar-brand" href="/">
            <img src="/logo.png" height="40" width="160" alt="Logo" />
        </a>
        <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
        >
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <button
                        class="nav-link active"
                        id="items-view"
                        type="button"
                        aria-current="page"
                        onclick={(_) => (currentView = "items")}
                    >
                        items
                    </button>
                </li>
                <li class="nav-item">
                    <button
                        class="nav-link"
                        id="skills-view"
                        type="button"
                        onclick={(_) => (currentView = "skills")}
                    >
                        skills
                    </button>
                </li>
            </ul>
        </div>
    </div>
</nav>
{#if currentView === "items"}
    <Items />
{:else if currentView === "skills"}
    <Skills />
{/if}
