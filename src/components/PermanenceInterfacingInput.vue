<script setup lang="ts">
    import { computed, onMounted, watch } from "vue";
    import { PersistentInputStorage, usePermanenceStore, useKeybindingsStore } from "./../functions";
    const keybindingsStore = useKeybindingsStore();

    const props = defineProps<{
        modelValue: string;
        uuid: string;
        type: "input" | "textarea";
    }>();
    const emit = defineEmits(["update:modelValue", "loadingValue"]);

    const localValue = computed({
        get: () => props.modelValue,
        set: (value) => {
            emit("update:modelValue", value);
        },
    });

    // STATE AND IMPORT/EXPORT
    const permanenceStore = usePermanenceStore();
    const inputStateAllocation = computed((): PersistentInputStorage => {
        return {
            textValue: localValue.value,
        };
    });
    watch(
        inputStateAllocation,
        (newVal) => {
            permanenceStore.storeInputForUUID(props.uuid, newVal);
        },
        {
            deep: true,
        }
    );
    onMounted(() => {
        const loaded = permanenceStore.getInputForUUID(props.uuid);

        if (loaded != null) {
            emit("loadingValue");
            localValue.value = loaded.textValue;
        }
    });
</script>

<template>
    <textarea
        v-model="localValue"
        :style="($attrs.style as any)"
        v-if="props.type == 'textarea'"
        @focus="keybindingsStore.unSetActiveUUID"
    ></textarea>
    <input v-model="localValue" :style="($attrs.style as any)" @focus="keybindingsStore.unSetActiveUUID" v-else />
</template>
