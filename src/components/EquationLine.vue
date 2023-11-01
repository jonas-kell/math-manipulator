<script setup lang="ts">
    import { computed, ref, watch } from "vue";
    import { EmptyArgument, Operator } from "../functions/operator";
    import KatexRenderer from "./KatexRenderer.vue";
    import InputToOperatorParser from "./InputToOperatorParser.vue";

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
    }
    const mode = ref(MODES.NONE);
    const availableModifications = computed((): string[] => {
        if (selectedOperator.value == null) {
            return [];
        }
        return Object.getOwnPropertyNames(Object.getPrototypeOf(selectedOperator.value)).filter((name) =>
            name.includes("MODIFICATION")
        );
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
    const structuralVariableDefinitionName = ref("");
    watch(structuralVariableDefinitionName, () => {
        structuralVariableDefinitionWithCallback();
    });
    const structuralVariableDefinitionWithCallback = () => {
        outputOperator.value = props.operator.getCopyWithPackedIntoStructuralVariable(
            structuralVariableDefinitionName.value == "" ? "A" : structuralVariableDefinitionName.value,
            selectionUUID.value
        );
    };
    const foldButtonAction = () => {
        resetControlPanel();

        if (selectedOperator.value != null) {
            outputOperator.value = props.operator.getCopyWithReplaced(
                selectionUUID.value,
                selectedOperator.value.getCopyWithNumbersFolded() as Operator
            );
        } else {
            console.error("Should not be possible. Operator is null");
        }
    };
    const modificationAction = (action: string) => {
        resetControlPanel();

        if (selectedOperator.value != null) {
            outputOperator.value = props.operator.getCopyWithReplaced(
                // as the `action` was extracted from filtered `getOwnPropertyNames` this is should always be successful
                selectionUUID.value,
                (selectedOperator.value as any)[action]() as Operator
            );
        } else {
            console.error("Should not be possible. Operator is null");
        }
    };
</script>

<template>
    <KatexRenderer :katex-input="katexInput" :uuid-refs-to-process="uuidRefsToProcess" @selected="selectOperator" />

    <template v-if="selectionUUID != '' && selectedOperator != null">
        <button @click="replaceButtonAction" style="margin-right: 0.2em">Replace</button>
        <button @click="structuralVariableDefinitionButtonAction" style="margin-right: 0.2em">Define Structural Variable</button>
        <button @click="foldButtonAction" style="margin-right: 0.2em">Fold Numbers</button>
        <button @click="modificationAction(mod)" v-for="mod in availableModifications" style="margin-right: 0.2em">
            {{ mod.replace("MODIFICATION", "") }}
        </button>
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
    </template>

    <EquationLine v-if="outputOperator != null" :operator="(outputOperator as Operator)" />
    <!-- <template v-if="outputOperator != null">
        <pre>{{ JSON.parse(outputOperator.getSerializedStructure()) }}</pre>
    </template> -->
    <!-- <template v-if="outputOperator != null">
        <pre>{{ { latex: outputOperator.getExportFormulaString() } }}</pre>
    </template> -->
</template>
