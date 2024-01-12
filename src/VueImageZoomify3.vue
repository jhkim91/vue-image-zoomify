<template>
  <div
    :id="canvasContainer"
    class="vue3-image-zoom"
    :style="{ width: `${width}`, height: `${height}` }"
    @wheel="handleZoom"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <canvas :id="canvasId"></canvas>
  </div>
</template>

<script>
import { v4 as uuidv4 } from "uuid";
import { ref, toRef, toRefs, reactive, watch, nextTick } from "vue";

export default {
  name: "Vue3ImageZoom",
  props: {
    src: { type: String, default: "" },
    width: { type: String, default: "100%" },
    height: { type: String, default: "100%" },
  },
  setup(props) {
    // const { src } = toRefs(props);
    const src = toRef(props, "src");
    const canvasContainer = ref(`canvas-container-${uuidv4()}`);
    const canvasId = ref(`canvas-id-${uuidv4()}`);
    const ctx = ref(null);
    let image = reactive({});
    const canvasObj = reactive({
      offsetX: 0,
      offsetY: 0,
      canvasWidth: 0,
      canvasHeight: 0,
      scale: 1,
      minScale: 1,
      originalWidth: 0,
      originalHeight: 0,
      lastX: 0,
      lastY: 0,
      isDragging: false,
    });

    watch(
      src, // watch에서 src 감지못함
      (newSrc) => {
        nextTick(() => init(newSrc));
      },
      { immediate: true, deep: true }
    );

    const init = (imgPath) => {
      const { width, height } = document
        .querySelector(`#${canvasContainer.value}`)
        .getClientRects()[0];
      canvasObj.canvasWidth = width;
      canvasObj.canvasHeight = height;

      const canvas = document.querySelector(`#${canvasId.value}`);
      canvas.width = width;
      canvas.height = height;
      ctx.value = canvas.getContext("2d");
      image = new Image();
      image.src = imgPath;
      image.onload = () => {
        canvasObj.originalWidth = image.width;
        canvasObj.originalHeight = image.height;
        fitImageIntoCanvas();
        adjustOffset();
        drawImage();
      };
    };

    const fitImageIntoCanvas = () => {
      if (
        canvasObj.canvasWidth < canvasObj.originalWidth ||
        canvasObj.canvasHeight < canvasObj.originalHeight
      ) {
        const yScale = canvasObj.canvasWidth / canvasObj.originalWidth; // y축 비율
        const xScale = canvasObj.canvasHeight / canvasObj.originalHeight; // x축 비율

        const upDtMinScale = Math.min(yScale, xScale); // 화면축소기준은 더 작은 비율로 지정
        canvasObj.scale = upDtMinScale;
        canvasObj.minScale = upDtMinScale;
      } else {
        const yScale = canvasObj.originalWidth / canvasObj.canvasWidth; // y축 비율
        const xScale = canvasObj.originalHeight / canvasObj.canvasHeight; // x축 비율
        const upDtMinScale = 1 / Math.max(yScale, xScale); // 화면축소기준은 더 작은 비율로 지정
        canvasObj.scale = upDtMinScale;
        canvasObj.minScale = upDtMinScale;
      }
    };

    const drawImage = () => {
      const canvas = document.querySelector(`#${canvasId.value}`);
      ctx.value.clearRect(0, 0, canvas.width, canvas.height);
      ctx.value.drawImage(
        image,
        canvasObj.offsetX,
        canvasObj.offsetY,
        canvasObj.originalWidth * canvasObj.scale,
        canvasObj.originalHeight * canvasObj.scale
      );
    };

    const handleZoom = (event) => {
      event.preventDefault();
      const canvas = document.querySelector(`#${canvasId.value}`);
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const scaleMultiplier = 0.1;
      const wheel = event.deltaY < 0 ? 1 : -1;
      const zoom = Math.exp(wheel * scaleMultiplier);
      const nextScale = canvasObj.scale * zoom;

      if (nextScale > 4 || nextScale < canvasObj.minScale) {
        return;
      }

      const varOffsetX = (x - canvasObj.offsetX) * (zoom - 1);
      const varOffsetY = (y - canvasObj.offsetY) * (zoom - 1);

      canvasObj.offsetX -= varOffsetX;
      canvasObj.offsetY -= varOffsetY;
      canvasObj.scale = nextScale;

      adjustOffset();
      drawImage();
    };

    const adjustOffset = () => {
      const canvas = document.querySelector(`#${canvasId.value}`);
      const imgWidth = canvasObj.originalWidth * canvasObj.scale;
      const imgHeight = canvasObj.originalHeight * canvasObj.scale;

      if (imgWidth < canvas.width) {
        canvasObj.offsetX = (canvas.width - imgWidth) / 2;
      } else {
        if (canvasObj.offsetX > 0) {
          canvasObj.offsetX = 0;
        } else if (canvasObj.offsetX < canvas.width - imgWidth) {
          canvasObj.offsetX = canvas.width - imgWidth;
        }
      }

      if (imgHeight < canvas.height) {
        canvasObj.offsetY = (canvas.height - imgHeight) / 2;
      } else {
        if (canvasObj.offsetY > 0) {
          canvasObj.offsetY = 0;
        } else if (canvasObj.offsetY < canvas.height - imgHeight) {
          canvasObj.offsetY = canvas.height - imgHeight;
        }
      }
    };

    const handleMouseDown = (event) => {
      canvasObj.isDragging = true;
      canvasObj.lastX = event.clientX;
      canvasObj.lastY = event.clientY;
    };

    const handleMouseMove = (event) => {
      if (canvasObj.isDragging) {
        const varOffsetX = event.clientX - canvasObj.lastX;
        const varOffsetY = event.clientY - canvasObj.lastY;

        const canvas = document.querySelector(`#${canvasId.value}`);

        const imgWidth = canvasObj.originalWidth * canvasObj.scale;
        const imgHeight = canvasObj.originalHeight * canvasObj.scale;

        const nextOffsetX = canvasObj.offsetX + varOffsetX;
        const nextOffsetY = canvasObj.offsetY + varOffsetY;

        if (nextOffsetX <= 0 && nextOffsetX >= canvas.width - imgWidth) {
          canvasObj.offsetX += varOffsetX;
        }
        if (nextOffsetY <= 0 && nextOffsetY >= canvas.height - imgHeight) {
          canvasObj.offsetY += varOffsetY;
        }

        adjustOffset();
        drawImage();

        canvasObj.lastX = event.clientX;
        canvasObj.lastY = event.clientY;
      }
    };

    const handleMouseUp = () => {
      canvasObj.isDragging = false;
    };

    return {
      canvasContainer,
      handleZoom,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleMouseUp,
      canvasId,
      canvasObj,
    };
  },
};
</script>
