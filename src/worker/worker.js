import {
    // initContextMenus,
    installHandler,
    remove,
    open,
    // isSystemTab,
    sendAll,
    sendExcept,
    sendLeft,
    sendOne,
    sendRight,
    startupHandler,
    arrange,
    rename,
    lock,
    display,
} from "./utils.js";
import { login, logout } from "./connection.js";

try {
    chrome.runtime.onInstalled.addListener(installHandler);
    chrome.runtime.onStartup.addListener(startupHandler);
    chrome.runtime.onSuspend.addListener(() => {});
    chrome.runtime.setUninstallURL("https://www.pocketdrive.in");
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

    // chrome.storage.onChanged.addListener(async (changes) => {
    //     try {
    //         if (changes.active) {
    //             initContextMenus();
    //         }
    //         console.log(changes);
    //     } catch (error) {
    //         console.warn("Storage onChange error", error);
    //     }
    // });

    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
        try {
            switch (info.menuItemId) {
                case "create":
                    // chrome.sidePanel.open({ windowId: tab.windowId });
                    sendOne(tab, info.srcUrl, false);
                    return;
                case "display":
                    display();
                    return;

                case "sendOne":
                    sendOne(tab, info?.srcUrl, true);
                    return;
                case "sendLink":
                    chrome.tabs
                        .create({
                            url: info.linkUrl,
                            active: false,
                            pinned: true,
                        })
                        .then((p) => {
                            chrome.tabs.onUpdated.addListener(
                                function onTabUpdated(tid, changeInfo, t) {
                                    if (
                                        p.id === tid &&
                                        changeInfo.status === "complete"
                                    ) {
                                        chrome.tabs.get(tid, (tt) => {
                                            sendOne(tt, "", true);
                                        });
                                        chrome.tabs.onUpdated.removeListener(
                                            onTabUpdated
                                        );
                                    }
                                }
                            );
                        });

                    return;
                case "sendAll":
                    sendAll();
                    return;
                case "sendExcept":
                    sendExcept(tab);
                    return;
                case "sendLeft":
                    sendLeft(tab);
                    return;
                case "sendRight":
                    sendRight(tab);
                    return;
                case "clearHistory":
                    chrome.storage.local.set({
                        history: { groups: [], tabs: [] },
                    });
                    return;
            }
        } catch (error) {
            console.warn("ContextMenu error:", error);
        }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
            // if (sender.tab &&isSystemTab(sender.tab.url)) return;
            if (message.context === "LOGIN") {
                login();
                return;
            }
            if (message.context === "LOGOUT") {
                logout();
                return;
            }
            if (message.context === "DISPLAY") {
                display();
                return;
            }
            if (message.context === "OPEN") {
                const { group } = message.data;
                open(group);
                return;
            }
            if (message.context === "CREATE") {
                chrome.tabs
                    .query({ active: true, lastFocusedWindow: true })
                    .then((ts) => {
                        sendOne(ts[0], "", false);
                    });
                return;
            }
            if (message.context === "REMOVE") {
                const { group, tab } = message.data;
                remove(group, tab).then(() => {
                    chrome.runtime.sendMessage({
                        context: "CHANGE",
                    });
                });
                return;
            }
            if (message.context === "ARRANGE") {
                arrange(message.data);
                return;
            }
            if (message.context === "RENAME") {
                const { group, name } = message.data;
                rename(group, name);
                return;
            }
            if (message.context === "LOCK") {
                const { group, locked } = message.data;
                lock(group, locked);
                return;
            }
            if (message.context === "CLEARHISTORY") {
                chrome.storage.local
                    .set({
                        history: { groups: [], tabs: [] },
                    })
                    .then(sendResponse);
                return true;
            }
        } catch (error) {
            console.warn(`${message.context} error: ${error.cause}`);
            sendResponse({
                context: message.context,
                status: 500,
                error,
            });
        }
    });
} catch (error) {
    console.warn("Service Worker error:", error);
}
