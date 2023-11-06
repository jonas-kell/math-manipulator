<script setup lang="ts">
    import { computed, ref, watch } from "vue";
    import { Operator, EmptyArgument } from "../functions";
    import KatexRenderer from "./KatexRenderer.vue";
    import InputToOperatorParser from "./InputToOperatorParser.vue";
    const VITE_MODE = import.meta.env.MODE;

    interface EffectMeasure {
        hasEffect: boolean;
        result: Operator | null;
    }

    // input to the equation line
    const props = defineProps<{
        operator: Operator;
    }>();
    const katexInput = computed(() => {
        return props.operator.getFormulaString();
    });
    const uuidRefsToProcess = computed(() => {
        return props.operator.getContainedUUIDRefs();
    });
    const selectionUUID = ref("");
    const selectedOperator = ref(null as Operator | null);
    const selectOperator = (id: string) => {
        resetControlPanel();
        selectionUUID.value = id;
        selectedOperator.value = props.operator.getOperatorByUUID(selectionUUID.value);
    };

    // structure of the operations line
    enum MODES {
        NONE,
        REPLACEMENT,
        STRUCTURAL_VARIABLE_DEFINITION,
        SHOW_LATEX,
        SHOW_STRUCTURE,
    }
    const mode = ref(MODES.NONE);
    const availableModifications = computed((): string[] => {
        if (selectedOperator.value == null) {
            return [];
        }
        return [
            "getCopyWithNumbersFolded", // Modification style Method available for all instances of Operator
            ...Object.getOwnPropertyNames(Object.getPrototypeOf(selectedOperator.value)).filter((name) =>
                name.includes("MODIFICATION")
            ),
        ];
    });

    // output to the next line
    const outputOperator = ref(null as null | Operator);
    function resetControlPanel() {
        outputOperator.value = null;
        mode.value = MODES.NONE;
    }
    watch(props, () => {
        resetControlPanel();
        selectionUUID.value = "";
        selectedOperator.value = null;
        replaceWithOperator.value = null;
    });

    // modification triggers to the current line
    const replaceButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.REPLACEMENT;
        replaceWithCallback();
    };
    const replaceWithOperator = ref(null as Operator | null);
    const replaceWithCallback = () => {
        if (replaceWithOperator.value == null) {
            outputOperator.value = props.operator.getCopyWithReplaced(selectionUUID.value, new EmptyArgument());
        } else {
            outputOperator.value = props.operator.getCopyWithReplaced(selectionUUID.value, replaceWithOperator.value as Operator);
        }
    };
    const structuralVariableDefinitionButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.STRUCTURAL_VARIABLE_DEFINITION;
        structuralVariableDefinitionWithCallback();
    };
    const structuralVariableDefinitionName = ref("A");
    watch(structuralVariableDefinitionName, () => {
        structuralVariableDefinitionWithCallback();
    });
    const structuralVariableDefinitionWithCallback = () => {
        outputOperator.value = props.operator.getCopyWithPackedIntoStructuralVariable(
            structuralVariableDefinitionName.value == "" ? "A" : structuralVariableDefinitionName.value,
            selectionUUID.value
        );
    };
    const actionsHaveAnyEffectAndTheirResults = computed(() => {
        let res = {} as { [key: string]: EffectMeasure };

        availableModifications.value.forEach((action) => {
            if (selectedOperator.value != null) {
                // as the `action` was extracted from filtered `getOwnPropertyNames` or manually inserted, this is should always be a valid method
                let actionResult = (selectedOperator.value as Operator as any)[action]() as Operator;

                // only consider actions that change anything applicable
                if (Operator.assertOperatorsEquivalent(actionResult, selectedOperator.value as Operator, false)) {
                    res[action] = {
                        hasEffect: false,
                        result: null,
                    };
                } else {
                    res[action] = {
                        hasEffect: true,
                        result: actionResult,
                    };
                }
            }
        });

        return res;
    });
    const modificationAction = (action: string) => {
        resetControlPanel();

        // get the result from the modification cache and output if it has any effect
        if (selectedOperator.value != null) {
            const resultFromCachedExecutedOperations = actionsHaveAnyEffectAndTheirResults.value[action];
            if (resultFromCachedExecutedOperations != undefined && resultFromCachedExecutedOperations) {
                if (resultFromCachedExecutedOperations.hasEffect && resultFromCachedExecutedOperations.result != null) {
                    outputOperator.value = props.operator.getCopyWithReplaced(
                        selectionUUID.value,
                        resultFromCachedExecutedOperations.result
                    );
                    return;
                }
            }
        }
        console.error("Something fell through, should not be executed right now");
    };
    const showLatexExportButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.SHOW_LATEX;
    };
    const showExportStructureButtonAction = () => {
        resetControlPanel();
        mode.value = MODES.SHOW_STRUCTURE;
    };
</script>

<template>
    <KatexRenderer :katex-input="katexInput" :uuid-refs-to-process="uuidRefsToProcess" @selected="selectOperator" />

    <template v-if="selectionUUID != '' && selectedOperator != null">
        <button @click="replaceButtonAction" style="margin-right: 0.2em">Replace</button>
        <button @click="structuralVariableDefinitionButtonAction" style="margin-right: 0.2em">Define Structural Variable</button>
        <button
            @click="modificationAction(mod)"
            v-for="mod in availableModifications"
            :disabled="!(actionsHaveAnyEffectAndTheirResults[mod].hasEffect ?? false)"
            style="margin-right: 0.2em"
        >
            {{ mod.replace("MODIFICATION", "").replace("getCopyWithNumbersFolded", "Fold Numbers") }}
        </button>
        <button @click="showLatexExportButtonAction" style="margin-right: 0.2em; float: right">Show Latex</button>
        <button @click="showExportStructureButtonAction" style="margin-right: 0.2em; float: right">Show Export Structure</button>
        <InputToOperatorParser
            v-show="mode == MODES.REPLACEMENT"
            @parsed="(a: Operator | null) => { 
                replaceWithOperator = a; 
                replaceWithCallback() 
            }"
            style="margin-top: 0.5em"
        />
        <input
            v-show="mode == MODES.STRUCTURAL_VARIABLE_DEFINITION"
            type="text"
            v-model="structuralVariableDefinitionName"
            style="margin-top: 0.5em; width: 100%"
        />
        <pre v-if="mode == MODES.SHOW_STRUCTURE">{{ JSON.parse(selectedOperator.getSerializedStructure(false)) }}</pre>
        <template v-if="mode == MODES.SHOW_LATEX">
            <pre>{{ selectedOperator.getExportFormulaString() }}</pre>
            <pre v-if="mode == MODES.SHOW_LATEX && VITE_MODE == 'development'">{{
                {
                    latexPasteableToJs: selectedOperator.getExportFormulaString(),
                }
            }}</pre>
        </template>
    </template>

    <EquationLine v-if="outputOperator != null" :operator="(outputOperator as Operator)" />
</template>
