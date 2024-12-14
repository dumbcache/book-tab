<script>
    import { onMount } from "svelte";

    let s = $state({ groups: [], tabs: [] });

    async function set() {
        const { history } = await chrome.storage.local.get();
        s.groups = history.groups;
        s.tabs = history.tabs;
    }
    onMount(() => {
        set();
    });
</script>

{#snippet Tab(tab)}
    {#if tab}
        <li class="tab" id={tab.id}>
            <img
                src={tab.image || tab.icon}
                alt=""
                loading="lazy"
                onerror={(e) => (e.target.style.visibility = "hidden")}
            />
            <a
                class="tlink"
                href={tab.url}
                title={tab.url}
                aria-label={tab.url}
                target="_blank"
                rel="noopener noreferrer"
            >
                <p class="tname ellipsis">{tab.name}</p>
            </a>
        </li>
    {/if}
{/snippet}
{#if s.groups.length > 0 || s.tabs.length > 0}
    <div class="head">
        <div>
            <h2>History</h2>
            <button
                class="clear"
                onclick={() => {
                    chrome.runtime
                        .sendMessage({ context: "CLEARHISTORY" })
                        .then(set);
                }}>[Clear history]</button
            >
        </div>
        <div class="nav">
            <a href="#tabs">Tabs</a><a href="#groups">Groups</a>
        </div>
    </div>
    <div class="history">
        <div class="one" id="tabs">
            <h3>Tabs</h3>
            {#each s.tabs as t}
                {@render Tab(t)}
            {/each}
        </div>
        <div class="two" id="groups">
            <h3>Groups</h3>
            {#each s.groups as g}
                <div class="group">
                    <div class="heading">
                        <h4 class="gname ellipsis">
                            {g.name}
                        </h4>
                        <sub
                            >{`(${new Date(g.createdDate).toLocaleString()})`}</sub
                        >
                    </div>
                    {#each g.tabs as t}
                        {@render Tab(t)}
                    {/each}
                </div>
            {/each}
        </div>
    </div>
{:else}
    <p class="note">No History</p>
{/if}

<style>
    .head {
        padding: 1rem;
    }

    .two {
        display: flex;
        flex-direction: column;
        .group {
            margin-bottom: 2rem;
            padding: 0rem 1rem;
        }
    }
    .history {
        display: flex;
        flex-direction: row;
        gap: 2rem;
        padding: 1rem;

        .one,
        .two {
            width: 50%;
            height: 75vh;
            overflow: scroll;
        }
        .one::-webkit-scrollbar,
        .two::-webkit-scrollbar {
            display: unset;
        }
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
        .gname {
            font-size: 1.6rem;
        }
    }

    .tab {
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 0.5rem;
        border-top: 1px solid var(--color-bg);
        /* margin-left: 1.5rem; */
    }
    .tab:hover,
    .tab:focus {
        background-color: light-dark(
            var(--color-white-one),
            var(--color-black-one)
        );
    }

    .tname {
        font-size: 1.4rem;
    }
    .tlink {
        /* display: inline-block; */
        color: inherit;
        /* width: fit-content; */
        text-decoration: none;
        /* color: var(--color-focus); */
    }
    a:hover,
    a:focus {
        text-decoration: underline;
    }
    img {
        width: 2.4rem;
        height: 2.4rem;
        object-fit: contain;
    }

    .clear {
        font-size: 1.3rem;
        color: var(--color-focus);
    }
    .clear:hover {
        text-decoration: underline;
    }

    .note {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    h3 {
        padding: 1rem;
        margin-bottom: 2rem;
    }
    .nav {
        display: none;
    }

    @media (max-width: 600px) {
        .nav {
            display: flex;
            gap: 1rem;
        }
        .history {
            flex-direction: column;
            .one,
            .two {
                width: unset;
                height: unset;
            }
        }
        .head {
            display: flex;
            justify-content: space-between;
            position: sticky;
            top: 7rem;
            background-color: var(--color-bg);
        }
    }
</style>
