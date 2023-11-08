import { defineStore } from "pinia";
import { Operator } from "./../exporter";

interface StoreType {
    values: { [key: string]: number };
    test: Operator | null;
}

export const useVariablesStore = defineStore("variables", {
    state: (): StoreType => {
        return { values: {}, test: null };
    },
    actions: {
        setValueForVariable(name: string, value: number) {
            this.values[name] = value;
        },
        removeVariableFromStore(name: string) {
            delete this.values[name];
        },
        getVariable(name: string): number | null {
            let val = this.values[name];

            if (val != undefined) {
                return val;
            } else {
                return null;
            }
        },
    },
});
