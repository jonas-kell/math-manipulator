<script setup lang="ts">
    import EquationLine from "./components/EquationLine.vue";
    import VariableList from "./components/VariableList.vue";
    import InputToOperatorParser from "./components/InputToOperatorParser.vue";
    import { Operator } from "./functions";
    import { ref } from "vue";

    const parsedOperator = ref(null as Operator | null);
</script>

<template>
    <p>Try:</p>
    <pre>sum((n = 0); 100; int(-inf; inf; (123+(A*4)/100); x))</pre>
    <InputToOperatorParser @parsed="(a: Operator) => {parsedOperator = a}" style="width: 100%; min-height: 4em" />
    <EquationLine v-if="parsedOperator" :operator="(parsedOperator as Operator)" />
    <VariableList style="margin-top: 3em" />
    <div style="width: 100%; min-height: 40vh"></div>
</template>

<style scoped></style>
