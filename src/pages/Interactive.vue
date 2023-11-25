<script setup lang="ts">
    import EquationLine from "./../components/EquationLine.vue";
    import VariableList from "./../components/VariableList.vue";
    import { EmptyArgument, Operator, usePermanenceStore } from "./../functions";
    import { nextTick, ref } from "vue";

    const props = defineProps({
        showHints: {
            type: Boolean,
            default: false,
        },
        firstLineUuid: {
            type: String,
            required: true,
        },
        variableListUuid: {
            type: String,
            required: true,
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
    <template v-if="props.showHints">
        <p>Try:</p>
        <pre>sum((n = 0); 100; int(-inf; inf; (123+(A*4)/100); x))</pre>
        <p>(You can click parts of the rendered function to invoke actions)</p>
    </template>
    <template v-if="showMainElements">
        <EquationLine
            v-if="emptyOperator"
            :operator="(emptyOperator as Operator)"
            :line-uuid="props.firstLineUuid"
            :is-base="true"
        />
        <VariableList style="margin-top: 3em" :uuid="props.variableListUuid" />
    </template>
    <div style="width: 100%; min-height: 40vh"></div>
</template>
