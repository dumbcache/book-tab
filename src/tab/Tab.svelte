<script>
    import { onMount } from "svelte";
    import bookIcon from "@assets/BookTab.svg?raw";
    import closeIcon from "@assets/close.svg?raw";
    import historyIcon from "@assets/history.svg?raw";
    import TabGroup from "@components/tab/TabGroup.svelte";
    import ColorScheme from "@components/tab/ColorScheme.svelte";
    import History from "@components/tab/History.svelte";

    let tabGroups = $state([]);
    let lastSync = $state("");
    let isLoggedIn = $state(false);
    let historyVisible = $state(false);

    function handleLogin() {
        chrome.runtime.sendMessage({
            context: !isLoggedIn ? "LOGIN" : "LOGOUT",
        });
    }

    function handleCreate() {
        chrome.runtime.sendMessage({ context: "CREATE" });
    }

    async function set() {
        let { groups, lastSynced, user } = await chrome.storage.local.get();
        tabGroups = groups ?? [];
        lastSynced && (lastSync = new Date(lastSynced).toLocaleString());
        user ? (isLoggedIn = true) : (isLoggedIn = false);
    }

    chrome.runtime.onMessage.addListener(
        async (message, sender, sendResponse) => {
            let { context } = message;
            if (context === "CHANGE") {
                set();
            }
        }
    );

    onMount(async () => {
        set();
    });
</script>

<header>
    <div class="one">
        <button
            onclick={() => chrome.runtime.sendMessage({ context: "DISPLAY" })}
            class="icon">{@html bookIcon}</button
        >

        <h1>BookTab</h1>
        {#if isLoggedIn}
            <p>{`last synced: ${lastSync}`}</p>
        {/if}
    </div>
    <div class="two">
        <button class="create" title="create" onclick={handleCreate}>
            {@html closeIcon}
        </button>
        <button
            class="create"
            title="create"
            onclick={() => {
                historyVisible = !historyVisible;
            }}
        >
            {@html historyIcon}
        </button>
        <ColorScheme />
        <button class="sign" onclick={handleLogin}>
            {isLoggedIn ? "Logout" : "Login"}
        </button>
    </div>
</header>
<main style:display={historyVisible ? "none" : "block"}>
    {#each tabGroups as group (group.id)}
        <TabGroup {group} />
    {/each}
</main>

{#if historyVisible}
    <History />
{/if}

<style>
    header {
        position: sticky;
        top: 0rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 2rem 1rem;
        border-bottom: 1px solid var(--color-focus);
        background-color: var(--color-bg);
    }

    .create {
        block-size: var(--primary-icon-size);
        inline-size: var(--primary-icon-size);
        rotate: 45deg;

        &:hover :global(svg) {
            fill: var(--color-focus);
        }
    }
    .one {
        position: relative;
        display: flex;
        align-items: center;
        p {
            font-size: 1.3rem;
            position: absolute;
            top: 3.5rem;
            left: 0;
            width: fit-content;
        }
    }

    .two {
        display: flex;
        align-items: center;
        gap: 3rem;
    }
    .sign {
        font-size: 1.6rem;

        &:hover {
            color: var(--color-focus);
        }
    }
    h1 {
        font-size: 3rem;
        font-family: var(--font-default);
    }
    .icon {
        width: 3rem;
        height: 3rem;
        padding-bottom: 0.1rem;
        & :global(svg) {
            width: 100%;
            height: 100%;
        }
    }
    main {
        padding: 1rem;
    }

    @media (max-width: 600px) {
        h1 {
            font-size: 2.5rem;
        }

        .sign {
            font-size: 1.3rem;
        }
        .two {
            gap: 1.5rem;
        }

        .icon {
            width: 2.5rem;
            height: 2.5rem;
        }
    }
</style>
