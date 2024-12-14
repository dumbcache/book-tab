<script>
    import { fade } from "svelte/transition";
    import closeIcon from "@assets/close.svg?raw";

    let { tab, group } = $props();

    function remove(group, tab) {
        chrome.runtime.sendMessage({
            context: "REMOVE",
            data: {
                group,
                tab,
            },
        });
    }

    function arrange(source, sourceParent, target, targetParent) {
        chrome.runtime.sendMessage({
            context: "ARRANGE",
            data: {
                source,
                sourceParent,
                target,
                targetParent,
            },
        });
    }
</script>

{#if tab}
    <li
        class="tab"
        id={tab.id}
        out:fade={{ duration: 200 }}
        draggable="true"
        ondragstart={(e) => {
            e.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                    sourceParentId: group.id,
                    sourceId: tab.id,
                })
            );
            e.dataTransfer.effectAllowed = "move";
        }}
        ondragover={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            e.currentTarget.style.borderColor = "var(--color-focus)";
        }}
        ondragleave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-bg)";
        }}
        ondrop={(e) => {
            const { sourceId, sourceParentId } = JSON.parse(
                e.dataTransfer.getData("application/json")
            );
            const target = e.currentTarget;
            const source = document.getElementById(sourceId);
            target.parentNode.insertBefore(source, target);
            e.currentTarget.style.borderColor = "var(--color-bg)";
            arrange(sourceId, sourceParentId, tab.id, group.id);
        }}
    >
        <button
            class:hide={group.locked}
            class="close icon"
            onclick={() => {
                remove(group.id, tab.id);
            }}>{@html closeIcon}</button
        >
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

<style>
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

    .tab:hover .close {
        visibility: visible;
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
        transition: transform 0.5s ease;
        transition-delay: 0s;
        transform-origin: center left;
    }
    img:hover {
        transform: scale(7);
        transition-delay: 0.5s;
    }

    .close {
        visibility: hidden;
        flex-shrink: 0;
    }
    .icon {
        width: 2rem;
        height: 2rem;
    }

    .icon:hover :global(svg),
    .icon:focus :global(svg) {
        fill: var(--color-focus);
    }
    .hide,
    .tab:hover .hide {
        visibility: hidden;
    }

    @media (max-width: 600px) {
        img:hover {
            transform: scale(5);
        }
    }
</style>
