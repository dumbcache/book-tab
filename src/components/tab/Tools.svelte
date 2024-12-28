<script>
    import closeIcon from "@assets/close.svg?raw";
    import allIcon from "@assets/all.svg?raw";
    import oneIcon from "@assets/one.svg?raw";
    import leftIcon from "@assets/left.svg?raw";
    import rightIcon from "@assets/right.svg?raw";
    import leftrightIcon from "@assets/leftright.svg?raw";

    function handler(action) {
        chrome.runtime.sendMessage({ context: "CONTEXTMENU", action });
    }
</script>

<div class="tools">
    <button
        class="create icon"
        title="Create a copy of this tab"
        onclick={() => handler("create")}
    >
        {@html closeIcon}
    </button>
    <button
        class="icon"
        title="Send only this tab to BookTab"
        onclick={() => handler("sendOne")}>{@html oneIcon}</button
    >
    <button
        class="icon"
        title="Send all tabs to BookTab"
        onclick={() => handler("sendAll")}>{@html allIcon}</button
    >
    <button
        class="icon"
        title="Send all tabs except this tab to BookTab"
        onclick={() => handler("sendExcept")}>{@html leftrightIcon}</button
    >
    <button
        class="icon"
        title="Send all tabs on left to BookTab"
        onclick={() => handler("sendLeft")}>{@html leftIcon}</button
    >
    <button
        class="icon"
        title="Send all tabs on right to BookTab"
        onclick={() => handler("sendRight")}>{@html rightIcon}</button
    >
</div>

<style>
    .tools {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2rem;
    }

    .create {
        rotate: 45deg;
        /* 
        &:hover :global(svg) {
            fill: var(--color-focus);
        } */
    }
</style>
