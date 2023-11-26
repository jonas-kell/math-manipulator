import { defineStore } from "pinia";
import { Operator } from "./../exporter";
import { v4 as uuidv4 } from "uuid";
import { vscodeApiInstance, registerUpdateHandler } from "./vscodeApi";
import { ref } from "vue";

export interface PersistentLineStorage {
    operator: Operator | null;
    childUUID: string;
    selectionUUID: string;
    operatorParserUUID: string;
    variableNameInputUUID: string;
    mode: string;
}

interface ExportablePersistedLineStorage {
    operator: string | null;
    childUUID: string;
    selectionUUID: string;
    operatorParserUUID: string;
    variableNameInputUUID: string;
    mode: string;
}

export interface PersistentInputStorage {
    textValue: string;
}

export interface PersistentVariable {
    op: Operator | null;
    created: number;
    uuid: string;
}
export interface PersistentVariablesStoreStorage {
    variables: { [key: string]: PersistentVariable };
}

interface ExportableVariable {
    op: string | null;
    created: number;
    uuid: string;
}
interface ExportablePersistentVariablesStoreStorage {
    variables: { [key: string]: ExportableVariable };
}

export enum PermanenceStorageModes {
    session = "session",
    vscode = "vscode",
    memory = "memory",
}

export const usePermanenceStore = defineStore("permanence", () => {
    const permanenceHasUpdatedHandlers = ref([] as (() => void)[]);
    const mode = ref(PermanenceStorageModes[(process.env.VITE_PERMANENCE ?? "session") as PermanenceStorageModes]);
    const memoryStorage = ref({} as { [key: string]: string });

    function setStorageModeTo(val: PermanenceStorageModes) {
        mode.value = val;
    }
    function storeLineForUUID(uuid: string, values: PersistentLineStorage) {
        const toStore: ExportablePersistedLineStorage = {
            operator: values.operator == null ? null : values.operator.getSerializedStructure(true),
            childUUID: values.childUUID,
            selectionUUID: values.selectionUUID,
            operatorParserUUID: values.operatorParserUUID,
            variableNameInputUUID: values.variableNameInputUUID,
            mode: values.mode,
        };
        abstractStoreImplementationSet(uuid, JSON.stringify(toStore));
    }
    function getLineForUUID(uuid: string): PersistentLineStorage | null {
        const loadedState = abstractStoreImplementationGet(uuid);

        let res = null;
        if (loadedState && loadedState != null && loadedState != undefined) {
            const loadedObject = JSON.parse(loadedState) as ExportablePersistedLineStorage;
            res = {
                operator:
                    loadedObject.operator != null && loadedObject.operator != undefined
                        ? Operator.generateStructure(loadedObject.operator, true)
                        : null,
                childUUID:
                    loadedObject.childUUID != null && loadedObject.childUUID != undefined ? loadedObject.childUUID : uuidv4(),
                selectionUUID:
                    loadedObject.selectionUUID != null && loadedObject.selectionUUID != undefined
                        ? loadedObject.selectionUUID
                        : uuidv4(),
                operatorParserUUID:
                    loadedObject.operatorParserUUID != null && loadedObject.operatorParserUUID != undefined
                        ? loadedObject.operatorParserUUID
                        : uuidv4(),
                variableNameInputUUID:
                    loadedObject.variableNameInputUUID != null && loadedObject.variableNameInputUUID != undefined
                        ? loadedObject.variableNameInputUUID
                        : uuidv4(),
                mode: loadedObject.mode != null && loadedObject.mode != undefined ? loadedObject.mode : uuidv4(),
            } as PersistentLineStorage;
        }

        return res;
    }
    function storeInputForUUID(uuid: string, values: PersistentInputStorage) {
        const toStore: PersistentInputStorage = {
            textValue: values.textValue,
        };
        abstractStoreImplementationSet(uuid, JSON.stringify(toStore));
    }
    function getInputForUUID(uuid: string): PersistentInputStorage | null {
        const loadedState = abstractStoreImplementationGet(uuid);

        let res = null;
        if (loadedState && loadedState != null && loadedState != undefined) {
            const loadedObject = JSON.parse(loadedState) as PersistentInputStorage;
            res = {
                textValue: loadedObject.textValue != null && loadedObject.textValue != undefined ? loadedObject.textValue : "",
            } as PersistentInputStorage;
        }

        return res;
    }
    function storeVariablesStoreForUUID(uuid: string, values: PersistentVariablesStoreStorage) {
        let variables = {} as { [key: string]: ExportableVariable };

        for (const key in values.variables) {
            const element = values.variables[key];

            if (element != null && element != undefined) {
                variables[key] = {
                    uuid: element.uuid,
                    created: element.created,
                    op: element.op != null && element.op != undefined ? element.op.getSerializedStructure(true) : null,
                } as ExportableVariable;
            }
        }

        const toStore: ExportablePersistentVariablesStoreStorage = {
            variables: variables,
        };
        abstractStoreImplementationSet(uuid, JSON.stringify(toStore));
    }
    function getVariablesStoreForUUID(uuid: string): PersistentVariablesStoreStorage | null {
        const loadedState = abstractStoreImplementationGet(uuid);

        let res = null;
        if (loadedState && loadedState != null && loadedState != undefined) {
            const loadedObject = JSON.parse(loadedState) as ExportablePersistentVariablesStoreStorage;

            let variables = {} as { [key: string]: PersistentVariable };
            for (const key in loadedObject.variables) {
                const element = loadedObject.variables[key];

                if (element != null && element != undefined) {
                    variables[key] = {
                        uuid: element.uuid != null && element.uuid != undefined ? element.uuid : uuidv4(),
                        created: element.created != null && element.created != undefined ? element.created : Date.now(),
                        op: element.op != null && element.op != undefined ? Operator.generateStructure(element.op, true) : null,
                    } as PersistentVariable;
                }
            }

            res = {
                variables: variables,
            } as PersistentVariablesStoreStorage;
        }

        return res;
    }
    function addPermanenceHasUpdatedHandler(handler: () => void) {
        permanenceHasUpdatedHandlers.value.push(handler);
    }
    function triggerPermanenceHasUpdatedHandlers() {
        permanenceHasUpdatedHandlers.value.forEach((handler) => {
            handler();
        });
    }
    // register VSCODE updates to cascade up
    registerUpdateHandler(() => {
        triggerPermanenceHasUpdatedHandlers();
    });

    function abstractStoreImplementationSet(uuid: string, content: string) {
        switch (mode.value) {
            case PermanenceStorageModes.session:
                sessionStorage.setItem(uuid, content);
                break;
            case PermanenceStorageModes.memory:
                memoryStorage.value[uuid] = content;
                break;
            case PermanenceStorageModes.vscode:
                vscodeApiInstance()?.postMessage({ type: "change", uuid: uuid, content: content });
                break;
            default:
                throw Error(`Permanence mode ${mode} not implemented`);
        }
    }
    function abstractStoreImplementationGet(uuid: string): string | null {
        switch (mode.value) {
            case PermanenceStorageModes.session:
                return sessionStorage.getItem(uuid);
            case PermanenceStorageModes.memory:
                const val = memoryStorage.value[uuid];
                if (val != undefined) {
                    return val;
                }
                return null;
            case PermanenceStorageModes.vscode:
                const comm = vscodeApiInstance()?.getState();
                if (comm != undefined) {
                    const selection = comm[uuid];
                    if (selection != undefined) {
                        return selection as string;
                    }
                }
                return null;
            default:
                throw Error(`Permanence mode ${mode} not implemented`);
        }
    }
    function dumpSessionStorageObjectToString(mainUuid: string, variablesUuid: string): string {
        const keys = Object.keys(sessionStorage);

        // Create an object to store all key-value pairs from sessionStorage
        const sessionData = {} as { [key: string]: string };

        // Iterate through the keys and store corresponding values in sessionData
        keys.forEach((key) => {
            sessionData[key] = sessionStorage.getItem(key) as string;
        });

        const newMainUuid = uuidv4();
        const newVariablesUuid = uuidv4();

        return JSON.stringify({
            title: "",
            description: "",
            storage: sessionData,
            showVariables: false,
            mainUuid: newMainUuid,
            variablesUuid: newVariablesUuid,
        })
            .replace(mainUuid, newMainUuid)
            .replace(variablesUuid, newVariablesUuid);
    }

    return {
        storeLineForUUID,
        storeInputForUUID,
        storeVariablesStoreForUUID,
        getLineForUUID,
        getInputForUUID,
        getVariablesStoreForUUID,
        addPermanenceHasUpdatedHandler,
        setStorageModeTo,
        abstractStoreImplementationSet,
        dumpSessionStorageObjectToString,
    };
});
