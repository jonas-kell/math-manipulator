type ApiInstance = { postMessage: (obj: any) => {}; setState: (obj: any) => {}; getState(): any };

let instance = null as ApiInstance | null;

export function vscodeApiInstance(): ApiInstance | null {
    if (instance != null) {
        return instance;
    }
    const vscode = (window as any).acquireVsCodeApi;
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

window.addEventListener("message", (event) => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
        case "update":
            vscodeApiInstance()?.setState(message.content);
            updateHandler(); // inform registered handler about changes
            break;
        default:
            throw Error(`Handling for Message of type ${message.type} is not implemented.`);
    }
});
