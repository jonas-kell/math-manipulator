<script setup lang="ts">
    import EquationLine from "./../components/EquationLine.vue";
    import VariableList from "./../components/VariableList.vue";
    import MacroList from "./../components/MacroList.vue";
    import { EmptyArgument, Operator, OperatorConfig, usePermanenceStore } from "./../functions";
    import { computed, nextTick, ref } from "vue";

    const props = defineProps<{
        showVariables: boolean;
        showMacros: boolean;
        config: OperatorConfig;
    }>();
    const firstLineUuid = computed(() => {
        return props.config.mainLineUuid;
    });

    const emptyOperator = ref(new EmptyArgument(props.config));
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
            :line-uuid="firstLineUuid"
            :is-base="true"
            :config="config"
        />
        <VariableList style="margin-top: 3em" :config="config" v-if="props.showVariables" />
        <MacroList style="" :config="config" v-if="props.showMacros" />
    </template>
</template>
