import { defineStore } from "pinia";
import { Operator } from "./../exporter";

interface StoreType {
    values: { [key: string]: { op: Operator | null; created: number } };
}

export const useVariablesStore = defineStore("variables", {
    state: (): StoreType => {
        return { values: {} };
    },
    actions: {
        makeSureVariableAvailable(name: string, skipVariablePurge: boolean = false) {
            if (!skipVariablePurge) {
                this.purgeLastElementsWithNamesLeadingUpToThis(name);
            }

            let val = this.values[name];

            if (val != undefined && val != null && val) {
                // ok, variable is set
            } else {
                // There NEEDS to be a new creation
                this.values[name] = { op: null, created: Date.now() };
            }
        },
        purgeLastElementsWithNamesLeadingUpToThis(name: string) {
            // when typing e.g. the variable "asdf", The variables "a" "as" "asd" get created and then linger
            // also when deleting characters, leaves a trail behind. So creating "asd" also treats "asdX"
            // deletes all variables with names that are substrings of the just created variable, that have been created not more than half a second ago

            this.availableVariables.forEach((iterName) => {
                if ((name.startsWith(iterName) && name != iterName) || iterName.substring(0, iterName.length - 1) == name) {
                    if (Date.now() - this.values[iterName].created < 600) {
                        this.removeVariableFromStore(iterName);
                    }
                }
            });
        },
        setOperatorForVariable(name: string, value: Operator | null, skipVariablePurge: boolean = false) {
            this.makeSureVariableAvailable(name, skipVariablePurge);
            this.values[name].op = value;
        },
        removeVariableFromStore(name: string) {
            delete this.values[name];
        },
        getVariableContent(name: string): Operator | null {
            let val = this.values[name];

            if (val != undefined && val != null && val) {
                return val.op;
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
