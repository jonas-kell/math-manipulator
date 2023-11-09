<script setup lang="ts">
    import EquationLine from "./components/EquationLine.vue";
    import VariableList from "./components/VariableList.vue";
    import InputToOperatorParser from "./components/InputToOperatorParser.vue";
    import { Operator } from "./functions";
    import { computed, onBeforeMount, ref, watch } from "vue";
    import { v4 as uuidv4 } from "uuid";
    import { PersistentLineStorage, usePermanenceStore } from "./functions";

    const skipParsedEffect = ref(false);
    const parsedOperator = ref(null as Operator | null);
    const firstLineUuid = ref(uuidv4());
    const operatorParserUUID = ref(uuidv4());
    const mainUUID = "MAIN_UUID";
    const variableListUUID = "MAIN_VARIABLE_LIST_UUID";

    // STATE AND IMPORT/EXPORT
    const permanenceStore = usePermanenceStore();
    const lineStateAllocation = computed((): PersistentLineStorage => {
        return {
            operator: parsedOperator.value as Operator | null,
            childUUID: firstLineUuid.value,
            selectionUUID: "",
            operatorParserUUID: operatorParserUUID.value,
            variableNameInputUUID: "",
            mode: "",
        };
    });
    watch(
        lineStateAllocation,
        (newVal) => {
            permanenceStore.storeLineForUUID(mainUUID, newVal);
        },
        {
            deep: true,
        }
    );
    onBeforeMount(() => {
        const loaded = permanenceStore.getLineForUUID(mainUUID);

        if (loaded != null) {
            operatorParserUUID.value = loaded.operatorParserUUID;
            parsedOperator.value = loaded.operator;
            firstLineUuid.value = loaded.childUUID;
        }
    });
</script>

<template>
    <p>Try:</p>
    <pre>sum((n = 0); 100; int(-inf; inf; (123+(A*4)/100); x))</pre>
    <InputToOperatorParser
        @parsed="(a: Operator) => {
            if (skipParsedEffect) {
                skipParsedEffect = false;
            } else {
                parsedOperator = a;
            }
        }"
        @loading-value="skipParsedEffect = true"
        style="width: 100%; min-height: 4em"
        :uuid="operatorParserUUID"
    />
    <EquationLine v-if="parsedOperator" :operator="(parsedOperator as Operator)" :line-uuid="firstLineUuid" />
    <VariableList style="margin-top: 3em" :uuid="variableListUUID" />
    <div style="width: 100%; min-height: 40vh"></div>
</template>

<style scoped></style>
