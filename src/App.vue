<script setup lang="ts">
    import EquationLine from "./components/EquationLine.vue";
    import VariableList from "./components/VariableList.vue";
    import { EmptyArgument, Operator, usePermanenceStore } from "./functions";
    import { nextTick, ref } from "vue";

    const emptyOperator = ref(new EmptyArgument());
    const firstLineUuid = ref("MAIN_UUID");
    const variableListUUID = ref("MAIN_VARIABLE_LIST_UUID");
    const showMainElements = ref(true);

    // update EVERYTHING if permanence has been forcefully rewritten
    usePermanenceStore().addPermanenceHasUpdatedHandler(() => {
        showMainElements.value = false;
        nextTick(() => {
            showMainElements.value = true;
        });
    });
</script>

<template>
    <p>Try:</p>
    <pre>sum((n = 0); 100; int(-inf; inf; (123+(A*4)/100); x))</pre>
    <template v-if="showMainElements">
        <EquationLine v-if="emptyOperator" :operator="(emptyOperator as Operator)" :line-uuid="firstLineUuid" :is-base="true" />
        <VariableList style="margin-top: 3em" :uuid="variableListUUID" />
    </template>
    <div style="width: 100%; min-height: 40vh"></div>
</template>

<style scoped></style>
