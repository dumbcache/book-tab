import { checks } from "./drive.js";
import { checkRuntimeError, getUserInfo, OAUTH } from "./utils.js";

export const login = async () => {
    const { user } = await chrome.storage.local.get("user");
    let url = OAUTH;
    if (user) url = OAUTH + `&login_hint=${user}`;

    chrome.identity.launchWebAuthFlow(
        { url: url, interactive: true },
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
            checks(token, email);
            console.log("session logged in");

            // }
        }
    );
};

export const logout = async () => {
    await chrome.storage.local.set({
        user: "",
        token: "",
        lastSynced: null,
        session: null,
    });
    chrome.runtime.sendMessage(
        {
            context: "CHANGE",
        },
        checkRuntimeError
    );
    console.log("session logged out");
};
