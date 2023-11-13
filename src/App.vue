<script setup lang="ts">
    import EquationLine from "./components/EquationLine.vue";
    import VariableList from "./components/VariableList.vue";
    import { EmptyArgument, Operator } from "./functions";
    import { ref } from "vue";

    const firstLineUuid = ref("MAIN_UUID");
    const variableListUUID = "MAIN_VARIABLE_LIST_UUID";
</script>

<template>
    <p>Try:</p>
    <pre>sum((n = 0); 100; int(-inf; inf; (123+(A*4)/100); x))</pre>
    <EquationLine :operator="(new EmptyArgument() as Operator)" :line-uuid="firstLineUuid" :is-base="true" />
    <VariableList style="margin-top: 3em" :uuid="variableListUUID" />
    <div style="width: 100%; min-height: 40vh"></div>
</template>

<style scoped></style>
