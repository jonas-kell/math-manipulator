import { setActivePinia, createPinia } from "pinia";
import { PermanenceStorageModes, usePermanenceStore, useMacrosStore, OperatorConfig } from "../functions";

// creates a fresh pinia and makes it active
// so it's automatically picked up by any useStore() call
// without having to pass it to it: `useStore(pinia)`
export default (macros: { [key: string]: string } = {}, config: OperatorConfig | undefined = undefined) => {
    setActivePinia(createPinia());
    usePermanenceStore().setStorageModeTo(PermanenceStorageModes.memory);

    const macroTriggers = Object.keys(macros);
    if (macroTriggers.length != 0) {
        if (config == undefined) {
            throw Error("To use macros in tests you need to supply a config");
        }

        macroTriggers.forEach((trigger) => {
            const template = macros[trigger];

            const uuid = useMacrosStore().makeSureMacroAvailable(config, trigger);
            useMacrosStore().setOutputForMacro(config, uuid, template);
        });
    }
};
