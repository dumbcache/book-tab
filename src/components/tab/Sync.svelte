<script>
    import startIcon from "@assets/start.svg?raw";
    import { onMount } from "svelte";
    // import stopIcon from "@assets/stop.svg?raw";
    let lastSynced = $state(null);
    let session = $state(null);
    let remaining = $state(null);

    async function set() {
        let { lastSynced: ls, session: s } = await chrome.storage.local.get();
        lastSynced = ls;
        session = s;
        remaining = session - Date.now();
    }

    chrome.runtime.onMessage.addListener(async (message) => {
        let { context } = message;
        if (context === "CHANGE") {
            set();
        }
    });

    onMount(() => {
        set();
    });
</script>

{#if session}
    <div class="sync">
        <p>
            <strong>Last synced:</strong>
            <span>
                {` ${new Date(lastSynced).toDateString() + ", " + new Date(lastSynced).toLocaleTimeString()}`}
            </span>
        </p>
        {#if remaining < 0}
            <div class="button-wrapper">
                <strong>Sync Paused</strong>
                <button
                    onclick={() =>
                        chrome.runtime.sendMessage({ context: "LOGIN" })}
                >
                    <span>Resume</span><span class="icon"
                        >{@html startIcon}</span
                    >
                </button>
            </div>
        {/if}
    </div>
{/if}

<style>
    .sync {
        display: flex;
        align-items: center;
        gap: 5rem;
        justify-content: center;
    }
    .button-wrapper {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    button {
        display: flex;
        align-items: center;
        background-color: var(--color-focus);
        border-radius: 2.5rem;
        padding: 0.5rem 1rem;
        span {
            font-size: 1.6rem;
        }

        .icon {
            width: 2.4rem;
            height: 2.4rem;
        }
        .icon :global(svg) {
            fill: var(--color);
        }
    }

    @media (max-width: 600px) {
        .sync {
            font-size: 1.2rem;
            gap: 1rem;
        }

        button {
            padding: 0.2rem 0.7rem;
            span {
                font-size: 1.2rem;
            }
            .icon {
                width: 2rem;
                height: 2rem;
            }
        }
    }
</style>
