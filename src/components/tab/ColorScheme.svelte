<script lang="ts">
    import lightModeIcon from "@assets/lightMode.svg?raw";
    import darkModeIcon from "@assets/darkMode.svg?raw";
    import { onMount } from "svelte";

    let theme = $state("");

    function setTheme() {
        const root = document.documentElement;
        switch (theme) {
            case "DARK":
                root.style.setProperty("color-scheme", "dark");
                break;
            default:
                root.style.setProperty("color-scheme", "light");
                break;
        }
    }

    function toggleTheme() {
        theme = theme === "DARK" ? "" : "DARK";
        chrome.storage.local.set({ theme });
        setTheme();
    }

    onMount(async () => {
        const { theme: t = "" } = await chrome.storage.local.get();
        theme = t;
        setTheme();
    });
</script>

<button
    type="button"
    class="color-theme icon"
    title="toggle theme"
    role="switch"
    aria-label="Toggle dark mode"
    aria-checked={theme === "" ? "false" : "true"}
    onclick={() => toggleTheme()}
>
    {#if theme === ""}
        {@html lightModeIcon}
    {:else}
        {@html darkModeIcon}
    {/if}
</button>

<style>
    .color-theme {
        border-radius: 50%;
    }

    @media (max-width: 600px) {
    }
</style>
