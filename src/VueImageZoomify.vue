<template>
  <div
    :id="canvasContainer"
    class="vue-image-zoomify"
    :style="{ width: `${width}`, height: `${height}` }"
    @wheel="handleZoom"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <canvas :id="canvasId"></canvas>
    <button @click="onZoomIn()">
      <img :src="ZoomIn" />
    </button>
    <button @click="onZoomOut()">
      <img :src="ZoomOut" />
    </button>
    <button @click="onZoomReset()">
      <img :src="ZoomReset" />
    </button>
    <button @click="onToggleFullScreen()">
      <img :src="FullScreen" />
    </button>
  </div>
</template>

<script>
import { v4 as uuidv4 } from "uuid";
import ZoomIn from "./assets/plus.svg";
import ZoomOut from "./assets/minus.svg";
import ZoomReset from "./assets/zoom-reset.svg";
import FullScreen from "./assets/full-screen.svg";

export default {
  name: "VueImageZoomify",
  props: {
    src: { type: String, default: "" },
    width: { type: String, default: "100%" },
    height: { type: String, default: "100%" },
    enableButton: { type: Boolean, default: true },
    isCtrlPressed: { type: Boolean, default: true },
  },
  watch: {
    src: {
      immediate: true,
      deep: true,
      async handler(newSrc, oldSrc) {
        this.existingScale = 0;
        this.$nextTick(() => {
          // 사이즈 변경 체크
          const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
              this.handleWidthChange(entry);
            }
          });
          resizeObserver.observe(this.getElementById(this.canvasContainer));
        });
      },
    },
    enableButton(isEnableButton) {
      const canvasContainerEl = this.getElementById(this.canvasContainer);
      if (canvasContainerEl) {
        const buttons = canvasContainerEl.getElementsByTagName("button");
        Array.from(buttons).forEach((button) => {
          button.style.display =
            this.isShowZoomBtn && isEnableButton ? "block" : "none";
        });
      }
    },
  },
  data() {
    return {
      ZoomIn: ZoomIn,
      ZoomOut: ZoomOut,
      ZoomReset: ZoomReset,
      FullScreen: FullScreen,
      canvasContainer: `canvas-container-${uuidv4()}`,
      canvasId: `canvas-id-${uuidv4()}`,
      canvasWidth: 0,
      canvasHeight: 0,
      scale: 1,
      isDragging: false,
      lastX: 0,
      lastY: 0,
      offsetX: 0,
      offsetY: 0,
      maxScale: 100,
      minScale: 1,
      ctx: null,
      image: null,
      originalWidth: 0,
      originalHeight: 0,
      existingScale: 0,
      isShowZoomBtn: false,
    };
  },
  methods: {
    handleWidthChange(entry) {
      const canvasContainerEl = this.getElementById(this.canvasContainer);
      const canvasEl = this.getElementById(this.canvasId);
      if (canvasContainerEl === null || canvasEl === null) return;

      if (this.existingScale === 0) {
        const { width, height } = canvasContainerEl.getClientRects()[0];
        this.canvasWidth = width;
        this.canvasHeight = height;

        canvasEl.width = width;
        canvasEl.height = height;
        this.ctx = canvasEl.getContext("2d");
        this.image = new Image();
        this.image.src = this.src;
        this.image.onload = () => {
          this.isShowZoomBtn = true;
          this.originalWidth = this.image.width;
          this.originalHeight = this.image.height;
          this.fitImageIntoCanvas();
          this.adjustOffset();
          this.drawImage();
        };
        this.image.onerror = () => {
          this.isShowZoomBtn = false;
        };
      } else {
        const { width, height } = entry.contentRect;
        canvasEl.width = width;
        canvasEl.height = height;
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.fitImageIntoCanvas();
        this.adjustOffset();
        this.drawImage();
      }

      if (canvasContainerEl) {
        canvasContainerEl.style.position = "relative";
        const buttons = canvasContainerEl.getElementsByTagName("button");

        Array.from(buttons).forEach((button, i) => {
          const btnLeft =
            this.canvasWidth / 2 - ((buttons.length * 55) / 2 - 7) + i * 55;
          button.style.width = "40px";
          button.style.height = "40px";
          button.style.position = "absolute";
          button.style.bottom = "10px";
          button.style.borderWidth = "0";
          button.style.borderRadius = "50%";
          button.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
          button.style.left = `${btnLeft}px`;
          button.style.cursor = "pointer";
          setTimeout(() => {
            button.style.display =
              this.isShowZoomBtn === true && this.enableButton === true
                ? "block"
                : "none";
          }, 100);

          const icon = button.querySelector("img");

          if (icon) {
            icon.style.width = "20px";
          }
        });
      }
    },
    fitImageIntoCanvas() {
      // 화면보다 이미지가 클경우
      if (
        this.canvasWidth < this.originalWidth ||
        this.canvasHeight < this.originalHeight
      ) {
        const yScale = this.canvasHeight / this.originalHeight;
        const xScale = this.canvasWidth / this.originalWidth;
        const upDtMinScale = Math.min(yScale, xScale);
        if (upDtMinScale !== this.existingScale) {
          this.scale = upDtMinScale;
          this.existingScale = upDtMinScale;
        }
        this.minScale = upDtMinScale;
      } else {
        const yScale = this.originalHeight / this.canvasHeight;
        const xScale = this.originalWidth / this.canvasWidth;
        const upDtMinScale = 1 / Math.max(yScale, xScale);
        if (upDtMinScale !== this.existingScale) {
          this.scale = upDtMinScale;
          this.existingScale = upDtMinScale;
        }
        this.minScale = upDtMinScale;
      }
    },
    adjustOffset() {
      const canvas = this.getElementById(this.canvasId);
      const imgWidth = this.originalWidth * this.scale;
      const imgHeight = this.originalHeight * this.scale;

      if (imgWidth < canvas.width) {
        this.offsetX = (canvas.width - imgWidth) / 2;
      } else {
        if (this.offsetX > 0) {
          this.offsetX = 0;
        } else if (this.offsetX < canvas.width - imgWidth) {
          this.offsetX = canvas.width - imgWidth;
        }
      }

      if (imgHeight < canvas.height) {
        this.offsetY = (canvas.height - imgHeight) / 2;
      } else {
        if (this.offsetY > 0) {
          this.offsetY = 0;
        } else if (this.offsetY < canvas.height - imgHeight) {
          this.offsetY = canvas.height - imgHeight;
        }
      }
    },
    drawImage() {
      const canvas = this.getElementById(this.canvasId);
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.ctx.drawImage(
        this.image,
        this.offsetX,
        this.offsetY,
        this.originalWidth * this.scale,
        this.originalHeight * this.scale
      );
    },
    handleZoom(event) {
      if (this.isCtrlPressed && !event.ctrlKey) return;

      event.preventDefault();
      const canvas = this.getElementById(this.canvasId);
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const scaleMultiplier = 0.1;
      const wheel = event.deltaY < 0 ? 1 : -1;
      const zoom = Math.exp(wheel * scaleMultiplier);
      const nextScale = this.scale * zoom;

      if (nextScale > this.maxScale || nextScale < this.minScale) return;

      const offsetX = (x - this.offsetX) * (zoom - 1);
      const offsetY = (y - this.offsetY) * (zoom - 1);

      this.offsetX -= offsetX;
      this.offsetY -= offsetY;
      this.scale = nextScale;

      this.adjustOffset();
      this.drawImage();
    },
    handleMouseUp() {
      this.isDragging = false;
    },
    handleMouseDown(event) {
      this.isDragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    },
    handleMouseMove(event) {
      if (this.isDragging) {
        const offsetX = event.clientX - this.lastX;
        const offsetY = event.clientY - this.lastY;

        const canvas = this.getElementById(this.canvasId);

        const imgWidth = this.originalWidth * this.scale;
        const imgHeight = this.originalHeight * this.scale;

        const nextOffsetX = this.offsetX + offsetX;
        const nextOffsetY = this.offsetY + offsetY;

        if (nextOffsetX <= 0 && nextOffsetX >= canvas.width - imgWidth) {
          this.offsetX += offsetX;
        }
        if (nextOffsetY <= 0 && nextOffsetY >= canvas.height - imgHeight) {
          this.offsetY += offsetY;
        }

        this.adjustOffset();
        this.drawImage();

        this.lastX = event.clientX;
        this.lastY = event.clientY;
      }
    },
    onZoomIn() {
      this.zoom(1.2);
    },
    onZoomOut() {
      this.zoom(0.8);
    },
    zoom(zoomMultiplier) {
      const canvas = this.getElementById(this.canvasId);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      const nextScale = this.scale * zoomMultiplier;
      if (nextScale > this.maxScale || nextScale < this.minScale) return;

      const offsetX = (centerX - this.offsetX) * (zoomMultiplier - 1);
      const offsetY = (centerY - this.offsetY) * (zoomMultiplier - 1);

      this.offsetX -= offsetX;
      this.offsetY -= offsetY;
      this.scale *= zoomMultiplier;

      this.adjustOffset();
      this.drawImage();
    },
    onZoomReset() {
      this.scale = this.minScale;
      this.offsetX = 0;
      this.offsetY = 0;
      this.adjustOffset();
      this.drawImage();
    },
    onToggleFullScreen() {
      const canvas = this.getElementById(this.canvasContainer);

      if (!document.fullscreenElement) {
        if (canvas.requestFullscreen) return canvas.requestFullscreen();
        if (canvas.webkitRequestFullscreen)
          return canvas.webkitRequestFullscreen();
        if (canvas.mozRequestFullScreen) return canvas.mozRequestFullScreen();
        if (canvas.msRequestFullscreen) return canvas.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) return document.exitFullscreen();
        if (document.webkitCancelFullscreen)
          return document.webkitCancelFullscreen();
        if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
        if (document.msExitFullscreen) return document.msExitFullscreen();
      }
    },
    getElementById(id) {
      return document.querySelector(`#${id}`);
    },
  },
};
</script>
