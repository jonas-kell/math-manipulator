<script setup lang="ts">
    import InputToOperatorParser from "./InputToOperatorParser.vue";
    import KatexRenderer from "./KatexRenderer.vue";
    import { Operator, useVariablesStore } from "./../functions";
    import { v4 as uuidv4 } from "uuid";
    import { computed, ref } from "vue";
    const variablesStore = useVariablesStore();

    const props = defineProps<{
        uuid: string;
    }>();
    variablesStore.setUUIDForPersistence(props.uuid);

    const names = computed(() => {
        return variablesStore.availableVariables;
    });

    function setOperator(varName: string, op: Operator | null) {
        // set value:
        variablesStore.setOperatorForVariable(varName, op);

        // bust cache
        updated.value = Date.now();
    }
    function removeVariableReference(varName: string) {
        variablesStore.removeVariableFromStore(varName);
    }
    type Draw = {
        name: string;
        renderOperator: boolean;
        katex: string;
        parserUUID: string;
        rendererUUID: string;
    }[];
    const updated = ref(Date.now());
    const drawSource = computed((): Draw => {
        // access this cache busting variable to trigger recalculations
        updated.value;

        let res = [] as Draw;
        names.value.forEach((name) => {
            const op = variablesStore.getVariableContent(name);
            const variableUUID = variablesStore.getVariableUUID(name) ?? ""; // must always be set, otherwise worse things fail
            let hasOp = !!op && op != null && op != undefined;
            let katex = hasOp ? (op as unknown as Operator).getFormulaString() : "";
            if (op && op != null && op != undefined) {
                hasOp = true;
                katex = op.getFormulaString();
            }

            let newElem = {
                name: name,
                renderOperator: hasOp,
                katex: katex,
                parserUUID: variableUUID, // TODO this needs to be persistent
                rendererUUID: uuidv4(),
            };

            res.push(newElem);
        });
        return res;
    });
    const skipEffect = ref(false);
</script>

<template>
    <div>
        <h3 style="margin-bottom: 0.2em">Variables:</h3>
        <table>
            <template v-for="draw in drawSource">
                <tr>
                    <td>
                        <span style="display: inline">
                            <b>{{ draw.name }}:</b>
                        </span>
                    </td>
                    <td>
                        <InputToOperatorParser
                            @parsed="(a: Operator | null) => {
                                if (skipEffect) {
                                    skipEffect = false;
                                } else {
                                    setOperator(draw.name, a)
                                }
                            }"
                            @loading-value="() => (skipEffect = true)"
                            :textarea="false"
                            :key="draw.parserUUID"
                            :uuid="draw.parserUUID"
                        />
                    </td>
                    <td>
                        <button class="delete-button" @click="removeVariableReference(draw.name)">x</button>
                    </td>
                    <td :key="draw.rendererUUID">
                        <KatexRenderer
                            v-if="draw.renderOperator"
                            :katex-input="draw.katex"
                            :uuid-refs-to-process="[]"
                            @selected="() => {}"
                            :renderer-uuid="draw.rendererUUID"
                        />
                    </td>
                </tr>
            </template>
        </table>
    </div>
</template>

<style scoped>
    .delete-button {
        background-color: #f2f2f2;
        border: 1px solid #ccc;
        color: red;
        font-size: 0.8em;
        border-radius: 10%;
        box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
    }
</style>
<style>
    /* render the latex in the table smaller */
    td .katex-display {
        margin: 0;
    }
</style>
