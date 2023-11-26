<script setup lang="ts">
    import EquationLine from "./../components/EquationLine.vue";
    import VariableList from "./../components/VariableList.vue";
    import { EmptyArgument, Operator, usePermanenceStore } from "./../functions";
    import { nextTick, ref } from "vue";

    const props = defineProps({
        firstLineUuid: {
            type: String,
            required: true,
        },
        variableListUuid: {
            type: String,
            required: true,
        },
        showVariables: {
            type: Boolean,
            default: true,
        },
    });

    const emptyOperator = ref(new EmptyArgument());
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
    <template v-if="showMainElements">
        <EquationLine
            v-if="emptyOperator"
            :operator="(emptyOperator as Operator)"
            :line-uuid="props.firstLineUuid"
            :is-base="true"
        />
        <VariableList style="margin-top: 3em" :uuid="props.variableListUuid" v-if="props.showVariables" />
    </template>
</template>
