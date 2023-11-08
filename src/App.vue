<script setup lang="ts">
    import EquationLine from "./components/EquationLine.vue";
    import InputToOperatorParser from "./components/InputToOperatorParser.vue";
    import { Operator } from "./functions";
    import { ref } from "vue";

    const parsedOperator = ref(null as Operator | null);
</script>

<template>
    <p>Try:</p>
    <pre>sum((n = 0); 100; int(-inf; inf; (123+(A*4)/100); x))</pre>
    <InputToOperatorParser @parsed="(a: Operator) => {parsedOperator = a}" />
    <EquationLine v-if="parsedOperator" :operator="(parsedOperator as Operator)" />
    <div style="width: 100%; min-height: 60vh"></div>
</template>

<style scoped></style>
