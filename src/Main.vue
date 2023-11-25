<script setup lang="ts">
    import EquationLine from "./components/EquationLine.vue";
    import VariableList from "./components/VariableList.vue";
    import { EmptyArgument, Operator, usePermanenceStore, useRouteStore } from "./functions";
    import { nextTick, ref } from "vue";

    const routeStore = useRouteStore();

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
    <template v-if="routeStore.mode == 'main'">main</template>
    <template v-else-if="routeStore.mode == 'help'">help</template>
    <template v-else-if="routeStore.mode == 'empty' || routeStore.mode == 'stored'">
        <template v-if="routeStore.mode == 'empty'">
            <p>Try:</p>
            <pre>sum((n = 0); 100; int(-inf; inf; (123+(A*4)/100); x))</pre>
            <p>(You can click parts of the rendered function to invoke actions)</p>
        </template>
        <template v-if="showMainElements">
            <EquationLine
                v-if="emptyOperator"
                :operator="(emptyOperator as Operator)"
                :line-uuid="firstLineUuid"
                :is-base="true"
            />
            <VariableList style="margin-top: 3em" :uuid="variableListUUID" />
        </template>
        <div style="width: 100%; min-height: 40vh"></div>
    </template>
</template>

<style scoped></style>
