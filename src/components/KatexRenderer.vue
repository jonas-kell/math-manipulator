<script setup lang="ts">
    import katex from "katex";
    import { ref, watch, onMounted } from "vue";
    import { v4 as uuidv4 } from "uuid";

    const props = defineProps<{
        katexInput: string;
        uuidsToProcess: string[]; // make sure the uuids that are put into this always start with a letter!! Our default is "ref_{{uuid}}"
    }>();

    const emit = defineEmits(["selected"]);

    const containerId = ref("ref_" + uuidv4());

    const clickListenerWrapper = (id: string) => {
        return (event: MouseEvent) => {
            event.stopPropagation();

            const container = document.getElementById(containerId.value);
            if (container) {
                // remove the border-class from all that have it
                const elements = container.querySelectorAll(".border");
                elements.forEach(function (element) {
                    element.classList.remove("border");
                });

                // add the class only to the current container
                const current = container.querySelector("#" + id);
                if (current) {
                    current.classList.add("border");

                    emit("selected", id);
                }
            }
        };
    };

    const postProcess = () => {
        props.uuidsToProcess.forEach((uuid) => {
            const outer = document.getElementById(uuid);
            if (outer) {
                outer.addEventListener("click", clickListenerWrapper(uuid));
            }
        });
    };

    const render = () => {
        const element = document.getElementById(containerId.value);

        if (element) {
            katex.render(props.katexInput, element, {
                throwOnError: false,
                displayMode: true,
                trust: true,
                strict: false,
                output: "html",
            });
        }

        postProcess();
    };

    onMounted(() => {
        render();
    });

    watch(props, () => {
        render();
    });
</script>

<template>
    <div :id="containerId" class="render-katex-custom"></div>
</template>
