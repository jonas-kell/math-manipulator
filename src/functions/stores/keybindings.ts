import { defineStore } from "pinia";
import { ref } from "vue";

type Handler = (keyCode: string) => void;

interface Handlers {
    [key: string]: Handler;
}

export const useKeybindingsStore = defineStore("keybindings", () => {
    const handlers = ref({} as Handlers);
    const activeUUID = ref(null as string | null);

    function registerHandler(uuid: string, handler: Handler) {
        handlers.value[uuid] = handler;
    }
    function unRegisterHandler(uuid: string) {
        delete handlers.value[uuid];
        if (activeUUID.value == uuid) {
            unSetActiveUUID();
        }
    }
    function setActiveUUID(uuid: string) {
        activeUUID.value = uuid;
    }
    function unSetActiveUUID() {
        activeUUID.value = null;
    }

    // add global event listener
    window.addEventListener("keydown", (e: KeyboardEvent) => {
        if (activeUUID.value != null) {
            const handler = handlers.value[activeUUID.value];

            if (handler != null && handler != undefined) {
                e.preventDefault();
                e.stopPropagation();
                handler(e.key);
            }
        }
    });

    return {
        registerHandler,
        unRegisterHandler,
        setActiveUUID,
        unSetActiveUUID,
    };
});
