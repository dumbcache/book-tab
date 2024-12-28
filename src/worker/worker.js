import {
    installHandler,
    startupHandler,
    contextMenuHandler,
    messageHandler,
    storageHandler,
} from "./utils.js";

try {
    chrome.runtime.onInstalled.addListener(installHandler);
    chrome.runtime.onStartup.addListener(startupHandler);
    chrome.runtime.onSuspend.addListener(() => {});
    chrome.runtime.setUninstallURL("https://www.pocketdrive.in");
    chrome.storage.onChanged.addListener(storageHandler);
    chrome.contextMenus.onClicked.addListener(contextMenuHandler);
    chrome.runtime.onMessage.addListener(messageHandler);
} catch (error) {
    console.warn("Service Worker error:", error);
}
