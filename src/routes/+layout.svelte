<script lang="ts">
	import favicon from "$lib/assets/favicon.ico";

	export const prerender = true;
	export const trailingSlash = "always";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link
		href="https://fonts.googleapis.com/css2?family=Metamorphous&family=Fira+Sans:wght@400;700&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
