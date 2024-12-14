import { checks, fetchRootDir } from "./drive.js";
import { checkRuntimeError, getUserInfo, OAUTH } from "./utils.js";

export const login = async () => {
    chrome.identity.launchWebAuthFlow(
        { url: OAUTH, interactive: true },
        async (redirectURL) => {
            chrome.runtime.lastError && "";
            if (!redirectURL) {
                chrome.runtime.sendMessage(
                    {
                        context: "LOGIN",
                        status: 500,
                    },
                    checkRuntimeError
                );
                console.log("redirect failed");
                return;
            }
            const url = new URL(redirectURL);
            const token = url.hash.split("&")[0].split("=")[1];
            const { email } = await getUserInfo(token);
            await chrome.storage.local.set({ user: email, token });
            checks(token);
            console.log("session logged in");

            // if (!active) {
            chrome.runtime.sendMessage(
                {
                    context: "CHANGE",
                },
                checkRuntimeError
            );
            // }
        }
    );
};

export const logout = async () => {
    await chrome.storage.local.set({ user: "", lastSynced: null, root: "" });
    chrome.runtime.sendMessage(
        {
            context: "CHANGE",
        },
        checkRuntimeError
    );
    console.log("session logged out");
};
