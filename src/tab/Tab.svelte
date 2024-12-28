<script>
    import { onMount } from "svelte";
    import googleIcon from "@assets/google.png";
    import bookIcon from "@assets/BookTab.svg?raw";
    import historyIcon from "@assets/history.svg?raw";
    import TabGroup from "@components/tab/TabGroup.svelte";
    import ColorScheme from "@components/tab/ColorScheme.svelte";
    import History from "@components/tab/History.svelte";
    import Sync from "@components/tab/Sync.svelte";
    import Tools from "@components/tab/Tools.svelte";

    let tabGroups = $state([]);
    let isLoggedIn = $state(false);
    let historyVisible = $state(false);

    function handleLogin() {
        chrome.runtime.sendMessage({
            context: !isLoggedIn ? "LOGIN" : "LOGOUT",
        });
    }

    async function set() {
        let {
            groups,
            lastSynced: ls,
            session: s,
            user,
        } = await chrome.storage.local.get();
        tabGroups = groups ?? [];
        user ? (isLoggedIn = true) : (isLoggedIn = false);
    }

    chrome.runtime.onMessage.addListener(async (message) => {
        let { context } = message;
        if (context === "CHANGE") {
            set();
        }
    });

    onMount(async () => {
        set();
    });
</script>

<header>
    <div class="one">
        <button
            onclick={() =>
                chrome.runtime.sendMessage({
                    context: "CONTEXTMENU",
                    action: "display",
                })}
            class="logo">{@html bookIcon}</button
        >

        <h1>BookTab</h1>
    </div>
    {#if isLoggedIn}
        <div class="two">
            <Sync />
        </div>
    {/if}
    <div class="three">
        <Tools />
    </div>
    <div class="four">
        <button
            class="icon history"
            title="history"
            onclick={() => {
                historyVisible = !historyVisible;
            }}
        >
            {@html historyIcon}
        </button>
        <ColorScheme />
        <button class="sign" onclick={handleLogin}>
            {#if isLoggedIn}
                <span>Logout</span>
            {:else}
                <img
                    src={googleIcon}
                    class="google-icon"
                    alt="Signin to Google"
                />
            {/if}
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
        gap: 1rem;
        align-items: center;
        justify-content: space-between;
        padding: 2rem;
        border-bottom: 1px solid var(--color-focus);
        background-color: var(--color-bg);
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
            min-width: max-content;
        }
    }

    .four {
        /* order: 3; */
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
    .logo {
        width: 3rem;
        height: 3rem;
        padding-bottom: 0.1rem;
        & :global(svg) {
            width: 100%;
            height: 100%;
        }
    }

    .sign {
        display: flex;
        .google-icon {
            width: 3rem;
            height: 3rem;
        }
    }
    main {
        padding: 1rem;
    }

    @media (max-width: 600px) {
        header {
            padding: 2rem 1rem 1rem;
            flex-wrap: wrap;
            .one {
                order: 1;
            }
            .two {
                order: 3;
                width: 100%;
            }
            .three {
                order: 4;
                width: 100%;
            }
            .four {
                order: 2;
                gap: 1.5rem;
            }
        }
        h1 {
            font-size: 2.5rem;
        }

        .sign {
            font-size: 1.3rem;
        }

        .logo {
            width: 2.5rem;
            height: 2.5rem;
        }
    }
</style>
