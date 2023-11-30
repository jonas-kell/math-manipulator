type ApiInstance = { postMessage: (obj: any) => {}; setState: (obj: any) => {}; getState(): any };

let instance = null as ApiInstance | null;

export function vscodeApiInstance(): ApiInstance | null {
    if (instance != null) {
        return instance;
    }
    let vscode = undefined;
    if ((process.env.VITE_PERMANENCE ?? "session") == "vscode") {
        vscode = (window as any).acquireVsCodeApi;
    }
    if (vscode != undefined) {
        const res = vscode();
        if (res != null && res != undefined) {
            instance = res;
            return instance;
        }
    }
    return null;
}

let updateHandler = () => {};
export function registerUpdateHandler(handler: () => void) {
    updateHandler = handler;
}

let atLeastOneUpdateReceivedHandler = () => {};
// we need to set the html. This starts the vue process.
// We then need to let the vue application finish initializing, so that it has the ability to receive messages
// BUT at that point do not yet render anything important, because there hasn't yet been an update message received, the state is still empty.
// Only after this, has been received once, we can do further things.
export function registerAtLeastOneUpdateReceivedHandler(handler: () => void) {
    atLeastOneUpdateReceivedHandler = handler;
}

if ((process.env.VITE_PERMANENCE ?? "session") == "vscode") {
    window.addEventListener("message", (event) => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case "update":
                vscodeApiInstance()?.setState(message.content);
                updateHandler(); // inform registered handler about changes
                break;
            case "atLeastOneUpdateSent":
                atLeastOneUpdateReceivedHandler(); // inform registered handler about changes
                break;
            default:
                throw Error(`Handling for Message of type ${message.type} is not implemented.`);
        }
    });
}
