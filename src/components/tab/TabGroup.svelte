<script>
    import { fade } from "svelte/transition";
    import lockIcon from "@assets/lock.svg?raw";
    import unlockIcon from "@assets/unlock.svg?raw";
    import Tab from "./Tab.svelte";
    let { group } = $props();

    function open(group) {
        chrome.runtime.sendMessage({
            context: "OPEN",
            data: {
                group,
            },
        });
    }

    function remove(group, tab) {
        chrome.runtime.sendMessage({
            context: "REMOVE",
            data: {
                group,
                tab,
            },
        });
    }
    function lock(l) {
        group.locked = l;
        chrome.runtime.sendMessage({
            context: "LOCK",
            data: {
                group: group.id,
                locked: l,
            },
        });
    }
    function rename(group, name) {
        chrome.runtime.sendMessage({
            context: "RENAME",
            data: {
                group,
                name,
            },
        });
    }
</script>

<section class="group" out:fade={{ duration: 200 }} id={group.id}>
    <div class="header">
        <div class="heading">
            <h4 class="gname ellipsis">
                {group.name}
            </h4>
            <sub>{`(${new Date(group.createdDate).toLocaleString()})`}</sub>
        </div>
        <div class="options">
            {#if group.locked}
                <button class="icon" onclick={() => lock(false)}
                    >{@html lockIcon}</button
                >
            {:else}
                <button class="icon" onclick={() => lock(true)}
                    >{@html unlockIcon}</button
                >
            {/if}
            <span>{group.tabs.length + " Tabs"}</span>
            <button onclick={() => open(group.id)}>[Open]</button>
            <button
                onclick={() => {
                    const title = window.prompt(
                        "Rename this tab group",
                        group.name
                    );
                    if (title && title !== group.name) {
                        rename(group.id, title);
                        group.name = title;
                    }
                }}>[Edit]</button
            >
            <button
                style:visibility={group.locked ? "hidden" : "visible"}
                onclick={() => {
                    const s = window.confirm("Confirm deletion?");
                    if (s) remove(group.id);
                }}>[Delete]</button
            >
        </div>
    </div>
    <ol>
        {#each group.tabs as tab (tab?.id)}
            <Tab {group} {tab} />
        {/each}
    </ol>
</section>

<style>
    .group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 2rem;
    }
    .header {
        padding: 1rem 0rem;
        display: flex;
        flex-direction: column;
        max-width: 50rem;
    }
    .heading {
        display: flex;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
        sub {
            min-width: fit-content;
            font-size: 1.3rem;
        }
    }
    .gname {
        font-size: 1.6rem;
    }

    .options {
        display: flex;
        justify-content: space-around;
        align-items: center;

        button {
            font-size: 1.3rem;
            color: var(--color-focus);
        }
        button:hover {
            text-decoration: underline;
        }

        span {
            font-size: 1.3rem;
        }
    }

    .icon {
        width: 2rem;
        height: 2rem;
    }

    .icon:hover :global(svg),
    .icon:focus :global(svg) {
        fill: var(--color-focus);
    }

    @media (max-width: 600px) {
        .options {
            justify-content: space-between;
        }
    }
</style>
