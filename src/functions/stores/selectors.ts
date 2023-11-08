import { defineStore } from "pinia";

type Handler = (UUIDRef: string) => {};

interface StoreType {
    registeredHandlers: { [key: string]: Handler };
}

export const useSelectFunctionStore = defineStore("selectors", {
    state: (): StoreType => {
        return { registeredHandlers: {} };
    },
    actions: {
        addHandlerToStore(rendererUUID: string, callback: Handler) {
            this.registeredHandlers[rendererUUID] = callback;
        },
        removeHandlerFromStore(rendererUUID: string) {
            delete this.registeredHandlers[rendererUUID];
        },
        callHandlerCallback(rendererUUID: string, UUIDRefToCallWith: string) {
            let func = this.registeredHandlers[rendererUUID];

            if (func != undefined) {
                (func as Handler)(UUIDRefToCallWith);
            } else {
                console.error("There was no handler registered...", rendererUUID, UUIDRefToCallWith);
            }
        },
    },
});
