import { defineStore } from "pinia";
import {
    OperatorConfig,
    usePermanenceStore,
    ExportablePersistentMacros as Macros,
    wordsParserConsidersReserved,
    wordsParserConsidersReservedIfWhitespaceSurrounded,
    ExportablePersistentMacrosStoreStorage,
} from "./../exporter";
import { v4 as uuidv4 } from "uuid";
import { ref } from "vue";

interface MacroStash {
    macros: Macros;
}

export const useMacrosStore = defineStore("macros", () => {
    const macroStashes = ref(
        {} as {
            [key: string]: MacroStash;
        }
    );
    const lastUpdate = ref(Date.now());

    function updateLastUpdateTimestamp() {
        lastUpdate.value = Date.now();
    }
    /**
     * @returns macro-uuid
     */
    function makeSureMacroAvailable(config: OperatorConfig, trigger: string): string {
        const oldMacroUuidOrNull = getMacroUUID(config, trigger);

        if (oldMacroUuidOrNull != null) {
            // found it, return the uuid
            return oldMacroUuidOrNull;
        }

        const newMacroUUID = uuidv4();
        getMacroStash(config).macros[newMacroUUID] = { output: "", trigger: trigger, created: Date.now() };
        updateLastUpdateTimestamp();

        storeValuesInPermanence(config);

        return newMacroUUID;
    }
    function setOutputForMacro(config: OperatorConfig, trigger: string, output: string) {
        const macroUUID = makeSureMacroAvailable(config, trigger);

        getMacroStash(config).macros[macroUUID].output = output;
        updateLastUpdateTimestamp();

        storeValuesInPermanence(config);
    }
    function removeMacroFromStore(config: OperatorConfig, uuid: string) {
        delete getMacroStash(config).macros[uuid];
        updateLastUpdateTimestamp();

        storeValuesInPermanence(config);
    }
    function triggerIsAllowed(trigger: string): boolean {
        // TODO
        trigger;
        wordsParserConsidersReserved;
        wordsParserConsidersReservedIfWhitespaceSurrounded;

        return false;
    }
    function getMacroUUID(config: OperatorConfig, trigger: string): string | null {
        const stash = getMacroStash(config).macros;
        let resUUIDOrNull = null as string | null;

        availableMacroUUIDs(config).forEach((uuid) => {
            const storedTrigger = stash[uuid].trigger;

            if (storedTrigger == trigger) {
                resUUIDOrNull = storedTrigger;
            }
        });

        return resUUIDOrNull;
    }
    function getMacroStash(config: OperatorConfig): MacroStash {
        const macroStashUuid = config.macrosListUuid;

        // is initialized, return it
        if (Object.keys(macroStashes.value).includes(macroStashUuid)) {
            return macroStashes.value[macroStashUuid];
        }

        // fresh initialization needed
        let macros: Macros = {};

        // call all the constructors once and store results, to make sure that calling a variable constructor while creating another variable doesn't cause empty variable initialization later
        const buffer = {} as Macros;

        const reimport = usePermanenceStore().getMacrosStoreForUUID(macroStashUuid);

        if (reimport && reimport != null) {
            for (const uuid in reimport.macros) {
                const reimportedMacro = reimport.macros[uuid];
                buffer[uuid] = reimportedMacro;
            }
        }

        // overwrite locally stored values
        for (const uuid in buffer) {
            const storage = buffer[uuid];
            macros[uuid] = storage;
        }

        const newStash: MacroStash = {
            macros: macros,
        };
        macroStashes.value[macroStashUuid] = newStash;
        updateLastUpdateTimestamp();

        return newStash;
    }
    function storeValuesInPermanence(config: OperatorConfig) {
        let exp = { macros: {} } as ExportablePersistentMacrosStoreStorage;

        availableMacroUUIDs(config).forEach((macroUUID) => {
            const macroToExport = getMacroStash(config).macros[macroUUID];
            exp.macros[macroUUID] = macroToExport;
        });

        usePermanenceStore().storeMacrosStoreForUUID(config.macrosListUuid, exp);
    }
    function availableMacroUUIDs(config: OperatorConfig): string[] {
        return Object.keys(getMacroStash(config).macros).sort((keyA, keyB) => {
            // append to end of list if is newer
            return getMacroStash(config).macros[keyA].created - getMacroStash(config).macros[keyB].created;
        });
    }
    function availableAllowedMacroTriggers(config: OperatorConfig): string[] {
        const stash = getMacroStash(config).macros;
        let triggers = [] as string[];

        availableMacroUUIDs(config).forEach((uuid) => {
            const trigger = stash[uuid].trigger;

            if (triggerIsAllowed(trigger)) {
                triggers.push(trigger);
            }
        });

        return triggers;
    }

    return {
        lastUpdate,
        triggerIsAllowed,
        makeSureMacroAvailable,
        removeMacroFromStore,
        setOutputForMacro,
        getMacroUUID,
        availableMacroUUIDs,
        availableAllowedMacroTriggers,
    };
});
