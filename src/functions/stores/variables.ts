import { defineStore } from "pinia";
import { Operator } from "./../exporter";

interface StoreType {
    values: { [key: string]: Operator | null };
}

export const useVariablesStore = defineStore("variables", {
    state: (): StoreType => {
        return { values: {} };
    },
    actions: {
        makeSureVariableAvailable(name: string) {
            let val = this.values[name];

            if (val != undefined && val != null && val) {
                // ok, variable is set
            } else {
                this.values[name] = null;
            }
        },
        setOperatorForVariable(name: string, value: Operator | null) {
            this.values[name] = value;
        },
        removeVariableFromStore(name: string) {
            delete this.values[name];
        },
        getVariableContent(name: string): Operator | null {
            let val = this.values[name];

            if (val != undefined && val != null && val) {
                return val;
            } else {
                return null;
            }
        },
    },
    getters: {
        availableVariables(state): string[] {
            return Object.keys(state.values).sort();
        },
    },
});
