<script setup lang="ts">
    import katex from "katex";
    import { ref, watch, onBeforeMount, onMounted, computed, onBeforeUnmount } from "vue";
    import { Operator, useSelectFunctionStore } from "../functions";

    const selectFunctionStore = useSelectFunctionStore();

    const props = defineProps<{
        katexInput: string;
        uuidRefsToProcess: string[]; // make sure the uuids that are put into this always start with a letter!! Our default is "ref_{{uuid}}"
        rendererUuid: string;
    }>();

    const emit = defineEmits(["selected"]);

    const containerId = computed(() => {
        return Operator.UUIDRefFromUUID(props.rendererUuid);
    });
    const selectionRef = ref(null as string | null);

    const clickListenerWrapper = (UUIDRef: string) => {
        return (event: MouseEvent) => {
            event.stopPropagation();

            selectUUIDProgrammatically(UUIDRef);
        };
    };

    const selectUUIDProgrammatically = (UUIDRef: string) => {
        selectUUIDGraphically(UUIDRef);
        emit("selected", Operator.UUIDFromUUIDRef(UUIDRef));
    };

    const selectUUIDGraphically = (UUIDRef: string) => {
        selectionRef.value = UUIDRef;
        updateBorders();
    };

    const postProcess = () => {
        props.uuidRefsToProcess.forEach((UUIDRef) => {
            const outer = document.getElementById(UUIDRef);
            if (outer) {
                outer.addEventListener("click", clickListenerWrapper(UUIDRef));
            }
        });

        updateBorders();
    };

    const updateBorders = () => {
        const container = document.getElementById(containerId.value);
        if (container) {
            // remove the border-class from all that have it
            const elements = container.querySelectorAll(".border");
            elements.forEach(function (element) {
                element.classList.remove("border");
            });

            // add the class only to the current container
            const selected = container.querySelector("#" + selectionRef.value);
            if (selected) {
                selected.classList.add("border");
            }
        }
    };

    const render = () => {
        const element = document.getElementById(containerId.value);

        if (element) {
            // empty
            element.replaceChildren();

            // render new content
            katex.render(props.katexInput, element, {
                macros: {
                    "\\semicolon": ";",
                    "\\plus": "+",
                    "\\minus": "-",
                    "\\starsymb": "\\ast",
                    "\\forwardslash": "/",
                    // "\\backslash": "\\backslash", // already exists per default and breaks if defined
                    "\\colon": ":",
                    "\\lbracket": "(",
                    "\\rbracket": ")",
                    "\\faculty": "!",
                    "\\percent": "\\%",
                    "\\eq": "=",
                    "\\less": "<",
                    "\\greater": ">",
                },
                throwOnError: false,
                displayMode: true,
                trust: true,
                strict: false,
                output: "html",
            });
        }

        postProcess();
    };

    onBeforeMount(() => {
        selectFunctionStore.addSelectionHandlerToStore(props.rendererUuid, selectUUIDProgrammatically as any);
        selectFunctionStore.addGraphicalSelectionHandlerToStore(props.rendererUuid, selectUUIDGraphically as any);
    });

    onMounted(() => {
        render();
    });

    watch(props, () => {
        selectFunctionStore.addSelectionHandlerToStore(props.rendererUuid, selectUUIDProgrammatically as any);
        selectFunctionStore.addGraphicalSelectionHandlerToStore(props.rendererUuid, selectUUIDGraphically as any);
        render();
    });

    onBeforeUnmount(() => {
        selectFunctionStore.removeSelectionHandlerFromStore(props.rendererUuid);
        selectFunctionStore.removeGraphicalSelectionHandlerFromStore(props.rendererUuid);
    });
</script>

<template>
    <div :id="containerId" class="render-katex-custom"></div>
</template>
